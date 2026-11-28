import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { checkCascade } from "./cascade.mjs";

async function seed(owner, locale) {
  const ru = locale === "ru";
  const titles = ru
    ? [
        "Стек вызовов",
        "Задачи и таймеры",
        "Микрозадачи",
        "Кадры анимации",
        "События ввода",
        "Очередь задач",
        "Отрисовка",
        "Компоновка",
        "Вычисление стилей",
        "Долгие задачи",
      ]
    : [
        "Call stack",
        "Tasks and timers",
        "Microtasks",
        "Animation frames",
        "Input events",
        "Task queue",
        "Painting",
        "Layout",
        "Style calculation",
        "Long tasks",
      ];
  const track = await owner.createTrack({
    title: ru ? "Цикл событий браузера" : "The browser event loop",
    language: locale,
  });
  const topics = await owner.upsertTopics(
    titles.map((title, i) => ({ slug: "browser-" + i, title })),
  );
  await owner.attachTopics(
    track.id,
    topics.map((t) => t.slug),
  );
  await owner.addEdges([{ from: topics[2].slug, to: topics[1].slug }]);
  const levels = [4, 3, 2, 1, 0, 1, 2, 0, 0, 3];
  let first;
  for (const [i, topic] of topics.entries()) {
    const lesson = await owner.createLesson({
      topicId: topic.id,
      title: i === 0 ? (ru ? "Как работает стек вызовов" : "How the call stack works") : titles[i],
      blocks: [
        {
          type: "theory",
          id: "stack",
          markdown: ru
            ? "Вызов функции добавляет в стек новый кадр. Когда функция возвращает значение, её кадр снимается со стека."
            : "A function call adds a frame to the stack. Returning from the function removes that frame and resumes its caller.",
        },
      ],
    });
    first ??= lesson;
    if (levels[i]) await owner.markLessonRead(lesson.id);
    await owner.setMastery(topic.id, levels[i]);
  }
  const grill = await owner.startGrill({ title: track.title, trackId: track.id });
  for (const [i, verdict] of ["strong", "strong", "partial", "weak", "strong"].entries()) {
    const q = await owner.addGrillQuestion(grill.id, { topicId: topics[i].id, prompt: titles[i] });
    await owner.answerGrillQuestion(q.id, titles[i], "ui");
    await owner.judgeGrillQuestion(q.id, verdict);
  }
  await owner.recordReviewResult(topics[2].id, "strong");
  await owner.recordReviewResult(topics[9].id, "partial");
  return first;
}

async function checkSort(page, ru) {
  const table = page.getByRole("table");
  const headers = table.getByRole("columnheader");
  assert.equal(await headers.count(), 5);
  assert.equal(await headers.first().getAttribute("aria-sort"), "ascending");
  const rows = table.locator("tbody tr");
  const refs = () => rows.getByRole("rowheader").allTextContents();
  const tag = ru ? "Т" : "T";
  assert.equal((await refs())[0], tag + "01");
  await page.getByRole("button", { name: ru ? "Следующая страница" : "Next page" }).click();
  assert.equal((await refs())[0], tag + "09");
  await headers.first().getByRole("button").press("Enter");
  assert.equal(await headers.first().getAttribute("aria-sort"), "descending");
  assert.equal((await refs())[0], tag + "10");
  for (const column of [1, 2, 3, 4]) {
    const header = headers.nth(column);
    await header.getByRole("button").click();
    assert.equal(await header.getAttribute("aria-sort"), "ascending");
    assert.equal(await table.locator('th[aria-sort="ascending"]').count(), 1);
    assert.ok(await header.locator("svg").isVisible());
  }
  async function dueOrder(direction) {
    const dates = await rows.evaluateAll((rows) =>
      rows.map((row) => row.querySelector("time")?.dateTime ?? null),
    );
    const scheduled = dates.filter(Boolean);
    assert.ok(scheduled.length >= 2);
    const ordered = [...scheduled].sort((a, b) => Date.parse(a) - Date.parse(b));
    if (direction === "desc") ordered.reverse();
    assert.deepEqual(dates, [...ordered, ...Array(dates.length - scheduled.length).fill(null)]);
    return (await refs()).slice(scheduled.length);
  }
  const undated = await dueOrder("asc");
  await headers.last().getByRole("button").press("Space");
  assert.equal(await headers.last().getAttribute("aria-sort"), "descending");
  assert.deepEqual(await dueOrder("desc"), undated);
}

