-- Agent verification request fields.
-- Run once on existing DBs:
--   psql "$DATABASE_URL" -f server/db/migrations/003_agent_verification_request.sql

ALTER TABLE "AgentProfile" ADD COLUMN IF NOT EXISTS "nin" TEXT;
ALTER TABLE "AgentProfile" ADD COLUMN IF NOT EXISTS "verificationPhotoUrl" TEXT;
ALTER TABLE "AgentProfile" ADD COLUMN IF NOT EXISTS "emergencyContact" TEXT;
ALTER TABLE "AgentProfile" ADD COLUMN IF NOT EXISTS "verificationRequestedAt" TIMESTAMP(3);
