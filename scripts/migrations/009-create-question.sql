-- Create question table

CREATE TABLE IF NOT EXISTS "question" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "text" TEXT NOT NULL,
  "response" TEXT[] NOT NULL,
  "correct_answer" INTEGER NOT NULL,
  "time" INTEGER NOT NULL,
  "level_id" INTEGER NOT NULL REFERENCES "levels" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "modele_id" UUID NOT NULL REFERENCES "modele" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "question_level_id" ON "question" ("level_id");
CREATE INDEX IF NOT EXISTS "question_modele_id" ON "question" ("modele_id");
