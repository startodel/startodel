ALTER TABLE "profiles" ADD COLUMN "bio" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "headline" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "links" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "public_profile_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "show_activity_heatmap" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "include_private_activity" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "show_learning_progress" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tracks" ADD COLUMN "pin_order" smallint;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "handle" text;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_handle_unique" UNIQUE("handle");--> statement-breakpoint
INSERT INTO profiles (user_id) SELECT id FROM users ON CONFLICT (user_id) DO NOTHING;--> statement-breakpoint
-- Preserve the former public reader's winner and its exact URL spelling.
UPDATE users SET handle = login WHERE id IN (
  SELECT DISTINCT ON (login) id FROM users ORDER BY login, updated_at DESC, id
);--> statement-breakpoint
DO $$
DECLARE
  account record;
  base text;
  candidate text;
  suffix integer;
BEGIN
  FOR account IN SELECT id, login FROM users WHERE handle IS NULL ORDER BY id LOOP
    base := trim(both '-' from regexp_replace(lower(account.login), '[^a-z0-9]+', '-', 'g'));
    base := coalesce(nullif(base, ''), 'learner');
    suffix := 2;
    LOOP
      candidate := rtrim(left(base, 39 - length(suffix::text)), '-') || '-' || suffix;
      EXIT WHEN NOT EXISTS (SELECT 1 FROM users WHERE handle = candidate);
      suffix := suffix + 1;
    END LOOP;
    UPDATE users SET handle = candidate WHERE id = account.id;
  END LOOP;
END $$;--> statement-breakpoint
ALTER TABLE users ALTER COLUMN handle SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_user_id_pin_order_unique" UNIQUE("user_id","pin_order");--> statement-breakpoint
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_pin_check" CHECK ("tracks"."pin_order" is null or ("tracks"."public" and "tracks"."pin_order" between 1 and 6));
