import { randomInt, randomUUID } from "node:crypto";
import { createDatabase, forUser, publicReader, signInWithGitHub } from "@startodel/db";
import { expect, onTestFinished, test as suiteTest } from "vite-plus/test";

const test = suiteTest.skipIf(!process.env.DATABASE_URL_TEST);

async function account() {
  const db = createDatabase(process.env.DATABASE_URL_TEST!);
  const login = randomUUID();
  const identity = { login, githubId: BigInt(-randomInt(1, 2 ** 47)), name: null, avatarUrl: null };
  const { id } = await signInWithGitHub(db, identity);
  onTestFinished(async () => {
    await db.$client.query("delete from users where id=$1", [id]);
    await db.$client.end();
  });
  return { db, id, login, own: forUser(db, id), profile: () => publicReader(db).profile(login) };
}

test("the heatmap counts dated observations once, in UTC, within the selected visibility", async () => {
  const { db, id, own, profile } = await account();
  const topic = await own.upsertTopic({ slug: "shared", title: "Shared" });
  const hidden = await own.upsertTopic({ slug: "private-topic", title: "Private title" });
  const [first, second, privateTrack] = await Promise.all(
    ["First", "Second", "Private"].map((title) => own.createTrack(title)),
  );
  for (const track of [first!, second!]) {
    await own.attachTopics(track.id, [topic.slug]);
    await own.setTrackVisibility(track.id, true, true);
  }
  await own.attachTopics(privateTrack!.id, [hidden.slug]);
  for (const member of [topic, hidden]) {
    const lesson = (await own.createLesson({ topicId: member.id, title: "Read" }))!;
    await own.markLessonRead(lesson.id);
  }
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  await db.$client.query("update lesson_progress set read_at=$1 where user_id=$2", [
    yesterday + "T23:30:00-02:00",
    id,
  ]);
  const grill = (await own.startGrill({ title: "Round", trackId: first!.id }))!;
  const question = (await own.addGrillQuestion(grill.id, { prompt: "Private prompt" }))!;
  await own.answerGrillQuestion(question.id, "Private answer", "ui");
  await own.judgeGrillQuestion(question.id, "strong", "Private feedback");
  await own.addGrillQuestion(grill.id, { prompt: "Private unfinished question" });
  await own.finishGrill(grill.id);
  await own.setMastery(topic.id, 3, "Private evidence");
  await own.recordReviewResult(topic.id, "weak", "Private reason");
  const today = new Date().toISOString().slice(0, 10);
  expect((await profile())?.heatmap).toMatchObject({ total: 3, days: [{ date: today, count: 3 }] });
  expect(await profile()).not.toHaveProperty("learningProgress");
  await own.updatePublicProfile({ includePrivateActivity: true, showLearningProgress: true });
  const visible = await profile();
  expect(visible?.heatmap).toMatchObject({ total: 4, days: [{ date: today, count: 4 }] });
  expect(visible?.learningProgress?.map((t) => t.title)).toEqual(["First", "Second"]);
  expect(visible?.learningProgress?.map((t) => t.counts)).toEqual([
    [0, 0, 0, 1, 0],
    [0, 0, 0, 1, 0],
  ]);
  expect(JSON.stringify(visible)).not.toContain("Private");
  await own.updatePublicProfile({ showActivityHeatmap: false });
  expect(await profile()).not.toHaveProperty("heatmap");
});

test("pins are ordered, limited to six and cleared on unpublishing", async () => {
  const { own, profile } = await account();
  const other = await account();
  const titles = ["A", "B", "C", "D", "E", "F", "G"];
  const list = await Promise.all(titles.map((title) => own.createTrack(title)));
  const ids = list.map((track) => track.id);
  for (const id of ids) await own.setTrackVisibility(id, true, true);
  await own.updatePublicProfile({ pinnedTrackIds: [ids[4]!, ids[2]!] });
  expect((await profile())?.tracks.map((t) => t.title)).toEqual([
    "E",
    "C",
    "A",
    "B",
    "D",
    "F",
    "G",
  ]);
  await expect(own.updatePublicProfile({ pinnedTrackIds: ids })).rejects.toThrow();
  await own.updatePublicProfile({ pinnedTrackIds: ids.slice(0, 6) });
  await expect(other.own.updatePublicProfile({ pinnedTrackIds: [ids[0]!] })).rejects.toThrow(
    "Track not found",
  );
  await own.setTrackVisibility(ids[0]!, false);
  await expect(
    own.updatePublicProfile({ pinnedTrackIds: [ids[0]!], headline: "rollback" }),
  ).rejects.toThrow("Track not found");
  await own.setTrackVisibility(ids[0]!, true);
  expect((await profile())?.tracks.map((t) => [t.title, t.pinOrder])).toEqual([
    ["B", 2],
    ["C", 3],
    ["D", 4],
    ["E", 5],
    ["F", 6],
    ["A", null],
    ["G", null],
  ]);
  expect((await profile())?.headline).toBeNull();
});

test("the 52-week window includes its first UTC day and ignores earlier and future observations", async () => {
  const { db, id, own, profile } = await account();
  const topic = await own.upsertTopic({ slug: "sql", title: "SQL" });
  const lesson = (await own.createLesson({ topicId: topic.id, title: "Read" }))!;
  await own.updatePublicProfile({ includePrivateActivity: true });
  await db.$client.query(
    `insert into quiz_attempts(user_id, lesson_id, block_id, answers, correct,total,source,created_at)
    select $1,$2,'test','[0]',1,1,'ui',(((now() at time zone 'UTC')::date + offset_days)::timestamp at time zone 'UTC')
      from unnest(array[-364,-363,-363,1]) offset_days`,
    [id, lesson.id],
  );
  const first = new Date(Date.now() - 363 * 86400000).toISOString().slice(0, 10);
  expect((await profile())?.heatmap?.days).toEqual([{ date: first, count: 2 }]);
});
