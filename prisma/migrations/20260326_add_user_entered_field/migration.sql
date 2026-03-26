-- Add is_user_entered field to biometric_data table
ALTER TABLE "biometric_data" ADD COLUMN "is_user_entered" BOOLEAN NOT NULL DEFAULT false;

-- Create index for is_user_entered field
CREATE INDEX "idx_biometric_data_is_user_entered" ON "biometric_data"("is_user_entered");

-- Create composite index for patient_id and is_user_entered
CREATE INDEX "idx_biometric_data_patient_user_entered" ON "biometric_data"("patient_id", "is_user_entered");
