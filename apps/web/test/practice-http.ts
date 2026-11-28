import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { CallToolResultSchema } from "@modelcontextprotocol/sdk/types.js";
import { forUser, type Database } from "@startodel/db";
import { expect, test } from "vite-plus/test";

import { practiceFailure } from "../app/utils/practice-failure";
import { sidebarProgressFixture } from "./sidebar-progress";
import { checkSidebarProgress } from "./lesson-screenshots.mjs";
import en from "../i18n/locales/en.json";
import ru from "../i18n/locales/ru.json";

type Request = (
  path: string,
  cookie?: string,
  method?: string,
  body?: unknown,
) => Promise<Response>;

function expectShellNavigation(html: string, href: string, label: string, parentCrumb = false) {
  const links = html.match(/<a\b[^>]*\bs-rail__item\b[^>]*>/g) ?? [];
  const current = links.filter((link) => link.includes("is-current"));
  expect(current, href).toHaveLength(1);
  expect(current[0]).toContain('href="' + href + '"');
  expect(links.filter((link) => link.includes('aria-current="page"'))).toEqual(current);

  const topBar = html.match(/<header\b[^>]*class="s-topbar"[^>]*>([\s\S]*?)<\/header>/)?.[1];
  if (parentCrumb) {
    const link = topBar?.match(/<a\b[^>]*class="s-crumbs__link"[^>]*>([^<]*)<\/a>/);
    expect(link?.[0]).toContain('href="' + href + '"');
    expect(link?.[1]).toBe(label);
  } else {
    expect(topBar?.match(/class="s-crumbs__here"[^>]*>([^<]*)</)?.[1]).toBe(label);
  }
}

