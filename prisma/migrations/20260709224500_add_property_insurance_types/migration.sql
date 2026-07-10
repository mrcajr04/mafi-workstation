-- Add multi-select insurance support while preserving the legacy single value.
ALTER TABLE "PropertyDetails" ADD COLUMN "insuranceTypes" "InsuranceType"[] NOT NULL DEFAULT ARRAY[]::"InsuranceType"[];

UPDATE "PropertyDetails"
SET "insuranceTypes" = ARRAY["insuranceType"]::"InsuranceType"[]
WHERE "insuranceType" IS NOT NULL;
