"use server";

import { RoleType } from "@prisma/client";
import { updateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentProfile } from "@/lib/rbac";

type UpdateOwnProfileInput = {
  fullName: string;
  phone?: string;
  nmlsNumber?: string;
};

type UpdateOwnProfileResult =
  | { success: true }
  | { success: false; error: string };

export async function updateOwnProfile(
  input: UpdateOwnProfileInput,
): Promise<UpdateOwnProfileResult> {
  const profile = await getCurrentProfile();

  if (!profile) {
    return {
      success: false,
      error: "You must be logged in to update your profile.",
    };
  }

  const fullName = input.fullName.trim();

  if (!fullName) {
    return {
      success: false,
      error: "Full name is required.",
    };
  }

  const canEditNmls =
    profile.role === RoleType.LICENSED_LO || profile.role === RoleType.OWNER;

  if (profile.role === RoleType.LICENSED_LO && !input.nmlsNumber?.trim()) {
    return {
      success: false,
      error: "NMLS number is required for Licensed LO users.",
    };
  }

  await prisma.profile.update({
    where: {
      id: profile.id,
    },
    data: {
      fullName,
      phone: input.phone?.trim() || null,
      ...(canEditNmls
        ? {
            nmlsNumber: input.nmlsNumber?.trim() || null,
          }
        : {}),
    },
  });

  updateTag(`profile-${profile.id}`);

  return {
    success: true,
  };
}
