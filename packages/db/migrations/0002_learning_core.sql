CREATE TABLE "grill_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"topic_id" uuid,
	"position" integer NOT NULL,
	"prompt" text NOT NULL,
	"answer" text,
	"answered_at" timestamp with time zone,
	"answer_source" text,
	"verdict" text,
	"feedback" text,
	"judged_at" timestamp with time zone,
	CONSTRAINT "grill_questions_session_id_position_unique" UNIQUE("session_id","position"),
	CONSTRAINT "grill_questions_verdict_check" CHECK ("grill_questions"."verdict" in ('strong','partial','weak')),
	CONSTRAINT "grill_questions_source_check" CHECK ("grill_questions"."answer_source" in ('ui','mcp'))
);
--> statement-breakpoint
CREATE TABLE "lesson_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL,
	"lesson_id" uuid NOT NULL,
	"read_at" timestamp with time zone,
	CONSTRAINT "lesson_progress_user_id_lesson_id_unique" UNIQUE("user_id","lesson_id")
);
--> statement-breakpoint
CREATE TABLE "quiz_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL,
	"lesson_id" uuid NOT NULL,
	"block_id" text NOT NULL,
	"answers" jsonb NOT NULL,
	"correct" integer NOT NULL,
	"total" integer NOT NULL,
	"source" text NOT NULL,
	CONSTRAINT "quiz_attempts_source_check" CHECK ("quiz_attempts"."source" in ('ui','mcp'))
);
--> statement-breakpoint
CREATE TABLE "topic_mastery" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL,
	"topic_id" uuid NOT NULL,
	"level" smallint NOT NULL,
	"evidence" text,
	CONSTRAINT "topic_mastery_user_id_topic_id_unique" UNIQUE("user_id","topic_id"),
	CONSTRAINT "topic_mastery_level_check" CHECK ("topic_mastery"."level" between 0 and 4)
);
--> statement-breakpoint
CREATE TABLE "track_topics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL,
	"track_id" uuid NOT NULL,
	"topic_id" uuid NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "track_topics_track_id_topic_id_unique" UNIQUE("track_id","topic_id")
);
--> statement-breakpoint
ALTER TABLE "progress" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "quizzes" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "progress" CASCADE;--> statement-breakpoint
DROP TABLE "quizzes" CASCADE;--> statement-breakpoint
ALTER TABLE "topic_edges" DROP CONSTRAINT "topic_edges_from_topic_id_to_topic_id_unique";--> statement-breakpoint
ALTER TABLE "grill_sessions" DROP CONSTRAINT "grill_sessions_track_id_tracks_id_fk";
--> statement-breakpoint
ALTER TABLE "grill_sessions" DROP CONSTRAINT "grill_sessions_lesson_id_lessons_id_fk";
--> statement-breakpoint
ALTER TABLE "lessons" DROP CONSTRAINT "lessons_track_id_tracks_id_fk";
--> statement-breakpoint
ALTER TABLE "lessons" DROP CONSTRAINT "lessons_topic_id_topics_id_fk";
--> statement-breakpoint
ALTER TABLE "review_items" DROP CONSTRAINT "review_items_topic_id_topics_id_fk";
--> statement-breakpoint
ALTER TABLE "topic_edges" DROP CONSTRAINT "topic_edges_from_topic_id_topics_id_fk";
--> statement-breakpoint
ALTER TABLE "topic_edges" DROP CONSTRAINT "topic_edges_to_topic_id_topics_id_fk";
--> statement-breakpoint
ALTER TABLE "lessons" ALTER COLUMN "topic_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "review_items" ALTER COLUMN "topic_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "grill_sessions" ADD COLUMN "title" text NOT NULL;--> statement-breakpoint
ALTER TABLE "grill_sessions" ADD COLUMN "status" text DEFAULT 'open' NOT NULL;--> statement-breakpoint
ALTER TABLE "grill_sessions" ADD COLUMN "target_size" integer DEFAULT 15 NOT NULL;--> statement-breakpoint
ALTER TABLE "grill_sessions" ADD COLUMN "finished_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN "summary" text;--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN "position" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN "blocks" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "stack" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "experience" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "years_of_experience" integer;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "onboarded_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "review_items" ADD COLUMN "box" smallint NOT NULL;--> statement-breakpoint
ALTER TABLE "review_items" ADD COLUMN "due_at" timestamp with time zone NOT NULL;--> statement-breakpoint
ALTER TABLE "review_items" ADD COLUMN "last_result" text;--> statement-breakpoint
ALTER TABLE "review_items" ADD COLUMN "reason" text;--> statement-breakpoint
ALTER TABLE "review_items" ADD COLUMN "last_reviewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "topic_edges" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "topics" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "topics" ADD COLUMN "slug" text NOT NULL;--> statement-breakpoint
ALTER TABLE "topics" ADD COLUMN "summary" text;--> statement-breakpoint
ALTER TABLE "tracks" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "tracks" ADD COLUMN "sources" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "grill_sessions" ADD CONSTRAINT "grill_sessions_user_id_id_unique" UNIQUE("user_id","id");--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_user_id_id_unique" UNIQUE("user_id","id");--> statement-breakpoint
ALTER TABLE "topics" ADD CONSTRAINT "topics_user_id_id_unique" UNIQUE("user_id","id");--> statement-breakpoint
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_user_id_id_unique" UNIQUE("user_id","id");--> statement-breakpoint
ALTER TABLE "grill_questions" ADD CONSTRAINT "grill_questions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grill_questions" ADD CONSTRAINT "grill_questions_user_id_session_id_grill_sessions_user_id_id_fk" FOREIGN KEY ("user_id","session_id") REFERENCES "public"."grill_sessions"("user_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grill_questions" ADD CONSTRAINT "grill_questions_user_id_topic_id_topics_user_id_id_fk" FOREIGN KEY ("user_id","topic_id") REFERENCES "public"."topics"("user_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_user_id_lesson_id_lessons_user_id_id_fk" FOREIGN KEY ("user_id","lesson_id") REFERENCES "public"."lessons"("user_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_user_id_lesson_id_lessons_user_id_id_fk" FOREIGN KEY ("user_id","lesson_id") REFERENCES "public"."lessons"("user_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_mastery" ADD CONSTRAINT "topic_mastery_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_mastery" ADD CONSTRAINT "topic_mastery_user_id_topic_id_topics_user_id_id_fk" FOREIGN KEY ("user_id","topic_id") REFERENCES "public"."topics"("user_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "track_topics" ADD CONSTRAINT "track_topics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "track_topics" ADD CONSTRAINT "track_topics_user_id_track_id_tracks_user_id_id_fk" FOREIGN KEY ("user_id","track_id") REFERENCES "public"."tracks"("user_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "track_topics" ADD CONSTRAINT "track_topics_user_id_topic_id_topics_user_id_id_fk" FOREIGN KEY ("user_id","topic_id") REFERENCES "public"."topics"("user_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grill_sessions" ADD CONSTRAINT "grill_sessions_user_id_track_id_tracks_user_id_id_fk" FOREIGN KEY ("user_id","track_id") REFERENCES "public"."tracks"("user_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_user_id_topic_id_topics_user_id_id_fk" FOREIGN KEY ("user_id","topic_id") REFERENCES "public"."topics"("user_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_items" ADD CONSTRAINT "review_items_user_id_topic_id_topics_user_id_id_fk" FOREIGN KEY ("user_id","topic_id") REFERENCES "public"."topics"("user_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_edges" ADD CONSTRAINT "topic_edges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_edges" ADD CONSTRAINT "topic_edges_user_id_from_topic_id_topics_user_id_id_fk" FOREIGN KEY ("user_id","from_topic_id") REFERENCES "public"."topics"("user_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_edges" ADD CONSTRAINT "topic_edges_user_id_to_topic_id_topics_user_id_id_fk" FOREIGN KEY ("user_id","to_topic_id") REFERENCES "public"."topics"("user_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topics" ADD CONSTRAINT "topics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grill_sessions" DROP COLUMN "lesson_id";--> statement-breakpoint
ALTER TABLE "lessons" DROP COLUMN "track_id";--> statement-breakpoint
ALTER TABLE "review_items" ADD CONSTRAINT "review_items_user_id_topic_id_unique" UNIQUE("user_id","topic_id");--> statement-breakpoint
ALTER TABLE "topic_edges" ADD CONSTRAINT "topic_edges_user_id_from_topic_id_to_topic_id_unique" UNIQUE("user_id","from_topic_id","to_topic_id");--> statement-breakpoint
ALTER TABLE "topics" ADD CONSTRAINT "topics_user_id_slug_unique" UNIQUE("user_id","slug");--> statement-breakpoint
ALTER TABLE "grill_sessions" ADD CONSTRAINT "grill_sessions_status_check" CHECK ("grill_sessions"."status" in ('open','finished'));--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_experience_check" CHECK ("profiles"."experience" in ('junior','middle','senior','lead'));--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_years_check" CHECK ("profiles"."years_of_experience" between 0 and 60);--> statement-breakpoint
ALTER TABLE "review_items" ADD CONSTRAINT "review_items_box_check" CHECK ("review_items"."box" between 0 and 4);--> statement-breakpoint
ALTER TABLE "review_items" ADD CONSTRAINT "review_items_result_check" CHECK ("review_items"."last_result" in ('strong','partial','weak'));--> statement-breakpoint
ALTER TABLE "topic_edges" ADD CONSTRAINT "topic_edges_distinct" CHECK ("topic_edges"."from_topic_id" <> "topic_edges"."to_topic_id");