-- Scenario Desk v2 additive fields. Old v1 columns stay in place for rollback.
DO $$
BEGIN
  CREATE TYPE "ScenarioLoanTerm" AS ENUM (
    'FIXED_30',
    'FIXED_20',
    'FIXED_15',
    'ARM_3_1',
    'ARM_5_1',
    'ARM_7_1',
    'INTEREST_ONLY'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "PropertyDetails"
ADD COLUMN IF NOT EXISTS "estimatedInsuranceAnnual" DECIMAL(12,2);

ALTER TABLE "Contact"
ADD COLUMN IF NOT EXISTS "enteredReviewAt" TIMESTAMP(3);

UPDATE "Contact"
SET "enteredReviewAt" = "updatedAt"
WHERE "status" = 'IN_SCENARIO_REVIEW'
  AND "enteredReviewAt" IS NULL;

ALTER TABLE "OpportunityValue"
ADD COLUMN IF NOT EXISTS "comments" TEXT;

ALTER TABLE "Scenario"
ADD COLUMN IF NOT EXISTS "mortgageInsurance" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Scenario"
ADD COLUMN IF NOT EXISTS "loanTermCode" "ScenarioLoanTerm" NOT NULL DEFAULT 'FIXED_30';

UPDATE "Scenario"
SET "loanTermCode" = CASE
  WHEN "program" = 'IO' THEN 'INTEREST_ONLY'::"ScenarioLoanTerm"
  WHEN "program" = 'ARM_3_1' THEN 'ARM_3_1'::"ScenarioLoanTerm"
  WHEN "program" = 'ARM_5_1' THEN 'ARM_5_1'::"ScenarioLoanTerm"
  WHEN "program" = 'ARM_7_1' THEN 'ARM_7_1'::"ScenarioLoanTerm"
  WHEN "loanTerm" = 15 THEN 'FIXED_15'::"ScenarioLoanTerm"
  WHEN "loanTerm" = 20 THEN 'FIXED_20'::"ScenarioLoanTerm"
  ELSE 'FIXED_30'::"ScenarioLoanTerm"
END;
