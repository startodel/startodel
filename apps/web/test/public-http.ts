import { readFile } from "node:fs/promises";
import { LEGAL_TERMS_VERSION } from "@startodel/core";
import { forUser, type Database } from "@startodel/db";
import { expect, onTestFinished, test } from "vite-plus/test";
import legal from "../app/utils/legal.generated.json";

const publicHtmlCache = "public, max-age=60, s-maxage=300, stale-while-revalidate=600";
const publicAssetCache = "public, max-age=300, stale-while-revalidate=3600";

function expectPublicHtml(response: Response) {
  expect(response.headers.get("cache-control")).toBe(publicHtmlCache);
  const vary = response.headers.get("vary")?.toLowerCase().split(/,\s*/);
  expect(vary).toEqual(expect.arrayContaining(["cookie", "accept-encoding"]));
  expect(response.headers.getSetCookie()).toEqual([]);
}

function expectSocialHead(html: string, path: string, lang: string, type = "website") {
  const origin = "https://startodel.example";
  const localized = (prefix: string) => origin + (prefix && path === "/" ? prefix : prefix + path);
  const image = origin + "/og" + (path.startsWith("/u/") ? path : "/site") + ".png?lang=" + lang;
  const tags = html.match(/<meta\b(?:[^">]|"[^"]*")*>/g) ?? [];
  const meta = (attr: "name" | "property", key: string) =>
    tags.find((tag) => tag.includes(attr + '="' + key + '"'))?.match(/ content="([^"]*)"/)?.[1];
  const title = meta("property", "og:title");
  const description = meta("name", "description");
  expect(title).toBeTruthy();
  expect(description).toBeTruthy();
  expect(meta("property", "og:type")).toBe(type);
  expect(meta("property", "og:locale")).toBe(lang === "en" ? "en_US" : "ru_RU");
  expect(meta("property", "og:description")).toBe(description);
  expect(meta("property", "og:site_name")).toBe(lang === "ru" ? "Стартодел" : "Startodel");
  expect(meta("property", "og:image")).toBe(image);
  expect(meta("property", "og:image:width")).toBe("1200");
  expect(meta("property", "og:image:height")).toBe("630");
  expect(meta("name", "twitter:card")).toBe("summary_large_image");
  expect(meta("name", "twitter:title")).toBe(title);
  expect(meta("name", "twitter:description")).toBe(description);
  expect(meta("name", "twitter:image")).toBe(image);
  const canonical = localized(lang === "ru" ? "/ru" : "");
  expect(meta("property", "og:url")).toBe(canonical);
  expect(html.match(/<link[^>]*rel="canonical"[^>]*>/)?.[0]).toContain('href="' + canonical + '"');
  for (const alternate of ["ru", "en", "x-default"]) {
    const tag = html.match(new RegExp('<link[^>]*hreflang="' + alternate + '"[^>]*>'))?.[0];
    expect(tag).toContain('href="' + localized(alternate === "ru" ? "/ru" : "") + '"');
  }
}

function expectIconLinks(html: string) {
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/)?.[1] ?? "";
  const links = head.match(/<link\b[^>]*>/g) ?? [];
  for (const attributes of [
    ['rel="icon"', 'href="/favicon.ico"', 'sizes="any"'],
    ['rel="icon"', 'href="/brand/favicon.svg"', 'type="image/svg+xml"'],
    ['rel="apple-touch-icon"', 'href="/brand/apple-touch-icon.png"'],
  ]) {
    const matching = links.filter((link) => attributes.every((attr) => link.includes(" " + attr)));
    expect(matching, attributes.join(" ")).toHaveLength(1);
  }
}

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
      title: "Урок по PostgreSQL & XML </script>",
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
  test("Open Graph images render only reachable public content", async () => {
    const { owner, track, lesson, hidden, privateLesson, page, b } = await curriculum();
    await owner.setTrackVisibility(track.id, true, true);
    for (const path of [
      "site",
      "u/publisher",
      page.slice(1),
      page.slice(1) + "/lessons/" + lesson.id,
    ]) {
      const url = "/og/" + path + ".png";
      for (const cookie of ["", b]) {
        const res = await request(url, cookie);
        expect(res.status, url).toBe(200);
        expect(res.headers.get("content-type")).toBe("image/png");
        expect(res.headers.get("cache-control")).toBe(publicAssetCache);
        expect((res.headers.get("vary") ?? "").toLowerCase()).not.toContain("cookie");
        const png = Buffer.from(await res.arrayBuffer());
        expect(png.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
        expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630]);
      }
    }
    const siteImage = async (lang: string) =>
      Buffer.from(await (await request("/og/site.png?lang=" + lang)).arrayBuffer());
    const english = await siteImage("en");
    expect((await siteImage("ru")).equals(english)).toBe(false);
    expect(Buffer.from(await (await request("/og/site.png")).arrayBuffer()).equals(english)).toBe(
      true,
    );
    for (const path of [
      "u/missing",
      "u/publisher/missing",
      "u/publisher/" + hidden.slug,
      page.slice(1) + "/lessons/" + privateLesson.id,
      page.slice(1) + "/lessons/" + crypto.randomUUID(),
      page.slice(1) + "/lessons/invalid",
    ]) {
      const res = await request("/og/" + path + ".png", b);
      expect(res.status, path).toBe(404);
      expect(res.headers.get("cache-control")).toBe(publicAssetCache);
      expect(await res.json()).toEqual({ message: "Not found" });
    }
  });
  test("the Landing has a localized title, site card and app icons", async () => {
    for (const lang of ["ru", "en"]) {
      const res = await request(lang === "ru" ? "/ru" : "/");
      expect(res.status).toBe(200);
      expectPublicHtml(res);
      const html = await res.text();
      expect(html).toMatch(new RegExp('<html[^>]* lang="' + lang + '"'));
      expect(html.match(/<title>([^<]*)<\/title>/)?.[1]).toMatch(
        lang === "ru" ? / · Стартодел$/ : / · Startodel$/,
      );
      expectSocialHead(html, "/", lang);
      expectIconLinks(html);
    }
  });
  test("the favicon is served in ICO and SVG formats", async () => {
    const ico = await request("/favicon.ico");
    expect(ico.status).toBe(200);
    expect(ico.headers.get("content-type")).toMatch(/^image\/(?:x-icon|vnd\.microsoft\.icon)\b/);
    const bytes = Buffer.from(await ico.arrayBuffer());
    expect(bytes.subarray(0, 4).toString("hex")).toBe("00000100");
    expect(bytes.length).toBeGreaterThan(22);

    const svg = await request("/brand/favicon.svg");
    expect(svg.status).toBe(200);
    expect(svg.headers.get("content-type")).toMatch(/^image\/svg\+xml\b/);
    expect(await svg.text()).toBe(
      await readFile(new URL("../public/brand/favicon.svg", import.meta.url), "utf8"),
    );
  });
  test("public HTML varies on Session cookie presence and public files are shared", async () => {
    const session = await signIn("alice");
    for (const prefix of ["", "/ru"]) {
      for (const path of ["", "/terms", "/rules", "/u/alice"]) {
        for (const cookie of ["", "startodel_language=ru"]) {
          const res = await request(prefix + path || "/", cookie);
          expect(res.status).toBe(!prefix && !path && cookie ? 302 : 200);
          expectPublicHtml(res);
        }
        for (const cookie of [session, "nuxt-auth-session=invalid", "nuxt-auth-session="]) {
          const res = await request(prefix + path, cookie);
          expect(res.headers.get("cache-control")).toBe("private, no-store");
          if (!path) expect(await res.text()).not.toContain("Alice");
        }
      }
    }
    for (const path of ["/robots.txt", "/sitemap.xml"]) {
      for (const cookie of ["", session]) {
        const res = await request(path, cookie);
        expect(res.headers.get("cache-control")).toBe(publicAssetCache);
        expect((res.headers.get("vary") ?? "").toLowerCase()).not.toContain("cookie");
      }
    }
  });
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
      expect(apiResponse.headers.get("cache-control")).toBe("private, no-store");
      const data = await apiResponse.json();
      const signedInApi = await request("/api/public" + suffix, b);
      expect(signedInApi.headers.get("cache-control")).toBe("private, no-store");
      expect(await signedInApi.json()).toEqual(data);
      const json = JSON.stringify(data);
      expect(json).not.toMatch(
        /"(?:userId|githubId|mastery|level|evidence|readAt|answers|verdict|feedback|dueAt|reason|experience|stack|goals|onboardedAt|correctIndex|explanation|solution|acceptedTermsVersion)"\s*:/,
      );
      for (const prefix of ["", "/ru"])
        for (const cookie of ["", a, b]) {
          const response = await fetch(origin + prefix + "/u" + suffix, { headers: { cookie } });
          expect(response.status).toBe(200);
          if (cookie) expect(response.headers.get("cache-control")).toBe("private, no-store");
          else expectPublicHtml(response);
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
          const type =
            suffix === "/publisher" ? "profile" : suffix === path ? "website" : "article";
          expectSocialHead(html, "/u" + suffix, prefix ? "ru" : "en", type);
          const schemaText = html.match(
            /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/,
          )?.[1];
          expect(schemaText).toBeTruthy();
          expect(schemaText).not.toContain("<");
          const schema = JSON.parse(schemaText!);
          const url = "https://startodel.example" + prefix + "/u" + suffix;
          expect(schema).toMatchObject({ "@context": "https://schema.org", url });
          if (suffix === "/publisher") {
            expect(schema).toMatchObject({
              "@type": "ProfilePage",
              mainEntity: { "@type": "Person", name: "publisher" },
            });
          } else if (suffix === path) {
            expect(schema).toMatchObject({
              "@type": "Course",
              name: track.title,
              author: { "@type": "Person", name: "publisher" },
            });
          } else {
            expect(schema).toMatchObject({
              "@type": "LearningResource",
              name: lesson.title,
              isPartOf: {
                "@type": "Course",
                url: "https://startodel.example" + prefix + "/u" + path,
              },
            });
          }
          const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1] ?? "";
          expect(html.match(/id="s-layer"/g)).toHaveLength(1);
          expect(html).toContain('class="s-site"');
          if (suffix === "/publisher") expect(main).toContain('class="s-trackcard"');
          expect(html).toMatch(new RegExp('<html[^>]* lang="' + (prefix ? "ru" : "en") + '"'));
          if (suffix === path) {
            expect(main).toMatch(/<h1\b[^>]*>Public curriculum<\/h1>/);
            expect(main).toContain("s-part is-outline");
            expect(main).not.toMatch(/s-part__mastery|s-part__lock/);
            expect(html).toContain('href="' + prefix + "/u" + path + "/lessons/" + lesson.id + '"');
            expect(html).toContain(
              "<title>Public curriculum · " +
                (prefix ? "Публичный трек · Стартодел" : "Public Track · Startodel") +
                "</title>",
            );
            expect(html).toContain(prefix ? "Граф тем" : "Track Graph");
          }
          if (suffix.includes("/lessons/")) {
            expect(main).toContain('class="s-block"');
            expect(main).toContain("Pick one");
            expect(main).toContain("Second");
            expect(main).toContain("Implement it");
            expect(main).not.toMatch(
              /s-quiz__feedback|s-exercise__solution|type="radio"|type="submit"/,
            );
            expect(html).toContain(
              prefix
                ? "Создайте форк трека, чтобы выполнить задания"
                : "Fork this track to practice",
            );
            expect(html).not.toContain(prefix ? "Показать решение" : "Show solution");
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
    for (const prefix of ["/api/public", "/u", "/ru/u"]) {
      expect((await request(prefix + path + "/lessons/" + privateLesson.id)).status).toBe(404);
      const missing = await request(prefix + "/publisher/missing"),
        inaccessible = await request(prefix + "/publisher/" + hidden.slug);
      expect(missing.status).toBe(404);
      expect(inaccessible.status).toBe(404);
      const body = await missing.text();
      expect(await inaccessible.text()).toBe(body);
      if (prefix !== "/api/public") {
        const english = prefix === "/u";
        const title = english ? "Page not found" : "Страница не найдена";
        const brand = english ? "Startodel" : "Стартодел";
        expect(body).toContain(`<h1>${title}</h1>`);
        expect(body).toContain(`<title>${title} · ${brand}</title>`);
        expect(body).toContain(`<a href="${english ? "/" : "/ru"}">${brand}</a>`);
        expectIconLinks(body);
      }
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
    expect((await request("/tracks/" + copy.slug, b)).status).toBe(200);
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
    for (const prefix of ["", "/ru"]) {
      expect(await sitemap()).toContain(
        "<loc>https://startodel.example" + prefix + page + "/lessons/" + lesson.id + "</loc>",
      );
    }
    expect((await request(visibility, a, "PATCH", { public: false })).status).toBe(200);
    for (const p of [api, page, api + "/lessons/" + lesson.id, page + "/lessons/" + lesson.id])
      expect((await request(p)).status).toBe(404);
    const afterUnpublishing = await sitemap();
    expect(afterUnpublishing).not.toContain(page);
    for (const prefix of ["", "/ru"]) {
      expect(afterUnpublishing).toContain(
        "<loc>https://startodel.example" + prefix + "/u/publisher</loc>",
      );
    }
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
  test("the first page contains four Public Forks and excludes private Forks from pagination", async () => {
    const { owner, recipient, track, fork, b, api, page } = await curriculum();
    await owner.setTrackVisibility(track.id, true, true);
    const html = () => request(page).then((r) => r.text());
    for (let i = 0; i < 6; i++) {
      const copy = await (await fork(b)).json();
      if (i >= 4) continue;
      await recipient.setTrackVisibility(copy.id, true, true);
    }
    expect(await html()).not.toContain('class="s-pagination"');
    const next = await (await fork(b)).json();
    await recipient.setTrackVisibility(next.id, true, true);
    const trackData = await (await request(api)).json();
    expect(trackData.forkCount).toBe(7);
    expect(trackData.forks).toHaveLength(5);
    const rendered = await html();
    expect(rendered).toContain('class="s-pagination"');
    expect(rendered.match(/class="s-trackcard"/g)).toHaveLength(4);
    for (const [i, f] of trackData.forks.entries()) {
      expect(rendered.includes('href="/u/forker/' + f.slug + '"')).toBe(i < 4);
    }
  });
  test("legal language follows the URL, including permanent redirects for legacy links", async () => {
    const { origin } = env();
    for (const name of ["terms", "rules"] as const) {
      for (const lang of ["ru", "en"] as const) {
        const prefix = lang === "ru" ? "/ru" : "";
        const path = prefix + "/" + name;
        const redirect = await request("/" + name + "?lang=" + lang);
        expect(redirect.status).toBe(301);
        expect(redirect.headers.get("location")).toBe(path);
        const res = await fetch(origin + path, {
          headers: { "accept-language": lang === "ru" ? "en" : "ru" },
        });
        expect(res.status).toBe(200);
        const html = await res.text();
        expectSocialHead(html, "/" + name, lang);
        const { title, version, body } = legal[name][lang];
        expect(html.match(/id="s-layer"/g)).toHaveLength(1);
        expect(html).toContain(version);
        for (const [, heading] of body.matchAll(/^## (.+)$/gm)) {
          expect(html).toContain(heading + "</h2>");
        }
        expect(html).toContain(
          `<title>${title} · ${lang === "ru" ? "Стартодел" : "Startodel"}</title>`,
        );
        expect(html).toContain('name="description"');
        expect(html).toContain('lang="' + lang + '"');
        for (const legal of ["terms", "rules"])
          expect(html).toContain('href="' + prefix + "/" + legal + '"');
        expect(html).not.toContain("PENDING LEGAL REVIEW");
      }
    }
  });
  test("robots and sitemap describe both locales on the public origin", async () => {
    const robots = await (await request("/robots.txt")).text();
    const sitemap = await (await request("/sitemap.xml")).text();
    for (const prefix of ["", "/ru"]) {
      for (const path of ["/u/", "/terms", "/rules"])
        expect(robots).toContain("Allow: " + prefix + path);
      for (const path of [
        "/api/",
        "/dashboard",
        "/settings",
        "/onboarding",
        "/grills",
        "/reviews",
        "/progress",
        "/tracks/",
        "/lessons/",
        "/topics/",
      ]) {
        expect(robots).toContain("Disallow: " + prefix + path);
      }
      expect(sitemap).toContain("<loc>https://startodel.example" + (prefix || "/") + "</loc>");
      for (const path of ["/login", "/dashboard"])
        expect(sitemap).not.toContain(prefix + path + "</loc>");
      for (const path of ["/terms", "/rules"]) {
        expect(sitemap).toContain("<loc>https://startodel.example" + prefix + path + "</loc>");
      }
    }
    expect(sitemap).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
    for (const [lang, prefix] of [
      ["ru", "/ru"],
      ["en", ""],
      ["x-default", ""],
    ])
      expect(sitemap).toContain(
        'hreflang="' + lang + '" href="https://startodel.example' + prefix + '/terms"',
      );
    expect(robots).not.toContain(": /en");
    expect(sitemap).not.toContain("https://startodel.example/en");
    expect(robots).toContain("Sitemap: https://startodel.example/sitemap.xml");
  });
}
