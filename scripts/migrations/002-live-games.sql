ALTER TABLE "game_sessions"
  ADD COLUMN IF NOT EXISTS "question_started_at" TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS "player_answers_game_player_question_unique"
  ON "player_answers" ("game_player_id", "question_id");
