// Run from the workspace root after building the app. PLAYWRIGHT_MODULE may point to a local installation.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
import { checkLessonInteractions, checkSidebarProgress } from "./lesson-screenshots.mjs";
import { checkOAuth } from "./oauth-screenshots.mjs";
import { checkSignIn, checkUnavailableSignIn } from "./signin-screenshots.mjs";
import { checkProgress } from "./progress-screenshots.mjs";
import { checkCascade } from "./cascade.mjs";
import { icons } from "../app/components/ui/icons.ts";
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
const oauthOnly = process.argv.includes("--oauth");
const signinOnly = process.argv.includes("--signin");
const progressOnly = process.argv.includes("--progress");
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
const mail = new Map();
function startServer(capture) {
  const instance = spawn(
    process.execPath,
    ["--import", "./apps/web/test/mail-capture.mjs", ...command],
    {
      env: {
        ...process.env,
        SMTP_HOST: "",
        NUXT_SESSION_COOKIE: JSON.stringify({ secure: false }),
        MAIL_TRANSPORT: capture ? "capture" : "",
        ...(!capture && { NODE_ENV: "production" }),
        ...((progressOnly || signinOnly || oauthOnly) && { NUXT_PUBLIC_DESIGN_SHOWCASE: "true" }),
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
      stdio: ["ignore", "ignore", "ignore", "ipc"],
    },
  );
  instance.on("message", (message) => {
    if (message.mail) mail.set(message.mail.to, message.mail);
  });
  return instance;
}
let server = startServer(true);
const directory = process.env.SCREENSHOT_DIR || "/home/coder/startodel-screens";
let browser;
async function waitForServer() {
  for (let i = 0; i < (cascade ? 900 : 100); i++) {
    try {
      if ((await fetch(origin + "/api/health")).ok) return;
    } catch {}
    await delay(100);
  }
  throw new Error("Screenshot server did not become ready");
}
async function exercise() {
  await waitForServer();
  browser = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
  });
  const request = context.request;
  async function signIn(login) {
    const start = await request.get(origin + "/auth/github", { maxRedirects: 0 });
    const state = new URL(start.headers().location).searchParams.get("state");
    const callback = await request.get(
      origin + "/auth/github?code=" + login + "&state=" + encodeURIComponent(state),
      { maxRedirects: 0 },
    );
    assert.equal(callback.status(), 302);
    assert.match(callback.headers().location, /^\/(?:ru\/)?dashboard$/);
  }
  await signIn("bob");
  const me = await (await request.get(origin + "/api/me")).json();
  const profilePath = "/u/" + me.handle;
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
  const shot = async (name, { fullPage = true, locator } = {}) => {
    if (cascade) return;
    if (pr12 && !name.startsWith("pr12-")) return;
    if (process.argv.includes("--pr11") && !name.startsWith("pr11-")) return;
    if (
      !name.startsWith("public-profile-") &&
      !name.startsWith("lesson-") &&
      !name.startsWith("track-header-") &&
      !name.startsWith("pr12-") &&
      !name.startsWith("pr11-") &&
      !name.startsWith("pr9-") &&
      !process.argv.includes("--include-pr8")
    )
      return;
    const options = {
      path: directory + "/" + name + ".png",
      animations: "disabled",
    };
    if (locator) {
      // Keep the whole row clear of the fixed mobile tab bar.
      await locator.evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
      await locator.screenshot(options);
    } else await page.screenshot({ ...options, fullPage });
    console.log(name);
  };
  if (oauthOnly || (cascade && !signinOnly && !progressOnly)) {
    await checkOAuth({ page, visit, request, origin, directory, cascade, db });
    if (oauthOnly) {
      assert.deepEqual(errors, []);
      return;
    }
  }
  if (cascade || signinOnly) {
    await visit("/onboarding");
    await checkSignIn({ page, visit, context, directory, cascade, mail, db, signIn });
    if (signinOnly) {
      assert.deepEqual(errors, []);
      return;
    }
    await signIn("bob");
  }
  if (cascade || progressOnly) {
    await checkProgress({
      page,
      visit,
      directory: process.env.PROGRESS_SCREENSHOT_DIR || process.env.SCREENSHOT_DIR,
      cascade,
      signInOwner: async (login) => {
        await signIn(login);
        const { user } = await (await request.get(origin + "/api/me")).json();
        return forUser(db, user.id);
      },
    });
    if (progressOnly) {
      assert.deepEqual(errors, []);
      return;
    }
    await signIn("bob");
    await page.setViewportSize({ width: 1280, height: 900 });
    await visit("/onboarding");
    await checkCascade(page, "/onboarding");
  }
  await visit("/dashboard");
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
  await page.waitForURL(origin + "/onboarding/connect");
  const profile = await owner.getProfile();
  assert.deepEqual(profile.stack, ["TypeScript", "SQL"]);
  assert.deepEqual(profile.goals, ["Understand internals"]);
  assert.equal(profile.experience, "senior");
  assert.equal(profile.yearsOfExperience, 8);
  assert.equal(profile.notes, "Browser internals");
  await page.getByRole("heading", { name: "First prompt", exact: true }).waitFor();
  if (cascade) await checkCascade(page, "/onboarding/connect");
  assert((await page.locator("main").innerText()).includes(origin + "/mcp"));
  await shot("connect");
  await page.getByLabel("Token name").fill("Local demo");
  await page.getByRole("button", { name: "Create token" }).click();
  await page.getByRole("button", { name: "Copy MCP Token" }).waitFor();
  const dismiss = page.getByRole("button", { name: "Dismiss" });
  for (const theme of ["light", "dark"]) {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
    const aligned = await dismiss.evaluate((button) => {
      const notice = button.closest(".s-notice");
      const title = notice.querySelector(".s-notice__title");
      const text = notice.querySelector(".s-notice__text");
      return (
        getComputedStyle(button).color === getComputedStyle(text).color &&
        Math.abs(button.getBoundingClientRect().top - title.getBoundingClientRect().top) <= 1
      );
    });
    assert.ok(aligned, "notice action alignment and ink in " + theme);
    if (process.env.SCREENSHOT_DIR) {
      await page
        .locator(".s-notice")
        .filter({ has: dismiss })
        .screenshot({
          path: directory + "/token-notice-" + theme + ".png",
          animations: "disabled",
        });
    }
  }
  await page.emulateMedia({ colorScheme: "light", reducedMotion: null });
  await dismiss.click();
  await page.getByRole("link", { name: "Skip for now" }).click();
  await page.getByRole("link", { name: "Connect agent", exact: true }).waitFor();
  const dashboardRequest = (r) => r.url() === origin + "/api/dashboard";
  const expectQuiet = () =>
    assert.rejects(page.waitForRequest(dashboardRequest, { timeout: 5500 }), {
      name: "TimeoutError",
    });
  if (cascade) {
    await checkCascade(page, "/dashboard");
    await page.evaluate(() => {
      Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await Promise.all([
      expectQuiet(),
      page.evaluate(() => window.dispatchEvent(new Event("focus"))),
    ]);
    await Promise.all([
      page.waitForRequest(dashboardRequest, { timeout: 3000 }),
      page.evaluate(() => {
        Reflect.deleteProperty(document, "visibilityState");
        document.dispatchEvent(new Event("visibilitychange"));
      }),
    ]);
  }
  const connection = await owner.mcpTokens.create("Second client");
  const ping = await request.post(origin + "/mcp", {
    headers: {
      authorization: "Bearer " + connection.token,
      accept: "application/json, text/event-stream",
    },
    data: { jsonrpc: "2.0", id: 1, method: "ping", params: {} },
  });
  assert.ok(ping.ok());
  await page.getByText("Agent connected · waiting for first track").waitFor();
  if (cascade) await checkCascade(page, "/dashboard");
  await context.grantPermissions(["clipboard-write"], { origin });
  await page.getByRole("button", { name: "Copy prompt" }).click();
  await page
    .getByRole("status")
    .filter({ hasText: "Copied — paste it into your agent's chat" })
    .waitFor();
  const docs = [
    "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Event_loop",
    "https://html.spec.whatwg.org/multipage/webappapis.html#event-loops",
    "https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout",
    "https://developer.mozilla.org/en-US/docs/Web/API/Window/queueMicrotask",
    "https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame",
    "https://www.w3.org/TR/longtasks-1/?view=spec#sec-intro",
  ];
  const track = await owner.createTrack({
    title: "The browser event loop",
    description:
      "Trace how the browser schedules JavaScript, handles input and decides when to paint.",
    sources: { docs: docs.slice(0, 5) },
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
  // Exercise the outline fallback for an older Theory Block alongside authored titles.
  delete blocks.find((b) => b.id === "order-trace").title;
  blocks.splice(
    blocks.findIndex((b) => b.id === "latency") + 1,
    0,
    {
      id: "minimum-delay",
      type: "callout",
      variant: "gotcha",
      title: "A minimum delay",
      markdown: "A zero-delay timer still waits for the current task to finish.",
    },
    {
      id: "measure-delay",
      type: "callout",
      variant: "tip",
      title: "Measure the delay",
      markdown: "Compare two performance.now() readings to measure how late the callback ran.",
    },
  );
  async function checkLesson(prefix, isPublic) {
    // The original fixture has no fenced starter. Both Lesson routes still offer an empty editor.
    const editor = page.getByRole("textbox", {
      name: prefix ? "Редактор задачи" : "Exercise editor",
    });
    await editor.waitFor();
    assert.deepEqual(await editor.locator(".cm-line").allTextContents(), [""]);
    const trackPath = prefix + (isPublic ? profilePath + "/" : "/tracks/") + track.slug;
    const crumbs = page.locator(".lesson .s-crumbs");
    assert.deepEqual(await crumbs.locator(".s-crumbs__link, .s-crumbs__here").allTextContents(), [
      track.title,
      prefix ? "Т02 Tasks and timers" : "T02 Tasks and timers",
      prefix ? "У01" : "L01",
    ]);
    assert.deepEqual(
      await crumbs
        .getByRole("link")
        .evaluateAll((links) => links.map((link) => link.getAttribute("href"))),
      [trackPath, trackPath + (isPublic ? "#topic-tasks" : "?topic=" + by.tasks.id)],
    );
    const header = page.locator(".lesson .s-page-header");
    assert.equal(await header.locator("h1").textContent(), lesson.title);
    assert.equal(
      await header.locator(".s-page-header__kicker").textContent(),
      (prefix ? "Урок У01 · Т02" : "Lesson L01 · T02") + " Tasks and timers",
    );
    assert.equal(await header.locator(".s-page-header__description").count(), 0);
    assert.deepEqual(
      (await header.locator(".s-badge").allTextContents()).slice(0, 2),
      prefix ? ["8 мин", "11 блоков"] : ["8 min", "11 Blocks"],
    );
    assert.equal(await header.locator(".s-mastery").count(), isPublic ? 0 : 1);
    if (isPublic) {
      assert.equal(
        await header.getByRole("link", { name: "@" + me.handle }).getAttribute("href"),
        prefix + profilePath,
      );
      assert.equal(await header.getByTitle(prefix ? "Язык трека" : "Track language").count(), 0);
      assert.equal(
        await page.locator('meta[name="description"]').getAttribute("content"),
        lesson.summary,
      );
    }
    const outline = page.locator(".s-index");
    assert.ok(await outline.isVisible());
    assert.equal(await outline.locator("svg:not(.s-index__done)").count(), 0);
    const refs = blocks.map((_, i) => (prefix ? "Б" : "B") + String(i + 1).padStart(2, "0"));
    assert.deepEqual(await outline.locator(".s-index__ref").allTextContents(), refs);
    assert.deepEqual(await page.locator(".s-block__ref").allTextContents(), refs);
    assert.deepEqual(await outline.locator(".s-index__title").allTextContents(), [
      "Two messages from one click",
      "timers.js",
      prefix ? "Тест · 1 вопрос" : "Quiz · 1 question",
      "The console shows sync first.",
      "When the timer is late",
      "A minimum delay",
      "Measure the delay",
      blocks.find((b) => b.id === "docs").title,
      blocks.find((b) => b.id === "talk").title,
      prefix ? "Тест · 1 вопрос" : "Quiz · 1 question",
      prefix ? "Задача: Move the save" : "Exercise: Move the save",
    ]);
    assert.equal(await page.locator(".s-code__title").textContent(), "timers.js");
    await shot("lesson-" + (isPublic ? "public-" : "private-") + (prefix ? "ru" : "en"));
    const viewport = page.viewportSize();
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(() => document.fonts.ready);
      for (const [id, variant, label] of [
        ["latency", "production", prefix ? "В продакшене" : "Production"],
        ["minimum-delay", "gotcha", prefix ? "Нюанс" : "Gotcha"],
        ["measure-delay", "tip", prefix ? "Совет" : "Tip"],
      ]) {
        const anchor = "#lesson-block-" + id;
        const block = page.locator(anchor);
        const kind = block.locator(".s-block__kind");
        assert.equal((await kind.textContent()).trim(), label);
        const matches = await kind.locator("svg").evaluate((svg, markup) => {
          const expected = svg.cloneNode(false);
          expected.innerHTML = markup;
          return svg.isEqualNode(expected);
        }, icons[variant]);
        assert.ok(matches, id + " uses the " + variant + " glyph");
        assert.ok(await block.locator(".s-callout__kind").isHidden());
        assert.ok(await block.locator(".s-callout__body").isVisible());
        const bounds = await kind.boundingBox();
        const box = await block.locator(".s-callout").boundingBox();
        const reference = await page.locator("#lesson-block-order .s-block__kind").boundingBox();
        assert.ok(
          await kind.evaluate((el) => {
            const range = document.createRange();
            range.selectNodeContents(el.lastChild);
            return range.getClientRects().length === 1;
          }),
          label + " fits on one line",
        );
        if (width === 390) assert.ok(bounds.y + bounds.height <= box.y);
        else {
          assert.ok(Math.abs(bounds.x + bounds.width - reference.x - reference.width) <= 1);
          assert.ok(
            bounds.x >= (await block.boundingBox()).x - 1 && bounds.x + bounds.width < box.x,
          );
        }
        if (!isPublic)
          await shot(`lesson-callout-${prefix ? "ru" : "en"}-${width}-${variant}`, {
            locator: block,
          });
      }
    }
    await page.setViewportSize(viewport);
  }
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await page.locator("main").getByRole("link", { name: track.title }).waitFor();
  await page.locator(".s-rail__item--track").filter({ hasText: track.title }).waitFor();
  if (cascade) {
    async function heroStyles(path) {
      await visit(path);
      return page.locator(".s-next").evaluate((card) => {
        const style = (selector) => getComputedStyle(card.querySelector(selector));
        return {
          border: getComputedStyle(card).border,
          background: getComputedStyle(card).backgroundColor,
          padding: style(".s-next__main").padding,
          kicker: style(".s-next__kicker").color,
          title: style(".s-next__title").fontSize,
          status: style(".s-next__why").color,
          button: style(".s-button--primary").backgroundColor,
          arrow: !!card.querySelector(".s-button--primary > svg:last-child"),
          footer: style(".s-next__prompt").backgroundColor,
        };
      });
    }
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const theme of ["light", "dark"]) {
        await context.addCookies([{ name: "startodel-theme", value: theme, url: origin }]);
        const reference = await heroStyles("/design/screens/dashboard?chrome=0");
        assert.deepEqual(await heroStyles("/dashboard"), reference);
      }
    }
    await Promise.all([
      expectQuiet(),
      page.evaluate(() => window.dispatchEvent(new Event("focus"))),
    ]);
  }
  // The dashboard specimen above shows a ready Topic that still needs its first Lesson.
  const lesson = await owner.createLesson({
    topicId: by.tasks.id,
    title: "When does a timer run?",
    summary: "Trace a timer callback through a single browser task.",
    blocks,
  });
  for (const path of ["/ru/dashboard", "/ru/progress", "/progress", "/dashboard"]) {
    await visit(path);
    const strip = page.locator(".s-trackstrip").filter({ hasText: track.title });
    assert.deepEqual(
      await strip
        .locator(".s-trackstrip__cells i")
        .evaluateAll((cells) => cells.map((cell) => cell.className)),
      ["is-l3", "is-l0", "is-l0", "is-l0"],
    );
    assert.equal(await strip.locator(".s-badge").count(), 0);
  }
  await shot("dashboard");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.locator("main").getByRole("link", { name: track.title }).click();
  const sources = page.getByRole("region", { name: "Track Sources" });
  await sources.waitFor();
  assert.equal(await sources.getByRole("link").count(), 5);
  assert.equal(await sources.getByRole("button").count(), 0);
  const header = page.locator(".s-page-header");
  assert.equal(await header.getByRole("button", { name: "Show more", exact: true }).count(), 0);

  const editLanguage = (tag) =>
    page.getByRole("button", { name: "Change Track language (" + tag + ")" });
  await editLanguage("en").click();
  const field = page.getByRole("combobox", { name: "Track language", exact: true });
  await field.click();
  await page.getByRole("option", { name: "Other language" }).click();
  const customTag = page.getByRole("textbox", { name: "Language tag" });
  await customTag.fill("PT-BR");
  const saveLanguage = page.getByRole("button", { name: "Save language" });
  assert.ok(await saveLanguage.isDisabled());
  await customTag.fill("pt-br");
  if (cascade) await checkCascade(page, "/tracks/" + track.slug);
  await saveLanguage.click();
  await editLanguage("pt-br").click();
  await field.click();
  await page.getByRole("option", { name: "English" }).click();
  await saveLanguage.click();
  await editLanguage("en").waitFor();

  // This pitch fits the desktop header and overflows three lines on a phone.
  const pitch =
    "Trace the browser event loop from a timer callback through the microtask queue to the next paint. Use the performance timeline to explain why a busy page misses a frame.";
  await owner.updateTrack(track.id, { description: pitch, sources: { docs } });
  for (const prefix of ["/ru", ""]) {
    const locale = prefix ? "ru" : "en";
    await visit(prefix + "/tracks/" + track.slug);
    await page.setViewportSize({ width: 390, height: 900 });
    await page.evaluate(() => document.fonts.ready);
    const start = header.getByRole("link", { name: prefix ? "Начать обучение" : "Start learning" });
    assert.equal(
      await start.getAttribute("href"),
      prefix + "/lessons/" + lesson.id + "?track=" + track.slug,
    );
    const actions = header.getByRole("button", {
      name: prefix ? "Действия с треком" : "Track actions",
    });
    assert.ok(await actions.isVisible());
    const more = header.getByRole("button", {
      name: prefix ? "Показать полностью" : "Show more",
      exact: true,
    });
    const less = header.getByRole("button", {
      name: prefix ? "Свернуть" : "Show less",
      exact: true,
    });
    const description = header.getByText(pitch, { exact: true });
    await more.waitFor();
    assert.equal(await more.getAttribute("aria-expanded"), "false");
    assert.equal(await more.getAttribute("aria-controls"), await description.getAttribute("id"));
    const textLeft = (el) => {
      const range = document.createRange();
      range.selectNodeContents(el);
      return range.getClientRects()[0].left;
    };
    assert.ok(
      Math.abs((await more.evaluate(textLeft)) - (await description.evaluate(textLeft))) < 1,
    );
    const clipped = () => description.evaluate((el) => el.scrollHeight > el.clientHeight);
    assert.ok(await clipped());
    const collapsedHeight = await description.evaluate(
      (el) => el.clientHeight / parseFloat(getComputedStyle(el).lineHeight),
    );
    assert.ok(Math.abs(collapsedHeight - 3) < 0.1);
    await shot("track-header-" + locale + "-390", { fullPage: false });
    await more.press("Enter");
    assert.equal(await clipped(), false);
    assert.equal(await less.getAttribute("aria-expanded"), "true");
    await less.click();
    assert.ok(await clipped());
    await more.click();
    await page.setViewportSize({ width: 1440, height: 900 });
    await less.waitFor({ state: "hidden" });
    assert.equal(await more.count(), 0);
    const board = page.locator(".s-board");
    const title = prefix ? "Карта тем" : "Topic map";
    assert.equal(await board.locator(".s-board__lead").textContent(), title);
    const parts = board.locator(".s-part");
    const blocked = parts.filter({ hasText: "Rendering opportunities" });
    await blocked.waitFor();
    assert.equal(await blocked.locator(".s-part__head > svg").count(), 1);
    assert.equal(await blocked.locator(".s-part__state").count(), 0);
    const sibling = (tag) => parts.filter({ hasText: tag }).boundingBox();
    const upper = await sibling(prefix ? "Т02" : "T02");
    const lower = await sibling(prefix ? "Т03" : "T03");
    assert.ok(upper.y < lower.y && Math.abs(upper.x - lower.x) < 1);
    assert.deepEqual(
      await board.locator(".s-legend__keys li").allTextContents(),
      prefix ? ["Освоена", "Доступна", "Закрыта"] : ["Mastered", "Available", "Locked"],
    );
    assert.equal(
      (await board.locator(".s-legend__readout span").allTextContents()).join(" "),
      prefix
        ? "Темы: 1 из 4 освоена · 2 доступны · 1 закрыта"
        : "Topics: 1 of 4 mastered · 2 available · 1 locked",
    );
    const toggle = board.locator(".s-segmented__option");
    await toggle.filter({ hasText: prefix ? "Список" : "List" }).click();
    await board.locator(".s-tracklist").waitFor();
    assert.equal(await board.locator(".s-board__lead").textContent(), title);
    await toggle.filter({ hasText: prefix ? "Схема" : "Board" }).click();
    await shot("track-header-" + locale + "-1440", { fullPage: false });
  }
  async function checkTrackSources() {
    const links = sources.getByRole("link");
    assert.equal(await links.count(), 5);
    await sources.getByRole("button", { name: "Show all 6" }).click();
    assert.equal(await links.count(), 6);
    assert.equal(
      await sources
        .getByRole("link", { name: "w3.org/TR/longtasks-1", exact: true })
        .getAttribute("href"),
      docs[5],
    );
    await sources.getByRole("button", { name: "Show less" }).click();
    assert.equal(await links.count(), 5);
  }
  await checkTrackSources();
  const node = page
    .locator(".vue-flow__node")
    .filter({ hasText: "Tasks and timers" })
    .getByRole("button", { name: /Tasks and timers/ });
  await node.click();
  await page.getByRole("link", { name: lesson.title }).waitFor();
  assert.equal(await page.locator(".s-canvas .vue-flow__edge .s-trace").count(), 4);
  const card = page.locator(".s-topic");
  assert.equal(await card.getByText("tasks", { exact: true }).count(), 0);
  const meter = card.getByRole("img", { name: "Mastery 0 of 4, don't know" });
  assert.equal((await meter.innerText()).trim().toLowerCase(), "don't know");
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
  await header.getByRole("link", { name: "Start learning" }).click();
  const timersQuiz = page.locator("#lesson-block-timers .s-quiz");
  await timersQuiz.waitFor();
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
  await timersQuiz.getByRole("radio", { name: /\bsync$/ }).check();
  await timersQuiz.getByRole("button", { name: "Submit answers" }).click();
  await timersQuiz.getByText("1 of 1 correct").waitFor();
  const [read] = await Promise.all([
    page.waitForResponse(
      (r) => r.url() === origin + lessonApi + "/read" && r.request().method() === "POST",
    ),
    page.getByRole("button", { name: "Mark as read" }).click(),
  ]);
  assert.ok(read.ok());
  await page.locator(".lesson__end").getByRole("status").getByText("Marked as read").waitFor();
  await page.locator("figure pre code span").first().waitFor();
  await shot("lesson");
  await page.locator(".s-video__poster").click();
  assert.equal(
    await page.locator("iframe[title]").getAttribute("src"),
    "https://www.youtube-nocookie.com/embed/8aGhZQkoFbQ?autoplay=1",
  );
  for (const prefix of ["", "/ru"]) {
    await visit(prefix + "/lessons/" + lesson.id);
    await checkLesson(prefix, false);
  }
  await page.setViewportSize({ width: 375, height: 812 });
  const nextLesson = await owner.createLesson({
    topicId: by.microtasks.id,
    title: "Promise callbacks",
  });
  await visit("/tracks/" + track.slug);
  assert.equal(
    await header.getByRole("link", { name: "Continue", exact: true }).getAttribute("href"),
    "/lessons/" + nextLesson.id + "?track=" + track.slug,
  );
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
    { topicId: by.tasks.id, prompt: "How would you measure the duration of a task?" },
    { topicId: by.microtasks.id, prompt: "What happens if a microtask queues another microtask?" },
    {
      topicId: by.rendering.id,
      prompt: "When would you schedule work with requestAnimationFrame?",
    },
  ]);
  await owner.answerGrillQuestion(weak.id, "Yes, once its delay expires.", "ui");
  await owner.judgeGrillQuestion(
    weak.id,
    "weak",
    "An expired timer queues a task. The current task must finish before the callback can run.",
  );
  await visit("/grills/" + grill.id);
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
  await visit("/dashboard");
  await page.getByRole("link", { name: "Continue grill session" }).waitFor();
  await shot("pr9-dashboard-next-up");
  await visit("/grills");
  await page.getByRole("link", { name: finished.title }).waitFor();
  await shot("pr9-grills");
  await page.getByRole("link", { name: finished.title }).click();
  await page.getByText("Rendering opportunities Lessons").waitFor();
  await shot("pr9-grill-summary");
  await db.$client.query(
    "update review_items set due_at=now()-interval '1 day' where user_id=$1 and topic_id=$2",
    [me.user.id, by.tasks.id],
  );
  await visit("/reviews");
  await page.getByRole("link", { name: "Practice quiz" }).waitFor();
  await shot("pr9-reviews");
  await page.getByRole("link", { name: "Practice quiz" }).click();
  async function answerPracticeQuiz() {
    const practice = page.locator(".s-quiz");
    await practice.getByRole("radio", { name: /message from the last line$/ }).check();
    await practice.getByRole("radio", { name: /\bsync$/ }).check();
  }
  await answerPracticeQuiz();
  await shot("pr9-review-practice");
  if (cascade) await checkCascade(page, "/reviews/" + by.tasks.id + "/practice");
  await page.getByRole("button", { name: "Submit Practice Quiz" }).click();
  await page.locator(".outcome__title").filter({ hasText: "2 of 2 correct" }).waitFor();
  if (cascade) await checkCascade(page, "/reviews/" + by.tasks.id + "/practice");
  await page.locator('.s-rail a[href="/progress"]').click();
  await page.getByRole("heading", { name: "Progress", exact: true }).waitFor();
  assert.equal(await page.locator(".s-rail .is-current").getAttribute("href"), "/progress");
  assert.equal(await page.locator(".s-topbar__crumbs").innerText(), "Progress");
  await page.getByRole("columnheader", { name: "Mastery" }).getByRole("button").click();
  const levels = await page.locator("tbody .s-mastery").evaluateAll((meters) =>
    meters.map((meter) => {
      const level = Number(meter.getAttribute("aria-label").match(/^Mastery ([0-4]) of 4,/)[1]);
      const numeral = meter.querySelector(".s-mastery__level")?.textContent;
      if (numeral !== (level ? String(level) : undefined))
        throw new Error("Unexpected visible Mastery numeral at level " + level);
      return level;
    }),
  );
  assert.equal(levels.length, topics.length);
  assert.deepEqual(
    levels.map(Number),
    levels.map(Number).sort((a, b) => a - b),
  );
  await page.getByRole("tab", { name: /Activity/ }).click();
  await page.locator(".s-timeline-item").first().waitFor();
  await shot("pr9-progress");
  const overview = "Read a browser trace alongside the HTML specification.";
  const outcomes = ["Identify the next task.", "Explain when a frame can paint."];
  await owner.updateTrack(track.id, {
    description: [pitch, overview, outcomes.map((line) => "- " + line).join("\n")].join("\n\n"),
  });
  const paintLesson = await owner.createLesson({
    topicId: by.rendering.id,
    title: "Finding a paint in the timeline",
  });
  if (cascade) {
    async function audit(path) {
      await visit(path);
      if (await page.locator(".s-editor").count())
        await page.locator(".s-editor .cm-content").first().waitFor();
      await checkCascade(page, new URL(path, origin).pathname);
    }
    const previousViewport = page.viewportSize();
    const frame = (selector) =>
      page.locator(selector).evaluate((el) => {
        const { x, width } = el.getBoundingClientRect();
        return { x, width };
      });
    async function capture(name) {
      if (!process.env.SCREENSHOT_DIR) return;
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
      await page.screenshot({ path: directory + "/" + name + ".png", animations: "disabled" });
    }
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      if (width === 1440 && process.env.SCREENSHOT_DIR) {
        await visit("/lessons/" + lesson.id);
        await page.evaluate(() => document.fonts.ready);
        await capture("lesson-en-1440");
      }
      for (const locale of ["en", "ru"]) {
        const prefix = locale === "en" ? "" : "/ru";
        let listFrame;
        let sessionFrame;
        for (const specimen of [false, true]) {
          await visit(
            prefix + (specimen ? "/design/screens/grill?state=sessions&chrome=0" : "/grills"),
          );
          await page.evaluate(() => document.fonts.ready);
          const activeNav = page.locator('nav a[aria-current="page"]:visible');
          assert.equal((await activeNav.textContent()).trim(), prefix ? "Разборы" : "Grills");
          const row = page.locator(".s-grill-row__link").first();
          assert.ok(await row.locator("time").innerText());
          const headingBox = await row.getByRole("heading").boundingBox();
          const badge = row.locator(".s-badge");
          assert.equal((await badge.textContent()).trim(), prefix ? "Разбор идёт" : "Open");
          const badgeBox = await badge.boundingBox();
          assert.ok(headingBox.x + headingBox.width <= badgeBox.x);
          const bounds = await frame(".s-grill-row:first-child");
          if (specimen) assert.deepEqual(bounds, listFrame);
          else listFrame = bounds;
          await capture("grills-" + (specimen ? "specimen-" : "list-") + locale + "-" + width);
          const path = specimen ? "/design/screens/grill?chrome=0" : "/grills/" + grill.id;
          await visit(prefix + path);
          await page.evaluate(() => document.fonts.ready);
          const bench = await frame(".s-bench");
          const shell = await page.locator(".s-shell__main").evaluate((main) => {
            const bounds = main.getBoundingClientRect();
            const style = getComputedStyle(main);
            const left = parseFloat(style.paddingLeft);
            const right = parseFloat(style.paddingRight);
            return {
              x: bounds.x + left,
              width: bounds.width - left - right,
              rem: parseFloat(getComputedStyle(document.documentElement).fontSize),
            };
          });
          const expectedWidth = width === 390 ? shell.width : 54 * shell.rem;
          assert.deepEqual(bench, {
            x: shell.x + (shell.width - expectedWidth) / 2,
            width: expectedWidth,
          });
          if (specimen) assert.deepEqual(bench, sessionFrame);
          else sessionFrame = bench;
          for (const part of [
            ".s-bench__head",
            ".s-strip",
            ".s-question",
            ".s-answer",
            ".s-bench__nav",
          ]) {
            assert.deepEqual(await frame(part), bench, part + " must share the Grill column");
          }
          const progress = page.locator(".s-bench").getByRole("status");
          if (!specimen) {
            assert.equal(
              await progress.innerText(),
              prefix ? "2 ответа из 6 · 1 оценён" : "2 of 6 answered · 1 judged",
            );
            const submit = page.getByRole("button", {
              name: prefix ? "Отправить ответ" : "Submit answer",
            });
            assert.ok(await submit.isDisabled());
            const field = page.getByRole("textbox", { name: prefix ? "Ваш ответ" : "Your answer" });
            await field.fill(
              prefix
                ? "Долгая задача в основном потоке задержит отрисовку кадра."
                : "A long task on the main thread can delay painting the next frame.",
            );
            await field.blur();
            assert.ok(await submit.isEnabled());
          }
          const index = specimen ? "07" : "03";
          const tagPrefix = prefix ? "В" : "Q";
          assert.equal(
            await page.locator(".s-question__number span").first().innerText(),
            tagPrefix + index,
          );
          for (const [pad, number] of [
            [page.locator(".s-strip__pad").first(), "01"],
            [page.locator(".s-strip [aria-current]"), index],
          ]) {
            const label = await pad.getAttribute("aria-label");
            assert.ok(label.startsWith(tagPrefix + number + ": "));
            assert.equal(await pad.getAttribute("title"), label);
          }
          const first = page.getByRole("button", {
            name: prefix ? "К первому вопросу без ответа" : "First unanswered",
            exact: true,
          });
          assert.equal(await first.count(), 0);
          const name = "grill-" + (specimen ? "specimen-" : "session-") + locale + "-" + width;
          await capture(name);
          const currentPad = page.locator(".s-strip [aria-current]");
          await currentPad.press("ArrowLeft");
          assert.ok(await currentPad.evaluate((el) => el === document.activeElement));
          await first.click();
          assert.equal(await first.count(), 0);
          assert.ok(await currentPad.evaluate((el) => el === document.activeElement));
          console.log(name + " · centered bench at x=" + bench.x + ", width=" + bench.width);
        }
      }
    }
    await visit("/design/components");
    const standalone = page.getByRole("figure").filter({ hasText: "Callout · kinds" });
    assert.deepEqual(await standalone.locator(".s-callout__kind:visible").allInnerTexts(), [
      "TIP",
      "GOTCHA",
      "PRODUCTION",
    ]);
    const shellWithActions = page
      .locator(".s-topbar")
      .filter({ has: page.locator(".s-topbar__actions button") })
      .first();
    await page.setViewportSize({ width: 1440, height: 900 });
    assert.ok(await shellWithActions.isVisible(), "desktop top bar keeps its actions");
    await page.setViewportSize({ width: 390, height: 900 });
    const specimenCallout = page
      .locator("#lesson .s-block")
      .filter({ has: page.locator(".s-callout") });
    const margin = await specimenCallout.locator(".s-block__margin").boundingBox();
    const box = await specimenCallout.locator(".s-callout").boundingBox();
    assert.ok(margin.y + margin.height <= box.y, "the narrow specimen stacks the Callout gutter");
    for (const prefix of ["", "/ru"]) {
      await audit(prefix + "/progress");
      const names = page.locator(".s-histogram__name");
      assert.equal(await names.count(), 5);
      const splitWords = await names.evaluateAll((names) =>
        names.flatMap((name) => {
          const split = [];
          for (const word of name.textContent.matchAll(/\S+/g)) {
            const range = document.createRange();
            range.setStart(name.firstChild, word.index);
            range.setEnd(name.firstChild, word.index + word[0].length);
            if (range.getClientRects().length > 1) split.push(word[0]);
          }
          return split;
        }),
      );
      assert.deepEqual(splitWords, []);
      await audit(prefix + "/reviews");
      const todayFits = await page.locator(".s-week__day.is-today").evaluate((cell) => {
        const range = document.createRange();
        range.selectNodeContents(cell.querySelector(".s-week__label"));
        const label = range.getBoundingClientRect();
        const bounds = cell.getBoundingClientRect();
        return label.width > 0 && label.left >= bounds.left && label.right <= bounds.right;
      });
      assert.ok(todayFits, "today label must fit inside its day");
      assert.deepEqual(
        await page.locator(".s-rack__interval").allInnerTexts(),
        [1, 3, 7, 16, 35].map((days) => days + (prefix ? " дн." : " d")),
      );
      assert.doesNotMatch(await page.locator(".s-rack").innerText(), /\bbox\b|коробк/iu);
    }
    await page.setViewportSize(previousViewport);
    for (const path of [
      "/ru/dashboard",
      "/dashboard",
      "/design/screens/track",
      "/design/screens/grill",
      "/ru/design/screens/grill",
      "/design/screens/grill?state=sessions",
      "/ru/design/screens/grill?state=sessions",
      "/design/screens/lesson",
      "/ru/design/screens/lesson",
      "/settings",
      "/tracks/" + track.slug,
      "/topics/" + by.tasks.id,
      "/lessons/" + lesson.id,
      "/ru/lessons/" + lesson.id,
      "/grills",
      "/ru/grills",
      "/grills/" + grill.id,
      "/ru/grills/" + grill.id,
      "/grills/" + finished.id,
    ])
      await audit(path);
    await owner.setTrackVisibility(track.id, true, true);
    await visit(profilePath + "/" + track.slug);
    await page.getByRole("link", { name: "Change visibility" }).click();
    await page.getByRole("dialog", { name: "Make this Track private?" }).waitFor();
    await checkCascade(page, "/tracks/" + track.slug);
    await context.clearCookies();
    const profile = profilePath;
    const publicTrack = profile + "/" + track.slug;
    for (const path of [
      "/ru",
      "/",
      "/terms",
      "/rules",
      profile,
      publicTrack,
      "/ru" + publicTrack,
      "/design/screens/public-track",
      "/ru/design/screens/public-track",
      publicTrack + "/lessons/" + lesson.id,
      "/ru" + publicTrack + "/lessons/" + lesson.id,
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
        const reference = await composition("/design/screens/landing?chrome=0");
        const product = await composition("/");
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
    await page.waitForURL(origin + "/?error=oauth#how");
    assert.ok(await page.locator(".hero .s-notice").isVisible());
  }
  if (pr12) {
    await page.setViewportSize({ width: 1440, height: 900 });
    await visit("/ru/dashboard");
    await page.getByRole("heading", { name: "С возвращением, Bob", exact: true }).waitFor();
    const trackLink = page.locator("main").getByRole("link", { name: track.title });
    await trackLink.waitFor();
    assert.equal(await trackLink.getAttribute("href"), "/ru/tracks/" + track.slug);
    await shot("pr12-ru-dashboard");
    await trackLink.click();
    await page.locator(".s-canvas .s-trace").first().waitFor();
    await header.getByRole("button", { name: "Действия с треком" }).waitFor();
    await shot("pr12-ru-track");
    await visit("/ru/reviews");
    await page.getByRole("link", { name: by.tasks.title, exact: true }).waitFor();
    await page.getByText("Тренировочный тест: 2 из 2 верно", { exact: true }).waitFor();
    await shot("pr12-ru-grill-or-reviews");

    // Exercise the real submission handler and check the message visible after each response.
    await page.getByRole("link", { name: "Тренировочный тест", exact: true }).click();
    await answerPracticeQuiz();
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
    const publicPath = profilePath + "/" + track.slug;
    await visit("/ru" + publicPath);
    await page.locator(".s-map .s-trace").first().waitFor();
    await shot("pr12-ru-public-track");
    await page.getByRole("banner").getByRole("button", { name: /Язык/ }).click();
    await page.getByRole("menuitem", { name: /English/ }).click();
    await page.waitForURL(origin + publicPath);
    await page.getByRole("group", { name: "Topic map" }).waitFor();
    await page.locator(".s-map .s-trace").first().waitFor();
    await shot("pr12-en-public-track");
    await visit("/");
    await page.waitForURL(origin + "/");
    await page
      .locator("footer")
      .getByRole("button", { name: /language/i })
      .click();
    await page.getByRole("menuitem", { name: /Русский/ }).click();
    await page.waitForURL(origin + "/ru");
    await visit("/");
    await page.waitForURL(origin + "/ru");
  }
  if (!cascade && !pr12) {
    await page.setViewportSize({ width: 1440, height: 900 });
    await visit("/tracks/" + track.slug);
    const actions = header.getByRole("button", { name: "Track actions" });
    await actions.click();
    await page.getByRole("menuitem", { name: "Make public" }).click();
    await page.getByRole("dialog").waitFor();
    await shot("pr11-publish-dialog");
    assert.ok(await page.getByRole("button", { name: "Publish", exact: true }).isDisabled());
    await page
      .getByRole("checkbox", { name: "I agree to the Publishing rules and Terms of Use" })
      .check();
    await page.getByRole("button", { name: "Publish", exact: true }).click();
    const permalink = origin + profilePath + "/" + track.slug;
    await page.getByRole("link", { name: permalink, exact: true }).waitFor();
    await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin });
    await actions.click();
    await page.getByRole("menuitem", { name: "Copy public URL" }).click();
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), permalink);
    await actions.click();
    await page.getByRole("menuitem", { name: "Make private" }).click();
    await page
      .getByRole("dialog", { name: "Make this Track private?" })
      .getByRole("button", { name: "Cancel" })
      .click();
  }
  if (process.argv.includes("--pr11")) {
    const publicPath = profilePath + "/" + track.slug;
    await visit("/terms?lang=en");
    await page.getByRole("heading", { name: "Terms of Use", exact: true }).waitFor();
    await shot("pr11-terms");
    await context.clearCookies();
    await visit(profilePath);
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
    await page.route("**/api/public/" + me.handle + "/*/lessons/*", async (route) => {
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
    await page.locator("#lesson-block-timers").getByText("Fork this track to practice").waitFor();
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
    await visit(publicPath);
    await page.getByRole("button", { name: "Fork", exact: true }).click();
    await page.waitForURL(origin + "/tracks/" + track.slug);
    await page.getByText("Forked from", { exact: false }).waitFor();
    await page.locator(".s-canvas .s-trace").first().waitFor();
    await shot("pr11-fork-result");
    await signIn("bob");
    await visit("/tracks/" + track.slug);
    await page.getByText("1 fork", { exact: true }).waitFor();
    await page.locator(".s-canvas .s-trace").first().waitFor();
    await shot("pr11-track-visibility");

    const recipient = forUser(db, reader.id);
    for (let i = 0; i < 5; i++) {
      const copy = await recipient.forkTrack(me.handle, track.slug);
      await recipient.setTrackVisibility(copy.id, true, true);
    }
    await visit(publicPath);
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
  await owner.setTrackVisibility(track.id, true, true);
  const publicPath = profilePath + "/" + track.slug;
  await signIn("bob");
  await visit(publicPath);
  assert.equal(
    await page.getByRole("link", { name: "Open in your workspace" }).getAttribute("href"),
    "/tracks/" + track.slug,
  );
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin });
  async function checkCopy(label, path) {
    await page.getByRole("button", { name: label }).click();
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), origin + path);
  }
  await checkCopy("Copy public URL", publicPath);
  await checkTrackSources();

  await signIn("reader");
  const { user: visitor } = await (await request.get(origin + "/api/me")).json();
  await visit(publicPath);
  await page.getByRole("button", { name: "Fork", exact: true }).click();
  await page.waitForURL(origin + "/tracks/" + track.slug);
  const recipient = forUser(db, visitor.id);
  const copy = await recipient.getTrackBySlug(track.slug);
  await recipient.setTrackVisibility(copy.id, true, true);
  await context.clearCookies();
  const noJs = await browser.newPage({ javaScriptEnabled: false });
  for (const prefix of ["", "/ru"]) {
    const path = prefix + publicPath;
    const tag = prefix ? "Т" : "T";
    await visit(path);
    const syllabus = page.getByRole("region", {
      name: prefix ? "Программа трека" : "Course syllabus",
    });
    const head = page.locator(".public__head");
    assert.equal(
      await page.getByTitle(prefix ? "Язык трека" : "Track language", { exact: true }).count(),
      0,
    );
    assert.equal(await head.locator("h1").innerText(), track.title);
    assert.equal(await head.locator(".public__lead").innerText(), pitch);
    assert.doesNotMatch(await head.innerText(), /Read a browser trace/);
    assert.match(await head.locator(".public__stats").innerText(), prefix ? /Обновлён/ : /Updated/);
    assert.equal(
      await head.getByRole("button", { name: prefix ? "Показать полностью" : "Show more" }).count(),
      0,
    );
    assert.equal(
      await head
        .getByRole("link", { name: prefix ? "Войти и создать форк" : "Sign in to fork" })
        .getAttribute("href"),
      prefix || "/",
    );
    await checkCopy(prefix ? "Скопировать публичную ссылку" : "Copy public URL", path);
    const about = page.locator("section").filter({
      has: page.getByRole("heading", {
        name: prefix ? "О треке" : "About this Track",
        exact: true,
      }),
    });
    assert.equal(await about.locator("p").innerText(), overview);
    assert.deepEqual(await about.getByRole("listitem").allTextContents(), outcomes);

    const graph = page.locator(".s-map");
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(() => window.scrollTo(0, 0));
      const bounds = await graph.boundingBox();
      assert.ok(
        bounds && bounds.y >= 0 && bounds.y + 60 < 900,
        "Track Graph starts above the fold",
      );
    }
    const rendering = graph.getByRole("button", { name: /Rendering opportunities/ });
    await rendering.click();
    assert.equal(await rendering.getAttribute("aria-pressed"), "true");
    await page
      .locator("figcaption")
      .getByRole("link", { name: tag + "04 · Rendering opportunities" })
      .click();
    assert.equal(new URL(page.url()).hash, "#topic-rendering");
    assert.deepEqual(
      await syllabus.locator("#topic-rendering .public__requires a").allTextContents(),
      [tag + "02 · Tasks and timers", tag + "03 · Microtasks"],
    );
    assert.equal(await page.locator(".public__author").getAttribute("href"), prefix + profilePath);
    await page
      .locator("#forks")
      .getByRole("link", { name: track.title, exact: true })
      .first()
      .waitFor();
    await noJs.goto(origin + path);
    const rendered = noJs.getByRole("region", {
      name: prefix ? "Программа трека" : "Course syllabus",
    });
    assert.deepEqual(await rendered.getByRole("heading", { level: 3 }).allTextContents(), [
      tag + "01 The runtime",
      tag + "02 Tasks and timers",
      tag + "03 Microtasks",
      tag + "04 Rendering opportunities",
    ]);
    for (const item of [lesson, paintLesson]) {
      const link = rendered.getByRole("link", { name: item.title });
      assert.ok(await link.isVisible());
      assert.equal(await link.getAttribute("href"), path + "/lessons/" + item.id);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await shot("pr11-" + (prefix ? "ru" : "en") + "-public-syllabus");
    await page.setViewportSize({ width: 390, height: 900 });
    await shot("pr11-" + (prefix ? "ru" : "en") + "-public-syllabus-mobile");
    await page.setViewportSize({ width: 1440, height: 900 });
    await visit(path + "/lessons/" + lesson.id);
    await checkLesson(prefix, true);
  }
  await noJs.close();
  await owner.updateTrack(track.id, { description: pitch });
  await visit(publicPath);
  assert.equal(await page.getByRole("heading", { name: "About this Track" }).count(), 0);
  assert.equal(await page.getByText(pitch, { exact: true }).count(), 1);
  // Mixed-language lists filter their own rows. Following a card keeps the chosen chrome.
  const second = await owner.createTrack({ title: "Сетевые протоколы", language: "ru" });
  await owner.setTrackVisibility(second.id, true, true);
  await signIn("bob");
  const filter = page.locator("main").getByRole("combobox", { name: "Filter Tracks by language" });
  for (const path of ["/dashboard", "/progress", profilePath]) {
    await visit(path);
    const links = page.locator("main").getByRole("link", { name: new RegExp(second.title) });
    assert.equal(await links.count(), 0);
    await filter.click();
    await page.getByRole("option", { name: "All languages" }).click();
    await links.waitFor();
    await filter.click();
    await page.getByRole("option", { name: "RU", exact: true }).click();
    assert.equal(await page.locator("main .s-trackcard, main .s-trackstrip").count(), 1);
    assert.equal(
      await page.locator("main").getByTitle("Track language", { exact: true }).count(),
      0,
    );
    if (cascade) await checkCascade(page, path);
  }
  await page.getByRole("link", { name: second.title, exact: true }).click();
  await page.waitForFunction(() => document.documentElement.lang === "ru");
  assert.equal(
    await page.locator('link[rel="canonical"]').getAttribute("href"),
    origin + profilePath + "/" + second.slug,
  );
  assert.equal(await page.locator("link[hreflang]").count(), 0);
  await page.locator(".public__login").click();
  await page.waitForFunction(() => document.documentElement.lang === "en");
  assert.equal(await page.locator("link[hreflang]").count(), 3);
  if (!cascade && !pr12 && !process.argv.includes("--pr11"))
    await checkLessonInteractions({ page, owner, visit, shot });
  // Populate dated Quiz Attempts on the local fixture so the rolling calendar spans all seasons.
  await db.$client.query(
    `insert into quiz_attempts
    (user_id,lesson_id,block_id,answers,correct,total,source,created_at)
    select $1,$2,$3,'[0]',0,1,'ui',now()-d * interval '1 day'
    from generate_series(1,363) d cross join lateral generate_series(1,1+(d*13)%9) n
    where (d*37)%17 < 5`,
    [me.user.id, lesson.id, blocks.find((b) => b.type === "quiz").id],
  );
  await signIn("bob");
  await visit("/settings");
  const settings = page.locator("#public-profile-settings");
  await settings.getByLabel("Headline", { exact: true }).fill("Frontend engineer");
  await settings
    .getByLabel("Bio", { exact: true })
    .fill("Studying browser scheduling, rendering and the details behind a responsive interface.");
  await settings.getByRole("button", { name: "Add link" }).click();
  await settings.getByLabel("HTTPS URL").fill("https://example.org/notes");
  await settings.getByLabel("Label (optional)").fill("Field notes");
  await settings.getByRole("switch", { name: /Learning progress/ }).click();
  await settings.getByRole("checkbox", { name: track.title, exact: true }).click();
  await settings.getByRole("button", { name: "Save profile" }).click();
  await settings.getByRole("status").filter({ hasText: "Profile saved." }).waitFor();
  for (const prefix of ["", "/ru"]) {
    const lang = prefix ? "ru" : "en";
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await visit(prefix + "/settings");
      assert.equal(
        await settings.getByLabel(prefix ? "Роль или специализация" : "Headline").inputValue(),
        "Frontend engineer",
      );
      // Frame the whole group between the app header and mobile tab bar.
      const groupHeight = (await settings.boundingBox()).height;
      await page.setViewportSize({ width, height: Math.ceil(groupHeight) + 156 });
      await settings.evaluate((el) => window.scrollBy(0, el.getBoundingClientRect().top - 68));
      await shot("public-profile-settings-" + lang + "-" + width, { fullPage: false });
      await page.setViewportSize({ width, height: 900 });
      await visit(prefix + profilePath);
      await page.locator(".s-histogram").waitFor();
      await page.locator("main").getByRole("combobox").click();
      await page.getByRole("option", { name: prefix ? "Все языки" : "All languages" }).click();
      assert.ok(
        await page
          .locator(".s-trackcard")
          .first()
          .getByText(prefix ? "Закреплён" : "Pinned", { exact: true })
          .isVisible(),
      );
      assert.equal(await page.locator(".s-heat__cell").count(), 364);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      const heat = page.locator(".s-heat__scroll");
      assert.equal(await heat.evaluate((el) => el.scrollWidth > el.clientWidth), width === 390);
      const today = heat.locator("[data-day='363']");
      await today.focus();
      await today.press("ArrowLeft");
      assert.ok(
        await heat.locator("[data-day='356']").evaluate((el) => el === document.activeElement),
      );
      assert.ok(await page.getByRole("tooltip").isVisible());
      await page.evaluate(() => document.activeElement.blur());
      await page.mouse.move(0, 0);
      await page.evaluate(() => window.scrollTo(0, 0));
      await shot("public-profile-page-" + lang + "-" + width);
    }
    if (cascade) {
      await checkCascade(page, prefix + profilePath);
      await visit(prefix + "/settings");
      await checkCascade(page, prefix + "/settings");
    }
  }
  await checkSidebarProgress(page, owner, origin);
  assert.deepEqual(errors, []);
}
try {
  await exercise();
  if (signinOnly && !cascade) {
    const stopped = once(server, "exit");
    server.kill();
    await stopped;
    server = startServer(false);
    await waitForServer();
    await checkUnavailableSignIn(browser, origin, directory);
  }
} finally {
  await browser?.close();
  server.kill();
  github.close();
  await db.$client.query("delete from users where github_id=any($1::bigint[])", [
    github.users.map((u) => u.id),
  ]);
  await db.$client.end();
}
