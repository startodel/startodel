import { randomInt, randomUUID } from "node:crypto";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { CallToolResultSchema } from "@modelcontextprotocol/sdk/types.js";
import type { Database } from "@startodel/db";
import { forUser, signInWithGitHub } from "@startodel/db";
import { afterEach, describe, expect, test } from "vite-plus/test";

export function learningMcpTests(environment: () => { origin: string; db: Database }) {
  describe("learning through Streamable HTTP", () => {
    const clients: Client[] = [];
    const owners: string[] = [];
    async function connect() {
      const { db, origin } = environment();
      const user = await signInWithGitHub(db, {
        githubId: BigInt(-randomInt(1, 2 ** 47)),
        login: "learner",
        avatarUrl: null,
        name: null,
      });
      owners.push(user.id);
      const data = forUser(db, user.id);
      const { token } = await data.mcpTokens.create("learning test");
      const client = new Client({ name: "learner", version: "1" });
      clients.push(client);
      await client.connect(
        new StreamableHTTPClientTransport(new URL("/mcp", origin), {
          requestInit: { headers: { authorization: "Bearer " + token } },
        }),
      );
      async function call(name: string, args: Record<string, unknown> = {}, error = false) {
        const result = CallToolResultSchema.parse(await client.callTool({ name, arguments: args }));
        const content = result.content[0];
        if (content?.type !== "text") throw new Error("Expected JSON text from " + name);
        expect(result.isError ?? false, name + " " + content.text).toBe(error);
        return JSON.parse(content.text);
      }
      return { client, call, user };
    }
    afterEach(async () => {
      await Promise.all(clients.splice(0).map((client) => client.close()));
      await environment().db.$client.query("delete from users where id = any($1::uuid[])", [
        owners.splice(0),
      ]);
    });

    test("guide resources, questionnaire, graph, Lessons, assessment and Leitner review form a complete learning loop", async () => {
      const { client, call, user } = await connect();
      expect(client.getInstructions()).toContain("get_guide");
      const { resources } = await client.listResources();
      expect(resources).toHaveLength(11);
      const documents = await Promise.all(
        resources.map(async (r) => {
          const { contents } = await client.readResource({ uri: r.uri });
          const content = contents[0];
          if (!content || !("text" in content)) throw new Error("Expected Markdown resource");
          return content.text;
        }),
      );
      for (const tool of (await client.listTools()).tools)
        expect(documents.join("\n")).toContain("`" + tool.name + "`");
      const lessonGuide =
        documents[resources.findIndex((r) => r.uri === "startodel://guide/lessons-and-blocks")];
      const blocks = JSON.parse(/```json\n([\s\S]+?)\n```/.exec(lessonGuide)![1]);
      expect(blocks.map((b: { type: string }) => b.type)).toEqual([
        "theory",
        "code",
        "callout",
        "link",
        "video",
        "quiz",
        "exercise",
      ]);
      async function step(id: string) {
        const guide = await call("get_guide");
        expect(guide.nextSteps[0]).toMatchObject({
          id,
          title: expect.any(String),
          why: expect.any(String),
          tools: expect.arrayContaining([expect.any(String)]),
        });
        expect(guide.guideSections[0].body).toBe(
          documents[resources.findIndex((r) => r.uri === "startodel://guide/" + id)],
        );
        return guide;
      }
      await step("first-steps");
      await call("update_profile", {
        stack: ["TypeScript"],
        yearsOfExperience: 0,
        experience: "junior",
      });
      await step("first-steps");
      expect(
        await call("update_profile", {
          goals: ["Explain timers"],
          notes: "Short sessions",
          markOnboarded: true,
        }),
      ).toMatchObject({ stack: ["TypeScript"], onboardedAt: expect.any(String) });
      await step("build-track-technology");
      const sources = {
        repo: "https://github.com/nodejs/node",
        docs: ["https://nodejs.org/api/timers.html"],
      };
      const track = await call("create_track", {
        title: "Runtime",
        description: "Trace callbacks",
        sources,
      });
      const trackId = track.id;
      expect(await call("update_track", { id: trackId, description: "Trace tasks" })).toMatchObject(
        { sources, title: "Runtime" },
      );
      const ids = await call("upsert_topics", {
        topics: [
          { slug: "js/tasks", title: "Tasks" },
          { slug: "js/timers", title: "Timers" },
          { slug: "system", title: "Event sources" },
        ],
      });
      expect(await call("list_topics", { prefix: "js/" })).toMatchObject([
        { slug: "js/tasks", level: 0 },
        { slug: "js/timers", level: 0 },
      ]);
      const edges = [
        { from: "js/tasks", to: "js/timers" },
        { from: "system", to: "js/tasks" },
      ];
      await call("add_edges", { edges });
      const members = { trackId, slugs: ["js/tasks", "js/timers"] };
      expect(await call("attach_topics_to_track", members)).toEqual(
        await call("attach_topics_to_track", members),
      );
      expect((await call("get_track_graph", { trackId })).suggestedNextTopics).toEqual([]);
      await call("set_mastery", { topic: "system", level: 2, evidence: "Traced an event source" });
      const lesson = await call("create_lesson", {
        topic: ids["js/tasks"],
        title: "Tasks",
        blocks,
      });
      const lessonId = lesson.id;
      expect(await call("update_lesson", { lessonId, summary: "Browser tasks" })).toMatchObject({
        blocks,
      });
      expect(await call("get_lesson", { lessonId })).toMatchObject({ blocks });
      // A replacement drops omitted Blocks while keeping the Quiz ID for subsequent attempts.
      const replacement = blocks.slice(1);
      expect(await call("update_lesson", { lessonId, blocks: replacement })).toMatchObject({
        blocks: replacement,
        summary: "Browser tasks",
      });
      expect((await call("get_lesson", { lessonId })).blocks).toEqual(replacement);
      expect(await call("list_lessons", { topic: "js/tasks" })).toMatchObject([
        { id: lessonId, readAt: null },
      ]);
      expect(await call("mark_lesson_read", { lessonId })).toMatchObject({ mastery: 1 });
      const graph = await call("get_track_graph", { trackId });
      expect(graph).toMatchObject({
        topics: [
          { slug: "js/tasks", lessonCount: 1, readCount: 1, level: 1 },
          { slug: "js/timers", lessonCount: 0, readCount: 0 },
        ],
        edges: [{ fromTopicId: ids["js/tasks"], toTopicId: ids["js/timers"] }],
        suggestedNextTopics: [{ slug: "js/tasks" }],
      });
      expect(await call("get_topic", { id: ids["js/tasks"] })).toMatchObject({
        mastery: { level: 1 },
        lessons: [{ id: lessonId }],
        prerequisites: [{ slug: "system" }],
        dependents: [{ slug: "js/timers" }],
      });
      expect((await step("agent-workflow")).nextSteps[0].why).toContain("js/tasks");
      expect(
        await call("record_quiz_result", { lessonId, blockId: "timers", answers: [1] }),
      ).toMatchObject({ correct: 1, total: 1, source: "mcp", mastery: 2 });
      expect(await call("get_progress")).toMatchObject({
        masteryDistribution: [1, 0, 2, 0, 0],
        perTrack: [{ trackId, completed: 1, total: 2 }],
        recentQuizAttempts: [{ lessonId }],
        dueReviewsCount: 0,
        openGrills: [],
      });
      const { session, candidates } = await call("start_grill", {
        trackId,
        title: "Explain timers",
      });
      const sessionId = session.id;
      expect(session.targetSize).toBe(15);
      expect(candidates).toEqual(await call("get_grill_candidates", { trackId }));
      expect(candidates.map((c: { slug: string }) => c.slug)).toEqual(["js/timers", "js/tasks"]);
      const [question] = await call("add_grill_questions", {
        sessionId,
        questions: [{ prompt: "Can a timer interrupt a task?", topic: "js/timers" }],
      });
      const questionId = question.id;
      expect((await step("grill-session")).nextSteps[0].why).toContain("1 unanswered");
      expect(await call("submit_grill_answer", { questionId, answer: "Yes" })).toMatchObject({
        answerSource: "mcp",
      });
      expect((await step("grill-session")).nextSteps[0].why).toContain("1 answered and awaiting");
      await call("judge_grill_answer", {
        questionId,
        verdict: "weak",
        feedback: "Trace the synchronous task.",
      });
      expect(await call("get_grill", { sessionId })).toMatchObject({
        questions: [
          {
            id: questionId,
            answer: "Yes",
            verdict: "weak",
            feedback: "Trace the synchronous task.",
          },
        ],
      });
      expect(await call("finish_grill", { sessionId })).toMatchObject({
        counts: { weak: 1, partial: 0, strong: 0, unjudged: 0 },
        weakTopics: [ids["js/timers"]],
      });
      expect(await call("list_grills", { status: "open" })).toEqual([]);
      expect(await call("list_due_reviews")).toEqual([]);
      // Advance just this scheduled ReviewItem to its due instant.
      const { rowCount } = await environment().db.$client.query(
        "update review_items set due_at = now() where user_id=$1 and topic_id=$2 and box=0 and last_result='weak' and due_at-last_reviewed_at=interval '1 day'",
        [user.id, ids["js/timers"]],
      );
      expect(rowCount).toBe(1);
      expect(await call("list_due_reviews", { limit: 1 })).toMatchObject([
        { topicId: ids["js/timers"] },
      ]);
      expect((await step("review-loop")).state.dueReviews).toBe(1);
      expect(
        await call("record_review_result", {
          topic: "js/timers",
          verdict: "strong",
          reason: "Traced a callback",
        }),
      ).toMatchObject({ box: 1 });
      await step("agent-workflow");
      await call("remove_edge", edges[0]);
      await call("detach_topic_from_track", { trackId, slug: "js/timers" });
      expect((await call("get_track_graph", { trackId })).topics).toHaveLength(1);
    });

    test("foreign and absent references give identical errors and every Tool preserves the other Owner's rows", async () => {
      const a = await connect();
      const b = await connect();
      const bIds = await b.call("upsert_topics", {
        topics: [
          { slug: "private", title: "Private" },
          { slug: "shared", title: "Same slug" },
        ],
      });
      const track = await b.call("create_track", { title: "Private Track" });
      await b.call("update_profile", { stack: ["Private"], markOnboarded: true });
      await b.call("attach_topics_to_track", { trackId: track.id, slugs: ["shared", "private"] });
      await b.call("add_edges", { edges: [{ from: "shared", to: "private" }] });
      const blocks = [
        {
          id: "quiz",
          type: "quiz",
          questions: [{ prompt: "Pick", options: ["A", "B"], correctIndex: 0 }],
        },
      ];
      const lesson = await b.call("create_lesson", {
        topic: "private",
        title: "Private Lesson",
        blocks,
      });
      await b.call("record_quiz_result", { lessonId: lesson.id, blockId: "quiz", answers: [0] });
      await b.call("mark_lesson_read", { lessonId: lesson.id });
      await b.call("set_mastery", { topic: "private", level: 4 });
      const grill = (await b.call("start_grill", { title: "Private Grill" })).session;
      const [question] = await b.call("add_grill_questions", {
        sessionId: grill.id,
        questions: [{ prompt: "Private?", topic: "private" }],
      });
      await b.call("submit_grill_answer", { questionId: question.id, answer: "Private answer" });
      await b.call("judge_grill_answer", { questionId: question.id, verdict: "weak" });
      const db = environment().db;
      await db.$client.query("update review_items set due_at = now() where user_id=$1", [
        b.user.id,
      ]);
      async function snapshot() {
        const tables = [
          "profiles",
          "tracks",
          "topics",
          "track_topics",
          "topic_edges",
          "lessons",
          "lesson_progress",
          "quiz_attempts",
          "topic_mastery",
          "review_items",
          "grill_sessions",
          "grill_questions",
        ];
        return Promise.all(
          tables.map(
            async (table) =>
              (
                await db.$client.query(`select * from ${table} where user_id=$1 order by id`, [
                  b.user.id,
                ])
              ).rows,
          ),
        );
      }
      const before = await snapshot();
      expect(await a.call("list_topics")).toEqual([]);
      expect(await a.call("list_due_reviews")).toEqual([]);
      expect(await a.call("list_grills")).toEqual([]);
      expect(await a.call("get_grill_candidates")).toEqual([]);
      expect(await a.call("get_progress")).toEqual({
        masteryDistribution: [0, 0, 0, 0, 0],
        perTrack: [],
        dueReviewsCount: 0,
        recentQuizAttempts: [],
        openGrills: [],
      });
      expect((await a.call("get_guide")).state).toEqual({
        onboarded: false,
        tracks: 0,
        topics: 0,
        dueReviews: 0,
        openGrills: 0,
      });
      const { shared } = await a.call("upsert_topics", {
        topics: [
          { slug: "shared", title: "My version" },
          { slug: "other", title: "Other" },
        ],
      });
      expect(shared).not.toBe(bIds.shared);
      const mine = await a.call("create_track", { title: "Mine" });
      const mineGrill = (await a.call("start_grill", { title: "Mine" })).session;
      const missing = randomUUID();
      for (const foreign of [true, false]) {
        const topic = foreign ? bIds.private : missing;
        const slug = foreign ? "private" : "absent";
        const lessonId = foreign ? lesson.id : missing;
        const trackId = foreign ? track.id : missing;
        const questionId = foreign ? question.id : missing;
        const sessionId = foreign ? grill.id : missing;
        const cases: [string, Record<string, unknown>][] = [
          ["get_topic", { id: topic }],
          ["get_topic", { slug }],
          [
            "add_edges",
            {
              edges: [
                { from: "shared", to: "other" },
                { from: "shared", to: slug },
              ],
            },
          ],
          ["remove_edge", { from: "shared", to: slug }],
          ["attach_topics_to_track", { trackId, slugs: ["shared"] }],
          ["attach_topics_to_track", { trackId: mine.id, slugs: ["shared", slug] }],
          ["detach_topic_from_track", { trackId, slug: "shared" }],
          ["detach_topic_from_track", { trackId: mine.id, slug }],
          ["get_track_graph", { trackId }],
          ["create_lesson", { topic, title: "X", blocks: [] }],
          ["list_lessons", { topic }],
          ["get_lesson", { lessonId }],
          ["update_lesson", { lessonId, title: "X" }],
          ["mark_lesson_read", { lessonId }],
          ["record_quiz_result", { lessonId, blockId: "quiz", answers: [0] }],
          ["set_mastery", { topic, level: 1 }],
          ["record_review_result", { topic, verdict: "partial" }],
          ["start_grill", { trackId, title: "X" }],
          ["get_grill_candidates", { trackId }],
          ["add_grill_questions", { sessionId, questions: [{ prompt: "X" }] }],
          [
            "add_grill_questions",
            {
              sessionId: mineGrill.id,
              questions: [{ prompt: "Valid first" }, { prompt: "X", topic }],
            },
          ],
          ["get_grill", { sessionId }],
          ["finish_grill", { sessionId }],
          ["submit_grill_answer", { questionId, answer: "X" }],
          ["judge_grill_answer", { questionId, verdict: "strong" }],
        ];
        for (const [name, args] of cases)
          expect(await a.call(name, args, true), name).toEqual({ error: "Not found" });
      }
      expect((await a.call("get_grill", { sessionId: mineGrill.id })).questions).toEqual([]);
      expect((await a.call("get_track_graph", { trackId: mine.id })).topics).toEqual([]);
      expect((await a.call("get_topic", { slug: "shared" })).dependents).toEqual([]);
      expect(await snapshot()).toEqual(before);
    });

    test("rejects invalid Blocks, slugs, Verdicts, unexpected nested fields and oversized batches", async () => {
      const { client } = await connect();
      const id = randomUUID();
      const topic = { slug: "sql", title: "SQL" };
      const edge = { from: "sql", to: "index" };
      const question = { prompt: "Explain" };
      const cases: [string, Record<string, unknown>][] = [
        [
          "create_lesson",
          { topic: "sql", title: "X", blocks: [{ type: "exercise", id: "x", prompt: "Try" }] },
        ],
        [
          "update_lesson",
          { lessonId: id, blocks: [{ type: "theory", id: "x", markdown: "X", userId: id }] },
        ],
        ["upsert_topics", { topics: [{ ...topic, slug: "SQL" }] }],
        ["upsert_topics", { topics: Array(101).fill(topic) }],
        ["add_edges", { edges: Array(201).fill(edge) }],
        ["add_edges", { edges: [{ from: "sql", to: "sql" }] }],
        ["add_grill_questions", { sessionId: id, questions: Array(31).fill(question) }],
        ["add_grill_questions", { sessionId: id, questions: [{ ...question, ownerId: id }] }],
        ["judge_grill_answer", { questionId: id, verdict: "excellent" }],
        ["record_review_result", { topic: "sql", verdict: "wrong" }],
        ["set_mastery", { topic: "sql", level: 5 }],
        ["update_profile", { yearsOfExperience: 61 }],
        ["get_topic", {}],
        ["get_topic", { id, slug: "sql" }],
      ];
      for (const [name, args] of cases) {
        const result = CallToolResultSchema.parse(await client.callTool({ name, arguments: args }));
        expect(result.isError, name).toBe(true);
        expect(result.content[0], name).toMatchObject({
          type: "text",
          text: expect.stringContaining("Invalid arguments"),
        });
      }
    });
  });
}
