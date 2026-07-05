CREATE TYPE "OpportunityStatus" AS ENUM ('NOT_DECIDED', 'READY_FOR_REVIEW', 'NOT_MOVING_FORWARD');

ALTER TABLE "OpportunityValue"
ADD COLUMN "status" "OpportunityStatus" NOT NULL DEFAULT 'NOT_DECIDED',
ADD COLUMN "notMovingForwardReason" TEXT;

UPDATE "OpportunityValue"
SET "status" = CASE
  WHEN "readyForScenarioReview" = true THEN 'READY_FOR_REVIEW'::"OpportunityStatus"
  ELSE 'NOT_DECIDED'::"OpportunityStatus"
END;

ALTER TABLE "OpportunityValue" DROP COLUMN "readyForScenarioReview";
