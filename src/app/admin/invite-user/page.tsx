import { RoleType } from "@prisma/client";
import { InviteUserForm } from "@/components/workstation/invite-user-form";
import { requireRole } from "@/lib/rbac";

export default async function InviteUserPage() {
  const roleCheck = await requireRole([RoleType.OWNER]);

  if (!roleCheck.success) {
    return (
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold text-mafi-text-dark">
          Not authorized
        </h1>
        <p className="text-mafi-text-mid">
          Only Owners can invite users and assign roles.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-mafi-text-dark">
          Invite User
        </h1>
        <p className="text-mafi-text-mid">
          Create invite-only access for the MAFI Workstation.
        </p>
      </div>
      <InviteUserForm />
    </section>
  );
}
