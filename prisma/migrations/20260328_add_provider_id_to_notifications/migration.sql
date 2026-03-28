-- AddColumn provider_id to notifications
ALTER TABLE "notifications" ADD COLUMN "provider_id" UUID;

-- Update schema to make patient_id nullable
ALTER TABLE "notifications" ALTER COLUMN "patient_id" DROP NOT NULL;

-- AddForeignKey for provider_id
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- CreateIndex for provider_id
CREATE INDEX "idx_notifications_provider_id" ON "notifications"("provider_id");
