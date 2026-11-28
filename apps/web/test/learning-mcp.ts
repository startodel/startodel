import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { randomInt, randomUUID } from "node:crypto";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { CallToolResultSchema } from "@modelcontextprotocol/sdk/types.js";
import type { Database } from "@startodel/db";
import { forUser, signInWithGitHub } from "@startodel/db";
import { afterEach, describe, expect, test } from "vite-plus/test";

export function learningMcpTests(
  environment: () => { origin: string; publicOrigin: string; db: Database },
) {
  describe("learning through Streamable HTTP", () => {
    const clients: Client[] = [];
    const owners: string[] = [];
    async function connect(login = "learner") {
      const { db, origin } = environment();
      const user = await signInWithGitHub(db, {
        githubId: BigInt(-randomInt(1, 2 ** 47)),
        login,
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
        const value = JSON.parse(content.text);
        expect(result.structuredContent, name).toEqual(
          Array.isArray(value) ? { items: value } : value,
        );
        return value;
      }
      return { client, call, user };
    }
    afterEach(async () => {
      await Promise.all(clients.splice(0).map((client) => client.close()));
      await environment().db.$client.query("delete from users where id = any($1::uuid[])", [
        owners.splice(0),
      ]);
    });

    test("accounts sharing a GitHub login publish at distinct stable handles", async () => {
      const login = randomUUID();
      const former = await connect(login);
      const track = await former.call("create_track", { title: "Same slug" });
      await forUser(environment().db, former.user.id).setTrackVisibility(track.id, true, true);
      const current = await connect(login);
      const other = await current.call("create_track", { title: "Same slug" });
      await forUser(environment().db, current.user.id).setTrackVisibility(other.id, true, true);
      const ref = { slug: track.slug };
      const privateLink = await former.call("get_track", ref);
      expect(privateLink.id).toBe(track.id);
      expect(privateLink.publicUrl).toBe(environment().publicOrigin + "/u/" + login + "/same-slug");
      expect(await current.call("get_track", ref)).toMatchObject({
        id: other.id,
        publicUrl: environment().publicOrigin + "/u/" + login + "-2/same-slug",
      });
    });

    test("records an answer for each question in a ten-question Quiz", async () => {
      const { call } = await connect();
      await call("upsert_topics", { topics: [{ slug: "tasks", title: "Tasks" }] });
      const questions = Array.from({ length: 10 }, (_, i) => ({
        prompt: `Pick the correct answer to question ${i + 1}`,
        options: ["A", "B"],
        correctIndex: i % 2,
      }));
      const lesson = await call("create_lesson", {
        topic: "tasks",
        title: "Practice",
        blocks: [{ type: "quiz", id: "q", questions }],
      });
      expect(
        await call("record_quiz_result", {
          id: lesson.id,
          blockId: "q",
          answers: questions.map((q) => q.correctIndex),
        }),
      ).toMatchObject({ correct: 10, total: 10 });
    });

    test("a mixed Topic upsert preserves omitted summaries and clears only explicit values", async () => {
      const { call } = await connect();
      const original = ["keep", "clear", "empty"].map((slug) => ({
        slug,
        title: slug,
        summary: "Prior",
      }));
      await call("upsert_topics", { topics: original });
      await call("upsert_topics", {
        topics: [
          { slug: "keep", title: "Renamed" },
          { slug: "clear", title: "Clear", summary: null },
          { slug: "empty", title: "Empty", summary: "" },
          { slug: "new", title: "New" },
        ],
      });
      expect(await call("list_topics")).toMatchObject([
        { slug: "clear", summary: null },
        { slug: "empty", summary: "" },
        { slug: "keep", title: "Renamed", summary: "Prior" },
        { slug: "new", summary: null },
      ]);
    });

    test("the Profile remembers the learner's language independently of their login", async () => {
      const { call, user } = await connect();
      expect(await call("get_profile")).toMatchObject({
        login: user.login,
        preferredLanguage: null,
      });
      await call("update_profile", { preferredLanguage: "ru" });
      await call("update_profile", { notes: "Keep the language" });
      expect(await call("get_profile")).toMatchObject({ preferredLanguage: "ru" });
      expect(await call("update_profile", { preferredLanguage: null })).toMatchObject({
        preferredLanguage: null,
      });
    });

    test("every Tool named in an installable skill is available over MCP", async () => {
      const { client } = await connect();
      const names = (await client.listTools()).tools.map((tool) => tool.name);
      const skills = "packages/skills/skills";
      for (const folder of await readdir(skills)) {
        const skill = await readFile(join(skills, folder, "SKILL.md"), "utf8");
        const references = skill.match(/\b[a-z][a-z0-9]*(?:_[a-z0-9]+)+\b/g) ?? [];
        expect(references).toContain("get_guide");
        for (const reference of references) expect(names, folder).toContain(reference);
      }
    });

    test("both Lesson writing Tools describe how to order, explain and source Blocks", async () => {
      const { client } = await connect();
      const { tools } = await client.listTools();
      for (const name of ["create_lesson", "update_lesson"]) {
        const description = tools.find((tool) => tool.name === name)?.description;
        expect(description, name).toMatch(
          /schema accepts up to 200 ordered Blocks with unique IDs/i,
        );
        expect(description, name).toMatch(
          /Topic needs.*no writing target for Lesson length or Block count/i,
        );
        expect(description, name).toMatch(/avoid one-line stubs/i);
        expect(description, name).toMatch(
          /leave out another framework’s code, terminology.*side-by-side comparisons unless the learner explicitly asks/i,
        );
        expect(description, name).toMatch(/code.*scenario.*before.*prediction/i);
        expect(description, name).toMatch(/prediction in a quiz.*unscored.*theory Block/i);
        expect(description, name).toMatch(/Callouts for.*tip.*gotcha.*takeaway/i);
        expect(description, name).toMatch(
          /never put prediction questions, Quiz prompts or Exercise prompts in a Callout/i,
        );
        expect(description, name).toMatch(/answer.*later theory Block/i);
        expect(description, name).toMatch(/one idea per theory Block/i);
        expect(description, name).toMatch(/jargon on first use/i);
        expect(description, name).toMatch(/labelled links.*Track Sources/i);
        expect(description, name).toMatch(/short, direct sentences.*filler/i);
        expect(description, name).toMatch(
          /sticky Lesson contents sidebar.*major theory, callout and exercise Blocks.*filename/i,
        );
        expect(description, name).toMatch(/optional.*120 characters/i);
        expect(description, name).toMatch(/Quiz.*question count.*ignores.*title/i);
      }
    });

    test("guide resources, questionnaire, graph, Lessons, assessment and Leitner review form a complete learning loop", async () => {
      const { client, call, user } = await connect();
      expect(client.getInstructions()).toContain("get_guide");
      const { resources } = await client.listResources();
      const guideIds = [
        "index",
        "platform",
        "first-steps",
        "user-workflow",
        "agent-workflow",
        "build-track-technology",
        "build-track-from-repo",
        "lessons-and-blocks",
        "grill-session",
        "review-loop",
        "rules",
        "references/browser-tasks",
      ];
      expect(resources.map((r) => r.uri).sort()).toEqual(
        guideIds.map((id) => "startodel://guide/" + id).sort(),
      );
      const documents = await Promise.all(
        resources.map(async (r) => {
          const { contents } = await client.readResource({ uri: r.uri });
          const content = contents[0];
          if (!content || !("text" in content)) throw new Error("Expected Markdown resource");
          return content.text;
        }),
      );
      const toolNames = (await client.listTools()).tools.map((tool) => tool.name);
      for (const name of toolNames) expect(documents.join("\n")).toContain("`" + name + "`");
      const lessonGuide =
        documents[resources.findIndex((r) => r.uri === "startodel://guide/lessons-and-blocks")];
      const exampleUri = /\]\((startodel:\/\/guide\/references\/[^)]+)\)/.exec(lessonGuide)?.[1];
      expect(exampleUri).toBe("startodel://guide/references/browser-tasks");
      const example = documents[resources.findIndex((r) => r.uri === exampleUri)];
      const blocks = JSON.parse(/```json\n([\s\S]+?)\n```/.exec(example)![1]);
      expect(blocks.map((b: { type: string }) => b.type)).toEqual([
        "theory",
        "code",
        "quiz",
        "theory",
        "callout",
        "link",
        "video",
        "quiz",
        "exercise",
      ]);
      expect(blocks[0].markdown).not.toMatch(/predict|which.*first|\?/i);
      expect(blocks[1]).not.toHaveProperty("explanation");
      expect(blocks[2].id).toBe("prediction");
      expect(blocks[2].questions[0].prompt).toMatch(/which.*first\?/i);
      expect(blocks[3].markdown).toMatch(/`sync` first/);
      expect(blocks[4]).toMatchObject({ id: "latency", variant: "production" });
      expect(blocks[4].markdown).toMatch(/Performance panel/);
      expect(blocks[4].markdown).not.toMatch(/which message|pick an order|predict/i);
      expect(blocks[1].title).toMatch(/\.js$/);
      for (const block of [blocks[0], blocks[3], blocks[4], blocks[8]]) {
        expect(block.title).toMatch(/\S/);
        expect(block.title.length).toBeLessThanOrEqual(120);
      }
      async function step(id: string) {
        const guide = await call("get_guide");
        expect(guide.nextSteps[0]).toMatchObject({
          id,
          title: expect.any(String),
          why: expect.any(String),
          tools: expect.arrayContaining([expect.any(String)]),
        });
        for (const name of guide.nextSteps[0].tools) expect(toolNames).toContain(name);
        expect(guide.guideSections[0].id).toBe(id);
        expect(guide.guideSections.at(-1).id).toBe("rules");
        for (const section of guide.guideSections) {
          expect(section.body).toBe(documents[resources.findIndex((r) => r.uri === section.uri)]);
        }
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
      const { publicOrigin } = environment();
      expect(track.url).toBe(publicOrigin + "/tracks/runtime");
      expect(track).not.toHaveProperty("publicUrl");
      expect(await call("get_track", { slug: track.slug })).toEqual(track);
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
        { slug: "js/tasks", level: 0, url: publicOrigin + "/topics/" + ids["js/tasks"] },
        { slug: "js/timers", level: 0, lessonCount: 0 },
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
      expect(await call("attach_topics_to_track", { trackId, slugs: ["js/tasks"] })).toMatchObject([
        { id: ids["js/tasks"], slug: "js/tasks", title: "Tasks", position: 0 },
        { id: ids["js/timers"], slug: "js/timers", title: "Timers", position: 1 },
      ]);
      expect((await call("get_track_graph", { trackId })).suggestedNextTopics).toEqual([]);
      await call("set_mastery", { topic: "system", level: 2, evidence: "Traced an event source" });
      const lesson = await call("create_lesson", {
        topic: ids["js/tasks"],
        title: "Tasks",
        blocks,
      });
      const lessonId = lesson.id;
      const lessonUrl = publicOrigin + "/lessons/" + lessonId;
      expect(lesson.url).toBe(lessonUrl);
      expect(lesson).not.toHaveProperty("userId");
      expect(await call("update_lesson", { lessonId, summary: "Browser tasks" })).toMatchObject({
        blocks,
      });
      expect(await call("get_lesson", { lessonId })).toMatchObject({ blocks, url: lessonUrl });
      // A replacement drops omitted Blocks while keeping the Quiz IDs for subsequent attempts.
      const replacement = blocks.slice(1);
      expect(await call("update_lesson", { lessonId, blocks: replacement })).toMatchObject({
        blocks: replacement,
        summary: "Browser tasks",
      });
      expect((await call("get_lesson", { lessonId })).blocks).toEqual(replacement);
      expect(await call("list_lessons", { topic: "js/tasks" })).toMatchObject([
        { id: lessonId, url: lessonUrl, readAt: null },
      ]);
      expect(await call("mark_lesson_read", { lessonId })).toMatchObject({ mastery: 1 });
      const graph = await call("get_track_graph", { trackId });
      expect(graph).toMatchObject({
        topics: [
          {
            slug: "js/tasks",
            url: publicOrigin + "/topics/" + ids["js/tasks"],
            lessonCount: 1,
            readCount: 1,
            level: 1,
          },
          { slug: "js/timers", lessonCount: 0, readCount: 0 },
        ],
        edges: [
          {
            fromTopicId: ids["js/tasks"],
            toTopicId: ids["js/timers"],
            fromSlug: "js/tasks",
            toSlug: "js/timers",
            fromTitle: "Tasks",
            toTitle: "Timers",
          },
        ],
        suggestedNextTopics: [{ slug: "js/tasks" }],
      });
      expect(await call("get_topic", { id: ids["js/tasks"] })).toMatchObject({
        topic: { url: publicOrigin + "/topics/" + ids["js/tasks"] },
        mastery: { level: 1 },
        lessons: [{ id: lessonId, url: lessonUrl }],
        prerequisites: [{ slug: "system" }],
        dependents: [{ slug: "js/timers" }],
      });
      const reason = (await step("agent-workflow")).nextSteps[0].why;
      expect(reason).toContain("Tasks (js/tasks)");
      await call("update_profile", { preferredLanguage: "ru" });
      expect((await step("agent-workflow")).nextSteps[0].why).toContain(
        "Можно изучать: Tasks (js/tasks)",
      );
      await call("update_profile", { preferredLanguage: "en" });
      expect(
        await call("record_quiz_result", { lessonId, blockId: "prediction", answers: [1] }),
      ).toMatchObject({ correct: 1, total: 1, source: "mcp", mastery: 1 });
      expect(
        await call("record_quiz_result", { lessonId, blockId: "timers", answers: [1] }),
      ).toMatchObject({ correct: 1, total: 1, source: "mcp", mastery: 2 });
      expect(await call("get_progress")).toMatchObject({
        masteryDistribution: [1, 0, 2, 0, 0],
        perTrack: [{ trackId, completed: 1, total: 2 }],
        recentQuizAttempts: [
          { lessonId, blockId: "timers" },
          { lessonId, blockId: "prediction" },
        ],
        dueReviewsCount: 0,
        openGrills: [],
      });
      const { session, candidates } = await call("start_grill", {
        trackId,
        title: "Explain timers",
      });
      const sessionId = session.id;
      const grillUrl = publicOrigin + "/grills/" + sessionId;
      expect(session.url).toBe(grillUrl);
      expect(await call("list_grills")).toMatchObject([{ url: grillUrl }]);
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
        url: grillUrl,
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

    test("a Track guide separates the next Lesson batch from study, Reviews and GrillSessions", async () => {
      const { call, user } = await connect();
      await call("update_profile", { markOnboarded: true });
      const old = await call("create_track", { title: "Old" });
      const course = await call("create_track", { title: "New" });
      const ids = await call("upsert_topics", {
        topics: ["old", "planned", "intro", "last", "extra"].map((slug) => ({ slug, title: slug })),
      });
      await call("attach_topics_to_track", { trackId: old.id, slugs: ["old", "extra"] });
      await call("attach_topics_to_track", {
        trackId: course.id,
        slugs: ["intro", "planned", "last"],
      });
      await call("create_lesson", { topic: "old", title: "Earlier", blocks: [] });
      const global = await call("get_guide");
      expect(global.nextSteps[0].why).toBe("Ready to study: old (old)");
      await call("start_grill", { trackId: old.id, title: "Older Grill" });
      await call("start_grill", { title: "General Grill" });
      await call("record_review_result", { topic: "old", verdict: "weak" });
      await environment().db.$client.query(
        "update review_items set due_at=now() where user_id=$1",
        [user.id],
      );

      const scoped = await call("get_guide", { track: course.slug });
      expect(await call("get_guide", { track: course.id })).toEqual(scoped);
      expect(scoped.state).toEqual({
        onboarded: true,
        tracks: 1,
        topics: 3,
        dueReviews: 0,
        openGrills: 0,
      });
      expect(scoped.nextSteps[0].why).toBe(
        "No Topics with Lessons are ready to study in this Track.",
      );
      expect(scoped.guideSections.map((s: { id: string }) => s.id)).toContain(
        "build-track-technology",
      );
      expect(scoped.authoring).toMatchObject({
        track: { id: course.id, slug: course.slug },
        nextTopics: [{ id: ids.intro }, { id: ids.planned }],
      });
      await call("create_lesson", { topic: "intro", title: "New Lesson", blocks: [] });
      await call("add_edges", { edges: [{ from: "old", to: "intro" }] });
      expect((await call("get_guide", { track: course.id })).nextSteps[0].why).not.toContain(
        "Ready to study",
      );
      await call("set_mastery", { topic: "old", level: 2 });
      const resumed = await call("get_guide", { track: course.id });
      expect(resumed.nextSteps[0].why).toBe("Ready to study: intro (intro)");
      expect(resumed.authoring.nextTopics).toMatchObject([{ id: ids.planned }, { id: ids.last }]);
      for (const topic of ["planned", "last"])
        await call("create_lesson", { topic, title: "Study", blocks: [] });
      expect((await call("get_guide", { track: course.id })).authoring.nextTopics).toEqual([]);
      await call("record_review_result", { topic: "intro", verdict: "weak" });
      await environment().db.$client.query(
        "update review_items set due_at=now() where user_id=$1",
        [user.id],
      );
      expect(await call("get_guide", { track: course.id })).toMatchObject({
        state: { dueReviews: 1 },
        nextSteps: [{ id: "review-loop", topicId: ids.intro }],
      });
      const { session } = await call("start_grill", { trackId: course.id, title: "Course Grill" });
      expect(await call("get_guide", { track: course.id })).toMatchObject({
        state: { openGrills: 1 },
        nextSteps: [{ id: "grill-session", sessionId: session.id }],
      });
    });

    test("Grill writes keep supplied titles and warn about entity prefixes", async () => {
      const { call } = await connect();
      const title = "Разбор: JSX, компоненты и состояние в React 19";
      const { session, warnings } = await call("start_grill", { title });
      const url = environment().publicOrigin + "/grills/" + session.id;
      expect(session).toMatchObject({ title, url });
      expect(warnings).toEqual([expect.stringContaining("subject")]);
      for (const prefixed of [
        "  оПрОс — HTTP",
        "GRILL:React",
        "Quiz–Timers",
        "разбор JSX",
        "Тест",
      ]) {
        const result = await call("update_grill", { sessionId: session.id, title: prefixed });
        expect(result).toMatchObject({ id: session.id, title: prefixed, url, warnings });
      }
      for (const subject of [
        "JSX in React 19",
        "Grilling techniques",
        "Разборка механизмов",
        "Quizlet",
      ]) {
        const result = await call("update_grill", { sessionId: session.id, title: subject });
        expect(result).toMatchObject({ id: session.id, title: subject, url });
        expect(result).not.toHaveProperty("warnings");
        expect((await call("get_grill", { sessionId: session.id })).title).toBe(subject);
      }
      expect(await call("start_grill", { title: "JSX in React 19" })).not.toHaveProperty(
        "warnings",
      );
    });

    test("Lesson writes save the content and report advisory Markdown warnings", async () => {
      const { call } = await connect();
      await call("upsert_topics", { topics: [{ slug: "markup", title: "Markup" }] });
      const exercise = {
        type: "exercise",
        id: "element",
        prompt: "Try <App />",
        solution: "Done",
        starterCode: "<App />",
        language: "tsx",
      };
      const saved = await call("create_lesson", {
        topic: "markup",
        title: "Markup",
        blocks: [exercise],
      });
      expect(saved).toMatchObject({
        blocks: [exercise],
        warnings: [expect.stringContaining("element")],
      });
      const blocks = [{ type: "theory", id: "syntax", markdown: "Use `print(`x`)`." }];
      expect(await call("update_lesson", { id: saved.id, blocks })).toMatchObject({
        blocks,
        warnings: [expect.stringContaining("syntax")],
      });
      expect((await call("get_lesson", { id: saved.id })).blocks).toEqual(blocks);
      expect(await call("update_lesson", { id: saved.id, blocks: [] })).not.toHaveProperty(
        "warnings",
      );
    });

    test("a new unread Lesson reopens study in a previously completed Topic", async () => {
      const { call } = await connect();
      await call("update_profile", { markOnboarded: true });
      const track = await call("create_track", { title: "Runtime" });
      const { tasks: topicId } = await call("upsert_topics", {
        topics: [{ slug: "tasks", title: "Tasks" }],
      });
      await call("attach_topics_to_track", { trackId: track.id, slugs: ["tasks"] });
      const first = await call("create_lesson", {
        topic: "tasks",
        title: "Queues",
        blocks: [
          {
            type: "quiz",
            id: "q",
            questions: [{ prompt: "First?", options: ["A", "B"], correctIndex: 0 }],
          },
        ],
      });
      const read = await call("mark_lesson_read", { id: first.id });
      const attempt = await call("record_quiz_result", {
        id: first.id,
        blockId: "q",
        answers: [0],
      });
      expect(attempt.mastery).toBe(2);
      expect((await call("get_progress")).perTrack).toMatchObject([{ completed: 1 }]);

      const added = await call("create_lesson", {
        topic: "tasks",
        title: "Scheduling",
        blocks: [],
      });
      for (const scope of [{}, { track: track.slug }]) {
        expect((await call("get_guide", scope)).nextSteps[0]).toMatchObject({
          id: "agent-workflow",
          topicId,
          lessonId: added.id,
        });
      }
      expect(await call("get_track_graph", { trackId: track.id })).toMatchObject({
        nextLesson: { id: added.id },
        suggestedNextTopics: [{ id: topicId }],
        topics: [{ level: 2, readCount: 1, lessonCount: 2 }],
      });
      expect(await call("list_lessons", { topic: "tasks" })).toMatchObject([
        { id: first.id, readAt: read.readAt },
        { id: added.id, readAt: null },
      ]);
      expect(await call("get_progress")).toMatchObject({
        perTrack: [{ completed: 0 }],
        recentQuizAttempts: [{ id: attempt.id, correct: 1 }],
      });
      await call("mark_lesson_read", { id: added.id });
      expect((await call("get_progress")).perTrack).toMatchObject([{ completed: 1 }]);
      expect((await call("get_track_graph", { trackId: track.id })).nextLesson).toBeNull();
    });

    test("Lesson and Topic Tools accept explicit IDs and slugs alongside their existing inputs", async () => {
      const { call, user } = await connect();
      const { tasks: id } = await call("upsert_topics", {
        topics: [{ slug: "tasks", title: "Tasks" }],
      });
      expect(await call("update_topic", { id, summary: "An event loop" })).toMatchObject({ id });
      expect(await call("update_topic", { slug: "tasks", title: "Tasks revised" })).toMatchObject({
        id,
        title: "Tasks revised",
        summary: "An event loop",
      });
      const track = await call("create_track", { title: "Runtime" });
      expect(
        await call("update_track", { slug: track.slug, description: "Practice" }),
      ).toMatchObject({ id: track.id, description: "Practice" });
      const graph = await call("get_track_graph", { trackId: track.id });
      expect(graph.track.url).toBe(environment().publicOrigin + "/tracks/runtime");
      for (const ref of [track.slug, track.id]) {
        expect(await call("get_track_graph", { track: ref })).toEqual(graph);
      }
      const legacySlug = randomUUID();
      await environment().db.$client.query("update tracks set slug=$1 where id=$2 and user_id=$3", [
        legacySlug,
        track.id,
        user.id,
      ]);
      expect((await call("get_track_graph", { track: legacySlug })).track.id).toBe(track.id);
      const first = await call("create_lesson", { id, title: "Timers", blocks: [] });
      const second = await call("create_lesson", { slug: "tasks", title: "Events", blocks: [] });
      for (const ref of [{ id }, { slug: "tasks" }, { topic: "tasks" }])
        expect(await call("list_lessons", ref)).toMatchObject([
          { id: first.id },
          { id: second.id },
        ]);
      expect(
        await call("update_lesson", { id: first.id, summary: "Timers revised" }),
      ).toMatchObject({ id: first.id, url: first.url });
      expect(await call("get_lesson", { id: first.id })).toEqual(
        await call("get_lesson", { lessonId: first.id }),
      );
      expect(await call("mark_lesson_read", { id: first.id })).toMatchObject({
        lessonId: first.id,
      });
      expect(await call("list_topics")).toMatchObject([{ id, lessonCount: 2 }]);
    });

    test("deleting a Track preserves shared and detached Topics, Lessons and GrillSessions", async () => {
      const { call } = await connect();
      const first = await call("create_track", { title: "First" });
      const second = await call("create_track", { title: "Second" });
      const ids = await call("upsert_topics", {
        topics: [
          { slug: "shared", title: "Shared" },
          { slug: "solo", title: "Solo" },
        ],
      });
      await call("attach_topics_to_track", { trackId: first.id, slugs: ["shared", "solo"] });
      await call("attach_topics_to_track", { trackId: second.id, slugs: ["shared"] });
      await call("add_edges", { edges: [{ from: "solo", to: "shared" }] });
      const lesson = await call("create_lesson", { topic: "shared", title: "Read me", blocks: [] });
      await call("mark_lesson_read", { lessonId: lesson.id });
      const { session } = await call("start_grill", { trackId: first.id, title: "Recall" });
      expect(await call("delete_track", { slug: first.slug })).toEqual({ id: first.id });
      expect(await call("get_track", { id: first.id }, true)).toEqual({ error: "Not found" });
      expect(await call("get_grill", { sessionId: session.id })).toMatchObject({ trackId: null });
      expect(await call("get_track_graph", { trackId: second.id })).toMatchObject({
        topics: [{ id: ids.shared, lessonCount: 1, readCount: 1 }],
      });
      expect(await call("get_topic", { slug: "solo" })).toMatchObject({
        dependents: [{ id: ids.shared }],
      });
      expect(await call("delete_track", { id: second.id })).toEqual({ id: second.id });
      expect(await call("delete_track", { id: second.id }, true)).toEqual({ error: "Not found" });
    });

    test("deleting a Topic removes its memberships, edges, Lessons, practice and progress", async () => {
      const { call, user } = await connect();
      const ids = await call("upsert_topics", {
        topics: ["before", "middle", "after"].map((slug) => ({ slug, title: slug })),
      });
      const tracks = [];
      for (const title of ["First", "Second"]) {
        const track = await call("create_track", { title });
        tracks.push(track.id);
        await call("attach_topics_to_track", {
          trackId: track.id,
          slugs: ["before", "middle", "after"],
        });
      }
      await call("add_edges", {
        edges: [
          { from: "before", to: "middle" },
          { from: "middle", to: "after" },
        ],
      });
      const lesson = await call("create_lesson", {
        topic: "middle",
        title: "Recall",
        blocks: [
          {
            id: "q",
            type: "quiz",
            questions: [{ prompt: "Pick one", options: ["A", "B"], correctIndex: 0 }],
          },
        ],
      });
      await call("mark_lesson_read", { lessonId: lesson.id });
      await call("record_quiz_result", { lessonId: lesson.id, blockId: "q", answers: [0] });
      await call("record_review_result", { topic: "middle", verdict: "weak" });
      const { session } = await call("start_grill", { title: "Recall" });
      await call("add_grill_questions", {
        sessionId: session.id,
        questions: [
          { prompt: "Recall middle", topic: "middle" },
          { prompt: "Recall after", topic: "after" },
        ],
      });
      async function storedProgress() {
        const result = await environment().db.$client.query(
          `select
            (select count(*)::int from lesson_progress where user_id=$1 and lesson_id=$2) as reads,
            (select count(*)::int from review_items where user_id=$1 and topic_id=$3) as reviews,
            (select count(*)::int from topic_mastery where user_id=$1 and topic_id=$3) as mastery`,
          [user.id, lesson.id, ids.middle],
        );
        return result.rows[0];
      }
      expect(await storedProgress()).toEqual({ reads: 1, reviews: 1, mastery: 1 });
      expect(await call("delete_topic", { slug: "middle" })).toEqual({ id: ids.middle });
      expect(await storedProgress()).toEqual({ reads: 0, reviews: 0, mastery: 0 });
      for (const trackId of tracks) {
        expect(await call("get_track_graph", { trackId })).toMatchObject({
          topics: [{ id: ids.before }, { id: ids.after }],
          edges: [],
        });
      }
      expect(await call("get_lesson", { lessonId: lesson.id }, true)).toEqual({
        error: "Not found",
      });
      expect(await call("get_grill", { sessionId: session.id })).toMatchObject({
        questions: [{ topicId: ids.after }],
      });
      expect(await call("get_progress")).toMatchObject({
        recentQuizAttempts: [],
        masteryDistribution: [2, 0, 0, 0, 0],
      });
      expect(await call("delete_topic", { id: ids.middle }, true)).toEqual({ error: "Not found" });
      expect(await call("delete_topic", { id: ids.before })).toEqual({ id: ids.before });
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
        for (const missingSlugs of [[slug], [slug, "another"]]) {
          expect(
            await a.call(
              "add_edges",
              {
                edges: [
                  { from: "shared", to: "other" },
                  ...missingSlugs.map((to) => ({ from: "shared", to })),
                ],
              },
              true,
            ),
          ).toEqual({ error: "Missing Topic slugs: " + missingSlugs.join(", ") });
        }
        const cases: [string, Record<string, unknown>][] = [
          ["get_track", { slug: foreign ? track.slug : "absent" }],
          ["get_guide", { track: trackId }],
          ["get_guide", { track: foreign ? track.slug : "absent" }],
          ["delete_track", { id: trackId }],
          ["delete_track", { slug: foreign ? track.slug : "absent" }],
          ["delete_topic", { id: topic }],
          ["delete_topic", { slug }],
          ["update_topic", { id: topic, title: "X" }],
          ["update_topic", { slug, summary: null }],
          ["update_track", { slug: foreign ? track.slug : "absent", title: "X" }],
          ["get_topic", { id: topic }],
          ["get_topic", { slug }],
          ["remove_edge", { from: "shared", to: slug }],
          ["attach_topics_to_track", { trackId, slugs: ["shared"] }],
          ["attach_topics_to_track", { trackId: mine.id, slugs: ["shared", slug] }],
          ["detach_topic_from_track", { trackId, slug: "shared" }],
          ["detach_topic_from_track", { trackId: mine.id, slug }],
          ["get_track_graph", { trackId }],
          ["get_track_graph", { track: trackId }],
          ["get_track_graph", { track: foreign ? track.slug : "absent" }],
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
          ["update_grill", { sessionId, title: "Foreign rename" }],
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
      const sameSlug = await a.call("create_track", { title: track.title });
      expect(sameSlug.slug).toBe(track.slug);
      expect(await a.call("delete_track", { slug: track.slug })).toEqual({ id: sameSlug.id });
      expect(await a.call("delete_topic", { slug: "shared" })).toEqual({ id: shared });
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
        ["start_grill", { title: "   " }],
        ["update_grill", { sessionId: id, title: "   " }],
        ["update_grill", { sessionId: id, title: "Title", ownerId: id }],
        ["judge_grill_answer", { questionId: id, verdict: "excellent" }],
        ["record_review_result", { topic: "sql", verdict: "wrong" }],
        ["set_mastery", { topic: "sql", level: 5 }],
        ["update_profile", { yearsOfExperience: 61 }],
        ["get_track_graph", {}],
        ["get_track_graph", { trackId: id, track: "ambiguous" }],
        ["get_track", {}],
        ["get_track", { id, slug: "ambiguous" }],
        ["get_topic", {}],
        ["get_topic", { id, slug: "sql" }],
        ["delete_track", {}],
        ["delete_topic", { id, slug: "sql" }],
        ["delete_topic", { id, ownerId: id }],
        ["update_topic", { title: "X" }],
        ["get_lesson", {}],
        ["update_lesson", { id, lessonId: randomUUID(), title: "X" }],
        ["mark_lesson_read", {}],
        ["list_lessons", { id, topic: "sql" }],
        ["create_lesson", { id: "sql", title: "X", blocks: [] }],
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
