-- CreateTable connection_requests
CREATE TABLE "connection_requests" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "provider_id" UUID NOT NULL,
  "patient_id" UUID NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "connection_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_connection_requests_provider_id" ON "connection_requests"("provider_id");

-- CreateIndex
CREATE INDEX "idx_connection_requests_patient_id" ON "connection_requests"("patient_id");

-- CreateIndex
CREATE INDEX "idx_connection_requests_status" ON "connection_requests"("status");

-- CreateIndex for partial unique constraint (pending requests only)
CREATE UNIQUE INDEX "connection_requests_unique_pending" ON "connection_requests" ("provider_id", "patient_id") WHERE status = 'pending';

-- AddForeignKey
ALTER TABLE "connection_requests" ADD CONSTRAINT "connection_requests_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "connection_requests" ADD CONSTRAINT "connection_requests_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
