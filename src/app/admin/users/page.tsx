import { RoleType } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { ManageUsersList } from "@/app/admin/users/manage-users-list";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { createAdminClient } from "@/lib/supabase/admin";

const getCachedManageUsers = unstable_cache(
  async () => {
    const [profiles, authUsersResult] = await Promise.all([
      prisma.profile.findMany({
        orderBy: {
          fullName: "asc",
        },
        select: {
          email: true,
          fullName: true,
          id: true,
          isActive: true,
          nmlsNumber: true,
          phone: true,
          role: true,
        },
      }),
      createAdminClient().auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      }),
    ]);
    const authUsersAvailable = !authUsersResult.error;
    const authUsers = authUsersAvailable ? authUsersResult.data.users : [];
    const authUsersById = new Map(
      authUsers.map((user) => [user.id, user]),
    );

    return profiles.map((profile) => {
      const authUser = authUsersById.get(profile.id);

      return {
        ...profile,
        canResendInvite:
          authUsersAvailable && profile.isActive && !authUser?.last_sign_in_at,
      };
    });
  },
  ["manage-users-list"],
  {
    revalidate: 60,
    tags: ["manage-users-list"],
  },
);

export default async function ManageUsersPage() {
  const access = await requireRole([RoleType.OWNER]);

  if (!access.success) {
    return (
      <main className="mx-auto max-w-6xl">
        <p className="text-sm text-destructive">
          Not authorized. Manage Users is available only to Owners.
        </p>
      </main>
    );
  }

  const users = await getCachedManageUsers();

  return (
    <main className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-mafi-blue-primary">
          Admin
        </p>
        <h1 className="mt-2 text-3xl font-bold text-mafi-text-dark">
          Manage Users
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-mafi-text-mid">
          Edit user profiles and deactivate or reactivate accounts without
          deleting history.
        </p>
      </div>

      <ManageUsersList
        users={users.map((user) => ({
          email: user.email,
          fullName: user.fullName,
          id: user.id,
          canResendInvite: user.canResendInvite,
          isActive: user.isActive,
          isSelf: user.id === access.data.id,
          nmlsNumber: user.nmlsNumber ?? "",
          phone: user.phone ?? "",
          role: user.role,
        }))}
      />
    </main>
  );
}
