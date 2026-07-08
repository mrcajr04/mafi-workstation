import { RoleType } from "@prisma/client";
import { redirect } from "next/navigation";
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

  redirect("/admin/users");
}
