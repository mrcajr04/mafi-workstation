"use client";

import { RoleType } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateOwnProfile } from "@/lib/actions/profile-actions";
import { formatUSPhone, isValidUSPhone, maskUSPhoneInput, US_PHONE_ERROR } from "@/lib/phone";
import { cn } from "@/lib/utils";

function buildSettingsProfileSchema(role: RoleType) {
  return z
    .object({
      fullName: z.string().trim().min(1, "Full name is required."),
      phone: z
        .string()
        .optional()
        .refine((value) => !value?.trim() || isValidUSPhone(value), {
          message: US_PHONE_ERROR,
        }),
      nmlsNumber: z.string().optional(),
    })
    .superRefine((values, context) => {
      if (role === RoleType.LICENSED_LO && !values.nmlsNumber?.trim()) {
        context.addIssue({
          code: "custom",
          message: "NMLS number is required for Licensed LO users.",
          path: ["nmlsNumber"],
        });
      }
    });
}

type SettingsProfileValues = z.infer<
  ReturnType<typeof buildSettingsProfileSchema>
>;

type SettingsProfileFormProps = {
  profile: {
    fullName: string;
    email: string;
    phone: string | null;
    role: RoleType;
    nmlsNumber: string | null;
  };
};

export function SettingsProfileForm({ profile }: SettingsProfileFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canEditNmls =
    profile.role === RoleType.LICENSED_LO || profile.role === RoleType.OWNER;

  const {
    formState: { errors },
    handleSubmit,
    control,
    register,
  } = useForm<SettingsProfileValues>({
    defaultValues: {
      fullName: profile.fullName,
      phone: profile.phone ? formatUSPhone(profile.phone, "") : "",
      nmlsNumber: profile.nmlsNumber ?? "",
    },
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    resolver: zodResolver(buildSettingsProfileSchema(profile.role)),
  });

  async function onSubmit(values: SettingsProfileValues) {
    setIsSubmitting(true);

    const result = await updateOwnProfile({
      fullName: values.fullName,
      phone: values.phone,
      nmlsNumber: canEditNmls ? values.nmlsNumber : undefined,
    });

    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Profile updated.");
    router.refresh();
  }

  return (
    <Card className="border-mafi-border bg-mafi-bg-off shadow-sm">
      <CardHeader className="border-b border-mafi-border bg-mafi-bg-light">
        <CardTitle className="text-mafi-blue-primary">Profile</CardTitle>
        <CardDescription>
          Update the information tied to your workstation account.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form className="space-y-5" noValidate onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fullName">
                Full name <span className="text-destructive">*</span>
              </Label>
              <Input
                aria-invalid={Boolean(errors.fullName)}
                className={cn(errors.fullName && "border-destructive")}
                id="fullName"
                {...register("fullName")}
              />
              {errors.fullName ? (
                <p className="text-sm text-destructive">
                  {errors.fullName.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                className="bg-mafi-bg-light text-mafi-text-mid"
                id="email"
                readOnly
                value={profile.email}
              />
              <p className="text-xs text-mafi-text-light">
                Email is managed through your login account.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Controller
                control={control}
                name="phone"
                render={({ field }) => (
                  <Input
                    aria-invalid={Boolean(errors.phone)}
                    className={cn(errors.phone && "border-destructive")}
                    id="phone"
                    onChange={(event) =>
                      field.onChange(maskUSPhoneInput(event.target.value))
                    }
                    type="tel"
                    value={field.value ?? ""}
                  />
                )}
              />
              {errors.phone ? (
                <p className="text-sm text-destructive">
                  {errors.phone.message}
                </p>
              ) : null}
            </div>
            {canEditNmls ? (
              <div className="space-y-2">
                <Label htmlFor="nmlsNumber">
                  NMLS number{" "}
                  {profile.role === RoleType.LICENSED_LO ? (
                    <span className="text-destructive">*</span>
                  ) : null}
                </Label>
                <Input
                  aria-invalid={Boolean(errors.nmlsNumber)}
                  className={cn(errors.nmlsNumber && "border-destructive")}
                  id="nmlsNumber"
                  {...register("nmlsNumber")}
                />
                {errors.nmlsNumber ? (
                  <p className="text-sm text-destructive">
                    {errors.nmlsNumber.message}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
          <div className="flex justify-end">
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
