-- Enable uuid-ossp extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateTable alert_thresholds
CREATE TABLE "alert_thresholds" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "patient_id" UUID NOT NULL,
    "metric_type" VARCHAR(50) NOT NULL,
    "min_value" DECIMAL(10,2),
    "max_value" DECIMAL(10,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alert_thresholds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "unique_patient_metric_threshold" ON "alert_thresholds"("patient_id", "metric_type");

-- CreateIndex
CREATE INDEX "idx_alert_thresholds_patient_id" ON "alert_thresholds"("patient_id");

-- CreateIndex
CREATE INDEX "idx_alert_thresholds_metric_type" ON "alert_thresholds"("metric_type");

-- CreateIndex
CREATE INDEX "idx_alert_thresholds_is_active" ON "alert_thresholds"("is_active");

-- AddForeignKey
ALTER TABLE "alert_thresholds" ADD CONSTRAINT "alert_thresholds_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- CreateTable critical_events
CREATE TABLE "critical_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "patient_id" UUID NOT NULL,
    "metric_type" VARCHAR(50) NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "threshold_type" VARCHAR(10) NOT NULL,
    "threshold_value" DECIMAL(10,2) NOT NULL,
    "is_acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledged_at" TIMESTAMPTZ(6),

    CONSTRAINT "critical_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_critical_events_patient_id" ON "critical_events"("patient_id");

-- CreateIndex
CREATE INDEX "idx_critical_events_metric_type" ON "critical_events"("metric_type");

-- CreateIndex
CREATE INDEX "idx_critical_events_created_at" ON "critical_events"("created_at");

-- CreateIndex
CREATE INDEX "idx_critical_events_acknowledged" ON "critical_events"("is_acknowledged");

-- CreateIndex
CREATE INDEX "idx_critical_events_patient_time" ON "critical_events"("patient_id", "created_at");

-- AddForeignKey
ALTER TABLE "critical_events" ADD CONSTRAINT "critical_events_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
