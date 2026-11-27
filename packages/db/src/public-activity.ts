import { sql } from "drizzle-orm";
import type { Connection } from "./index.ts";

// A shared Topic can appear in several Tracks. Membership is a visibility test, never an event multiplier.
function observations(userId: string) {
  return sql`public_topics as (
      select distinct tt.topic_id from track_topics tt join tracks t on t.id = tt.track_id
      where t.user_id = ${userId} and t.public
    ), events(stamp, topic_id, track_id) as (
      select p.read_at, l.topic_id, null::uuid from lesson_progress p join lessons l on l.id = p.lesson_id
      where p.user_id = ${userId} and p.read_at is not null
      union all
      select a.created_at, l.topic_id, null from quiz_attempts a join lessons l on l.id = a.lesson_id
      where a.user_id = ${userId}
      union all
      select last_reviewed_at, topic_id, null from review_items where user_id = ${userId} and last_reviewed_at is not null
      union all
      select q.judged_at, q.topic_id, s.track_id from grill_questions q join grill_sessions s on s.id = q.session_id
      where q.user_id = ${userId} and q.judged_at is not null
    ), public_events as (
      select * from events e where
        (e.topic_id is null or e.topic_id in (select topic_id from public_topics)) and
        (e.track_id is null or exists (select 1 from tracks t where t.id = e.track_id and t.public)) and
        (e.topic_id is not null or e.track_id is not null)
    )`;
}

export async function activityHeatmap(db: Connection, userId: string, includePrivate: boolean) {
  const through = new Date().toISOString().slice(0, 10);
  const { rows: days } = await db.execute<{ date: string; count: number }>(sql`
    with ${observations(userId)}
    select to_char(stamp at time zone 'UTC', 'YYYY-MM-DD') as date, count(*)::int as count
    from ${includePrivate ? sql`events` : sql`public_events`}
    where stamp >= ((${through}::date - 363)::timestamp at time zone 'UTC')
      and stamp < ((${through}::date + 1)::timestamp at time zone 'UTC')
    group by 1 order by 1`);
  return { through, days, total: days.reduce((sum, d) => sum + d.count, 0) };
}

export async function learningProgress(db: Connection, userId: string) {
  const { rows } = await db.execute<{ slug: string; title: string; counts: number[] }>(sql`
    with ${observations(userId)}, studied as (
      select t.id, t.slug, t.title, tt.topic_id, coalesce(m.level, 0) as level,
        m.level > 0 or tt.topic_id in (select topic_id from public_events)
          or t.id in (select track_id from public_events) as started
      from tracks t
      left join track_topics tt on tt.track_id = t.id
      left join topic_mastery m on m.user_id = t.user_id and m.topic_id = tt.topic_id
      where t.user_id = ${userId} and t.public
    )
    select slug, title, array[
      count(topic_id) filter(where level=0), count(topic_id) filter(where level=1), count(topic_id) filter(where level=2),
      count(topic_id) filter(where level=3), count(topic_id) filter(where level=4)
    ]::int[] as counts
    from studied group by id, slug, title having bool_or(started) order by title, slug`);
  return rows;
}
