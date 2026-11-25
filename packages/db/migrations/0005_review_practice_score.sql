ALTER TABLE "review_items" ADD COLUMN "practice_correct" integer;--> statement-breakpoint
ALTER TABLE "review_items" ADD COLUMN "practice_total" integer;--> statement-breakpoint
ALTER TABLE "review_items" ADD CONSTRAINT "review_items_practice_score_check" CHECK (("review_items"."practice_correct" is null and "review_items"."practice_total" is null)
      or ("review_items"."practice_correct" is not null and "review_items"."practice_total" is not null
        and "review_items"."practice_total" > 0 and "review_items"."practice_correct" between 0 and "review_items"."practice_total"));
--> statement-breakpoint
-- Only the old formatter's complete, canonical integer scores have a localized presentation.
WITH legacy AS (
  SELECT id, matched[1]::bigint AS correct, matched[2]::bigint AS total
  FROM review_items
  CROSS JOIN LATERAL regexp_matches(reason,
    '^Practice Quiz: (0|[1-9][0-9]{0,9}) of ([1-9][0-9]{0,9}) correct$') AS matched
)
UPDATE review_items AS item SET practice_correct = legacy.correct, practice_total = legacy.total
FROM legacy WHERE item.id = legacy.id AND legacy.correct <= legacy.total AND legacy.total <= 2147483647;
