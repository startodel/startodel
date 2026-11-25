// Run from the workspace root after building the app. PLAYWRIGHT_MODULE may point to a local installation.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
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
const server = spawn(process.execPath, ["apps/web/.output/server/index.mjs"], {
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
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(origin + "/api/health")).ok) break;
    } catch {}
    await delay(100);
  }
  browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
  });
  const request = context.request;
  const start = await request.get(origin + "/auth/github", { maxRedirects: 0 });
  const state = new URL(start.headers().location).searchParams.get("state");
  assert.equal(
    (
      await request.get(origin + "/auth/github?code=bob&state=" + encodeURIComponent(state), {
        maxRedirects: 0,
      })
    ).status(),
    302,
  );
  const me = await (await request.get(origin + "/api/me")).json();
  const owner = forUser(db, me.user.id);
  const page = await context.newPage();
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
  const shot = async (name) => {
    if (!name.startsWith("pr9-") && !process.argv.includes("--include-pr8")) return;
    await page.screenshot({
      path: directory + "/" + name + ".png",
      fullPage: true,
      animations: "disabled",
    });
    console.log(name);
  };
  await page.goto(origin + "/");
  await page.getByLabel("TypeScript", { exact: true }).check();
  await page.getByLabel("Other technologies").fill("SQL,");
  await page.getByLabel("Other technologies").press("Enter");
  await page.getByLabel("Understand internals").check();
  await page.getByLabel("senior", { exact: true }).check();
  await shot("onboarding");
  await page.getByRole("button", { name: "Continue to connect your agent" }).click();
  await page.waitForURL("**/onboarding/connect");
  await page.getByRole("heading", { name: "First prompt" }).waitFor();
  assert((await page.locator("main").innerText()).includes(origin + "/mcp"));
  await shot("connect");
  await page.getByLabel("Token name").fill("Local demo");
  await page.getByRole("button", { name: "Create token" }).click();
  await page.getByRole("button", { name: "Copy token" }).waitFor();
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
  const guide = await readFile("docs/agent-guide/07-lessons-and-blocks.md", "utf8");
  const blocks = JSON.parse(guide.split("```json\n")[1].split("\n```")[0]);
  const lesson = await owner.createLesson({
    topicId: by.tasks.id,
    title: "When does a timer run?",
    summary: "Trace a timer callback through a single browser task.",
    blocks,
  });
  await page.reload();
  await page.getByRole("link", { name: track.title }).waitFor();
  await shot("dashboard");
  await page.getByRole("link", { name: track.title }).click();
  const node = page
    .locator(".vue-flow__node")
    .filter({ hasText: "Tasks and timers" })
    .getByRole("button", { name: "Tasks and timers", exact: true });
  await node.click();
  await page.getByRole("link", { name: lesson.title }).waitFor();
  assert.equal(await page.locator(".vue-flow__edge-path").count(), 4);
  await shot("track-graph");
  await page.getByRole("link", { name: lesson.title }).click();
  await page.getByText("Show solution", { exact: true }).click();
  await page.getByRole("radio", { name: "sync", exact: true }).check();
  await page.getByRole("button", { name: "Submit answers" }).click();
  await page.getByText("1 of 1 correct").waitFor();
  await page.getByRole("button", { name: "Mark as read" }).click();
  await page.getByRole("button", { name: "Marked as read" }).waitFor();
  await page.locator("figure pre code span").first().waitFor();
  await shot("lesson");
  await page.getByRole("button", { name: /Load video/ }).click();
  assert.equal(
    await page.locator("iframe[title]").getAttribute("src"),
    "https://www.youtube-nocookie.com/embed/8aGhZQkoFbQ",
  );
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(origin + "/tracks/" + track.id);
  await page.getByRole("button", { name: "Tasks and timers", exact: true }).click();
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
  await page.goto(origin + "/grills/" + grill.id);
  await page
    .getByLabel("Your answer")
    .fill("After the current task returns and before the next task starts.");
  await page.getByRole("button", { name: "Submit answer" }).click();
  await page.getByRole("heading", { name: "Waiting for your agent" }).waitFor();
  assert.equal(
    (await owner.getGrill(grill.id)).questions.find((q) => q.id === waiting.id).answerSource,
    "ui",
  );
  await page.getByRole("button", { name: "Previous" }).click();
  await page.getByText("Verdict · weak").waitFor();
  await shot("pr9-grill-open");
  await page.goto(origin + "/");
  await page.getByRole("link", { name: "Continue grill session" }).waitFor();
  await shot("pr9-dashboard-next-up");
  await page.goto(origin + "/grills");
  await page.getByRole("link", { name: finished.title }).waitFor();
  await shot("pr9-grills");
  await page.getByRole("link", { name: finished.title }).click();
  await page.getByText("Rendering opportunities Lessons").waitFor();
  await shot("pr9-grill-summary");
  await db.$client.query(
    "update review_items set due_at=now()-interval '1 day' where user_id=$1 and topic_id=$2",
    [me.user.id, by.tasks.id],
  );
  await page.goto(origin + "/reviews");
  await page.getByRole("link", { name: "Practice quiz" }).waitFor();
  await shot("pr9-reviews");
  await page.getByRole("link", { name: "Practice quiz" }).click();
  await page.getByRole("radio", { name: "sync", exact: true }).check();
  await shot("pr9-review-practice");
  await page.getByRole("button", { name: "Submit Practice Quiz" }).click();
  await page.getByRole("heading", { name: "1 of 1 correct · strong" }).waitFor();
  await page.goto(origin + "/progress");
  await page.getByLabel("Sort by").selectOption("mastery");
  await page.getByRole("heading", { name: "Recent activity" }).waitFor();
  await shot("pr9-progress");
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