export function practiceHttpTests(
  env: () => { db: Database; origin: string },
  request: Request,
  signIn: (name: string) => Promise<string>,
) {
  async function owner(name: string) {
    const cookie = await signIn(name);
    const { user } = await (await request("/api/me", cookie)).json();
    return { cookie, data: forUser(env().db, user.id), id: user.id as string };
  }
  test("private Track bookmarks resolve within the Session Owner in both locales", async () => {
    const own = await owner("slug-owner");
    const other = await owner("slug-reader");
    await own.data.updateProfile({ onboardedAt: new Date() });
    await other.data.updateProfile({ onboardedAt: new Date() });
    const id = crypto.randomUUID();
    // Rows created before slug routing may have both v4 IDs and UUID-shaped slugs.
    const legacySlug = crypto.randomUUID();
    await env().db.$client.query(
      "insert into tracks (user_id, id, language, title, slug) values ($1,$2,'en','Legacy Track','legacy-track'), ($1,$3,'en','UUID slug',$2::uuid::text), ($1,$4,'en','Another legacy Track',$5)",
      [own.id, id, crypto.randomUUID(), crypto.randomUUID(), legacySlug],
    );
    const query = "?topic=one&filter=a%20b&filter=two";
    for (const prefix of ["", "/ru"]) {
      const base = prefix + "/tracks/";
      const bookmark = base + id + query;
      const redirect = await request(bookmark, own.cookie);
      expect(redirect.status).toBe(301);
      expect(redirect.headers.get("location")).toBe(base + "legacy-track" + query);
      expect(redirect.headers.get("cache-control")).toBe("private, no-store");
      for (const [slug, title] of [
        ["legacy-track", "Legacy Track"],
        [legacySlug, "Another legacy Track"],
      ]) {
        const page = await request(base + slug, own.cookie);
        expect(page.status).toBe(200);
        expect(await page.text()).toContain(title);
      }
      for (const ref of [id, "legacy-track", crypto.randomUUID()]) {
        const foreign = await request(base + ref, other.cookie);
        expect(foreign.status).toBe(404);
        expect(foreign.headers.get("location")).toBeNull();
      }
      const anonymous = await request(bookmark);
      expect(anonymous.status).toBe(302);
      expect(anonymous.headers.get("location")).toBe(prefix || "/");
    }
  });

  test("private learning pages link Track, Topic and Lesson and reflect read and Grill transitions", async () => {
    const { cookie, data } = await owner("learning-pages");
    await data.updateProfile({ onboardedAt: new Date() });
    const track = await data.createTrack("Delivery");
    const topic = await data.upsertTopic({ slug: "delivery", title: "Delivery modes" });
    await data.attachTopicToTrack(track.id, topic.id, 0);
    const prerequisite = await data.upsertTopic({ slug: "queues", title: "Queues" });
    await data.attachTopicToTrack(track.id, prerequisite.id, 1);
    await data.addEdge(prerequisite.id, topic.id);
    const lesson = (await data.createLesson({
      topicId: topic.id,
      title: "Redelivery",
      blocks: [
        {
          id: "quiz",
          type: "quiz",
          questions: [
            {
              prompt: "Choose",
              options: ["A", "B"],
              correctIndex: 0,
              explanation: "Private explanation",
            },
          ],
        },
        {
          id: "exercise",
          type: "exercise",
          prompt: "Build",
          starterCode: "select 42",
          language: "sql",
          solution: "Private solution",
        },
      ],
    }))!;
    const grill = (await data.startGrill({ title: "Delivery recall", trackId: track.id }))!;
    const question = (await data.addGrillQuestion(grill.id, {
      topicId: topic.id,
      prompt: "What repeats?",
    }))!;
    async function page(path: string, prefix = "") {
      const response = await request(prefix + path, cookie);
      expect(response.status, path).toBe(200);
      return (await response.text()).split('<script type="application/json"')[0]!;
    }
    expectShellNavigation(await page("/progress", "/ru"), "/ru/progress", "Прогресс");
    expectShellNavigation(await page("/progress"), "/progress", "Progress");
    const lessonPath = "/lessons/" + lesson.id + "?track=" + track.slug;
    const trackPath = "/tracks/" + track.slug + "?topic=" + topic.id;
    const board = await page(trackPath);
    expectShellNavigation(board, "/tracks/" + track.slug, track.title);
    expect(board).toContain('href="' + lessonPath + '"');
    expect(board).toContain('href="/tracks/' + track.slug + "?topic=" + prerequisite.id + '"');
    expect(board).toContain('class="s-board');
    for (const prefix of ["", "/ru"]) {
      for (const path of ["/dashboard", "/progress"]) {
        const html = await page(path, prefix);
        const strip = html.match(/<a\b[^>]*\bs-trackstrip--link\b[^>]*>/)?.[0];
        expect(strip).toContain('href="' + prefix + "/tracks/" + track.slug + '"');
      }
    }
    expect(await page("/topics/" + topic.id)).toContain('href="/lessons/' + lesson.id + '"');
    const lessonPage = await page(lessonPath);
    expect(lessonPage).toContain('href="' + trackPath + '"');
    expect(await page("/lessons/" + lesson.id + "?track=" + track.id, "/ru")).toContain(
      'href="/ru' + trackPath + '"',
    );
    expect(lessonPage).toContain("Mark as read");
    expect(lessonPage).toMatch(/<pre\b[^>]*\bs-editor__fallback\b[^>]*>select 42<\/pre>/);
    expect(lessonPage).not.toMatch(/Private explanation|Private solution|class="s-quiz__feedback"/);
    expect((await request("/api/lessons/" + lesson.id + "/read", cookie, "POST")).status).toBe(200);
    expect(await page(lessonPath)).toContain("Marked as read");
    expect(await page(trackPath)).toContain("is-read");

    const grillPath = "/grills/" + grill.id;
    expect(await page("/grills")).toContain('href="' + grillPath + '"');
    const grillPage = await page(grillPath);
    expectShellNavigation(grillPage, "/grills", "Grills", true);
    expect(grillPage).toContain('href="/tracks/' + track.slug + '"');
    expect(grillPage).toContain("What repeats?");
    const renamed = "Delivery guarantees";
    await data.updateGrill(grill.id, renamed);
    for (const prefix of ["", "/ru"]) {
      for (const [path, heading] of [
        [grillPath, "h1"],
        ["/grills", "h2"],
      ]) {
        const response = await request(prefix + path, cookie);
        expect(response.status).toBe(200);
        expect(response.headers.get("cache-control")).toContain("no-store");
        const html = await response.text();
        expect(html).toMatch(new RegExp("<" + heading + "[^>]*>" + renamed + "</" + heading + ">"));
        if (path === grillPath) expect(html).toContain("<title>" + renamed);
      }
    }
    expect(
      (
        await request(
          "/api" + grillPath + "/questions/" + question.id + "/answer",
          cookie,
          "POST",
          { answer: "The message" },
        )
      ).status,
    ).toBe(200);
    const waiting = await page(grillPath);
    expect(waiting).toContain("The message");
    expect(waiting).toContain("Refresh feedback");
    expect(waiting).not.toContain('class="s-tally"');
    await data.judgeGrillQuestion(question.id, "partial", "Trace the delivery");
    expect(await (await request("/api/grills", cookie)).json()).toContainEqual(
      expect.objectContaining({ id: grill.id, strong: 0, partial: 1, weak: 0 }),
    );
    const summary = await page(grillPath);
    expect(summary).toContain('class="s-tally"');
    expect(summary).toContain('href="/topics/' + topic.id + '"');
    expect(summary).toContain("Trace the delivery");
  });

  test("the final Lesson read moves one of nine Topics into the sidebar's mastered count", async () => {
    const { cookie, data } = await owner("sidebar");
    const { track, last } = await sidebarProgressFixture(data);
    const tracks = async () => (await (await request("/api/dashboard", cookie)).json()).tracks;
    expect(await tracks()).toEqual([
      expect.objectContaining({ trackId: track.id, completed: 0, total: 9, percent: 0 }),
    ]);
    const read = await request("/api/lessons/" + last.id + "/read", cookie, "POST");
    expect(read.status).toBe(200);
    expect(await read.json()).toMatchObject({ mastery: 2 });
    expect(await tracks()).toEqual([
      expect.objectContaining({ trackId: track.id, completed: 1, total: 9, percent: 11 }),
    ]);
  });

  test.runIf(process.env.PLAYWRIGHT_MODULE)(
    "the mounted sidebar refreshes on the final Lesson read",
    async () => {
      const { cookie, data } = await owner("sidebar-browser");
      await data.updateProfile({ onboardedAt: new Date() });
      const { chromium } = await import(process.env.PLAYWRIGHT_MODULE!);
      const browser = await chromium.launch({ executablePath: process.env.CHROME });
      try {
        const { origin } = env();
        const page = await browser.newPage();
        const separator = cookie.indexOf("=");
        await page
          .context()
          .addCookies([
            { url: origin, name: cookie.slice(0, separator), value: cookie.slice(separator + 1) },
          ]);
        await checkSidebarProgress(page, data, origin);
      } finally {
        await browser.close();
      }
    },
    30_000,
  );

  const dashboardLocales = [
    ["/ru", ru],
    ["", en],
  ] as const;
  async function dashboardHero(
    cookie: string,
    prefix: string,
    mode: string,
    title: string,
    primaryPath: string,
  ) {
    const response = await request(prefix + "/dashboard", cookie);
    expect(response.status).toBe(200);
    const html = await response.text();
    const cards = html.match(/<section class="s-next"[^>]*>[\s\S]*?<\/section>/g);
    expect(cards).toHaveLength(1);
    const hero = cards![0]!;
    expect(hero).not.toMatch(/Эти темы уже можно изучать|These Topics are ready to study|<ul\b/i);
    expect(hero).toContain(" · " + mode + "</span>");
    expect(hero).toContain(">" + title + "</h2>");
    const primary = hero.match(/<a\b[^>]*\bs-button--primary\b[^>]*>/g);
    expect(primary).toHaveLength(1);
    expect(primary![0]).toContain('href="' + prefix + primaryPath + '"');
    return hero;
  }

  async function dashboardStep(cookie: string) {
    const response = await request("/api/dashboard", cookie);
    expect(response.status).toBe(200);
    return (await response.json()).nextStep;
  }

  test("Next Step opens the first unread Lesson for one ready Topic", async () => {
    const { cookie, data } = await owner("hero");
    await data.updateProfile({ onboardedAt: new Date() });
    const track = await data.createTrack("Reactivity");
    const topic = await data.upsertTopic({
      slug: "react/snapshot",
      title: "Снимок состояния React vs Vue Proxy",
    });
    await data.attachTopicToTrack(track.id, topic.id, 0);
    const other = await data.upsertTopic({ slug: "vue/refs", title: "Refs" });
    await data.attachTopicToTrack(track.id, other.id, 1);
    expect(await dashboardStep(cookie)).toMatchObject({
      kind: "study",
      topic: { id: topic.id, trackId: track.id, firstLessonId: null },
    });
    for (const [prefix, messages] of dashboardLocales) {
      const card = await dashboardHero(
        cookie,
        prefix,
        messages.next.study,
        topic.title,
        "/tracks/" + track.slug,
      );
      expect(card).toContain(messages.next.noLessons);
      expect(card).toContain(messages.next.openTrack);
      expect(card).toContain('class="s-prompt"');
      expect(card).toContain(messages.next.lessonPrompt.replace("{slug}", topic.slug));
      expect(card).toMatch(/class="s-prompt__text"[^>]*>[^<]*create_lesson/);
    }
    const read = (await data.createLesson({
      topicId: topic.id,
      title: "Introduction",
      blocks: [],
    }))!;
    const unread = (await data.createLesson({
      topicId: topic.id,
      title: "State updates",
      blocks: [],
    }))!;
    await data.markLessonRead(read.id);
    for (const [prefix, messages] of dashboardLocales) {
      const hero = await dashboardHero(
        cookie,
        prefix,
        messages.next.study,
        topic.title,
        "/lessons/" + unread.id,
      );
      expect(hero).toContain(messages.next.lessonReady);
      expect(hero).toContain(messages.next.openLesson);
      expect(hero).not.toContain(other.title);
      expect(hero).not.toContain('class="s-prompt"');
    }
    expect(await dashboardStep(cookie)).toMatchObject({
      kind: "study",
      topic: {
        id: topic.id,
        slug: topic.slug,
        title: topic.title,
        trackId: track.id,
        firstLessonId: unread.id,
      },
    });
    await data.markLessonRead(unread.id);
    const reread = await dashboardHero(
      cookie,
      "",
      en.next.study,
      topic.title,
      "/lessons/" + read.id,
    );
    expect(reread).toContain(en.next.reread);
  });

  test("Next Step opens the due Review or active Grill and offers reviews alongside study", async () => {
    const { cookie, data, id } = await owner("hero-schedule");
    await data.updateProfile({ onboardedAt: new Date() });
    const track = await data.createTrack("Delivery");
    const topic = await data.upsertTopic({ slug: "queues", title: "Queues" });
    await data.attachTopicToTrack(track.id, topic.id, 0);
    await data.recordReviewResult(topic.id, "weak");
    await env().db.$client.query("update review_items set due_at=now() where user_id=$1", [id]);
    expect(await dashboardStep(cookie)).toMatchObject({
      kind: "review",
      title: topic.title,
      topicId: topic.id,
      href: "/reviews",
    });
    for (const [prefix, messages] of dashboardLocales) {
      const card = await dashboardHero(
        cookie,
        prefix,
        messages.next.reviewKind,
        topic.title,
        "/reviews",
      );
      expect(card).toContain(messages.next.review);
    }
    await data.createLesson({
      topicId: topic.id,
      title: "Queue practice",
      blocks: [
        {
          id: "recall",
          type: "quiz",
          questions: [
            {
              prompt: "Which is FIFO?",
              options: ["Queue", "Stack"],
              correctIndex: 0,
              explanation: "A queue.",
            },
          ],
        },
      ],
    });
    await dashboardHero(
      cookie,
      "",
      en.next.reviewKind,
      topic.title,
      "/reviews/" + topic.id + "/practice",
    );

    const ready = await data.upsertTopic({ slug: "streams", title: "Streams" });
    await data.attachTopicToTrack(track.id, ready.id, 1);
    const mixed = await dashboardHero(
      cookie,
      "",
      en.next.study,
      ready.title,
      "/tracks/" + track.slug,
    );
    expect(mixed).toContain('href="/reviews"');
    expect(mixed).toContain("Review 1 Topic first");

    const grill = (await data.startGrill({ title: "Recall" }))!;
    await data.addGrillQuestion(grill.id, { prompt: "Explain delivery" });
    expect(await dashboardStep(cookie)).toMatchObject({
      kind: "grill",
      id: grill.id,
      title: grill.title,
      unanswered: 1,
      waiting: 0,
    });
    for (const [prefix, messages] of dashboardLocales) {
      const card = await dashboardHero(
        cookie,
        prefix,
        messages.next.grill,
        grill.title,
        "/grills/" + grill.id,
      );
      expect(card).toContain(messages.next.continue);
      expect(card).toContain(messages.grill.unanswered.replace("{count}", "1"));
    }
  });

  test("dashboard and get_guide agree on all six Next Steps and their precedence", async () => {
    const { cookie, data, id } = await owner("guide");
    const { token } = await data.mcpTokens.create("Guide parity");
    const client = new Client({ name: "learner", version: "1" });
    await client.connect(
      new StreamableHTTPClientTransport(new URL("/mcp", env().origin), {
        requestInit: { headers: { authorization: "Bearer " + token } },
      }),
    );
    async function step(id: string) {
      const browser = await (await request("/api/next-step", cookie)).json();
      const response = CallToolResultSchema.parse(
        await client.callTool({ name: "get_guide", arguments: {} }),
      );
      const content = response.content[0];
      if (content?.type !== "text") throw new Error("Missing guide");
      const guide = JSON.parse(content.text);
      expect(browser.id).toBe(id);
      expect(guide.state).toEqual(browser.state);
      expect(guide.nextSteps[0]).toMatchObject({ id, why: browser.why });
      return browser;
    }
    try {
      await step("first-steps");
      await data.updateProfile({
        onboardedAt: new Date(),
        goals: ["Understand internals", "queues"],
      });
      const dashboard = await (await request("/ru/dashboard", cookie)).text();
      expect(dashboard).toContain("Разобраться, как всё устроено внутри, queues");
      expect((await step("build-track-technology")).prompt).toContain("queues");
      const track = await data.createTrack("Delivery");
      expect((await step("agent-workflow")).why).toContain("No Track Topics");
      const topic = await data.upsertTopic({ slug: "queues", title: "Queues" });
      await data.attachTopicToTrack(track.id, topic.id, 0);
      expect((await step("agent-workflow")).suggestions).toBeUndefined();
      await data.createLesson({ topicId: topic.id, title: "Queue delivery" });
      expect((await step("agent-workflow")).suggestions[0].id).toBe(topic.id);
      await data.recordReviewResult(topic.id, "weak");
      await env().db.$client.query("update review_items set due_at=now() where user_id=$1", [id]);
      expect(await step("review-loop")).toMatchObject({
        label: "Review due topics",
        why: "1 topic is due for review.",
      });
      const grill = (await data.startGrill({ title: "Recall" }))!;
      expect(await step("grill-session")).toMatchObject({
        href: "/grills/" + grill.id,
        label: "Continue grill session",
      });
      const q = (await data.addGrillQuestion(grill.id, { prompt: "Explain delivery" }))!;
      await step("grill-session");
      await data.answerGrillQuestion(q.id, "at least once", "ui");
      expect((await step("grill-session")).waiting).toBe(1);
      await data.judgeGrillQuestion(q.id, "strong");
      await step("review-loop");
    } finally {
      await client.close();
    }
  });

  test("Reviews lists overdue Topics in order and only the next seven days, including Topics without Quizzes", async () => {
    const { cookie, data, id } = await owner("schedule");
    for (const [slug, days] of [
      ["oldest", -2],
      ["later", -1],
      ["soon", 6],
      ["outside", 8],
    ] as const) {
      const topic = await data.upsertTopic({ slug, title: slug });
      await data.recordReviewResult(topic.id, "partial", "Recall from memory");
      await env().db.$client.query(
        "update review_items set due_at=now()+$3 * interval '1 day' where user_id=$1 and topic_id=$2",
        [id, topic.id, days],
      );
      expect((await request("/api/reviews/" + topic.id + "/practice", cookie)).status).toBe(404);
    }
    expect(await (await request("/api/reviews", cookie)).json()).toMatchObject({
      due: [
        { title: "oldest", hasQuiz: false },
        { title: "later", hasQuiz: false },
      ],
      upcoming: [
        {
          title: "soon",
          level: 0,
          box: 0,
          lastResult: "partial",
          reason: "Recall from memory",
          hasQuiz: false,
        },
      ],
    });
    await data.updateProfile({ onboardedAt: new Date() });
    const html = (await (await request("/reviews", cookie)).text()).split(
      '<script type="application/json"',
    )[0]!;
    const groups = html.split('class="s-section__title"');
    expect(groups[1]).toContain("oldest");
    expect(groups[1]).toContain("later");
    expect(groups[1]).not.toContain(">soon<");
    expect(groups[2]).toContain(">soon<");
    expect(html).not.toContain(">outside<");
  });
  test("every practice route requires a Session and isolates GrillSessions, answers, ReviewItems, practice, solutions and Activity", async () => {
    const a = await owner("reader"),
      b = await owner("practice");
    const track = await b.data.createTrack("Private Track");
    const topic = await b.data.upsertTopic({ slug: "delivery", title: "Delivery" });
    await b.data.attachTopicToTrack(track.id, topic.id, 0);
    const otherTrack = await b.data.createTrack("Shared Topic");
    await b.data.attachTopicToTrack(otherTrack.id, topic.id, 0);
    const lesson = (await b.data.createLesson({
      topicId: topic.id,
      title: "Delivery modes",
      blocks: [
        {
          type: "quiz",
          id: "q",
          questions: [
            {
              prompt: "Which is a duplicate?",
              options: ["redelivery", "first delivery"],
              correctIndex: 0,
              explanation: "private key",
            },
          ],
        },
        {
          type: "quiz",
          id: "second",
          questions: [{ prompt: "Select first delivery", options: ["A", "B"], correctIndex: 1 }],
        },
        { type: "exercise", id: "exercise", prompt: "Explain", solution: "private solution" },
      ],
    }))!;
    const grill = (await b.data.startGrill({ title: "Private grill", trackId: track.id }))!;
    const question = (await b.data.addGrillQuestion(grill.id, {
      topicId: topic.id,
      prompt: "What repeats?",
    }))!;
    const unjudged = (await b.data.addGrillQuestion(grill.id, { prompt: "What is lost?" }))!;
    await b.data.recordReviewResult(topic.id, "weak", "initial");
    const practiceUrl = (id: string) => `/api/reviews/${id}/practice`;
    const answerUrl = (g: string, q: string) => `/api/grills/${g}/questions/${q}/answer`;
    const solutionUrl = (id: string) => `/api/lessons/${id}/exercise/exercise/solution`;
    const quiz = await (await request(practiceUrl(topic.id), b.cookie)).json();
    expect(quiz.questions).toHaveLength(2);
    const answer = { answer: "The message" };
    const submission = {
      revision: quiz.revision,
      answers: [
        { lessonId: lesson.id, blockId: "q", answers: [0] },
        { lessonId: lesson.id, blockId: "second", answers: [1] },
      ],
    };
    const routes = (g: string, q: string, t: string, l: string) =>
      [
        ["/api/grills/" + g, "GET"],
        [answerUrl(g, q), "POST", answer],
        [practiceUrl(t), "GET"],
        [practiceUrl(t), "POST", submission],
        [solutionUrl(l), "GET"],
      ] as const;
    const own = routes(grill.id, question.id, topic.id, lesson.id);
    const lists = ["/api/next-step", "/api/grills", "/api/reviews", "/api/progress"];
    for (const [url, method, body] of [
      ...lists.map((url) => [url, "GET", undefined] as const),
      ...own,
    ])
      expect((await request(url, "", method, body)).status, url).toBe(401);
    const otherSession = (await b.data.startGrill({ title: "Second GrillSession" }))!;
    expect(
      (await request(answerUrl(otherSession.id, question.id), b.cookie, "POST", answer)).status,
    ).toBe(404);
    const mine = (await a.data.startGrill({ title: "Reader grill" }))!;
    const missing = crypto.randomUUID();
    for (const [url, method, body] of [
      ...own,
      ...routes(missing, missing, missing, missing),
      [answerUrl(mine.id, question.id), "POST", answer],
    ] as const)
      expect((await request(url, a.cookie, method, body)).status, url).toBe(404);
    expect(await (await request("/api/grills", a.cookie)).json()).toMatchObject([
      { id: mine.id, total: 0 },
    ]);
    expect(await (await request("/api/reviews", a.cookie)).json()).toEqual({
      due: [],
      upcoming: [],
    });
    expect(await (await request("/api/progress", a.cookie)).json()).toEqual({
      masteryDistribution: [0, 0, 0, 0, 0],
      perTrack: [],
      perTopic: [],
      edges: [],
      grill: { answers: 0, strong: 0, partial: 0, weak: 0 },
      reviews: { scheduled: 0, onTime: 0 },
      recentVerdicts: { strong: 0, partial: 0, weak: 0 },
      activity: [],
    });
    expect((await (await request("/api/next-step", a.cookie)).json()).state).toMatchObject({
      tracks: 0,
      topics: 0,
      openGrills: 1,
      dueReviews: 0,
    });
    expect((await b.data.getGrill(grill.id))?.questions[0]).toEqual(question);
    expect(await b.data.listReviews()).toMatchObject({
      upcoming: [{ reason: "initial", box: 0, hasQuiz: true }],
    });
    expect((await b.data.getProgress()).recentQuizAttempts).toEqual([]);

    for (const path of [practiceUrl(topic.id), "/api/lessons/" + lesson.id]) {
      const payload = await (await request(path, b.cookie)).text();
      expect(payload).not.toMatch(
        /"correctIndex"|"explanation"|"solution"|private key|private solution/,
      );
    }
    expect(await (await request(solutionUrl(lesson.id), b.cookie)).json()).toEqual({
      solution: "private solution",
    });
    const path = answerUrl(grill.id, question.id);
    const simultaneous = await Promise.all([
      request(path, b.cookie, "POST", answer),
      request(path, b.cookie, "POST", answer),
    ]);
    expect(simultaneous.map((r) => r.status).sort((a, b) => a - b)).toEqual([200, 409]);
    expect((await b.data.getGrill(grill.id))?.questions[0]).toMatchObject({
      answerSource: "ui",
      answer: answer.answer,
    });
    await b.data.judgeGrillQuestion(question.id, "weak", "Trace the delivery");
    expect((await request(path, b.cookie, "POST", { answer: "replacement" })).status).toBe(409);
    await b.data.finishGrill(grill.id);
    expect((await request(answerUrl(grill.id, unjudged.id), b.cookie, "POST", answer)).status).toBe(
      409,
    );
    expect(await (await request("/api/grills", b.cookie)).json()).toMatchObject([
      { id: otherSession.id, status: "open", total: 0 },
      {
        id: grill.id,
        status: "finished",
        track: "Private Track",
        total: 2,
        answered: 1,
        judged: 1,
      },
    ]);
    expect(await (await request("/api/grills/" + grill.id, b.cookie)).json()).toMatchObject({
      reinforce: [{ id: topic.id, dueAt: expect.any(String) }],
      questions: [
        { answer: answer.answer, verdict: "weak", feedback: "Trace the delivery" },
        { answer: null },
      ],
    });
    const ruPracticeMessage = (key: string) =>
      ru.review[key.slice("review.".length) as keyof typeof ru.review];
    const stale = await request(practiceUrl(topic.id), b.cookie, "POST", submission);
    expect(stale.status).toBe(409);
    expect(practiceFailure(stale.status, ruPracticeMessage)).toEqual({
      stale: true,
      message: "Вопросы изменились. Загрузите новую версию теста.",
    });
    const current = await (await request(practiceUrl(topic.id), b.cookie)).json();
    submission.revision = current.revision;
    const readerTopic = await a.data.upsertTopic({ slug: "private", title: "Reader Topic" });
    const readerLesson = (await a.data.createLesson({
      topicId: readerTopic.id,
      title: "Reader Lesson",
    }))!;
    for (const lessonId of [readerLesson.id, missing]) {
      const mixed = structuredClone(submission);
      mixed.answers[1]!.lessonId = lessonId;
      expect((await request(practiceUrl(topic.id), b.cookie, "POST", mixed)).status).toBe(404);
    }
    const invalid = structuredClone(submission);
    invalid.answers[1]!.answers = [9];
    const rejected = await request(practiceUrl(topic.id), b.cookie, "POST", invalid);
    expect(rejected.status).toBe(400);
    expect(practiceFailure(rejected.status, ruPracticeMessage)).toEqual({
      stale: false,
      message: "Проверьте, что для каждого вопроса выбран один из предложенных ответов.",
    });
    expect((await b.data.getProgress()).recentQuizAttempts).toEqual([]);
    await b.data.markLessonRead(lesson.id);
    const responses = await Promise.all(
      [0, 1].map(() => request(practiceUrl(topic.id), b.cookie, "POST", submission)),
    );
    expect(responses.map((r) => r.status).sort((a, b) => a - b)).toEqual([200, 409]);
    const result = await responses.find((r) => r.ok)!.json();
    expect(result).toMatchObject({
      results: [
        { blockId: "q", perQuestion: [true] },
        { blockId: "second", perQuestion: [true] },
      ],
      verdict: "strong",
      box: 1,
      correct: 2,
      total: 2,
      mastery: 2,
    });
    const reviewed = await b.data.listDueReviews(new Date(result.dueAt), 1);
    expect(reviewed[0]?.reason).toBe("Practice Quiz: 2 of 2 correct");
    expect(reviewed[0]).not.toHaveProperty("practiceCorrect");
    expect(reviewed[0]).not.toHaveProperty("practiceTotal");
    expect(await (await request("/api/reviews", b.cookie)).json()).toMatchObject({
      upcoming: [{ topicId: topic.id, practiceCorrect: 2, practiceTotal: 2 }],
    });
    expect(await (await request("/api/reviews", a.cookie)).json()).toEqual({
      due: [],
      upcoming: [],
    });
    await b.data.updateProfile({ onboardedAt: new Date() });
    const practice = await request("/reviews/" + topic.id + "/practice", b.cookie);
    const practicePage = await practice.text();
    expectShellNavigation(practicePage, "/reviews", "Reviews");
    const quizForm = practicePage.split('class="s-quiz"')[1]?.split("</form>")[0];
    expect(quizForm).toContain("Which is a duplicate?");
    expect(quizForm).not.toMatch(/private key|correctIndex|explanation|is-judged/);
    const dashboard = await (await request("/dashboard", b.cookie)).text();
    expect(dashboard).toContain('class="s-trackstrip__cells"');
    expect(dashboard).toContain('class="s-timeline-item__title"');
    expect(dashboard).toContain('class="s-week"');
    expect(dashboard).toContain('class="s-rack');
    const overview = await (await request("/progress", b.cookie)).text();
    expect(overview).toContain('class="s-histogram"');
    expect(overview).toContain('href="/topics/' + topic.id + '"');
    for (const [prefix, score] of [
      ["/ru", "Тренировочный тест: 2 из 2 верно"],
      ["", "Practice Quiz: 2 of 2 correct"],
    ]) {
      expect(await (await request(prefix + "/reviews", b.cookie)).text()).toContain(
        "<p>" + score + "</p>",
      );
    }
    expect(new Date(result.dueAt).getTime() - reviewed[0]!.lastReviewedAt!.getTime()).toBe(
      3 * 86400000,
    );
    expect((await b.data.getProgress()).recentQuizAttempts.map((r) => r.source)).toEqual([
      "ui",
      "ui",
    ]);
    const progress = await (await request("/api/progress", b.cookie)).json();
    expect(progress).toMatchObject({
      masteryDistribution: [0, 0, 1, 0, 0],
      perTrack: [{ completed: 1 }, { completed: 1 }],
      perTopic: [
        {
          tracks: [{ id: track.id }, { id: otherTrack.id }],
          level: 2,
          read: 1,
          lessons: 1,
          lastActivity: expect.any(String),
          nextReview: result.dueAt,
        },
      ],
    });
    expect(new Set(progress.activity.map((r: { kind: string }) => r.kind))).toEqual(
      new Set([
        "Grill answer",
        "Grill verdict",
        "Lesson read",
        "Quiz attempt",
        "Review result",
        "Mastery",
      ]),
    );
    const times = progress.activity.map((r: { at: string }) => Date.parse(r.at));
    expect(times).toEqual([...times].sort((a, b) => b - a));
    expect((await (await request("/api/progress", a.cookie)).json()).activity).toEqual([]);

    // New authored notes are always literal, even when they match the retired formatter.
    const note = "Practice Quiz: 1 of 1 correct";
    await b.data.recordReviewResult(topic.id, "weak", note);
    expect(await (await request("/api/reviews", b.cookie)).json()).toMatchObject({
      upcoming: [{ topicId: topic.id, practiceCorrect: null, practiceTotal: null, reason: note }],
    });
    expect(await (await request("/reviews", b.cookie)).text()).toContain("<p>" + note + "</p>");
  });
}
