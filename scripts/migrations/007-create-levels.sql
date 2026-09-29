-- Create levels table (levels belonging to a course)

CREATE TABLE IF NOT EXISTS "levels" (
  "id" SERIAL PRIMARY KEY,
  "course_id" UUID NOT NULL REFERENCES "courses" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "levels_course_id" ON "levels" ("course_id");
