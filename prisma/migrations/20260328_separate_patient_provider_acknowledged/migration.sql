-- Add separate acknowledgement tracking for patient and provider
ALTER TABLE "critical_events" ADD COLUMN "patient_acknowledged" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "critical_events" ADD COLUMN "provider_acknowledged" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "critical_events" ADD COLUMN "patient_acknowledged_at" TIMESTAMPTZ;
ALTER TABLE "critical_events" ADD COLUMN "provider_acknowledged_at" TIMESTAMPTZ;

-- Migrate existing data: if is_acknowledged is true, mark both as acknowledged
UPDATE "critical_events" SET "provider_acknowledged" = "is_acknowledged", "provider_acknowledged_at" = "acknowledged_at" WHERE "is_acknowledged" = true;
