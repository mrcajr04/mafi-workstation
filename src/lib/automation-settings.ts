import { prisma } from "@/lib/prisma";

export const AUTOMATION_SETTINGS_ID = "singleton";

export async function getAutomationSettings() {
  return prisma.automationSettings.upsert({
    where: {
      id: AUTOMATION_SETTINGS_ID,
    },
    update: {},
    create: {
      id: AUTOMATION_SETTINGS_ID,
    },
  });
}
