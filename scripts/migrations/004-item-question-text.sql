-- Exam stems and options can exceed VARCHAR(255).

ALTER TABLE "item_questions"
  ALTER COLUMN "question" TYPE TEXT;

ALTER TABLE "item_questions"
  ALTER COLUMN "options" TYPE TEXT[];
