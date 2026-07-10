CREATE TYPE "InsuranceCoverageBasis" AS ENUM (
  'BORROWER_PAID_POLICY',
  'HOA_CONDO_MASTER_POLICY',
  'OTHER_CONFIRMED_COVERAGE'
);

ALTER TABLE "PropertyDetails"
ADD COLUMN "insuranceCoverageBasis" "InsuranceCoverageBasis",
ADD COLUMN "insuranceZeroConfirmed" BOOLEAN NOT NULL DEFAULT false;
