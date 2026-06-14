-- Store the user's last activity as a local calendar date for streak tracking.

ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "last_activity_date" DATE;
