import { RoleType } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: "UNAUTHENTICATED" | "PROFILE_NOT_FOUND" | "FORBIDDEN" };

export const phaseWritePermissions = {
  phase1And2: [RoleType.BDR, RoleType.OWNER],
  phase3: [RoleType.LICENSED_LO, RoleType.OWNER],
  phase4: [RoleType.LICENSED_LO, RoleType.LOAN_PROCESSOR, RoleType.OWNER],
  commandCenter: [RoleType.BDR, RoleType.OWNER],
  auditLogDirectWrite: [],
  auditLogRead: [RoleType.COMPLIANCE_OFFICER, RoleType.OWNER],
} satisfies Record<string, RoleType[]>;

export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims.sub) {
    return null;
  }

  return {
    id: data.claims.sub,
  };
});

export const getCurrentProfile = cache(async () => {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  return unstable_cache(
    () =>
      prisma.profile.findUnique({
        where: {
          id: user.id,
        },
      }),
    [`profile-${user.id}`],
    {
      revalidate: 300,
      tags: [`profile-${user.id}`],
    },
  )();
});

export async function requireRole(allowedRoles: RoleType[]) {
  const profile = await getCurrentProfile();

  if (!profile) {
    return {
      success: false,
      error: "UNAUTHENTICATED",
    } as const;
  }

  if (!allowedRoles.includes(profile.role)) {
    return {
      success: false,
      error: "FORBIDDEN",
    } as const;
  }

  return {
    success: true,
    data: profile,
  } as const;
}
