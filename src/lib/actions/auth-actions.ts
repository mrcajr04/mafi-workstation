"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma, RoleType } from "@prisma/client";
import { optionalUSPhoneToE164, US_PHONE_ERROR } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { getCurrentProfile } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";

type CreateProfileInput = {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: RoleType;
};

export async function createProfile(input: CreateProfileInput) {
  const phone = optionalUSPhoneToE164(input.phone);

  if (phone === "INVALID_PHONE") {
    return {
      success: false,
      error: US_PHONE_ERROR,
    };
  }

  try {
    await prisma.profile.create({
      data: {
        id: input.id,
        fullName: input.fullName,
        email: input.email,
        phone,
        role: input.role,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Profile creation failed", error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        success: false,
        error: "An account profile already exists for this email.",
      };
    }

    return {
      success: false,
      error: "Unable to create the account profile. Please try again.",
    };
  }
}

export async function signOut() {
  const supabase = await createClient();

  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirect("/login");
}

export async function completePasswordSetup() {
  const profile = await getCurrentProfile();

  if (!profile) {
    return {
      success: false,
      error: "UNAUTHENTICATED",
    } as const;
  }

  await prisma.profile.update({
    where: {
      id: profile.id,
    },
    data: {
      passwordSetupRequired: false,
    },
  });

  updateTag(`profile-${profile.id}`);
  revalidatePath("/", "layout");

  return {
    success: true,
  } as const;
}

export async function getPasswordSetupStatus() {
  const profile = await getCurrentProfile();

  if (!profile) {
    return {
      success: false,
      error: "UNAUTHENTICATED",
    } as const;
  }

  return {
    success: true,
    passwordSetupRequired: profile.passwordSetupRequired,
  } as const;
}
