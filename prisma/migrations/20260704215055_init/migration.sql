-- CreateEnum
CREATE TYPE "RoleType" AS ENUM ('BDR', 'LICENSED_LO', 'LOAN_PROCESSOR', 'COMPLIANCE_OFFICER', 'OWNER');

-- CreateEnum
CREATE TYPE "ContactStatus" AS ENUM ('ACTIVE', 'IN_SCENARIO_REVIEW', 'IN_PROCESSING', 'WON', 'LOST', 'RE_ENGAGEMENT');

-- CreateEnum
CREATE TYPE "LoanPurpose" AS ENUM ('PURCHASE', 'RATE_TERM_REFI', 'CASH_OUT_REFI', 'LIMITED_CASH_OUT');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('CHECKING', 'SAVINGS', 'RETIREMENT', 'GIFT', 'OTHER');

-- CreateEnum
CREATE TYPE "FicoSource" AS ENUM ('KNOWN_CREDIT_KARMA', 'KNOWN_BANK', 'ESTIMATED_GUESS', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('SFR', 'PUD_TOWNHOUSE', 'PUD_VILLA', 'CONDO', 'COMMERCIAL', 'BUSINESS', 'OTHER');

-- CreateEnum
CREATE TYPE "InsuranceType" AS ENUM ('HAZARD_HO3', 'INVESTOR_DP3', 'WALL_IN_HO6', 'FLOOD', 'WINDSTORM', 'MASTER_INSURANCE', 'MASTER_FLOOD', 'MASTER_WINDSTORM', 'OTHER');

-- CreateEnum
CREATE TYPE "RealtorStatus" AS ENUM ('YES', 'NO', 'NEEDS_HELP');

-- CreateEnum
CREATE TYPE "ScenarioDeskStatus" AS ENUM ('IN_REVIEW', 'FINALIZED');

-- CreateEnum
CREATE TYPE "DecisionBranch" AS ENUM ('PENDING', 'PROCEED_TO_PROCESSING', 'RE_ENGAGEMENT');

-- CreateEnum
CREATE TYPE "PricingLockFloat" AS ENUM ('LOCKED', 'FLOATING', 'NOT_SET');

-- CreateEnum
CREATE TYPE "LoanApprovalStatus" AS ENUM ('NOT_STARTED', 'CONDITIONS_PENDING', 'FINAL_REVIEW', 'APPROVED');

-- CreateEnum
CREATE TYPE "CreditAuthorizationStatus" AS ENUM ('NOT_STARTED', 'AUTHORIZED', 'REPORT_REVIEWED');

-- CreateEnum
CREATE TYPE "LoanApplicationStatus" AS ENUM ('NOT_STARTED', 'SUBMITTED');

-- CreateEnum
CREATE TYPE "DisclosuresStatus" AS ENUM ('NOT_SENT', 'SENT', 'SIGNED');

-- CreateEnum
CREATE TYPE "AppraisalStatus" AS ENUM ('NOT_ORDERED', 'ORDERED', 'CONFIRMED');

-- CreateEnum
CREATE TYPE "CommandCenterTag" AS ENUM ('CLIENT', 'RE_ENGAGEMENT');

-- CreateEnum
CREATE TYPE "NurtureTouchType" AS ENUM ('EMAIL', 'SMS', 'SEASONAL_CHECKIN', 'RATE_DROP_ALERT', 'OTHER');

-- CreateTable
CREATE TABLE "Profile" (
    "id" UUID NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "role" "RoleType" NOT NULL,
    "nmlsNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" UUID NOT NULL,
    "bdrId" UUID NOT NULL,
    "assignedLOId" UUID,
    "status" "ContactStatus" NOT NULL DEFAULT 'ACTIVE',
    "prospectName" TEXT NOT NULL,
    "prospectPhone" TEXT NOT NULL,
    "prospectEmail" TEXT,
    "borrowerType" TEXT NOT NULL,
    "loanPurpose" "LoanPurpose" NOT NULL,
    "vesting" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoBorrower" (
    "id" UUID NOT NULL,
    "contactId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "order" INTEGER NOT NULL,

    CONSTRAINT "CoBorrower_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" UUID NOT NULL,
    "contactId" UUID NOT NULL,
    "type" "AssetType" NOT NULL,
    "amount" DECIMAL(12,2),
    "notes" TEXT,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FicoInfo" (
    "id" UUID NOT NULL,
    "contactId" UUID NOT NULL,
    "source" "FicoSource" NOT NULL,
    "score" INTEGER,

    CONSTRAINT "FicoInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyDetails" (
    "id" UUID NOT NULL,
    "contactId" UUID NOT NULL,
    "address" TEXT NOT NULL,
    "zillowUrl" TEXT,
    "redfinUrl" TEXT,
    "realtorUrl" TEXT,
    "propertyType" "PropertyType" NOT NULL,
    "propertyTaxesLastYear" DECIMAL(12,2),
    "propertyTaxesPresentYear" DECIMAL(12,2),
    "insuranceType" "InsuranceType",
    "hoaName" TEXT,
    "hoaManagementInfo" TEXT,
    "additionalHoaFees" DECIMAL(12,2),

    CONSTRAINT "PropertyDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpportunityValue" (
    "id" UUID NOT NULL,
    "contactId" UUID NOT NULL,
    "propertyValue" DECIMAL(12,2) NOT NULL,
    "purchasePrice" DECIMAL(12,2) NOT NULL,
    "estimatedValue" DECIMAL(12,2) NOT NULL,
    "loanAmount" DECIMAL(12,2) NOT NULL,
    "hasRealtor" "RealtorStatus" NOT NULL,
    "calculatedOpportunityValue" DECIMAL(12,2) NOT NULL,
    "readyForScenarioReview" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpportunityValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScenarioDesk" (
    "id" UUID NOT NULL,
    "contactId" UUID NOT NULL,
    "status" "ScenarioDeskStatus" NOT NULL DEFAULT 'IN_REVIEW',
    "selectedScenarioNumber" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScenarioDesk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scenario" (
    "id" UUID NOT NULL,
    "scenarioDeskId" UUID NOT NULL,
    "scenarioNumber" INTEGER NOT NULL,
    "lenderAndProduct" TEXT NOT NULL,
    "interestRate" DECIMAL(6,3) NOT NULL,
    "principalAndInterest" DECIMAL(12,2) NOT NULL,
    "pitia" DECIMAL(12,2) NOT NULL,
    "escrowed" BOOLEAN NOT NULL,
    "originationPay" DECIMAL(12,2) NOT NULL,
    "processingFee" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "Scenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Phase4Pipeline" (
    "id" UUID NOT NULL,
    "contactId" UUID NOT NULL,
    "decisionBranch" "DecisionBranch" NOT NULL DEFAULT 'PENDING',
    "loanPreApprovalHtml" TEXT,
    "loanEstimateHtml" TEXT,
    "pricingLockFloat" "PricingLockFloat" NOT NULL DEFAULT 'NOT_SET',
    "loanApprovalStatus" "LoanApprovalStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "creditAuthorizationStatus" "CreditAuthorizationStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "loanApplicationStatus" "LoanApplicationStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "disclosuresStatus" "DisclosuresStatus" NOT NULL DEFAULT 'NOT_SENT',
    "appraisalStatus" "AppraisalStatus" NOT NULL DEFAULT 'NOT_ORDERED',
    "loanLockConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "allInvoicesCollected" BOOLEAN NOT NULL DEFAULT false,
    "ctcNotified" BOOLEAN NOT NULL DEFAULT false,
    "closingScheduleDate" TIMESTAMP(3),
    "closingDocsSignedOut" BOOLEAN NOT NULL DEFAULT false,
    "fundingDate" TIMESTAMP(3),
    "postClosingComplete" BOOLEAN NOT NULL DEFAULT false,
    "reasonCode" TEXT,
    "nextTouchDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Phase4Pipeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommandCenterEntry" (
    "id" UUID NOT NULL,
    "contactId" UUID NOT NULL,
    "tag" "CommandCenterTag" NOT NULL,
    "sourcePhase" TEXT NOT NULL,
    "assignedBDRId" UUID NOT NULL,
    "assignedLOId" UUID,
    "lastContactDate" TIMESTAMP(3),
    "nextScheduledTouch" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommandCenterEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NurtureTouch" (
    "id" UUID NOT NULL,
    "commandCenterEntryId" UUID NOT NULL,
    "touchType" "NurtureTouchType" NOT NULL,
    "touchDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "NurtureTouch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "fieldDiffs" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Profile_email_key" ON "Profile"("email");

-- CreateIndex
CREATE INDEX "Contact_bdrId_idx" ON "Contact"("bdrId");

-- CreateIndex
CREATE INDEX "Contact_assignedLOId_idx" ON "Contact"("assignedLOId");

-- CreateIndex
CREATE INDEX "Contact_status_idx" ON "Contact"("status");

-- CreateIndex
CREATE INDEX "CoBorrower_contactId_idx" ON "CoBorrower"("contactId");

-- CreateIndex
CREATE INDEX "Asset_contactId_idx" ON "Asset"("contactId");

-- CreateIndex
CREATE UNIQUE INDEX "FicoInfo_contactId_key" ON "FicoInfo"("contactId");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyDetails_contactId_key" ON "PropertyDetails"("contactId");

-- CreateIndex
CREATE UNIQUE INDEX "OpportunityValue_contactId_key" ON "OpportunityValue"("contactId");

-- CreateIndex
CREATE UNIQUE INDEX "ScenarioDesk_contactId_key" ON "ScenarioDesk"("contactId");

-- CreateIndex
CREATE INDEX "Scenario_scenarioDeskId_idx" ON "Scenario"("scenarioDeskId");

-- CreateIndex
CREATE UNIQUE INDEX "Scenario_scenarioDeskId_scenarioNumber_key" ON "Scenario"("scenarioDeskId", "scenarioNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Phase4Pipeline_contactId_key" ON "Phase4Pipeline"("contactId");

-- CreateIndex
CREATE UNIQUE INDEX "CommandCenterEntry_contactId_key" ON "CommandCenterEntry"("contactId");

-- CreateIndex
CREATE INDEX "CommandCenterEntry_assignedBDRId_idx" ON "CommandCenterEntry"("assignedBDRId");

-- CreateIndex
CREATE INDEX "CommandCenterEntry_assignedLOId_idx" ON "CommandCenterEntry"("assignedLOId");

-- CreateIndex
CREATE INDEX "CommandCenterEntry_tag_idx" ON "CommandCenterEntry"("tag");

-- CreateIndex
CREATE INDEX "NurtureTouch_commandCenterEntryId_idx" ON "NurtureTouch"("commandCenterEntryId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_bdrId_fkey" FOREIGN KEY ("bdrId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_assignedLOId_fkey" FOREIGN KEY ("assignedLOId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoBorrower" ADD CONSTRAINT "CoBorrower_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FicoInfo" ADD CONSTRAINT "FicoInfo_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyDetails" ADD CONSTRAINT "PropertyDetails_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityValue" ADD CONSTRAINT "OpportunityValue_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScenarioDesk" ADD CONSTRAINT "ScenarioDesk_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scenario" ADD CONSTRAINT "Scenario_scenarioDeskId_fkey" FOREIGN KEY ("scenarioDeskId") REFERENCES "ScenarioDesk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Phase4Pipeline" ADD CONSTRAINT "Phase4Pipeline_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommandCenterEntry" ADD CONSTRAINT "CommandCenterEntry_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommandCenterEntry" ADD CONSTRAINT "CommandCenterEntry_assignedBDRId_fkey" FOREIGN KEY ("assignedBDRId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommandCenterEntry" ADD CONSTRAINT "CommandCenterEntry_assignedLOId_fkey" FOREIGN KEY ("assignedLOId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NurtureTouch" ADD CONSTRAINT "NurtureTouch_commandCenterEntryId_fkey" FOREIGN KEY ("commandCenterEntryId") REFERENCES "CommandCenterEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
