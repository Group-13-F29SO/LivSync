-- CreateTable devices
CREATE TABLE "devices" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "patient_id" UUID NOT NULL,
    "device_name" VARCHAR(100) NOT NULL,
    "device_type" VARCHAR(50) NOT NULL,
    "device_model" VARCHAR(100),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "battery_level" INTEGER,
    "last_sync" TIMESTAMPTZ(6),
    "paired_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_devices_patient_id" ON "devices"("patient_id");

-- CreateIndex
CREATE INDEX "idx_devices_is_active" ON "devices"("is_active");

-- CreateIndex
CREATE INDEX "idx_devices_device_type" ON "devices"("device_type");

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
