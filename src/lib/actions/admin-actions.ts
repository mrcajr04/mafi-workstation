"use server";

import { Prisma, RoleType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { logAccessDenied, logAuditEvent } from "@/lib/audit";
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

type UpdateUserProfileInput = {
  fullName: string;
  nmlsNumber?: string;
  phone?: string;
  role: RoleType;
  userId: string;
};

type AdminActionResult = { success: true } | { success: false; error: string };

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

export async function updateUserProfile(
  input: UpdateUserProfileInput,
): Promise<AdminActionResult> {
  const access = await requireRole([RoleType.OWNER]);

  if (!access.success) {
    await logAccessDenied("UPDATE_USER_PROFILE", "Profile", input.userId);
    return {
      success: false,
      error: "FORBIDDEN",
    };
  }

  const fullName = input.fullName.trim();

  if (!fullName) {
    return {
      success: false,
      error: "Full name is required.",
    };
  }

  const existingProfile = await prisma.profile.findUnique({
    where: {
      id: input.userId,
    },
    select: {
      fullName: true,
      nmlsNumber: true,
      phone: true,
      role: true,
    },
  });

  if (!existingProfile) {
    return {
      success: false,
      error: "User profile not found.",
    };
  }

  if (input.role === RoleType.LICENSED_LO && !input.nmlsNumber?.trim()) {
    return {
      success: false,
      error: "NMLS number is required for Licensed LO users.",
    };
  }

  if (existingProfile.role === RoleType.OWNER && input.role !== RoleType.OWNER) {
    const ownerCount = await prisma.profile.count({
      where: {
        role: RoleType.OWNER,
      },
    });

    if (ownerCount <= 1) {
      return {
        success: false,
        error:
          "Cannot demote the only remaining Owner. Promote another user to Owner first.",
      };
    }
  }

  const nextProfile = {
    fullName,
    nmlsNumber:
      input.role === RoleType.LICENSED_LO || input.role === RoleType.OWNER
        ? input.nmlsNumber?.trim() || null
        : null,
    phone: input.phone?.trim() || null,
    role: input.role,
  };

  await prisma.profile.update({
    where: {
      id: input.userId,
    },
    data: nextProfile,
  });

  await logAuditEvent(
    access.data.id,
    "UPDATE_USER_PROFILE",
    "Profile",
    input.userId,
    {
      changedFields: changedFields(existingProfile, nextProfile),
    },
  );
  revalidatePath("/admin/users");

  return {
    success: true,
  };
}

export async function setUserActiveStatus(
  userId: string,
  isActive: boolean,
): Promise<AdminActionResult> {
  const access = await requireRole([RoleType.OWNER]);

  if (!access.success) {
    await logAccessDenied(
      isActive ? "REACTIVATE_USER" : "DEACTIVATE_USER",
      "Profile",
      userId,
    );
    return {
      success: false,
      error: "FORBIDDEN",
    };
  }

  if (userId === access.data.id && !isActive) {
    return {
      success: false,
      error: "You cannot deactivate your own account.",
    };
  }

  const profile = await prisma.profile.findUnique({
    where: {
      id: userId,
    },
    select: {
      isActive: true,
    },
  });

  if (!profile) {
    return {
      success: false,
      error: "User profile not found.",
    };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.auth.admin.updateUserById(userId, {
    ban_duration: isActive ? "none" : "876000h",
  });

  if (error) {
    console.error("Supabase user active status update failed", error.message);
    return {
      success: false,
      error: error.message,
    };
  }

  await prisma.profile.update({
    where: {
      id: userId,
    },
    data: {
      isActive,
    },
  });

  await logAuditEvent(
    access.data.id,
    isActive ? "REACTIVATE_USER" : "DEACTIVATE_USER",
    "Profile",
    userId,
    {
      changedFields: {
        isActive: {
          after: isActive,
          before: profile.isActive,
        },
      },
    },
  );
  revalidatePath("/admin/users");

  return {
    success: true,
  };
}

// Local testing note: the first OWNER account must be created manually, either
// through Supabase Auth plus a matching Profile row, or by temporarily bypassing
// RBAC during setup. Do not expose a public bootstrap flow.
