-- CreateTable
CREATE TABLE "AutomationSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "welcomeEmailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "discoveryFollowUpEnabled" BOOLEAN NOT NULL DEFAULT true,
    "discoveryFollowUpDays" INTEGER NOT NULL DEFAULT 14,
    "reEngagementFollowUpEnabled" BOOLEAN NOT NULL DEFAULT true,
    "reEngagementFollowUpDays" INTEGER NOT NULL DEFAULT 60,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutomationSettings_pkey" PRIMARY KEY ("id")
);
