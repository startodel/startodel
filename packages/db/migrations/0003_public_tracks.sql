ALTER TABLE "tracks" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "tracks" ADD COLUMN "public" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tracks" ADD COLUMN "forked_from_track_id" uuid;--> statement-breakpoint
ALTER TABLE "tracks" ADD COLUMN "forked_from_login" text;--> statement-breakpoint
ALTER TABLE "tracks" ADD COLUMN "forked_from_slug" text;--> statement-breakpoint
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_forked_from_track_id_tracks_id_fk" FOREIGN KEY ("forked_from_track_id") REFERENCES "public"."tracks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tracks_fork_source_idx" ON "tracks" USING btree ("forked_from_track_id");--> statement-breakpoint
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_user_id_slug_unique" UNIQUE("user_id","slug");--> statement-breakpoint
-- Allocate names in stable order, including collisions with a literal suffixed title.
DO $$
DECLARE
  track_row record;
  base text;
  candidate text;
  suffix text;
  n integer;
BEGIN
  FOR track_row IN SELECT id, user_id, title FROM tracks ORDER BY user_id, created_at, id LOOP
    base := rtrim(left(ltrim(regexp_replace(lower(track_row.title COLLATE "C"), '[^a-z0-9]+', '-', 'g'), '-'), 120), '-');
    IF base = '' THEN base := 'track'; END IF;
    n := 1;
    candidate := base;
    WHILE EXISTS (SELECT 1 FROM tracks WHERE user_id = track_row.user_id AND slug = candidate) LOOP
      n := n + 1;
      suffix := '-' || n;
      candidate := rtrim(left(base, 120 - length(suffix)), '-') || suffix;
    END LOOP;
    UPDATE tracks SET slug = candidate WHERE id = track_row.id;
  END LOOP;
END $$;--> statement-breakpoint
ALTER TABLE "tracks" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_slug_check" CHECK (length("tracks"."slug") <= 120 and "tracks"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$');