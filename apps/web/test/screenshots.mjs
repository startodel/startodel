// Run from the workspace root after building the app. PLAYWRIGHT_MODULE may point to a local installation.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
import { checkCascade } from "./cascade.mjs";
import { localGitHub } from "./github.ts";
import { createDatabase, forUser } from "@startodel/db";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { once } from "node:events";
import { readFile, mkdir } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";
import { randomBytes } from "node:crypto";
import assert from "node:assert/strict";
const dbUrl = process.env.DATABASE_URL_TEST;
const target = new URL(dbUrl);
assert.equal(target.hostname, "127.0.0.1");
assert.equal(target.port, "55432");
assert.equal(target.pathname, "/startodel_test");
const db = createDatabase(dbUrl);
const github = await localGitHub();
const socket = createServer().listen(0, "127.0.0.1");
await once(socket, "listening");
const port = socket.address().port;
await new Promise((r) => socket.close(r));
const origin = "http://127.0.0.1:" + port;
const cascade = process.argv.includes("--cascade");
const command = cascade
  ? [
      "apps/web/node_modules/nuxt/bin/nuxt.mjs",
      "dev",
      "apps/web",
      "--host",
      "127.0.0.1",
      "--port",
      String(port),
      "--no-fork",
      "--no-tui",
    ]
  : ["apps/web/.output/server/index.mjs"];
