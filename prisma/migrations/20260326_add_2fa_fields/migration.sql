-- Add 2FA fields to patients table
ALTER TABLE "patients" ADD COLUMN "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "patients" ADD COLUMN "two_factor_secret" TEXT;
