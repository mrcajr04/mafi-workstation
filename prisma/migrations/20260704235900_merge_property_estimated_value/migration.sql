-- Drop the duplicate estimated value field after stakeholder confirmation that
-- Property Value and Estimated Value represent the same pre-appraisal concept.
ALTER TABLE "OpportunityValue" DROP COLUMN "estimatedValue";
