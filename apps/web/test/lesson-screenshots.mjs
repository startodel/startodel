import assert from "node:assert/strict";

const starter = "function Counter() {\n  const count = 0;\n  return <b>{count}</b>;\n}";

export async function checkLessonInteractions({ page, owner, visit, shot }) {
  for (const locale of ["en", "ru"]) {
    const ru = locale === "ru";
    const [topic] = await owner.upsertTopics([
      { slug: "counter-" + locale, title: ru ? "Счётчик" : "Counter" },
    ]);
    const questions = [
      {
        prompt: ru
          ? "Что отобразит счётчик при первом рендере?"
          : "What does the counter show on its first render?",
        options: ["0", "1", "2"],
        correctIndex: 0,
      },
      {
        prompt: ru
          ? "Какой хук сохранит значение между рендерами?"
          : "Which hook keeps the count between renders?",
        options: ["useState", "useEffect", "useMemo"],
        correctIndex: 0,
      },
    ];
    const lesson = await owner.createLesson({
      topicId: topic.id,
      title: ru ? "Первый рендер" : "First render",
      blocks: [
        {
          id: "counter",
          type: "exercise",
          prompt:
            (ru ? "Измените начальное значение счётчика." : "Change the counter’s initial value.") +
            "\n\n```jsx\n" +
            starter +
            "\n```",
          hints: [ru ? "Найдите переменную count." : "Find the count variable."],
          solution: "const count = 1;",
        },
        { id: "state", type: "quiz", questions },
      ],
    });
    const next = await owner.createLesson({
      topicId: topic.id,
      title: ru ? "Обновление состояния" : "Updating state",
    });
    const prefix = ru ? "/ru" : "";
    const path = prefix + "/lessons/" + lesson.id;
    const exercise = page.locator(".s-exercise");
    const editor = exercise.getByRole("textbox", {
      name: ru ? "Редактор задачи" : "Exercise editor",
    });
    const reset = exercise.getByRole("button", { name: ru ? "Сбросить" : "Reset" });
    const readBuffer = async () => (await editor.locator(".cm-line").allTextContents()).join("\n");
    const quiz = page.locator(".s-quiz");
    const footer = page.locator(".lesson__end");
    const mark = footer.getByRole("button", {
      name: ru ? "Отметить как прочитанный" : "Mark as read",
    });
    const status = footer.getByRole("status");
    const readLabel = ru ? "Урок прочитан" : "Marked as read";
    const forward = footer.getByRole("link", { name: "L02 " + next.title });

    // Inspect the server response before hydration, including its escaping of JSX.
    const html = await (await page.request.get(new URL(path, page.url()).href)).text();
    assert.match(
      html,
      /<pre[^>]*class="s-editor__fallback"[^>]*>function Counter\(\) \{[\s\S]*?&lt;b&gt;\{count\}&lt;\/b&gt;;/,
    );

    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await visit(path);
      await editor.waitFor();
      await page.evaluate(() => document.fonts.ready);
      const capture = async (name, locator) => {
        await page.mouse.move(0, 0);
        await shot(`lesson-${name}-${locale}-${width}`, { locator });
      };
      assert.equal(await exercise.locator("pre").count(), 0);
      assert.equal(await readBuffer(), starter);
      assert.ok(await reset.isDisabled());
      await capture("editor-default", exercise);
      await editor.press("Control+Home");
      await editor.press("ArrowDown");
      await editor.press("End");
      await editor.press("ArrowLeft");
      await editor.press("Backspace");
      await page.keyboard.insertText("1");
      const edited = starter.replace("= 0", "= 1");
      assert.equal(await readBuffer(), edited);
      assert.ok(await reset.isEnabled());
      await capture("editor-edited", exercise);
      await visit(path);
      await editor.waitFor();
      assert.equal(await readBuffer(), edited);
      await reset.click();
      assert.equal(await readBuffer(), starter);
      assert.ok(await reset.isDisabled());
      assert.equal(
        await page.evaluate(
          (key) => localStorage.getItem(key),
          "startodel:exercise:" + lesson.id + ":counter",
        ),
        null,
      );
      await capture("editor-reset", exercise);

      const gaps = [];
      for (const [i, q] of questions.entries()) {
        const group = quiz.getByRole("group", { name: `0${i + 1} ${q.prompt}` });
        assert.equal(await group.getByRole("radio").count(), 3);
        const legend = group.locator("legend");
        const options = group.locator(".s-quiz__options");
        const promptBounds = await legend.boundingBox();
        gaps.push((await options.boundingBox()).y - promptBounds.y - promptBounds.height);
        assert.equal(await legend.evaluate((el) => getComputedStyle(el).alignItems), "baseline");
      }
      assert.ok(
        gaps[0] > 0 && Math.abs(gaps[0] - gaps[1]) <= 1,
        "Both legends have the same gap above their options",
      );
      await capture("quiz-alignment", quiz);
      assert.ok(await mark.isEnabled());
      assert.equal(await footer.locator(".s-button--primary").count(), 1);
      const navBox = await footer.getByRole("navigation").boundingBox();
      const nextBox = await forward.boundingBox();
      assert.ok(Math.abs(navBox.x + navBox.width - nextBox.x - nextBox.width) <= 1);
      assert.equal(await status.count(), 0);
      assert.match(await forward.getAttribute("class"), /s-button--primary/);
      assert.ok((await forward.getAttribute("href")).startsWith(prefix + "/lessons/" + next.id));
      await capture("footer-unread", footer);
    }

    await mark.click();
    await status.getByText(readLabel, { exact: true }).waitFor();
    await visit(path);
    assert.equal(await status.count(), 1);
    assert.equal(await footer.getByRole("button").count(), 0);
    assert.ok(await status.getByText(readLabel, { exact: true }).isVisible());
    assert.match(await forward.getAttribute("class"), /s-button--primary/);
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await shot(`lesson-footer-read-${locale}-${width}`, { locator: footer });
    }
  }
}
