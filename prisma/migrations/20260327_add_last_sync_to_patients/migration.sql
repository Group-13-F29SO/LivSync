-- Add last_sync field to patients table to track when user last synced data
ALTER TABLE "patients" ADD COLUMN "last_sync" TIMESTAMP(3);
