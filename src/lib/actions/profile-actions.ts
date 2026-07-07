"use server";

import { RoleType } from "@prisma/client";
import { updateTag } from "next/cache";
import { optionalUSPhoneToE164, US_PHONE_ERROR } from "@/lib/phone";
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

type UpdateMarketingProfileInput = {
  facebookUrl?: string;
  googleBusinessUrl?: string;
  instagramUrl?: string;
  landingPageBio?: string;
  landingPageHeadline?: string;
  linkedinUrl?: string;
  profilePhotoUrl?: string;
  whatsappNumber?: string;
  xTwitterUrl?: string;
};

const urlFields: Array<keyof UpdateMarketingProfileInput> = [
  "facebookUrl",
  "googleBusinessUrl",
  "instagramUrl",
  "linkedinUrl",
  "profilePhotoUrl",
  "xTwitterUrl",
];

function optionalUrl(value?: string) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  if (!/^https?:\/\//i.test(trimmed)) {
    return "INVALID_URL";
  }

  return trimmed;
}

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

  const phone = optionalUSPhoneToE164(input.phone);

  if (phone === "INVALID_PHONE") {
    return {
      success: false,
      error: US_PHONE_ERROR,
    };
  }

  await prisma.profile.update({
    where: {
      id: profile.id,
    },
    data: {
      fullName,
      phone,
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

export async function updateMarketingProfile(
  input: UpdateMarketingProfileInput,
): Promise<UpdateOwnProfileResult> {
  const profile = await getCurrentProfile();

  if (!profile) {
    return {
      success: false,
      error: "You must be logged in to update your marketing profile.",
    };
  }

  if (
    profile.role !== RoleType.BDR &&
    profile.role !== RoleType.LICENSED_LO &&
    profile.role !== RoleType.OWNER
  ) {
    return {
      success: false,
      error: "FORBIDDEN",
    };
  }

  for (const field of urlFields) {
    if (optionalUrl(input[field]) === "INVALID_URL") {
      return {
        success: false,
        error: "URLs must start with http:// or https://.",
      };
    }
  }

  const whatsappNumber = optionalUSPhoneToE164(input.whatsappNumber);

  if (whatsappNumber === "INVALID_PHONE") {
    return {
      success: false,
      error: US_PHONE_ERROR,
    };
  }

  await prisma.profile.update({
    where: {
      id: profile.id,
    },
    data: {
      facebookUrl: optionalUrl(input.facebookUrl) || null,
      googleBusinessUrl: optionalUrl(input.googleBusinessUrl) || null,
      instagramUrl: optionalUrl(input.instagramUrl) || null,
      landingPageBio: input.landingPageBio?.trim() || null,
      landingPageHeadline: input.landingPageHeadline?.trim() || null,
      linkedinUrl: optionalUrl(input.linkedinUrl) || null,
      profilePhotoUrl: optionalUrl(input.profilePhotoUrl) || null,
      whatsappNumber,
      xTwitterUrl: optionalUrl(input.xTwitterUrl) || null,
    },
  });

  updateTag(`profile-${profile.id}`);

  return {
    success: true,
  };
}
