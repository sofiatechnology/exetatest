-- Create modele table

CREATE TABLE IF NOT EXISTS "modele" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" VARCHAR(255) NOT NULL,
  "pin" BOOLEAN NOT NULL DEFAULT false,
  "auto_scroll" BOOLEAN NOT NULL DEFAULT false,
  "public" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
