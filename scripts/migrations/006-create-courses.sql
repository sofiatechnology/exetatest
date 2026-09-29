-- Create courses catalog table (subjects belonging to a section)

CREATE TABLE IF NOT EXISTS "courses" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(255) NOT NULL,
  "section_id" VARCHAR(64) NOT NULL REFERENCES "sections" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "courses_section_id" ON "courses" ("section_id");
