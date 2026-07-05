"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma, RoleType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

type CreateProfileInput = {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: RoleType;
};

export async function createProfile(input: CreateProfileInput) {
  try {
    await prisma.profile.create({
      data: {
        id: input.id,
        fullName: input.fullName,
        email: input.email,
        phone: input.phone || null,
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
