import { sql } from "drizzle-orm";
import type { MasteryLevel } from "@startodel/core";
import type { Transaction } from "./owned.ts";

type Activity = {
  id: string;
  kind:
    | "Lesson read"
    | "Quiz attempt"
    | "Grill answer"
    | "Grill verdict"
    | "Review result"
    | "Mastery";
  title: string;
  detail: string | null;
  at: Date;
  topicId: string | null;
};
type TopicProgress = {
  id: string;
  title: string;
  level: MasteryLevel;
  tracks: { id: string; title: string }[];
  read: number;
  lessons: number;
  lastActivity: Date | null;
};

export async function topicActivity(tx: Transaction, userId: string) {
  // ReviewItems, Mastery and read receipts retain their latest observation.
  const events = sql`with activity(id,kind,title,detail,at,"topicId") as (
    select p.id,'Lesson read',l.title,null,p.read_at,l.topic_id from lesson_progress p
      join lessons l on l.user_id=${userId} and l.id=p.lesson_id where p.user_id=${userId} and p.read_at is not null
    union all select a.id,'Quiz attempt',l.title,concat(a.correct,'/',a.total),a.created_at,l.topic_id from quiz_attempts a
      join lessons l on l.user_id=${userId} and l.id=a.lesson_id where a.user_id=${userId}
    union all select id,'Grill answer',prompt,null,answered_at,topic_id from grill_questions where user_id=${userId} and answered_at is not null
    union all select id,'Grill verdict',prompt,verdict,judged_at,topic_id from grill_questions where user_id=${userId} and judged_at is not null
    union all select r.id,'Review result',t.title,r.last_result,r.last_reviewed_at,t.id from review_items r
      join topics t on t.user_id=${userId} and t.id=r.topic_id where r.user_id=${userId} and r.last_reviewed_at is not null
    union all select m.id,'Mastery',t.title,m.level::text,m.updated_at,t.id from topic_mastery m
      join topics t on t.user_id=${userId} and t.id=m.topic_id where m.user_id=${userId}
  )`;
  const { rows: activity } = await tx.execute<Activity>(
    sql`${events} select * from activity order by at desc,id,kind limit 30`,
  );
  const { rows: perTopic } = await tx.execute<TopicProgress>(sql`${events},
    latest as (select "topicId",max(at) as at from activity group by "topicId"),
    membership as (
      select m.topic_id,json_agg(json_build_object('id',t.id,'title',t.title) order by t.created_at,t.id) as tracks
      from track_topics m join tracks t on t.user_id=${userId} and t.id=m.track_id where m.user_id=${userId} group by m.topic_id
    ), reading as (
      select l.topic_id,count(*)::int as lessons,count(p.read_at)::int as read
      from lessons l left join lesson_progress p on p.user_id=${userId} and p.lesson_id=l.id where l.user_id=${userId} group by l.topic_id
    )
    select t.id,t.title,coalesce(m.level,0) as level,coalesce(membership.tracks,'[]'::json) as tracks,
      coalesce(reading.lessons,0) as lessons,coalesce(reading.read,0) as read,latest.at as "lastActivity"
    from topics t left join topic_mastery m on m.user_id=${userId} and m.topic_id=t.id
      left join membership on membership.topic_id=t.id left join reading on reading.topic_id=t.id
      left join latest on latest."topicId"=t.id where t.user_id=${userId} order by t.title,t.id`);
  return { perTopic, activity };
}
