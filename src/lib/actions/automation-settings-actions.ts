"use server";

import { revalidatePath } from "next/cache";
import { logAccessDenied, logAuditEvent } from "@/lib/audit";
import {
  AUTOMATION_SETTINGS_ID,
  getAutomationSettings,
} from "@/lib/automation-settings";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { RoleType } from "@prisma/client";

type UpdateAutomationSettingsInput = {
  discoveryFollowUpDays: number;
  discoveryFollowUpEnabled: boolean;
  reEngagementFollowUpDays: number;
  reEngagementFollowUpEnabled: boolean;
  welcomeEmailEnabled: boolean;
};

type UpdateAutomationSettingsResult =
  | { success: true }
  | { success: false; error: string };

function changedFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
) {
  return Object.fromEntries(
    Object.entries(after)
      .filter(([key, value]) => before[key] !== value)
      .map(([key, value]) => [
        key,
        {
          after: value,
          before: before[key],
        },
      ]),
  );
}

export async function updateAutomationSettings(
  input: UpdateAutomationSettingsInput,
): Promise<UpdateAutomationSettingsResult> {
  const access = await requireRole([RoleType.OWNER]);

  if (!access.success) {
    await logAccessDenied(
      "UPDATE_AUTOMATION_SETTINGS",
      "AutomationSettings",
      AUTOMATION_SETTINGS_ID,
    );
    return {
      success: false,
      error: "FORBIDDEN",
    };
  }

  const discoveryFollowUpDays = Number(input.discoveryFollowUpDays);
  const reEngagementFollowUpDays = Number(input.reEngagementFollowUpDays);

  if (
    !Number.isInteger(discoveryFollowUpDays) ||
    discoveryFollowUpDays < 1 ||
    !Number.isInteger(reEngagementFollowUpDays) ||
    reEngagementFollowUpDays < 1
  ) {
    return {
      success: false,
      error: "Follow-up days must be whole numbers greater than zero.",
    };
  }

  const before = await getAutomationSettings();
  const nextSettings = {
    discoveryFollowUpDays,
    discoveryFollowUpEnabled: input.discoveryFollowUpEnabled,
    reEngagementFollowUpDays,
    reEngagementFollowUpEnabled: input.reEngagementFollowUpEnabled,
    welcomeEmailEnabled: input.welcomeEmailEnabled,
  };

  await prisma.automationSettings.update({
    where: {
      id: before.id,
    },
    data: nextSettings,
  });

  await logAuditEvent(
    access.data.id,
    "UPDATE_AUTOMATION_SETTINGS",
    "AutomationSettings",
    before.id,
    {
      changedFields: changedFields(before, nextSettings),
    },
  );

  revalidatePath("/admin/automation-settings");

  return {
    success: true,
  };
}
