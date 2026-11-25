import { LEGAL_TERMS_VERSION } from "@startodel/core";
import { forUser, type Database } from "@startodel/db";
import { expect, onTestFinished, test } from "vite-plus/test";

export function publicHttpTests(
  env: () => { db: Database; origin: string },
  request: (path: string, cookie?: string, method?: string, body?: unknown) => Promise<Response>,
  signIn: (name: string) => Promise<string>,
) {
  async function curriculum() {
    const { db, origin } = env();
    const a = await signIn("publisher"),
      b = await signIn("forker");
    const identity = async (cookie: string) =>
      (await (await request("/api/me", cookie)).json()).user;
    const author = await identity(a),
      reader = await identity(b);
    onTestFinished(async () => {
      await db.$client.query("delete from users where id = any($1::uuid[])", [
        [author.id, reader.id],
      ]);
    });
    const owner = forUser(db, author.id),
      recipient = forUser(db, reader.id);
    const track = await owner.createTrack({
      title: "Public curriculum",
      sources: { docs: ["https://example.org/docs"] },
    });
    const hidden = await owner.createTrack("Hidden-track-sentinel");
    const topic = await owner.upsertTopic({ slug: "public-topic", title: "Public topic" });
    const kept = await owner.upsertTopic({ slug: "reuse", title: "Source topic" });
    const unrelated = await owner.upsertTopic({
      slug: "unrelated",
      title: "Hidden-topic-sentinel",
    });
    await owner.attachTopics(track.id, [topic.slug, kept.slug]);
    await owner.attachTopics(hidden.id, [topic.slug, unrelated.slug]);
    await owner.addEdges([
      { from: topic.slug, to: kept.slug },
      { from: topic.slug, to: unrelated.slug },
    ]);
    const lesson = (await owner.createLesson({
      topicId: topic.id,
      title: "Published lesson",
      blocks: [
        {
          type: "quiz",
          id: "q",
          questions: [
            {
              prompt: "Pick one",
              options: ["First", "Second"],
              correctIndex: 1,
              explanation: "Hidden-explanation-sentinel",
            },
          ],
        },
        {
          type: "exercise",
          id: "e",
          prompt: "Implement it",
          solution: "Hidden-solution-sentinel",
          hints: ["Start small"],
        },
      ],
    }))!;
    await owner.createLesson({ topicId: kept.id, title: "Source lesson" });
    const privateLesson = (await owner.createLesson({
      topicId: unrelated.id,
      title: "Hidden-lesson-sentinel",
    }))!;
    const path = "/publisher/" + track.slug,
      api = "/api/public" + path,
      page = "/u" + path;
    const visibility = "/api/tracks/" + track.id + "/visibility";
    const fork = (cookie: string, slug = track.slug) =>
      request("/api/tracks/fork", cookie, "POST", { login: "publisher", slug });
    return {
      db,
      origin,
      a,
      b,
      author,
      reader,
      owner,
      recipient,
      track,
      hidden,
      topic,
      kept,
      lesson,
      privateLesson,
      path,
      api,
      page,
      visibility,
      fork,
    };
  }
  test("publishing checks Session ownership and records current Terms Acceptance", async () => {
    const { a, b, owner, api, visibility, fork } = await curriculum();
    expect((await fork("")).status).toBe(401);
    expect((await request(visibility, "", "PATCH", { public: true })).status).toBe(401);
    expect(
      (await request(visibility, b, "PATCH", { public: true, acceptTerms: true })).status,
    ).toBe(404);
    expect((await request(visibility, a, "PATCH", { public: true })).status).toBe(409);
    expect(await owner.termsAcceptance()).toEqual({ version: null, at: null });
    expect((await fork(b)).status).toBe(404);
    expect((await request("/u/unknown-user")).status).toBe(404);
    expect((await request("/u/publisher")).status).toBe(200);
    expect(await (await request("/api/public/publisher")).json()).toMatchObject({ tracks: [] });
    expect(
      (await request(visibility, a, "PATCH", { public: true, acceptTerms: true })).status,
    ).toBe(200);
    expect(await owner.termsAcceptance()).toEqual({
      version: LEGAL_TERMS_VERSION,
      at: expect.any(Date),
    });
    expect((await fork(a)).status).toBe(400);
    expect((await request(api, "", "POST", {})).status).toBe(401);
  });
  test("public JSON and SSR project published content without private learning or identity data", async () => {
    const {
      db,
      origin,
      a,
      b,
      owner,
      author,
      reader,
      track,
      topic,
      hidden,
      privateLesson,
      lesson,
      path,
      api,
    } = await curriculum();
    await owner.markLessonRead(lesson.id);
    await db.$client.query(
      "update lesson_progress set read_at='2002-03-04' where user_id=$1 and lesson_id=$2",
      [author.id, lesson.id],
    );
    await owner.recordQuizAttempt(lesson.id, "q", [0], "ui");
    await owner.setMastery(topic.id, 4, "Hidden-mastery-sentinel");
    const grill = (await owner.startGrill({ title: "Hidden-grill-sentinel", trackId: track.id }))!;
    const question = (await owner.addGrillQuestion(grill.id, {
      topicId: topic.id,
      prompt: "Hidden-prompt-sentinel",
    }))!;
    await owner.answerGrillQuestion(question.id, "Hidden-answer-sentinel", "mcp");
    await owner.judgeGrillQuestion(question.id, "weak", "Hidden-feedback-sentinel");
    await owner.recordReviewResult(topic.id, "weak", "Hidden-review-sentinel");
    await db.$client.query(
      "update review_items set due_at='2003-04-05' where user_id=$1 and topic_id=$2",
      [author.id, topic.id],
    );
    await owner.updateProfile({
      stack: ["Hidden-stack-sentinel"],
      goals: ["Hidden-goal-sentinel"],
      notes: "Hidden-notes-sentinel",
      experience: "senior",
      onboardedAt: new Date("2001-02-03T04:05:06Z"),
    });
    const token = await owner.mcpTokens.create("Hidden-token-sentinel");
    const {
      rows: [account],
    } = await db.$client.query("select github_id from users where id=$1", [author.id]);
    await owner.setTrackVisibility(track.id, true, true);
    for (const suffix of [
      "/publisher",
      "/publisher/" + track.slug,
      path + "/lessons/" + lesson.id,
    ]) {
      const apiResponse = await request("/api/public" + suffix);
      expect(apiResponse.status).toBe(200);
      expect(apiResponse.headers.get("cache-control")).toContain("no-store");
      const data = await apiResponse.json();
      expect(await (await request("/api/public" + suffix, b)).json()).toEqual(data);
      const json = JSON.stringify(data);
      expect(json).not.toMatch(
        /"(?:userId|githubId|mastery|level|evidence|readAt|answers|verdict|feedback|dueAt|reason|experience|stack|goals|onboardedAt|correctIndex|explanation|solution|acceptedTermsVersion)"\s*:/,
      );
      for (const cookie of ["", a, b]) {
        const response = await fetch(origin + "/u" + suffix, { headers: { cookie } });
        expect(response.status).toBe(200);
        expect(response.headers.get("cache-control")).toContain("no-store");
        const html = await response.text();
        for (const value of [
          "Hidden-",
          author.id,
          reader.id,
          token.prefix,
          account.github_id,
          "2001-02-03",
          "2002-03-04",
          "2003-04-05",
          grill.id,
          question.id,
          token.id,
          privateLesson.id,
          '"mastery"',
          '"answers"',
          '"verdict"',
          '"feedback"',
          '"readAt"',
          '"stack"',
          '"goals"',
          '"experience"',
          '"onboardedAt"',
          '"githubId"',
          '"userId"',
          "senior",
          "correctIndex",
          '"solution"',
          '"explanation"',
        ]) {
          expect((html + json).includes(value), "private value in " + suffix).toBe(false);
        }
        expect(html).toContain('rel="canonical"');
        expect(html).toContain("https://startodel.example/u" + suffix);
        expect(html).toContain('name="description"');
        for (const key of ["title", "description", "url", "type"])
          expect(html).toContain('property="og:' + key + '"');
        if (suffix.includes("/lessons/")) {
          expect(html).toContain("Fork this track to practice");
          expect(html).not.toContain("Show solution");
        }
      }
    }
    const graph = await (await request(api)).json();
    expect(Object.keys(graph).sort()).toEqual([
      "author",
      "createdAt",
      "description",
      "edges",
      "forkCount",
      "forkedFrom",
      "forks",
      "slug",
      "sources",
      "title",
      "topics",
      "updatedAt",
    ]);
    expect(graph.edges).toEqual([{ from: "public-topic", to: "reuse" }]);
    expect(graph.author).toEqual({ login: "publisher", name: "publisher", avatarUrl: null });
    expect(graph.topics[0]).toEqual({
      slug: topic.slug,
      title: topic.title,
      summary: null,
      position: 0,
      lessons: [{ id: lesson.id, title: lesson.title, summary: null, position: 0 }],
    });
    expect((await (await request(api + "/lessons/" + lesson.id)).json()).blocks).toEqual([
      { type: "quiz", id: "q", questions: [{ prompt: "Pick one", options: ["First", "Second"] }] },
      { type: "exercise", id: "e", prompt: "Implement it", hints: ["Start small"] },
    ]);
    for (const prefix of ["/api/public", "/u"]) {
      expect((await request(prefix + path + "/lessons/" + privateLesson.id)).status).toBe(404);
      const missing = await request(prefix + "/publisher/missing"),
        inaccessible = await request(prefix + "/publisher/" + hidden.slug);
      expect(missing.status).toBe(404);
      expect(inaccessible.status).toBe(404);
      expect(await inaccessible.text()).toBe(await missing.text());
    }
  });
  test("Forks preserve source content, reuse owned Topics and list only Public Forks", async () => {
    const {
      db,
      owner,
      recipient,
      reader,
      a,
      b,
      track,
      kept,
      topic,
      lesson,
      fork,
      api,
      page,
      visibility,
    } = await curriculum();
    await owner.setTrackVisibility(track.id, true, true);
    const retained = await recipient.upsertTopic({ slug: kept.slug, title: "My retained topic" });
    const retainedLesson = await recipient.createLesson({
      topicId: retained.id,
      title: "My retained lesson",
    });
    await recipient.setMastery(retained.id, 3, "My assessment");
    const activity = async () =>
      await Promise.all(
        [
          "topic_mastery",
          "lesson_progress",
          "quiz_attempts",
          "grill_sessions",
          "grill_questions",
          "review_items",
        ].map(
          async (table) =>
            (
              await db.$client.query("select id from " + table + " where user_id=$1 order by id", [
                reader.id,
              ])
            ).rows,
        ),
      );
    const beforeActivity = await activity();
    const beforeSource = await owner.getTrackGraph(track.id);
    const result = await fork(b);
    expect(result.status).toBe(201);
    const copy = await result.json();
    expect(copy).toMatchObject({
      title: track.title,
      slug: track.slug,
      public: false,
      forkedFromTrackId: track.id,
      forkedFromLogin: "publisher",
    });
    expect((await request("/api/tracks/" + copy.id, a)).status).toBe(404);
    expect((await request("/tracks/" + copy.id, b)).status).toBe(200);
    expect((await recipient.getTrackGraph(copy.id))?.edges).toHaveLength(1);
    expect(await recipient.getTopicBySlug(kept.slug)).toEqual(retained);
    expect(await recipient.getMastery(retained.id)).toMatchObject({
      level: 3,
      evidence: "My assessment",
    });
    expect(await recipient.listLessonsForTopic(retained.id)).toEqual([retainedLesson]);
    const copiedTopic = (await recipient.getTopicBySlug(topic.slug))!;
    const [copiedLesson] = (await recipient.listLessonsForTopic(copiedTopic.id))!;
    expect(copiedLesson!.blocks).toEqual(lesson.blocks);
    expect(copiedLesson!.id).not.toBe(lesson.id);
    expect(await activity()).toEqual(beforeActivity);
    expect(await recipient.recordQuizAttempt(copiedLesson!.id, "q", [1], "ui")).toMatchObject({
      correct: 1,
    });
    expect(await owner.getLesson(lesson.id)).toEqual(lesson);
    expect(await owner.getTrackGraph(track.id)).toEqual({
      ...beforeSource,
      track: { ...beforeSource!.track, forkCount: 1 },
    });
    expect(await (await request(api)).json()).toMatchObject({ forkCount: 1, forks: [] });
    const second = await (await fork(b)).json();
    expect(second.slug).toBe(track.slug + "-2");
    expect((await recipient.listLessonsForTopic(copiedTopic.id))?.length).toBe(1);
    await recipient.setTrackVisibility(copy.id, true, true);
    expect((await (await request(api)).json()).forks).toEqual([
      { login: "forker", slug: copy.slug, title: copy.title, createdAt: copy.createdAt },
    ]);
    expect((await (await request("/api/public/forker/" + copy.slug)).json()).forkedFrom).toEqual({
      login: "publisher",
      slug: track.slug,
      source: { login: "publisher", slug: track.slug },
    });
    await recipient.setTrackVisibility(copy.id, false);
    expect(await (await request(api)).json()).toMatchObject({ forkCount: 2, forks: [] });
    const sitemap = () => request("/sitemap.xml").then((r) => r.text());
    expect(await sitemap()).toContain("https://startodel.example" + page);
    expect((await request(visibility, a, "PATCH", { public: false })).status).toBe(200);
    for (const p of [api, page, api + "/lessons/" + lesson.id, page + "/lessons/" + lesson.id])
      expect((await request(p)).status).toBe(404);
    expect(await sitemap()).not.toContain("/u/publisher");
    expect((await recipient.getTrackGraph(copy.id))?.track.forkedFrom).toEqual({
      login: "publisher",
      slug: track.slug,
      source: null,
    });
    await owner.deleteTrack(track.id);
    expect(await recipient.getTrack(copy.id)).toMatchObject({
      forkedFromTrackId: null,
      forkedFromLogin: "publisher",
      forkedFromSlug: track.slug,
    });
  });
  test("legal pages negotiate both languages and discovery includes public routes", async () => {
    const { origin } = env();
    for (const name of ["terms", "rules"]) {
      for (const lang of ["en", "ru"]) {
        for (const query of ["", "?lang=" + lang]) {
          const res = await fetch(origin + "/" + name + query, {
            headers: { "accept-language": query ? "de,en;q=1" : lang + ";q=1" },
          });
          expect(res.status).toBe(200);
          const html = await res.text();
          const title =
            name === "terms"
              ? lang === "en"
                ? "Terms of Use"
                : "Условия использования"
              : lang === "en"
                ? "Publishing rules"
                : "Правила публикации";
          expect(html).toContain("<title>" + title + " · Startodel</title>");
          expect(html).toContain('name="description"');
          expect(html).toContain('lang="' + lang + '"');
          expect(html).toContain('href="/terms"');
          expect(html).toContain('href="/rules"');
          expect(html).not.toContain("PENDING LEGAL REVIEW");
        }
      }
    }
    const robots = await (await request("/robots.txt")).text(),
      sitemap = await (await request("/sitemap.xml")).text();
    for (const path of ["/u/", "/rules", "/terms"]) expect(robots).toContain("Allow: " + path);
    for (const path of [
      "/api/",
      "/settings",
      "/onboarding",
      "/grills",
      "/reviews",
      "/progress",
      "/tracks/",
      "/lessons/",
      "/topics/",
    ])
      expect(robots).toContain("Disallow: " + path);
    expect(robots).toContain("Sitemap: https://startodel.example/sitemap.xml");
    for (const path of ["/rules", "/terms"])
      expect(sitemap).toContain("<loc>https://startodel.example" + path + "</loc>");
  });
}
