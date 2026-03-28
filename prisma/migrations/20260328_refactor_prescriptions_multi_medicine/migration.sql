-- CreateTable prescription_items
CREATE TABLE "prescription_items" (
    "id" UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "prescription_id" UUID NOT NULL,
    "medicine_name" VARCHAR(255) NOT NULL,
    "dosage" VARCHAR(100) NOT NULL,
    "frequency" VARCHAR(100) NOT NULL,
    "duration" VARCHAR(100),
    "instructions" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "prescription_items_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "prescriptions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex prescription_items_prescription_id
CREATE INDEX "prescription_items_prescription_id_idx" ON "prescription_items"("prescription_id");

-- Migrate existing prescription data to prescription_items
INSERT INTO "prescription_items" ("id", "prescription_id", "medicine_name", "dosage", "frequency", "duration", "instructions", "created_at")
SELECT 
    gen_random_uuid(),
    "id" AS prescription_id,
    "medicine_name",
    "dosage",
    "frequency",
    "duration",
    "instructions",
    CURRENT_TIMESTAMP
FROM "prescriptions"
WHERE "medicine_name" IS NOT NULL;

-- AlterTable prescriptions - drop old medicine columns
ALTER TABLE "prescriptions" DROP COLUMN "medicine_name";
ALTER TABLE "prescriptions" DROP COLUMN "dosage";
ALTER TABLE "prescriptions" DROP COLUMN "frequency";
ALTER TABLE "prescriptions" DROP COLUMN "duration";
ALTER TABLE "prescriptions" DROP COLUMN "instructions";
