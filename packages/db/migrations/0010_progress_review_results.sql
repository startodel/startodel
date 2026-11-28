CREATE TABLE "review_results" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL,
	"topic_id" uuid NOT NULL,
	"scheduled_for" timestamp with time zone,
	"verdict" text NOT NULL,
	CONSTRAINT "review_results_verdict_check" CHECK ("review_results"."verdict" in ('strong','partial','weak'))
);
--> statement-breakpoint
ALTER TABLE "review_results" ADD CONSTRAINT "review_results_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_results" ADD CONSTRAINT "review_results_user_id_topic_id_topics_user_id_id_fk" FOREIGN KEY ("user_id","topic_id") REFERENCES "public"."topics"("user_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "review_results_owner_time_idx" ON "review_results" USING btree ("user_id","created_at");
--> statement-breakpoint
-- Existing ReviewItems retain only their latest result and their next due time.
INSERT INTO review_results (user_id, topic_id, created_at, verdict)
SELECT user_id, topic_id, last_reviewed_at, last_result FROM review_items
WHERE last_reviewed_at IS NOT NULL AND last_result IS NOT NULL
  AND (practice_correct IS NOT NULL OR last_result = 'strong' OR NOT EXISTS (
    SELECT 1 FROM grill_questions g WHERE g.user_id = review_items.user_id
      AND g.topic_id = review_items.topic_id AND g.judged_at IS NOT NULL
  ));