export async function checkProgress({ page, visit, signInOwner, directory, cascade }) {
  if (directory) await mkdir(directory, { recursive: true });
  const frame = (selector) =>
    page.locator(selector).evaluate((el) => {
      const { x, width } = el.getBoundingClientRect();
      return { x, width };
    });
  const capture = async (name) => {
    if (directory)
      await page.screenshot({
        path: directory + "/" + name + ".png",
        fullPage: true,
        animations: "disabled",
      });
  };
  for (const locale of ["en", "ru"]) {
    const ru = locale === "ru";
    const prefix = ru ? "/ru" : "";
    const owner = await signInOwner(ru ? "guide" : "schedule");
    await owner.updateProfile({ onboardedAt: new Date() });
    await visit(prefix + "/progress");
    assert.ok(
      await page.getByText(ru ? "Пока нет треков." : "No Tracks yet.", { exact: true }).isVisible(),
    );
    assert.equal(await page.locator(".s-tally__bar").count(), 0);
    assert.deepEqual((await page.locator(".s-stat__value").allTextContents()).slice(2), ["—", "—"]);
    if (cascade) await checkCascade(page);
    const lesson = await seed(owner, locale);
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      if (directory && !ru && width === 1440) {
        await visit("/lessons/" + lesson.id);
        await page.evaluate(() => document.fonts.ready);
        await capture("lesson-en-1440");
      }
      let pageFrame;
      for (const specimen of [false, true]) {
        await visit(prefix + (specimen ? "/design/screens/progress?chrome=0" : "/progress"));
        await page.evaluate(() => document.fonts.ready);
        const name = "progress-" + (specimen ? "specimen-" : "") + locale + "-" + width;
        const bounds = await frame(".s-progress");
        if (specimen) assert.deepEqual(bounds, pageFrame, name + " must match the Progress page");
        else pageFrame = bounds;
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        assert.equal(
          await page.locator(".s-table").evaluate((el) => el.scrollWidth > el.clientWidth),
          width === 390,
        );
        assert.ok(await page.locator(".s-tally__bar").isVisible());
        if (!specimen) {
          assert.deepEqual(
            await page
              .locator(".s-trackstrip__cells i")
              .evaluateAll((cells) => cells.map((c) => c.className)),
            [4, 2, 3, 1, 0, 1, 2, 0, 0, 3].map((level) => "is-l" + level),
          );
        }
        if (width === 390) {
          const scroll = page.locator(".s-table");
          await scroll.evaluate((el) => {
            el.scrollLeft = el.scrollWidth;
          });
          assert.ok(await scroll.evaluate((el) => el.scrollLeft > 0 && window.scrollX === 0));
          await scroll.evaluate((el) => {
            el.scrollLeft = 0;
          });
        }
        const background = () =>
          page.locator(".s-shell").evaluate((el) => getComputedStyle(el).backgroundColor);
        const light = await background();
        await page.emulateMedia({ colorScheme: "dark" });
        assert.deepEqual(await frame(".s-progress"), bounds);
        assert.notEqual(await background(), light);
        await page.emulateMedia({ colorScheme: "light" });
        await capture(name);
        console.log(name + " · Progress frame at x=" + bounds.x + ", width=" + bounds.width);
        if (width === 1440) {
          if (cascade) await checkCascade(page);
          const hint = page.locator(".s-progress-summary__threshold");
          await hint.focus();
          await page.getByRole("tooltip").waitFor();
          await hint.press("Escape");
          if (!specimen) await checkSort(page, ru);
          await page.getByRole("tab", { name: ru ? /Активность/ : /Activity/ }).click();
          await page.locator(".s-timeline-item").first().waitFor();
          if (cascade) await checkCascade(page);
        }
      }
    }
  }
}
