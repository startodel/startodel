ALTER TABLE "tracks" ADD COLUMN "language" text;
--> statement-breakpoint
-- Unicode Cyrillic letters (Script=Cyrillic intersected with Letter), in code point order.
UPDATE "tracks" SET "language" = CASE
  WHEN "title" COLLATE "C" ~ U&'[\0400-\0481\048a-\052f\1c80-\1c8a\1d2b\1d78\a640-\a66e\a67f-\a69d\+01e030-\+01e06d]' THEN 'ru'
  ELSE 'en'
END;
--> statement-breakpoint
ALTER TABLE "tracks" ALTER COLUMN "language" SET NOT NULL;
