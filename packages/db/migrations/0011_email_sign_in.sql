CREATE TABLE "auth_rate_events" (
	"key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_challenges" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"purpose" text NOT NULL,
	"user_id" uuid,
	"code_hash" text NOT NULL,
	"token_hash" text,
	"attempts" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone DEFAULT now() + interval '15 minutes' NOT NULL,
	"consumed_at" timestamp with time zone,
	CONSTRAINT "email_challenges_purpose" CHECK (("email_challenges"."purpose"='sign_in' and "email_challenges"."user_id" is null and "email_challenges"."token_hash" is not null) or ("email_challenges"."purpose"='change_email' and "email_challenges"."user_id" is not null and "email_challenges"."token_hash" is null))
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "github_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "email_challenges" ADD CONSTRAINT "email_challenges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "auth_rate_events_key_created" ON "auth_rate_events" USING btree ("key","created_at");--> statement-breakpoint
CREATE INDEX "auth_rate_events_created" ON "auth_rate_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "email_challenges_email_created" ON "email_challenges" USING btree ("email","created_at");--> statement-breakpoint
CREATE INDEX "email_challenges_created" ON "email_challenges" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_email_unique" UNIQUE("email");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_sign_in_method" CHECK ("users"."github_id" is not null or "users"."email" is not null);--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_normalized_email" CHECK ("users"."email" = lower(trim("users"."email")));