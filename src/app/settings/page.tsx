import Link from "next/link";
import { RoleType } from "@prisma/client";
import { SettingsProfileForm } from "@/components/workstation/settings-profile-form";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/rbac";

export default async function SettingsPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    return (
      <main className="mx-auto max-w-3xl">
        <p className="text-sm text-destructive">
          You must be logged in to view settings.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-mafi-blue-primary">
          Account
        </p>
        <h1 className="mt-2 text-3xl font-bold text-mafi-text-dark">
          Settings
        </h1>
        <p className="mt-1 text-sm text-mafi-text-mid">
          Manage your workstation profile details.
        </p>
      </div>
      <SettingsProfileForm
        profile={{
          fullName: profile.fullName,
          email: profile.email,
          phone: profile.phone,
          role: profile.role,
          nmlsNumber: profile.nmlsNumber,
        }}
      />
      {profile.role === RoleType.OWNER ? (
        <Card className="border-mafi-border bg-mafi-bg-white">
          <CardContent className="space-y-3 p-5">
            <div>
              <h2 className="text-lg font-bold text-mafi-text-dark">
                Admin Settings
              </h2>
              <p className="text-sm text-mafi-text-mid">
                Manage users and editable email templates.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <SettingsLink
                description="Edit users, resend invites, and invite new users."
                href="/admin/users"
                label="Manage Users"
              />
              <SettingsLink
                description="Control welcome and follow-up email automations."
                href="/admin/automation-settings"
                label="Automation Settings"
              />
              <SettingsLink
                description="Edit automated email template content."
                href="/admin/email-templates"
                label="Email Templates"
              />
            </div>
          </CardContent>
        </Card>
      ) : null}
    </main>
  );
}

function SettingsLink({
  description,
  href,
  label,
}: {
  description: string;
  href: string;
  label: string;
}) {
  return (
    <Link
      className="rounded-md border border-mafi-border bg-mafi-bg-off p-4 transition hover:border-mafi-blue-primary hover:bg-mafi-bg-light"
      href={href}
    >
      <span className="font-semibold text-mafi-blue-primary">{label}</span>
      <span className="mt-1 block text-sm text-mafi-text-mid">
        {description}
      </span>
    </Link>
  );
}
