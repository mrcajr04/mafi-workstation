import { SettingsProfileForm } from "@/components/workstation/settings-profile-form";
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
    </main>
  );
}
