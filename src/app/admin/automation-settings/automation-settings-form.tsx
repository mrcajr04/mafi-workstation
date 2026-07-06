"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import {
  useForm,
  useWatch,
  type UseFormRegisterReturn,
} from "react-hook-form";
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
import { updateAutomationSettings } from "@/lib/actions/automation-settings-actions";
import { cn } from "@/lib/utils";

const automationSettingsSchema = z.object({
  discoveryFollowUpDays: z
    .number({
      error: "Days before sending is required.",
    })
    .int("Use a whole number.")
    .min(1, "Must be at least 1 day."),
  discoveryFollowUpEnabled: z.boolean(),
  reEngagementFollowUpDays: z
    .number({
      error: "Days before sending is required.",
    })
    .int("Use a whole number.")
    .min(1, "Must be at least 1 day."),
  reEngagementFollowUpEnabled: z.boolean(),
  welcomeEmailEnabled: z.boolean(),
});

type AutomationSettingsValues = z.infer<typeof automationSettingsSchema>;

type AutomationSettingsFormProps = {
  settings: AutomationSettingsValues;
};

export function AutomationSettingsForm({
  settings,
}: AutomationSettingsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<AutomationSettingsValues>({
    defaultValues: settings,
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    resolver: zodResolver(automationSettingsSchema),
  });
  const discoveryEnabled = useWatch({
    control,
    name: "discoveryFollowUpEnabled",
  });
  const reEngagementEnabled = useWatch({
    control,
    name: "reEngagementFollowUpEnabled",
  });

  async function onSubmit(values: AutomationSettingsValues) {
    setIsSubmitting(true);

    const result = await updateAutomationSettings(values);

    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Automation settings saved.");
  }

  return (
    <form className="space-y-4" noValidate onSubmit={handleSubmit(onSubmit)}>
      <AutomationCard
        description="Send a friendly intro after Contact Basics are saved."
        enabledField="welcomeEmailEnabled"
        register={register}
        title="Welcome Email"
      />

      <AutomationCard
        description="Send a check-in when a Phase 4 pipeline is pending for the configured number of days."
        enabledField="discoveryFollowUpEnabled"
        register={register}
        title="14-Day Discovery Follow-Up"
      >
        <DayField
          disabled={!discoveryEnabled}
          error={errors.discoveryFollowUpDays?.message}
          label="Days before sending"
          registration={register("discoveryFollowUpDays", {
            valueAsNumber: true,
          })}
        />
      </AutomationCard>

      <AutomationCard
        description="Send a soft re-engagement email after a not-moving-forward contact has been idle."
        enabledField="reEngagementFollowUpEnabled"
        register={register}
        title="60-Day Re-Engagement Follow-Up"
      >
        <DayField
          disabled={!reEngagementEnabled}
          error={errors.reEngagementFollowUpDays?.message}
          label="Days before sending"
          registration={register("reEngagementFollowUpDays", {
            valueAsNumber: true,
          })}
        />
      </AutomationCard>

      <div className="flex justify-end">
        <Button disabled={isSubmitting} type="submit">
          {isSubmitting ? "Saving..." : "Save automation settings"}
        </Button>
      </div>
    </form>
  );
}

function AutomationCard({
  children,
  description,
  enabledField,
  register,
  title,
}: {
  children?: ReactNode;
  description: string;
  enabledField:
    | "welcomeEmailEnabled"
    | "discoveryFollowUpEnabled"
    | "reEngagementFollowUpEnabled";
  register: ReturnType<typeof useForm<AutomationSettingsValues>>["register"];
  title: string;
}) {
  return (
    <Card className="border-mafi-border bg-mafi-bg-off shadow-sm">
      <CardHeader className="border-b border-mafi-border bg-mafi-bg-light">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-mafi-blue-primary">{title}</CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
          <Label className="flex min-h-10 cursor-pointer items-center gap-3 rounded-md border border-mafi-border bg-white px-3 py-2 text-sm font-semibold text-mafi-text-dark">
            <input
              className="h-4 w-4 accent-mafi-blue-primary"
              type="checkbox"
              {...register(enabledField)}
            />
            Enabled
          </Label>
        </div>
      </CardHeader>
      {children ? <CardContent className="pt-5">{children}</CardContent> : null}
    </Card>
  );
}

function DayField({
  disabled,
  error,
  label,
  registration,
}: {
  disabled: boolean;
  error?: string;
  label: string;
  registration: UseFormRegisterReturn;
}) {
  return (
    <div className="max-w-xs space-y-2">
      <Label htmlFor={registration.name}>
        {label} <span className="text-destructive">*</span>
      </Label>
      <Input
        aria-invalid={Boolean(error)}
        className={cn(error && "border-destructive")}
        disabled={disabled}
        id={registration.name}
        min={1}
        type="number"
        {...registration}
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