const server = spawn(process.execPath, command, {
  env: {
    ...process.env,
    NITRO_HOST: "127.0.0.1",
    NITRO_PORT: String(port),
    DATABASE_URL: dbUrl,
    NUXT_APP_SECRET: randomBytes(32).toString("hex"),
    NUXT_OAUTH_GITHUB: JSON.stringify({
      clientId: "test-client",
      clientSecret: "test-secret",
      authorizationURL: github.origin + "/authorize",
      tokenURL: github.origin + "/token",
      apiURL: github.origin,
    }),
  },
  stdio: "ignore",
});
const directory = process.env.SCREENSHOT_DIR || "/home/coder/startodel-screens";
let browser;
try {
  for (let i = 0; i < (cascade ? 900 : 100); i++) {
    try {
      if ((await fetch(origin + "/api/health")).ok) break;
    } catch {}
    await delay(100);
  }
  browser = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
  });
  const request = context.request;
  async function signIn(login) {
    const start = await request.get(origin + "/auth/github", { maxRedirects: 0 });
    const state = new URL(start.headers().location).searchParams.get("state");
    assert.equal(
      (
        await request.get(
          origin + "/auth/github?code=" + login + "&state=" + encodeURIComponent(state),
          {
            maxRedirects: 0,
          },
        )
      ).status(),
      302,
    );
  }
  await signIn("bob");
  const me = await (await request.get(origin + "/api/me")).json();
  const owner = forUser(db, me.user.id);
  const page = await context.newPage();
  // SSR links and form controls become visible before their click handlers are attached.
  const hydrated = () => page.waitForFunction(() => window.useNuxtApp?.().isHydrating === false);
  async function visit(path) {
    await page.goto(origin + path);
    await hydrated();
  }
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  // Keep browser navigation and embedded resources on the local test app.
  await page.route("**/*", (r) =>
    r
      .request()
      .url()
      .startsWith(origin + "/")
      ? r.continue()
      : r.abort(),
  );
  await mkdir(directory, { recursive: true });
  const pr12 = process.argv.includes("--pr12");
  const shot = async (name) => {
    if (cascade) return;
    if (pr12 && !name.startsWith("pr12-")) return;
    if (process.argv.includes("--pr11") && !name.startsWith("pr11-")) return;
    if (
      !name.startsWith("pr12-") &&
      !name.startsWith("pr11-") &&
      !name.startsWith("pr9-") &&
      !process.argv.includes("--include-pr8")
    )
      return;
    await page.screenshot({
      path: directory + "/" + name + ".png",
      fullPage: true,
      animations: "disabled",
    });
    console.log(name);
  };
  if (cascade) {
    await visit("/en/onboarding");
    await checkCascade(page, "/en/onboarding");
  }
  await visit("/en/dashboard");
  await page.getByText("TypeScript", { exact: true }).click();
  await page.getByLabel("Other technologies").fill("SQL,");
  await page.getByLabel("Other technologies").press("Enter");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByText("Understand internals", { exact: true }).click();
  await page.getByLabel("Notes for your agent").fill("Browser internals");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("radio", { name: "Senior", exact: true }).click();
  await page.getByLabel("Years of experience").fill("8");
  await shot("onboarding");
  await page.getByRole("button", { name: "Continue to connect your agent" }).click();
  await page.waitForURL(origin + "/en/onboarding/connect");
  const profile = await owner.getProfile();
  assert.deepEqual(profile.stack, ["TypeScript", "SQL"]);
  assert.deepEqual(profile.goals, ["Understand internals"]);
  assert.equal(profile.experience, "senior");
  assert.equal(profile.yearsOfExperience, 8);
  assert.equal(profile.notes, "Browser internals");
  await page.getByRole("heading", { name: "First prompt", exact: true }).waitFor();
  if (cascade) await checkCascade(page, "/en/onboarding/connect");
  assert((await page.locator("main").innerText()).includes(origin + "/mcp"));
  await shot("connect");
  await page.getByLabel("Token name").fill("Local demo");
  await page.getByRole("button", { name: "Create token" }).click();
  await page.getByRole("button", { name: "Copy MCP Token" }).waitFor();
  await page.getByRole("button", { name: "Dismiss" }).click();
  await page.getByRole("link", { name: "Skip for now" }).click();
  await page.getByRole("heading", { name: "Build your first Track" }).waitFor();
  const track = await owner.createTrack({
    title: "The browser event loop",
    description:
      "Trace how the browser schedules JavaScript, handles input and decides when to paint.",
    sources: { docs: ["https://developer.mozilla.org/en-US/docs/Web/JavaScript/Event_loop"] },
  });
  const topics = await owner.upsertTopics([
    {
      slug: "runtime",
      title: "The runtime",
      summary: "Identify the call stack and the host environment.",
    },
    {
      slug: "tasks",
      title: "Tasks and timers",
      summary: "Follow a timer from registration to the next available task.",
    },
    { slug: "microtasks", title: "Microtasks", summary: "Trace promise callbacks between tasks." },
    {
      slug: "rendering",
      title: "Rendering opportunities",
      summary: "Connect task scheduling to painting.",
    },
  ]);
  const by = Object.fromEntries(topics.map((t) => [t.slug, t]));
  await owner.attachTopics(track.id, ["runtime", "tasks", "microtasks", "rendering"]);
  await owner.addEdges([
    { from: "runtime", to: "tasks" },
    { from: "runtime", to: "microtasks" },
    { from: "tasks", to: "rendering" },
    { from: "microtasks", to: "rendering" },
  ]);
  await owner.setMastery(by.runtime.id, 3);
  const guide = await readFile("docs/agent-guide/references/browser-tasks.md", "utf8");
  const blocks = JSON.parse(guide.split("```json\n")[1].split("\n```")[0]);
  const lesson = await owner.createLesson({
    topicId: by.tasks.id,
    title: "When does a timer run?",
    summary: "Trace a timer callback through a single browser task.",
    blocks,
  });
  await page.reload();
  await hydrated();
  await page.locator("main").getByRole("link", { name: track.title }).waitFor();
  await shot("dashboard");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.locator("main").getByRole("link", { name: track.title }).click();
  const node = page
    .locator(".vue-flow__node")
    .filter({ hasText: "Tasks and timers" })
    .getByRole("button", { name: /Tasks and timers/ });
  await node.click();
  await page.getByRole("link", { name: lesson.title }).waitFor();
  assert.equal(await page.locator(".s-canvas .vue-flow__edge .s-trace").count(), 4);
  await shot("track-graph");
  const lessonApi = "/api/lessons/" + lesson.id;
  let enriched = false;
  let reveals = 0;
  page.on("request", (request) => {
    if (request.url().includes(lessonApi + "/exercise/")) reveals++;
  });
  await page.route("**" + lessonApi, async (route) => {
    const response = await route.fetch();
    const json = await response.json();
    for (const block of json.lesson.blocks) {
      if (block.type === "exercise") block.solution = "Preloaded solution";
      if (block.type === "quiz") {
        for (const q of block.questions)
          Object.assign(q, { correctIndex: 0, explanation: "Preloaded explanation" });
      }
    }
    enriched = true;
    await route.fulfill({ response, json });
  });
  await page.getByRole("link", { name: lesson.title }).click();
  await page.locator(".s-quiz").waitFor();
  assert.ok(enriched);
  const projected = await page.evaluate((id) => {
    const payload = Object.values(window.useNuxtApp().payload.data).find(
      (data) => data?.lesson?.id === id,
    );
    return payload.lesson.blocks;
  }, lesson.id);
  for (const block of projected) {
    if (block.type === "quiz") {
      for (const question of block.questions)
        assert.deepEqual(Object.keys(question).sort(), ["options", "prompt"]);
    }
    if (block.type === "exercise") assert.ok(!("solution" in block));
  }
  const rendered = await page.locator("main").innerText();
  assert.doesNotMatch(rendered, /Preloaded solution|Preloaded explanation/);
  assert.equal(await page.locator(".s-quiz .is-correct, .s-quiz__feedback").count(), 0);
  assert.equal(reveals, 0);
  await page.getByText("Show solution", { exact: true }).click();
  await page.locator(".s-exercise__solution.is-open").waitFor();
  assert.equal(reveals, 1);
  await page.getByRole("radio", { name: /\bsync$/ }).check();
  await page.getByRole("button", { name: "Submit answers" }).click();
  await page.getByText("1 of 1 correct").waitFor();
  const [read] = await Promise.all([
    page.waitForResponse(
      (r) => r.url() === origin + lessonApi + "/read" && r.request().method() === "POST",
    ),
    page.getByRole("button", { name: "Mark as read" }).click(),
  ]);
  assert.ok(read.ok());
  await page.getByRole("button", { name: "Marked as read" }).waitFor();
  await page.locator("figure pre code span").first().waitFor();
  await shot("lesson");
  await page.locator(".s-video__poster").click();
  assert.equal(
    await page.locator("iframe[title]").getAttribute("src"),
    "https://www.youtube-nocookie.com/embed/8aGhZQkoFbQ?autoplay=1",
  );
  await page.setViewportSize({ width: 375, height: 812 });
  await visit("/en/tracks/" + track.id);
  await page.locator(".s-tracklist__row").filter({ hasText: "Tasks and timers" }).click();
  await page.getByRole("link", { name: lesson.title }).waitFor();
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  await page.setViewportSize({ width: 1280, height: 900 });
  const finished = await owner.startGrill({ title: "Inside the runtime", trackId: track.id });
  const previous = await owner.addGrillQuestion(finished.id, {
    topicId: by.runtime.id,
    prompt: "What owns the call stack?",
  });
  await owner.answerGrillQuestion(
    previous.id,
    "The engine manages the stack of active calls.",
    "mcp",
  );
  await owner.judgeGrillQuestion(
    previous.id,
    "strong",
    "Correctly distinguished the engine from its host.",
  );
  const reinforce = await owner.addGrillQuestion(finished.id, {
    topicId: by.rendering.id,
    prompt: "Does every task end in a paint?",
  });
  await owner.answerGrillQuestion(reinforce.id, "The browser can paint after a task.", "mcp");
  await owner.judgeGrillQuestion(
    reinforce.id,
    "partial",
    "Painting is an opportunity. The browser can skip a frame.",
  );
  await owner.finishGrill(finished.id);
  const grill = await owner.startGrill({ title: "Timers and the call stack", trackId: track.id });
  const [weak, waiting] = await owner.addGrillQuestions(grill.id, [
    { topicId: by.tasks.id, prompt: "Can a timer interrupt synchronous JavaScript?" },
    { topicId: by.microtasks.id, prompt: "When do pending promise callbacks run?" },
    { topicId: by.rendering.id, prompt: "What can delay the next paint?" },
  ]);
  await owner.answerGrillQuestion(weak.id, "Yes, once its delay expires.", "ui");
  await owner.judgeGrillQuestion(
    weak.id,
    "weak",
    "An expired timer queues a task. The current task must finish before the callback can run.",
  );
  await visit("/en/grills/" + grill.id);
  await page
    .getByLabel("Your answer")
    .fill("After the current task returns and before the next task starts.");
  await page.getByRole("button", { name: "Submit answer" }).click();
  await page.getByText("Waiting for your agent", { exact: true }).waitFor();
  assert.equal(
    (await owner.getGrill(grill.id)).questions.find((q) => q.id === waiting.id).answerSource,
    "ui",
  );
  await page.getByRole("button", { name: "Previous" }).click();
  await page.locator(".s-judgment__verdict").getByText("weak", { exact: true }).waitFor();
  await shot("pr9-grill-open");
  await visit("/en/dashboard");
  await page.getByRole("link", { name: "Continue grill session" }).waitFor();
  await shot("pr9-dashboard-next-up");
  await visit("/en/grills");
  await page.getByRole("link", { name: finished.title }).waitFor();
  await shot("pr9-grills");
  await page.getByRole("link", { name: finished.title }).click();
  await page.getByText("Rendering opportunities Lessons").waitFor();
  await shot("pr9-grill-summary");
  await db.$client.query(
    "update review_items set due_at=now()-interval '1 day' where user_id=$1 and topic_id=$2",
    [me.user.id, by.tasks.id],
  );
  await visit("/en/reviews");
  await page.getByRole("link", { name: "Practice quiz" }).waitFor();
  await shot("pr9-reviews");
  await page.getByRole("link", { name: "Practice quiz" }).click();
  await page
    .locator(".s-quiz")
    .getByRole("radio", { name: /\bsync$/ })
    .check();
  await shot("pr9-review-practice");
  if (cascade) await checkCascade(page, "/en/reviews/" + by.tasks.id + "/practice");
  await page.getByRole("button", { name: "Submit Practice Quiz" }).click();
  await page.locator(".outcome__title").filter({ hasText: "1 of 1 correct" }).waitFor();
  if (cascade) await checkCascade(page, "/en/reviews/" + by.tasks.id + "/practice");
  await visit("/en/progress");
  await page.getByRole("combobox", { name: "Sort by" }).click();
  await page.getByRole("option", { name: "Mastery (lowest first)" }).click();
  const levels = await page.locator("tbody .s-mastery__level").allTextContents();
  assert.equal(levels.length, topics.length);
  assert.deepEqual(
    levels.map(Number),
    levels.map(Number).sort((a, b) => a - b),
  );
  await page.getByRole("tab", { name: /Recent activity/ }).click();
  await page.locator(".s-timeline-item").first().waitFor();
  await shot("pr9-progress");
  if (cascade) {
    async function audit(path) {
      await visit(path);
      await checkCascade(page, path);
    }
    for (const path of [
      "/dashboard",
      "/en/dashboard",
      "/settings",
      "/progress",
      "/reviews",
      "/tracks/" + track.id,
      "/topics/" + by.tasks.id,
      "/lessons/" + lesson.id,
      "/grills",
      "/grills/" + grill.id,
      "/grills/" + finished.id,
    ])
      await audit(path);
    await owner.setTrackVisibility(track.id, true, true);
    await visit("/en/u/bob/" + track.slug);
    await page.getByRole("button", { name: "Change visibility" }).click();
    await page.getByRole("dialog", { name: "Make this Track private?" }).waitFor();
    await checkCascade(page, "/en/tracks/" + track.id);
    await context.clearCookies();
    const profile = "/u/bob";
    const publicTrack = profile + "/" + track.slug;
    for (const path of [
      "/",
      "/en",
      "/terms",
      "/rules",
      profile,
      publicTrack,
      publicTrack + "/lessons/" + lesson.id,
    ])
      await audit(path);
    // Compare the responsive Landing composition directly with its reference screen.
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const theme of ["light", "dark"]) {
        await context.addCookies([{ name: "startodel-theme", value: theme, url: origin }]);
        async function composition(path) {
          await visit(path);
          await page.evaluate(() => document.fonts.ready);
          return page.evaluate(() => {
            const get = (selector) => getComputedStyle(document.querySelector(selector));
            return {
              board: document.querySelectorAll(".hero__board .s-part").length,
              steps: [...document.querySelectorAll(".steps__pad")].map((el) =>
                el.textContent.trim(),
              ),
              columns: get(".steps").gridTemplateColumns,
              band: get(".band").backgroundColor,
              surface: get(".band--plain").backgroundColor,
              levels: document.querySelectorAll(".signal__scale li").length,
              facts: document.querySelectorAll(".fact").length,
              rule: get(".fact").borderTopWidth,
              cta: get(".cta__inner").justifyContent,
            };
          });
        }
        const reference = await composition("/en/design/screens/landing?chrome=0");
        const product = await composition("/en");
        assert.deepEqual(product, reference);
        assert.equal(product.columns.split(" ").length, width === 390 ? 1 : 4);
        assert.equal(product.rule, "2px");
        assert.notEqual(product.band, product.surface);
        if (process.env.SCREENSHOT_DIR)
          await page.screenshot({
            path: directory + "/landing-" + width + "-" + theme + ".png",
            fullPage: true,
            animations: "disabled",
          });
      }
    }
    await visit("/en/login?error=oauth#how");
    await page.waitForURL(origin + "/en?error=oauth#how");
    assert.ok(await page.locator(".hero .s-notice").isVisible());
  }
  if (pr12) {
    await page.setViewportSize({ width: 1440, height: 900 });
    await visit("/dashboard");
    await page.getByRole("heading", { name: "С возвращением, Bob", exact: true }).waitFor();
    await page.locator("main").getByRole("link", { name: track.title }).waitFor();
    await shot("pr12-ru-dashboard");
    await page.locator("main").getByRole("link", { name: track.title }).click();
    await page.locator(".s-canvas .s-trace").first().waitFor();
    await page.getByRole("button", { name: "Открыть доступ" }).waitFor();
    await shot("pr12-ru-track");
    await visit("/reviews");
    await page.getByRole("link", { name: by.tasks.title, exact: true }).waitFor();
    await page.getByText("Тренировочный тест: 1 из 1 верно", { exact: true }).waitFor();
    await shot("pr12-ru-grill-or-reviews");

    // Exercise the real submission handler and check the message visible after each response.
    await page.getByRole("link", { name: "Тренировочный тест", exact: true }).click();
    await page
      .locator(".s-quiz")
      .getByRole("radio", { name: /\bsync$/ })
      .check();
    await page.route("**/api/reviews/*/practice", (route) => route.continue({ postData: "{}" }), {
      times: 1,
    });
    await page.getByRole("button", { name: "Проверить ответы" }).click();
    await page
      .getByText("Проверьте, что для каждого вопроса выбран один из предложенных ответов.", {
        exact: true,
      })
      .waitFor();
    await owner.recordReviewResult(by.tasks.id, "strong", "Discussed with the learner");
    await page.getByRole("button", { name: "Проверить ответы" }).click();
    await page
      .getByText("Вопросы изменились. Загрузите новую версию теста.", { exact: true })
      .waitFor();

    await owner.setTrackVisibility(track.id, true, true);
    await context.clearCookies();
    const publicPath = "/u/bob/" + track.slug;
    await visit(publicPath);
    await page.locator(".s-map .s-trace").first().waitFor();
    await shot("pr12-ru-public-track");
    await page.getByRole("banner").getByRole("button", { name: /Язык/ }).click();
    await page.getByRole("menuitem", { name: /English/ }).click();
    await page.waitForURL(origin + "/en" + publicPath);
    await page.getByRole("group", { name: "Track Graph" }).waitFor();
    await page.locator(".s-map .s-trace").first().waitFor();
    await shot("pr12-en-public-track");
    await visit("/");
    await page.waitForURL(origin + "/en");
    await page
      .locator("footer")
      .getByRole("button", { name: /language/i })
      .click();
    await page.getByRole("menuitem", { name: /Русский/ }).click();
    await page.waitForURL(origin + "/");
    await visit("/");
    await page.waitForURL(origin + "/");
  }
  if (process.argv.includes("--pr11")) {
    await page.setViewportSize({ width: 1440, height: 900 });
    await visit("/en/tracks/" + track.id);
    await page.getByRole("button", { name: "Make public" }).click();
    await page.getByRole("dialog").waitFor();
    await shot("pr11-publish-dialog");
    assert.ok(await page.getByRole("button", { name: "Publish", exact: true }).isDisabled());
    await page
      .getByRole("checkbox", { name: "I agree to the Publishing rules and Terms of Use" })
      .check();
    await page.getByRole("button", { name: "Publish", exact: true }).click();
    await page.getByRole("button", { name: "Copy public URL" }).waitFor();
    const publicPath = "/u/bob/" + track.slug;
    await visit("/terms?lang=en");
    await page.getByRole("heading", { name: "Terms of Use", exact: true }).waitFor();
    await shot("pr11-terms");
    await context.clearCookies();
    await visit("/en/u/bob");
    await page.getByRole("link", { name: track.title }).waitFor();
    await shot("pr11-public-profile");
    await page.getByRole("link", { name: track.title }).click();
    await page.locator(".s-map .s-trace").first().waitFor();
    await page.getByRole("link", { name: "Sign in to fork" }).waitFor();
    await shot("pr11-public-track");
    await page
      .locator(".s-map")
      .getByRole("button", { name: /Tasks and timers/ })
      .click();
    let enrichedPreview = false;
    await page.route("**/api/public/bob/*/lessons/*", async (route) => {
      const response = await route.fetch();
      const json = await response.json();
      for (const block of json.blocks) {
        if (block.type === "quiz") {
          for (const q of block.questions)
            Object.assign(q, { correctIndex: 1, explanation: "Hidden explanation" });
        }
        if (block.type === "exercise") block.solution = "Hidden solution";
      }
      enrichedPreview = true;
      await route.fulfill({ response, json });
    });
    await page.getByRole("link", { name: lesson.title }).click();
    await page.getByText("Fork this track to practice").waitFor();
    assert.equal(await page.getByText("Show solution", { exact: true }).count(), 0);
    const preview = await page.evaluate(() =>
      Object.values(window.useNuxtApp().payload.data).find((entry) => entry?.blocks),
    );
    assert.ok(enrichedPreview);
    assert.ok(preview.blocks.some((block) => block.type === "quiz"));
    for (const block of preview.blocks) {
      if (block.type === "quiz") {
        for (const q of block.questions)
          assert.deepEqual(Object.keys(q).sort(), ["options", "prompt"]);
      }
      if (block.type === "exercise") assert.ok(!("solution" in block));
    }
    assert.equal(await page.locator(".s-quiz input, .s-exercise__solution").count(), 0);
    await shot("pr11-public-lesson");
    await page.setViewportSize({ width: 390, height: 900 });
    await context.addCookies([{ name: "startodel-theme", value: "dark", url: origin }]);
    await page.emulateMedia({ colorScheme: "light" });
    await page.reload();
    await hydrated();
    await page.evaluate(() => document.fonts.ready);
    assert.equal(
      await page.locator(".s-root").evaluate((el) => getComputedStyle(el).colorScheme),
      "dark",
    );
    const crumbs = await page
      .locator(".s-crumbs__item")
      .evaluateAll((items) =>
        items
          .slice(0, -1)
          .every(
            (item, i) =>
              item.querySelector("a").getBoundingClientRect().right <=
              items[i + 1].getBoundingClientRect().left + 1,
          ),
      );
    assert.ok(crumbs, "Breadcrumb links must fit inside their items on narrow screens");
    await page.setViewportSize({ width: 1440, height: 900 });
    await signIn("forker");
    const { user: reader } = await (await request.get(origin + "/api/me")).json();
    await visit("/en" + publicPath);
    await page.getByRole("button", { name: "Fork", exact: true }).click();
    await page.waitForURL("**/en/tracks/*");
    await page.getByText("Forked from", { exact: false }).waitFor();
    await page.locator(".s-canvas .s-trace").first().waitFor();
    await shot("pr11-fork-result");
    await signIn("bob");
    await visit("/en/tracks/" + track.id);
    await page.getByText("1 fork", { exact: true }).waitFor();
    await page.locator(".s-canvas .s-trace").first().waitFor();
    await shot("pr11-track-visibility");

    const recipient = forUser(db, reader.id);
    for (let i = 0; i < 5; i++) {
      const copy = await recipient.forkTrack("bob", track.slug);
      await recipient.setTrackVisibility(copy.id, true, true);
    }
    await visit("/en" + publicPath);
    assert.equal(await page.getByRole("button", { name: "Fork", exact: true }).count(), 0);
    const links = page.locator("#forks .s-trackcard__link");
    const targets = () => links.evaluateAll((items) => items.map((el) => el.href));
    const first = await targets();
    assert.equal(first.length, 4);
    await page.getByRole("button", { name: "Next page" }).click();
    assert.equal(await links.count(), 1);
    assert.ok(!first.includes((await targets())[0]));
    await page.getByRole("button", { name: "Previous page" }).click();
    assert.deepEqual(await targets(), first);
  }
  assert.deepEqual(errors, []);
} finally {
  await browser?.close();
  server.kill();
  github.close();
  await db.$client.query("delete from users where github_id=any($1::bigint[])", [
    github.users.map((u) => u.id),
  ]);
  await db.$client.end();
}
