"use server";

import { Prisma, RoleType } from "@prisma/client";
import { revalidatePath, updateTag } from "next/cache";
import { headers } from "next/headers";
import { logAccessDenied, logAuditEvent } from "@/lib/audit";
import { optionalUSPhoneToE164, US_PHONE_ERROR } from "@/lib/phone";
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

function logInviteError(label: string, error: unknown) {
  console.error(label, {
    error,
    message: error instanceof Error ? error.message : undefined,
    stack: error instanceof Error ? error.stack : undefined,
  });
}

async function getAppUrl() {
  const headerStore = await headers();
  const origin = headerStore.get("origin");

  if (origin) {
    return origin;
  }

  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

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

  const phone = optionalUSPhoneToE164(input.phone);

  if (phone === "INVALID_PHONE") {
    return {
      success: false,
      error: US_PHONE_ERROR,
    };
  }

  const supabase = createAdminClient();
  const appUrl = await getAppUrl();
  const { data, error } = await supabase.auth.admin.inviteUserByEmail(
    input.email,
    {
      redirectTo: `${appUrl}/set-password`,
    },
  );

  if (error || !data.user) {
    logInviteError("Supabase invite failed", error);
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
        passwordSetupRequired: true,
        phone,
        role: input.role,
      },
    });
    revalidatePath("/admin/users");
    updateTag("manage-users-list");

    return { success: true };
  } catch (profileError) {
    logInviteError("Invited user profile creation failed", profileError);

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

  const phone = optionalUSPhoneToE164(input.phone);

  if (phone === "INVALID_PHONE") {
    return {
      success: false,
      error: US_PHONE_ERROR,
    };
  }

  const nextProfile = {
    fullName,
    nmlsNumber:
      input.role === RoleType.LICENSED_LO || input.role === RoleType.OWNER
        ? input.nmlsNumber?.trim() || null
        : null,
    phone,
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
  updateTag("manage-users-list");

  return {
    success: true,
  };
}

export async function resendInvite(userId: string): Promise<AdminActionResult> {
  const access = await requireRole([RoleType.OWNER]);

  if (!access.success) {
    await logAccessDenied("RESEND_INVITE", "Profile", userId);
    return {
      success: false,
      error: "FORBIDDEN",
    };
  }

  const profile = await prisma.profile.findUnique({
    where: {
      id: userId,
    },
    select: {
      email: true,
      id: true,
      isActive: true,
      passwordSetupRequired: true,
    },
  });

  if (!profile) {
    return {
      success: false,
      error: "User profile not found.",
    };
  }

  if (!profile.isActive) {
    return {
      success: false,
      error: "Inactive users must be reactivated before resending an invite.",
    };
  }

  const supabase = createAdminClient();
  const appUrl = await getAppUrl();
  let passwordSetupRequired = profile.passwordSetupRequired;
  const emailResult = profile.passwordSetupRequired
    ? await supabase.auth.admin.inviteUserByEmail(profile.email, {
        redirectTo: `${appUrl}/set-password`,
      })
    : await supabase.auth.resetPasswordForEmail(profile.email, {
        redirectTo: `${appUrl}/reset-password`,
      });

  if (emailResult.error) {
    logInviteError("Supabase resend invite failed", emailResult.error);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      profile.email,
      {
        redirectTo: `${appUrl}/reset-password`,
      },
    );

    if (resetError) {
      logInviteError("Supabase password reset fallback failed", resetError);
      return {
        success: false,
        error: resetError.message,
      };
    }

    passwordSetupRequired = false;
  } else if (!profile.passwordSetupRequired) {
    passwordSetupRequired = false;
  }

  await logAuditEvent(access.data.id, "RESEND_INVITE", "Profile", profile.id, {
    email: profile.email,
  });
  await prisma.profile.update({
    where: {
      id: profile.id,
    },
    data: {
      passwordSetupRequired,
    },
  });
  revalidatePath("/admin/users");
  updateTag("manage-users-list");

  return {
    success: true,
  };
}

export async function deleteUserForTesting(
  userId: string,
): Promise<AdminActionResult> {
  const access = await requireRole([RoleType.OWNER]);

  if (!access.success) {
    await logAccessDenied("DELETE_USER", "Profile", userId);
    return {
      success: false,
      error: "FORBIDDEN",
    };
  }

  if (userId === access.data.id) {
    return {
      success: false,
      error: "You cannot delete your own account.",
    };
  }

  const profile = await prisma.profile.findUnique({
    where: {
      id: userId,
    },
    select: {
      email: true,
      fullName: true,
      id: true,
      role: true,
    },
  });

  if (!profile) {
    return {
      success: false,
      error: "User profile not found.",
    };
  }

  if (profile.role === RoleType.OWNER) {
    const ownerCount = await prisma.profile.count({
      where: {
        role: RoleType.OWNER,
      },
    });

    if (ownerCount <= 1) {
      return {
        success: false,
        error:
          "Cannot delete the only remaining Owner. Promote another user to Owner first.",
      };
    }
  }

  const [contactCount, commandCenterCount, auditLogCount] = await Promise.all([
    prisma.contact.count({
      where: {
        OR: [{ bdrId: userId }, { assignedLOId: userId }],
      },
    }),
    prisma.commandCenterEntry.count({
      where: {
        OR: [{ assignedBDRId: userId }, { assignedLOId: userId }],
      },
    }),
    prisma.auditLog.count({
      where: {
        userId,
      },
    }),
  ]);

  if (contactCount || commandCenterCount || auditLogCount) {
    return {
      success: false,
      error:
        "This user has related records and cannot be deleted safely. Deactivate them instead.",
    };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.auth.admin.deleteUser(userId);

  if (error) {
    console.error("Supabase user delete failed", error.message);
    return {
      success: false,
      error: error.message,
    };
  }

  await logAuditEvent(access.data.id, "DELETE_USER", "Profile", profile.id, {
    email: profile.email,
    fullName: profile.fullName,
    source: "Temporary testing action",
  });

  await prisma.profile.delete({
    where: {
      id: profile.id,
    },
  });

  revalidatePath("/admin/users");
  updateTag("manage-users-list");

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
  updateTag("manage-users-list");

  return {
    success: true,
  };
}

// Local testing note: the first OWNER account must be created manually, either
// through Supabase Auth plus a matching Profile row, or by temporarily bypassing
// RBAC during setup. Do not expose a public bootstrap flow.
