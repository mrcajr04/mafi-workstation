"use server";

import { Prisma, RoleType } from "@prisma/client";
import { logAccessDenied } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { createAdminClient } from "@/lib/supabase/admin";

type InviteUserInput = {
  fullName: string;
  email: string;
  phone?: string;
  role: RoleType;
};

type InviteUserResult =
  | { success: true }
  | { success: false; error: string };

export async function inviteUser(
  input: InviteUserInput,
): Promise<InviteUserResult> {
  const roleCheck = await requireRole([RoleType.OWNER]);

  if (!roleCheck.success) {
    await logAccessDenied("INVITE_USER", "Profile", input.email || "pending");
    return {
      success: false,
      error: "FORBIDDEN",
    };
  }

  if (!input.fullName || !input.email || !input.role) {
    return {
      success: false,
      error: "Full name, email, and role are required.",
    };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.auth.admin.inviteUserByEmail(
    input.email,
  );

  if (error || !data.user) {
    console.warn("Supabase invite failed", error?.message);
    return {
      success: false,
      error: error?.message ?? "Unable to send invite.",
    };
  }

  try {
    await prisma.profile.create({
      data: {
        id: data.user.id,
        fullName: input.fullName,
        email: input.email,
        phone: input.phone || null,
        role: input.role,
      },
    });

    return { success: true };
  } catch (profileError) {
    console.error("Invited user profile creation failed", profileError);

    if (
      profileError instanceof Prisma.PrismaClientKnownRequestError &&
      profileError.code === "P2002"
    ) {
      return {
        success: false,
        error: "A profile already exists for this user.",
      };
    }

    return {
      success: false,
      error: "Invite was sent, but the profile could not be created.",
    };
  }
}

// Local testing note: the first OWNER account must be created manually, either
// through Supabase Auth plus a matching Profile row, or by temporarily bypassing
// RBAC during setup. Do not expose a public bootstrap flow.
