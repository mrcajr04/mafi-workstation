import { RoleType } from "@prisma/client";
import { AutomationSettingsForm } from "@/app/admin/automation-settings/automation-settings-form";
import { getAutomationSettings } from "@/lib/automation-settings";
import { requireRole } from "@/lib/rbac";

export default async function AutomationSettingsPage() {
  const access = await requireRole([RoleType.OWNER]);

  if (!access.success) {
    return (
      <main className="mx-auto max-w-5xl">
        <p className="text-sm text-destructive">
          Not authorized. Automation Settings is available only to Owners.
        </p>
      </main>
    );
  }

  const settings = await getAutomationSettings();

  return (
    <main className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-mafi-blue-primary">
          Admin
        </p>
        <h1 className="mt-2 text-3xl font-bold text-mafi-text-dark">
          Automation Settings
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-mafi-text-mid">
          Control automated prospect emails without changing code.
        </p>
      </div>

      <AutomationSettingsForm
        settings={{
          discoveryFollowUpDays: settings.discoveryFollowUpDays,
          discoveryFollowUpEnabled: settings.discoveryFollowUpEnabled,
          reEngagementFollowUpDays: settings.reEngagementFollowUpDays,
          reEngagementFollowUpEnabled: settings.reEngagementFollowUpEnabled,
          welcomeEmailEnabled: settings.welcomeEmailEnabled,
        }}
      />
    </main>
  );
}
