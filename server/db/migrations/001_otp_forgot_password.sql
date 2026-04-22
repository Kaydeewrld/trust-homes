-- Add forgot-password OTP purpose to existing databases.
-- Run once: psql "$DATABASE_URL" -f server/db/migrations/001_otp_forgot_password.sql

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE n.nspname = 'public' AND t.typname = 'OtpPurpose' AND e.enumlabel = 'FORGOT_PASSWORD'
  ) THEN
    ALTER TYPE "OtpPurpose" ADD VALUE 'FORGOT_PASSWORD';
  END IF;
END
$$;
