/*
  Warnings:

  - A unique constraint covering the columns `[medical_license_number]` on the table `providers` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `medical_license_number` to the `providers` table without a default value. This is not possible if the table is not empty.
  - Made the column `specialty` on table `providers` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "providers" ADD COLUMN     "medical_license_number" VARCHAR(100) NOT NULL,
ADD COLUMN     "work_phone" VARCHAR(20),
ADD COLUMN     "workplace_name" VARCHAR(200),
ALTER COLUMN "specialty" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "providers_medical_license_number_key" ON "providers"("medical_license_number");
