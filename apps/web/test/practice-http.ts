import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { CallToolResultSchema } from "@modelcontextprotocol/sdk/types.js";
import { forUser, type Database } from "@startodel/db";
import { expect, test } from "vite-plus/test";

type Request = (
  path: string,
  cookie?: string,
  method?: string,
  body?: unknown,
) => Promise<Response>;

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
      await data.updateProfile({ onboardedAt: new Date(), goals: ["queues"] });
      expect((await step("build-track-technology")).prompt).toContain("queues");
      const track = await data.createTrack("Delivery");
      expect((await step("agent-workflow")).why).toContain("No Track Topics");
      const topic = await data.upsertTopic({ slug: "queues", title: "Queues" });
      await data.attachTopicToTrack(track.id, topic.id, 0);
      expect((await step("agent-workflow")).suggestions[0].id).toBe(topic.id);
      await data.recordReviewResult(topic.id, "weak");
      await env().db.$client.query("update review_items set due_at=now() where user_id=$1", [id]);
      await step("review-loop");
      const grill = (await data.startGrill({ title: "Recall" }))!;
      expect((await step("grill-session")).href).toBe("/grills/" + grill.id);
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
    expect((await request(practiceUrl(topic.id), b.cookie, "POST", submission)).status).toBe(409);
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
    expect((await request(practiceUrl(topic.id), b.cookie, "POST", invalid)).status).toBe(400);
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
  });
}
