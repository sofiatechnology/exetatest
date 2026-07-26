-- OTP hardening + email suppression / webhook idempotency

ALTER TABLE "otps"
  ADD COLUMN IF NOT EXISTS "attemptCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "requestIp" VARCHAR(255);

CREATE INDEX IF NOT EXISTS "otps_request_ip_created_at"
  ON "otps" ("requestIp", "createdAt");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_email_suppressions_reason') THEN
    CREATE TYPE "enum_email_suppressions_reason" AS ENUM (
      'hard_bounce',
      'soft_bounce',
      'complaint',
      'unsubscribe'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "email_suppressions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" VARCHAR(255) NOT NULL UNIQUE,
  "reason" "enum_email_suppressions_reason" NOT NULL,
  "softBounceCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "webhook_events" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "eventId" VARCHAR(255) NOT NULL UNIQUE,
  "eventType" VARCHAR(255) NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
