-- Add title and passage to levels (Latin texts / reading passages)

ALTER TABLE "levels"
  ADD COLUMN IF NOT EXISTS "title" VARCHAR(255) NULL;

ALTER TABLE "levels"
  ADD COLUMN IF NOT EXISTS "passage" TEXT NULL;
