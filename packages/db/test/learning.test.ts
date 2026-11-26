import { randomInt, randomUUID } from "node:crypto";
import { LEGAL_TERMS_VERSION, type LessonBlocks, type ProfileQuestionnaire } from "@startodel/core";
import { inArray } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, test } from "vite-plus/test";
import { createDatabase, forUser, signInWithGitHub } from "@startodel/db";
import { users } from "@startodel/db/schema";

const url = process.env.DATABASE_URL_TEST;
describe.skipIf(!url)("two independent Topic Catalogs", () => {
  let db: ReturnType<typeof createDatabase>;
  let alice: ReturnType<typeof forUser>;
  let bob: typeof alice;
  let owners: string[];
  beforeEach(async () => {
    db = createDatabase(url!);
    const identity = {
      githubId: BigInt(-randomInt(1, 2 ** 46)) * 2n,
      login: "a",
      name: null,
      avatarUrl: null,
    };
    const a = await signInWithGitHub(db, identity);
    const b = await signInWithGitHub(db, {
      ...identity,
      githubId: identity.githubId - 1n,
      login: "b",
    });
    owners = [a.id, b.id];
    alice = forUser(db, a.id);
    bob = forUser(db, b.id);
  });
  afterEach(async () => {
    try {
      await db.delete(users).where(inArray(users.id, owners));
    } finally {
      await db.$client.end();
    }
  });

  test("Track Slugs transliterate titles and allocate collision suffixes within each Owner", async () => {
    for (const [title, slug] of [
      ["Основы сетей", "osnovy-setey"],
      ["Основы сетей", "osnovy-setey-2"],
      ["Osnovy SETEY", "osnovy-setey-3"],
      ["а".repeat(121), "a".repeat(120)],
      ["а".repeat(121), "a".repeat(118) + "-2"],
    ] as const) {
      expect((await alice.createTrack(title)).slug).toBe(slug);
    }
    expect((await bob.createTrack("Основы сетей")).slug).toBe("osnovy-setey");
  });

  test("new Track Slugs avoid UUIDs and reserved route segments", async () => {
    const track = await alice.createTrack("Custom slug");
    for (const reserved of ["new", "edit", "fork", randomUUID()]) {
      expect((await alice.createTrack(reserved)).slug).toBe(reserved + "-2");
      await expect(alice.updateTrack(track.id, { slug: reserved })).rejects.toThrow();
    }
  });

  test("Terms Acceptance belongs to the Owner and is required for each new terms version", async () => {
    const track = await alice.createTrack("Visibility");
    expect(await bob.setTrackVisibility(track.id, true, true)).toBeUndefined();
    await expect(alice.setTrackVisibility(track.id, true)).rejects.toThrow("Publishing rules");
    expect(await alice.setTrackVisibility(track.id, true, true)).toMatchObject({ public: true });
    expect(await alice.termsAcceptance()).toEqual({
      version: LEGAL_TERMS_VERSION,
      at: expect.any(Date),
    });
    await db.$client.query("update users set accepted_terms_version='older' where id=$1", [
      owners[0],
    ]);
    expect(await alice.setTrackVisibility(track.id, false)).toMatchObject({ public: false });
    await expect(alice.setTrackVisibility(track.id, true)).rejects.toThrow("Publishing rules");
    expect(await alice.getTrack(track.id)).toMatchObject({ public: false });
    expect(await alice.setTrackVisibility(track.id, true, true)).toMatchObject({ public: true });
    expect(await alice.termsAcceptance()).toMatchObject({ version: LEGAL_TERMS_VERSION });
    expect(await bob.termsAcceptance()).toEqual({ version: null, at: null });
  });

  test("concurrent Forks preserve an existing empty Topic and copy its Lessons only once", async () => {
    const login = randomUUID();
    await db.$client.query("update users set login=$1 where id=$2", [login, owners[0]]);
    const track = await alice.createTrack("Runtime");
    const topic = await alice.upsertTopic({ slug: "runtime", title: "Source topic" });
    await alice.attachTopicToTrack(track.id, topic.id, 3);
    await alice.createLesson({ topicId: topic.id, title: "Study", position: 7 });
    await alice.setTrackVisibility(track.id, true, true);
    const existing = await bob.upsertTopic({ slug: "runtime", title: "My topic" });
    const forks = await Promise.all([
      bob.forkTrack(login, track.slug),
      bob.forkTrack(login, track.slug),
    ]);
    expect(new Set(forks.map((fork) => fork?.slug))).toEqual(new Set(["runtime", "runtime-2"]));
    expect(await bob.getTopicBySlug("runtime")).toEqual(existing);
    expect(await bob.listLessonsForTopic(existing.id)).toMatchObject([
      { title: "Study", position: 7 },
    ]);
    for (const fork of forks)
      expect((await bob.getTrackGraph(fork!.id))?.topics).toMatchObject([
        { id: existing.id, position: 3 },
      ]);
  });

  test("Topic Slugs deduplicate for one Owner and resolve independently for another", async () => {
    const input = { slug: "react/state", title: "State", summary: "State updates" };
    const a = await alice.upsertTopic(input);
    expect(
      await alice.upsertTopic({ ...input, title: "Render state", summary: null }),
    ).toMatchObject({ id: a.id, title: "Render state", summary: null });
    expect(await bob.getTopicBySlug(input.slug)).toBeUndefined();
    const b = await bob.upsertTopic(input);
    expect(b.id).not.toBe(a.id);
    expect(await alice.getTopic(b.id)).toBeUndefined();
    expect(await alice.getTopicBySlug(input.slug)).toMatchObject({ id: a.id });
    expect(await bob.listTopics()).toEqual([b]);
  });

  test("edges and graph membership require both endpoints and the Track to belong to the Owner", async () => {
    const a = await alice.upsertTopic({ slug: "a", title: "A" });
    const next = await alice.upsertTopic({ slug: "b", title: "B" });
    const foreign = await bob.upsertTopic({ slug: "private", title: "Private" });
    const track = await alice.createTrack({
      title: "A",
      description: "Graph",
      sources: { repo: "https://github.com/o/r" },
    });
    const other = await bob.createTrack("B");
    const edge = await alice.addEdge(a.slug, next.id);
    expect(await alice.addEdge(a.id, a.slug)).toBeUndefined();
    expect(await alice.addEdge(a.id, foreign.id)).toBeUndefined();
    expect(await bob.addEdge(foreign.slug, next.id)).toBeUndefined();
    expect(await bob.listEdges()).toEqual([]);
    expect(await bob.removeEdge(a.id, next.id)).toBeUndefined();
    expect(await alice.listEdges([a.id, next.id])).toEqual([edge]);
    expect(await alice.listEdges([a.id])).toEqual([]);
    await alice.attachTopicToTrack(track.id, a.id, 0);
    await bob.attachTopicToTrack(other.id, foreign.id, 0);
    expect(await alice.attachTopicToTrack(track.id, foreign.id, 1)).toBeUndefined();
    expect(await alice.attachTopicToTrack(other.id, a.id, 1)).toBeUndefined();
    expect(await alice.attachTopicToTrack(other.id, foreign.id, 5)).toBeUndefined();
    expect(await alice.detachTopicFromTrack(other.id, foreign.id)).toBeUndefined();
    expect(await alice.getTrackGraph(other.id)).toBeUndefined();
    expect(await alice.getTrackGraph(track.id)).toMatchObject({
      topics: [{ id: a.id, level: 0, lessonCount: 0 }],
      edges: [],
    });
    await alice.attachTopicToTrack(track.id, next.id, 1);
    expect(await alice.getTrackGraph(track.id)).toMatchObject({
      topics: [{ id: a.id }, { id: next.id }],
      edges: [edge],
    });
    expect(await bob.getTrackGraph(other.id)).toMatchObject({
      topics: [{ id: foreign.id, position: 0 }],
    });
    expect(await alice.removeEdge(a.id, next.slug)).toEqual(edge);
    expect(await alice.detachTopicFromTrack(track.id, next.id)).toMatchObject({ topicId: next.id });
    await expect(
      db.$client.query(
        "insert into topic_edges(user_id,from_topic_id,to_topic_id) values ($1,$2,$3)",
        [owners[0], a.id, foreign.id],
      ),
    ).rejects.toMatchObject({ code: "23503" });
  });

  test("questionnaire and Track updates preserve earlier fields and validate sources", async () => {
    const patch = {
      stack: ["Rust"],
      experience: "senior",
      yearsOfExperience: 9,
      goals: ["Learn"],
      notes: "Evenings",
      onboardedAt: new Date(),
    } satisfies ProfileQuestionnaire;
    const updated = await alice.updateProfile(patch);
    expect(updated).toMatchObject(patch);
    expect(await alice.updateProfile(["New goal"])).toMatchObject({
      ...patch,
      goals: ["New goal"],
    });
    expect(await bob.getProfile()).toMatchObject({ stack: [], onboardedAt: null });
    const track = await alice.createTrack("Test");
    await alice.updateTrack(track.id, {
      sources: { docs: ["https://example.org"] },
      description: "Read docs",
    });
    expect(await alice.updateTrack(track.id, "New")).toMatchObject({
      title: "New",
      sources: { docs: ["https://example.org"] },
      description: "Read docs",
    });
    await expect(
      alice.updateTrack(track.id, { sources: { repo: "http://example.org" } }),
    ).rejects.toThrow();
  });

  test("Lessons, read receipts and scored Quiz attempts are shared across the Owner's Tracks only", async () => {
    const topic = await alice.upsertTopic({ slug: "sql", title: "SQL" });
    const blocks: LessonBlocks = [
      { id: "intro", type: "theory", markdown: "A query reads rows." },
      {
        id: "check",
        type: "quiz",
        questions: [{ prompt: "Pick", options: ["one", "two"], correctIndex: 1 }],
      },
    ];
    const input = { topicId: topic.id, title: "Queries", position: 1, blocks };
    const lesson = (await alice.createLesson(input))!;
    expect(await bob.createLesson(input)).toBeUndefined();
    expect(await bob.getLesson(lesson.id)).toBeUndefined();
    expect(await bob.listLessonsForTopic(topic.id)).toBeUndefined();
    expect(await bob.updateLesson(lesson.id, { title: "changed" })).toBeUndefined();
    expect(await bob.markLessonRead(lesson.id)).toBeUndefined();
    expect(await bob.recordQuizAttempt(lesson.id, "check", [1], "mcp")).toBeUndefined();
    expect(await alice.listLessonsForTopic(topic.id)).toEqual([lesson]);
    expect(await alice.updateLesson(lesson.id, { summary: "Intro", position: 0 })).toMatchObject({
      summary: "Intro",
      blocks,
    });
    await expect(
      alice.updateLesson(lesson.id, { blocks: [...blocks, ...blocks] }),
    ).rejects.toThrow();
    await expect(
      alice.createLesson({ ...input, blocks: [...blocks, ...blocks] }),
    ).rejects.toThrow();
    const read = await alice.markLessonRead(lesson.id);
    expect(read).toMatchObject({ mastery: 1 });
    expect(await alice.markLessonRead(lesson.id)).toMatchObject({ id: read!.id });
    expect(await alice.recordQuizAttempt(lesson.id, "absent", [1], "ui")).toBeUndefined();
    expect(await alice.recordQuizAttempt(lesson.id, "intro", [0], "ui")).toBeUndefined();
    for (const answers of [[], [2], [-1], [0.5], [1, 1]])
      await expect(alice.recordQuizAttempt(lesson.id, "check", answers, "ui")).rejects.toThrow();
    expect(await alice.recordQuizAttempt(lesson.id, "check", [1], "mcp")).toMatchObject({
      correct: 1,
      total: 1,
      source: "mcp",
    });
    expect(await alice.recordQuizAttempt(lesson.id, "check", [0], "ui")).toMatchObject({
      correct: 0,
      total: 1,
      source: "ui",
    });
    for (const title of ["First", "Second"]) {
      const track = await alice.createTrack(title);
      await alice.attachTopicToTrack(track.id, topic.id, 0);
      await alice.setMastery(topic.id, 3, "Explained");
      expect(await alice.getTrackGraph(track.id)).toMatchObject({
        topics: [{ id: topic.id, lessonCount: 1, level: 3 }],
      });
    }
  });

  test("only complete Topic evidence auto-raises Mastery, using the latest attempt for each Lesson and Block", async () => {
    const topic = await alice.upsertTopic({ slug: "queues", title: "Queues" });
    const blocks: LessonBlocks = [
      {
        type: "quiz",
        id: "check",
        questions: [{ prompt: "First?", options: ["A", "B"], correctIndex: 0 }],
      },
    ];
    const first = (await alice.createLesson({ topicId: topic.id, title: "First", blocks }))!;
    const second = (await alice.createLesson({ topicId: topic.id, title: "Second", blocks }))!;
    const reads = await Promise.all([
      alice.markLessonRead(first.id),
      alice.markLessonRead(second.id),
    ]);
    expect(reads.map((r) => r?.mastery)).toEqual(expect.arrayContaining([0, 1]));
    const attempt = (id: string, answer: number) =>
      alice.recordQuizAttempt(id, "check", [answer], "ui");
    expect(await attempt(first.id, 0)).toMatchObject({ mastery: 1 });
    await attempt(first.id, 1);
    expect(await attempt(second.id, 0)).toMatchObject({ mastery: 1 });
    expect(await attempt(first.id, 0)).toMatchObject({ mastery: 2 });
    expect(await attempt(first.id, 1)).toMatchObject({ mastery: 2 });
    for (const level of [3, 4] as const) {
      await alice.setMastery(topic.id, level, "Explained");
      expect(await alice.markLessonRead(first.id)).toMatchObject({ mastery: level });
      expect(await attempt(first.id, 0)).toMatchObject({ mastery: level });
      expect(await alice.getMastery(topic.id)).toMatchObject({ level, evidence: "Explained" });
    }
  });

  test("Mastery and review scheduling isolate foreign Topics and serialize concurrent results", async () => {
    const topic = await bob.upsertTopic({ slug: "rust", title: "Rust" });
    expect(await bob.setMastery(topic.id, 2, "Applied")).toMatchObject({
      level: 2,
      evidence: "Applied",
    });
    for (const id of [topic.id, randomUUID()]) {
      expect(await alice.setMastery(id, 4)).toBeUndefined();
      expect(await alice.getMastery(id)).toBeUndefined();
      expect(await alice.recordReviewResult(id, "weak")).toBeUndefined();
    }
    expect(await bob.getMastery(topic.id)).toMatchObject({ level: 2 });
    await Promise.all([
      bob.recordReviewResult(topic.id, "strong"),
      bob.recordReviewResult(topic.id, "strong"),
    ]);
    const future = new Date("2200-01-01");
    expect(await alice.listDueReviews(future, 10)).toEqual([]);
    expect(await bob.listDueReviews(new Date(), 10)).toEqual([]);
    expect(await bob.listDueReviews(future, 10)).toMatchObject([{ topicId: topic.id, box: 2 }]);
  });

  test("only the Owner can add, answer, judge and finish Grill Questions and sessions", async () => {
    const topic = await bob.upsertTopic({ slug: "sql", title: "SQL" });
    const track = await bob.createTrack("Storage");
    expect(await alice.startGrill({ trackId: track.id, title: "Foreign" })).toBeUndefined();
    const session = (await bob.startGrill({ trackId: track.id, title: "SQL" }))!;
    const other = (await alice.startGrill({ title: "Unscoped", targetSize: 2 }))!;
    expect(session).toMatchObject({ targetSize: 15, status: "open" });
    expect(
      await alice.addGrillQuestion(other.id, { topicId: topic.id, prompt: "Foreign" }),
    ).toBeUndefined();
    for (const id of [session.id, randomUUID()]) {
      expect(await alice.addGrillQuestion(id, { prompt: "Foreign" })).toBeUndefined();
      expect(await alice.getGrill(id)).toBeUndefined();
      expect(await alice.finishGrill(id)).toBeUndefined();
    }
    expect(await alice.listGrills()).toEqual([other]);
    const questions = await Promise.all(
      ["Locks?", "Indexes?"].map((prompt) =>
        bob.addGrillQuestion(session.id, { topicId: topic.id, prompt }),
      ),
    );
    const [q1, q2] = questions.map((q) => q!);
    expect((await bob.getGrill(session.id))?.questions.map((q) => q.position)).toEqual([0, 1]);
    for (const id of [q1.id, randomUUID()]) {
      expect(await alice.answerGrillQuestion(id, "Foreign", "ui")).toBeUndefined();
    }
    expect(await bob.answerGrillQuestion(q1.id, "Row lock", "ui")).toMatchObject({
      answerSource: "ui",
      answeredAt: expect.any(Date),
    });
    for (const id of [q1.id, randomUUID()])
      expect(await alice.judgeGrillQuestion(id, "strong")).toBeUndefined();
    expect(await bob.judgeGrillQuestion(q1.id, "weak", "Practice locks")).toMatchObject({
      verdict: "weak",
      judgedAt: expect.any(Date),
    });
    const [review] = await bob.listDueReviews(new Date("2200-01-01"), 10);
    await bob.answerGrillQuestion(q2.id, "B-tree", "mcp");
    await bob.judgeGrillQuestion(q2.id, "partial", "Practice indexes");
    expect(await bob.listDueReviews(new Date("2200-01-01"), 10)).toMatchObject([
      { id: review.id, box: 0, lastResult: "partial", reason: "Practice indexes" },
    ]);
    const unjudged = (await bob.addGrillQuestion(session.id, { prompt: "What else?" }))!;
    await bob.answerGrillQuestion(unjudged.id, "Read replica", "ui");
    expect(await bob.finishGrill(session.id)).toMatchObject({
      status: "finished",
      finishedAt: expect.any(Date),
    });
    expect(await bob.addGrillQuestion(session.id, { prompt: "Late" })).toBeUndefined();
    expect(await bob.answerGrillQuestion(q2.id, "Changed", "ui")).toBeUndefined();
    expect(await bob.judgeGrillQuestion(unjudged.id, "strong")).toMatchObject({
      verdict: "strong",
    });
    expect(await bob.getGrill(session.id)).toMatchObject({
      status: "finished",
      questions: expect.arrayContaining([
        expect.objectContaining({ id: q2.id, answerSource: "mcp", feedback: "Practice indexes" }),
      ]),
    });
  });

  test("deleting a Track keeps the Owner's GrillSession and Topic Catalog", async () => {
    const track = await alice.createTrack("Temporary");
    const topic = await alice.upsertTopic({ slug: "sql", title: "SQL" });
    await alice.attachTopicToTrack(track.id, topic.id, 1);
    const grill = (await alice.startGrill({ trackId: track.id, title: "SQL" }))!;
    await alice.addGrillQuestion(grill.id, { prompt: "What is a join?", topicId: topic.id });
    expect(await bob.deleteTrack(track.id)).toBeUndefined();
    expect(await alice.getGrill(grill.id)).toMatchObject({ trackId: track.id });
    await alice.deleteTrack(track.id);
    expect(await alice.getGrill(grill.id)).toMatchObject({
      trackId: null,
      questions: [{ topicId: topic.id }],
    });
    expect(await alice.getTopic(topic.id)).toEqual(topic);
  });

  test("candidates put overdue Topics first, then sort by Mastery within the requested Track", async () => {
    const track = await alice.createTrack("Catalog");
    const members = await Promise.all(
      ["a", "b", "c", "d", "outside"].map((slug) => alice.upsertTopic({ slug, title: slug })),
    );
    const [a, b, c, d, outside] = members;
    for (const [i, t] of members.slice(0, 4).entries())
      await alice.attachTopicToTrack(track.id, t.id, i);
    await alice.setMastery(a.id, 4);
    await alice.setMastery(b.id, 2);
    await alice.setMastery(c.id, 3);
    for (const t of [a, b, outside]) await alice.recordReviewResult(t.id, "weak");
    await db.$client.query(
      "update review_items set due_at = case when topic_id = $2 then '2020-01-01'::timestamptz else '2021-01-01'::timestamptz end where user_id = $1",
      [owners[0], b.id],
    );
    expect((await alice.listDueReviews(new Date(), 1)).map((r) => r.topicId)).toEqual([b.id]);
    expect(
      (await alice.grillCandidates({ trackId: track.id, limit: 6 }))?.map((t) => t.topicId),
    ).toEqual([b.id, a.id, d.id, c.id]);
    expect((await alice.grillCandidates({ limit: 2 }))?.[0].topicId).toBe(b.id);
    expect(await bob.grillCandidates({ limit: 10 })).toEqual([]);
    expect(await bob.grillCandidates({ trackId: track.id, limit: 10 })).toBeUndefined();
  });
});
