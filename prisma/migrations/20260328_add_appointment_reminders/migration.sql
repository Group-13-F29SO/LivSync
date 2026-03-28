-- CreateTable appointment_reminders
CREATE TABLE "appointment_reminders" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "appointment_id" UUID NOT NULL,
  "patient_id" UUID NOT NULL,
  "provider_id" UUID NOT NULL,
  "reminder_type" VARCHAR(20) NOT NULL,
  "remind_at" TIMESTAMPTZ(6) NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
  "sent_at" TIMESTAMPTZ(6),
  "notification_id" UUID,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "appointment_reminders_pkey" PRIMARY KEY ("id")
);

-- Unique reminder per appointment/type
CREATE UNIQUE INDEX "unique_appointment_reminder_type" ON "appointment_reminders"("appointment_id", "reminder_type");

-- Indexes
CREATE INDEX "idx_appointment_reminders_appointment_id" ON "appointment_reminders"("appointment_id");
CREATE INDEX "idx_appointment_reminders_patient_id" ON "appointment_reminders"("patient_id");
CREATE INDEX "idx_appointment_reminders_provider_id" ON "appointment_reminders"("provider_id");
CREATE INDEX "idx_appointment_reminders_status_remind_at" ON "appointment_reminders"("status", "remind_at");
CREATE INDEX "idx_appointment_reminders_remind_at" ON "appointment_reminders"("remind_at");

-- Foreign keys
ALTER TABLE "appointment_reminders" ADD CONSTRAINT "appointment_reminders_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "appointment_reminders" ADD CONSTRAINT "appointment_reminders_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "appointment_reminders" ADD CONSTRAINT "appointment_reminders_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
