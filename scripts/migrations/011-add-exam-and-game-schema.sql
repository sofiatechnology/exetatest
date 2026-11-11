-- Align the content schema with the exam and multiplayer game domain.
-- Existing records are left in place; legacy columns remain for compatibility.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_items_category') THEN
    CREATE TYPE "enum_items_category" AS ENUM ('cg', 'sc', 'co', 'la');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_game_sessions_status') THEN
    CREATE TYPE "enum_game_sessions_status" AS ENUM ('waiting', 'active', 'ended');
  END IF;
END $$;

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "province" VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "avatar" VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION;

ALTER TABLE "otps"
  ADD COLUMN IF NOT EXISTS "opt_number" VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "is_used" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "items"
  ALTER COLUMN "type" DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS "category" "enum_items_category",
  ADD COLUMN IF NOT EXISTS "is_all_sections" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "courses"
  ALTER COLUMN "section_id" DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS "item_id" UUID REFERENCES "items" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD COLUMN IF NOT EXISTS "title" VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "passage" TEXT;

ALTER TABLE "question"
  ALTER COLUMN "text" DROP NOT NULL,
  ALTER COLUMN "response" DROP NOT NULL,
  ALTER COLUMN "correct_answer" DROP NOT NULL,
  ALTER COLUMN "time" DROP NOT NULL,
  ALTER COLUMN "level_id" DROP NOT NULL,
  ALTER COLUMN "modele_id" DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS "question" TEXT,
  ADD COLUMN IF NOT EXISTS "time_limit" INTEGER,
  ADD COLUMN IF NOT EXISTS "course_id" UUID REFERENCES "courses" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "courses_item_id" ON "courses" ("item_id");
CREATE INDEX IF NOT EXISTS "question_course_id" ON "question" ("course_id");

CREATE TABLE IF NOT EXISTS "responses" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "question_id" UUID NOT NULL REFERENCES "question" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "question" TEXT,
  "option_text" TEXT NOT NULL,
  "is_correct" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "responses_question_id" ON "responses" ("question_id");

CREATE TABLE IF NOT EXISTS "revisions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "title" VARCHAR(255) NOT NULL,
  "auto_scroll" BOOLEAN NOT NULL DEFAULT false,
  "public" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "revisions_user_id" ON "revisions" ("user_id");

CREATE TABLE IF NOT EXISTS "revision_questions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "revision_id" UUID NOT NULL REFERENCES "revisions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "question_id" UUID NOT NULL REFERENCES "question" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "question_order" INTEGER NOT NULL,
  "time_limit" INTEGER,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "revision_questions_revision_id"
  ON "revision_questions" ("revision_id");
CREATE INDEX IF NOT EXISTS "revision_questions_question_id"
  ON "revision_questions" ("question_id");

CREATE TABLE IF NOT EXISTS "game_sessions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "revision_id" UUID NOT NULL REFERENCES "revisions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "host_id" UUID NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "pin_code" VARCHAR(6) NOT NULL UNIQUE,
  "status" "enum_game_sessions_status" NOT NULL DEFAULT 'waiting',
  "current_question_index" INTEGER NOT NULL DEFAULT 0,
  "started_at" TIMESTAMPTZ,
  "ended_at" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "game_sessions_revision_id" ON "game_sessions" ("revision_id");
CREATE INDEX IF NOT EXISTS "game_sessions_host_id" ON "game_sessions" ("host_id");

CREATE TABLE IF NOT EXISTS "game_players" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "game_session_id" UUID NOT NULL REFERENCES "game_sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "user_id" UUID REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "nickname" VARCHAR(100) NOT NULL,
  "score" INTEGER NOT NULL DEFAULT 0,
  "joined_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "game_players_game_session_id"
  ON "game_players" ("game_session_id");
CREATE INDEX IF NOT EXISTS "game_players_user_id" ON "game_players" ("user_id");

CREATE TABLE IF NOT EXISTS "player_answers" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "game_player_id" UUID NOT NULL REFERENCES "game_players" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "question_id" UUID NOT NULL REFERENCES "question" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "response_id" UUID NOT NULL REFERENCES "responses" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "is_correct" BOOLEAN NOT NULL,
  "time_taken_ms" INTEGER NOT NULL,
  "answered_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "player_answers_game_player_id"
  ON "player_answers" ("game_player_id");
CREATE INDEX IF NOT EXISTS "player_answers_question_id"
  ON "player_answers" ("question_id");
CREATE INDEX IF NOT EXISTS "player_answers_response_id"
  ON "player_answers" ("response_id");
