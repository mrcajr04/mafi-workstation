-- AlterTable
ALTER TABLE "CommandCenterEntry" ADD COLUMN     "followUpEmailSentAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Phase4Pipeline" ADD COLUMN     "followUpEmailSentAt" TIMESTAMP(3);
