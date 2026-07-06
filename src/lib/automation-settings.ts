import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

export const AUTOMATION_SETTINGS_ID = "singleton";

export async function getFreshAutomationSettings() {
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

export async function getAutomationSettings() {
  return unstable_cache(
    () => getFreshAutomationSettings(),
    ["automation-settings"],
    {
      revalidate: 300,
      tags: ["automation-settings"],
    },
  )();
}
