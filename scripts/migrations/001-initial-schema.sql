-- Complete initial schema for a fresh EXETATEST PostgreSQL database.
-- Keep this file aligned with the models in src/models/.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "enum_users_role" AS ENUM ('admin', 'user');
CREATE TYPE "enum_items_type" AS ENUM ('cg', 'sc', 'co', 'la');
CREATE TYPE "enum_items_category" AS ENUM ('cg', 'sc', 'co', 'la');
CREATE TYPE "enum_email_suppressions_reason" AS ENUM (
  'hard_bounce',
  'soft_bounce',
  'complaint',
  'unsubscribe'
);
CREATE TYPE "enum_game_sessions_status" AS ENUM ('waiting', 'active', 'ended');

CREATE TABLE "users" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" VARCHAR(255) NOT NULL UNIQUE,
  "country" VARCHAR(255),
  "province" VARCHAR(255),
  "avatar" VARCHAR(255),
  "longitude" DOUBLE PRECISION,
  "latitude" DOUBLE PRECISION,
  "region" VARCHAR(255),
  "section" VARCHAR(255),
  "section_id" VARCHAR(64),
  "role" "enum_users_role" NOT NULL DEFAULT 'user',
  "current_streak" INTEGER NOT NULL DEFAULT 0,
  "longest_streak" INTEGER NOT NULL DEFAULT 0,
  "last_activity_date" DATE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "otps" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "code" VARCHAR(255) NOT NULL,
  "opt_number" VARCHAR(255),
  "is_used" BOOLEAN NOT NULL DEFAULT false,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "isVerified" BOOLEAN NOT NULL DEFAULT false,
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "requestIp" VARCHAR(255),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "otps_user_id" ON "otps" ("userId");
CREATE INDEX "otps_request_ip_created_at" ON "otps" ("requestIp", "createdAt");

CREATE TABLE "sections" (
  "id" VARCHAR(64) PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO "sections" ("id", "name") VALUES
  ('01', 'LATIN – PHILO'),
  ('02', 'SCIENTIFIQUE'),
  ('03', 'COMMERCIALE ET GESTION'),
  ('04', 'ELECTRICITE'),
  ('05', 'MECANIQUE'),
  ('06', 'ELECTRONIQUE'),
  ('07', 'CONSTRUCTION'),
  ('08', 'COUPE COUTURE'),
  ('09', 'HOTELLERIE ET RESTAURATION'),
  ('10', 'TOURISME'),
  ('11', 'HOTESSE D''ACCUEIL'),
  ('12', 'AGRICULTURE'),
  ('13', 'VETERINAIRE'),
  ('14', 'AGRONOMIE'),
  ('15', 'PECHE ET NAVIGATION'),
  ('16', 'PEDAGOGIE'),
  ('17', 'NUTRITION'),
  ('18', 'TECHNIQUE SOCIALE');

CREATE TABLE "items" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "type" "enum_items_type",
  "category" "enum_items_category",
  "section_id" VARCHAR(64) NOT NULL,
  "year" INTEGER NOT NULL,
  "universal" BOOLEAN NOT NULL DEFAULT false,
  "is_all_sections" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "item_courses" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "course" VARCHAR(128) NOT NULL,
  "item_id" UUID NOT NULL REFERENCES "items" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "passage" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "item_courses_item_id" ON "item_courses" ("item_id");

CREATE TABLE "item_questions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "question" TEXT NOT NULL,
  "item_course_id" UUID NOT NULL REFERENCES "item_courses" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "options" TEXT[] NOT NULL,
  "answer" INTEGER NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "item_questions_item_course_id" ON "item_questions" ("item_course_id");

CREATE TABLE "courses" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(255) NOT NULL,
  "section_id" VARCHAR(64) REFERENCES "sections" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "item_id" UUID REFERENCES "items" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "title" VARCHAR(255),
  "passage" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "courses_section_id" ON "courses" ("section_id");
CREATE INDEX "courses_item_id" ON "courses" ("item_id");

CREATE TABLE "levels" (
  "id" SERIAL PRIMARY KEY,
  "course_id" UUID NOT NULL REFERENCES "courses" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "title" VARCHAR(255),
  "passage" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "levels_course_id" ON "levels" ("course_id");

CREATE TABLE "modele" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" VARCHAR(255) NOT NULL,
  "pin" BOOLEAN NOT NULL DEFAULT false,
  "auto_scroll" BOOLEAN NOT NULL DEFAULT false,
  "public" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "question" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "text" TEXT,
  "response" TEXT[],
  "correct_answer" INTEGER,
  "time" INTEGER,
  "level_id" INTEGER REFERENCES "levels" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "modele_id" UUID REFERENCES "modele" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "question" TEXT,
  "time_limit" INTEGER,
  "course_id" UUID REFERENCES "courses" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "question_level_id" ON "question" ("level_id");
CREATE INDEX "question_modele_id" ON "question" ("modele_id");
CREATE INDEX "question_course_id" ON "question" ("course_id");

CREATE TABLE "email_suppressions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" VARCHAR(255) NOT NULL UNIQUE,
  "reason" "enum_email_suppressions_reason" NOT NULL,
  "softBounceCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "webhook_events" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "eventId" VARCHAR(255) NOT NULL UNIQUE,
  "eventType" VARCHAR(255) NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "responses" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "question_id" UUID NOT NULL REFERENCES "question" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "question" TEXT,
  "option_text" TEXT NOT NULL,
  "is_correct" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "responses_question_id" ON "responses" ("question_id");

CREATE TABLE "revisions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "title" VARCHAR(255) NOT NULL,
  "auto_scroll" BOOLEAN NOT NULL DEFAULT false,
  "public" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "revisions_user_id" ON "revisions" ("user_id");

CREATE TABLE "revision_questions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "revision_id" UUID NOT NULL REFERENCES "revisions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "question_id" UUID NOT NULL REFERENCES "question" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "question_order" INTEGER NOT NULL,
  "time_limit" INTEGER,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "revision_questions_revision_id" ON "revision_questions" ("revision_id");
CREATE INDEX "revision_questions_question_id" ON "revision_questions" ("question_id");

CREATE TABLE "game_sessions" (
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

CREATE INDEX "game_sessions_revision_id" ON "game_sessions" ("revision_id");
CREATE INDEX "game_sessions_host_id" ON "game_sessions" ("host_id");

CREATE TABLE "game_players" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "game_session_id" UUID NOT NULL REFERENCES "game_sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "user_id" UUID REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "nickname" VARCHAR(100) NOT NULL,
  "score" INTEGER NOT NULL DEFAULT 0,
  "joined_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "game_players_game_session_id" ON "game_players" ("game_session_id");
CREATE INDEX "game_players_user_id" ON "game_players" ("user_id");

CREATE TABLE "player_answers" (
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

CREATE INDEX "player_answers_game_player_id" ON "player_answers" ("game_player_id");
CREATE INDEX "player_answers_question_id" ON "player_answers" ("question_id");
CREATE INDEX "player_answers_response_id" ON "player_answers" ("response_id");
