-- AlterTable
ALTER TABLE "OpportunityValue" ALTER COLUMN "propertyValue" DROP NOT NULL,
ALTER COLUMN "loanAmount" DROP NOT NULL,
ALTER COLUMN "calculatedOpportunityValue" DROP NOT NULL;
