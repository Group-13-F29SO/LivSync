-- CreateTable appointments
CREATE TABLE "appointments" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "provider_id" UUID NOT NULL,
  "patient_id" UUID NOT NULL,
  "appointment_date" DATE NOT NULL,
  "appointment_time" VARCHAR(5) NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'scheduled',
  "notes" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex for provider_id
CREATE INDEX "idx_appointments_provider_id" ON "appointments"("provider_id");

-- CreateIndex for patient_id
CREATE INDEX "idx_appointments_patient_id" ON "appointments"("patient_id");

-- CreateIndex for appointment_date
CREATE INDEX "idx_appointments_appointment_date" ON "appointments"("appointment_date");

-- CreateIndex for status
CREATE INDEX "idx_appointments_status" ON "appointments"("status");

-- CreateIndex for provider_date
CREATE INDEX "idx_appointments_provider_date" ON "appointments"("provider_id", "appointment_date");

-- CreateUnique constraint for appointment slots
CREATE UNIQUE INDEX "unique_provider_appointment_slot" ON "appointments"("provider_id", "appointment_date", "appointment_time");

-- AddForeignKey for provider_id
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey for patient_id
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
