"use client";

import { RoleType } from "@prisma/client";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { inviteUser } from "@/lib/actions/admin-actions";
import { cn } from "@/lib/utils";

const roles = [
  RoleType.BDR,
  RoleType.LICENSED_LO,
  RoleType.LOAN_PROCESSOR,
  RoleType.COMPLIANCE_OFFICER,
  RoleType.OWNER,
];

const inviteUserSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required."),
  email: z.string().trim().min(1, "Email is required.").email("Enter a valid email address."),
  phone: z.string().optional(),
  role: z.nativeEnum(RoleType, {
    error: "Role is required.",
  }),
});

type InviteUserValues = z.infer<typeof inviteUserSchema>;

export function InviteUserForm() {
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<InviteUserValues>({
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      role: RoleType.BDR,
    },
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    resolver: zodResolver(inviteUserSchema),
  });

  async function onSubmit(values: InviteUserValues) {
    setError("");
    setSuccessMessage("");

    setIsSubmitting(true);

    const result = await inviteUser({
      fullName: values.fullName,
      email: values.email,
      phone: values.phone,
      role: values.role,
    });

    setIsSubmitting(false);

    if (!result.success) {
      setError(
        result.error === "FORBIDDEN"
          ? "You do not have permission to invite users."
          : result.error,
      );
      return;
    }

    setSuccessMessage(`Invite sent to ${values.email}`);
    reset();
  }

  return (
    <Card className="max-w-2xl border-mafi-border bg-mafi-bg-off">
      <CardHeader>
        <CardTitle>Invite User</CardTitle>
        <CardDescription>
          Send a secure invite and assign the user role.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" noValidate onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="fullName">Full name</Label>
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
              aria-invalid={Boolean(errors.email)}
              className={cn(errors.email && "border-destructive")}
              id="email"
              type="email"
              {...register("email")}
            />
            {errors.email ? (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              {...register("phone")}
            />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Controller
              control={control}
              name="role"
              render={({ field }) => (
                <Select
                  onValueChange={(value) => field.onChange(value as RoleType)}
                  value={field.value}
                >
                  <SelectTrigger
                    aria-invalid={Boolean(errors.role)}
                    className={cn(errors.role && "border-destructive")}
                  >
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((roleOption) => (
                      <SelectItem key={roleOption} value={roleOption}>
                        {roleOption}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.role ? (
              <p className="text-sm text-destructive">{errors.role.message}</p>
            ) : null}
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {successMessage ? (
            <p className="text-sm font-medium text-mafi-status-green">
              {successMessage}
            </p>
          ) : null}
          <Button disabled={isSubmitting} type="submit">
            {isSubmitting ? "Sending invite..." : "Send invite"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
