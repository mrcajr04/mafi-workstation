"use client";

import {
  AppraisalStatus,
  CreditAuthorizationStatus,
  DecisionBranch,
  DisclosuresStatus,
  LoanApplicationStatus,
  LoanApprovalStatus,
  PricingLockFloat,
} from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  updatePhase4DecisionBranch,
  updatePhase4Pipeline,
  Phase4PipelineInput,
} from "@/lib/actions/phase4-actions";
import {
  appraisalStatusLabels,
  creditAuthorizationStatusLabels,
  decisionBranchLabels,
  disclosuresStatusLabels,
  loanApplicationStatusLabels,
  loanApprovalStatusLabels,
  pricingLockFloatLabels,
} from "@/lib/labels";

type Phase4FormState = Phase4PipelineInput;

type Phase4FormProps = {
  canEdit: boolean;
  contactId: string;
  initialData?: Partial<Phase4FormState>;
};

const defaultState = (contactId: string): Phase4FormState => ({
  allInvoicesCollected: false,
  appraisalStatus: AppraisalStatus.NOT_ORDERED,
  closingDocsSignedOut: false,
  closingScheduleDate: "",
  contactId,
  creditAuthorizationStatus: CreditAuthorizationStatus.NOT_STARTED,
  ctcNotified: false,
  decisionBranch: DecisionBranch.PENDING,
  disclosuresStatus: DisclosuresStatus.NOT_SENT,
  fundingDate: "",
  loanApplicationStatus: LoanApplicationStatus.NOT_STARTED,
  loanApprovalStatus: LoanApprovalStatus.NOT_STARTED,
  loanLockConfirmed: false,
  postClosingComplete: false,
  pricingLockFloat: PricingLockFloat.NOT_SET,
});

export function Phase4Form({ canEdit, contactId, initialData }: Phase4FormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [reengagementReason, setReengagementReason] = useState("");
  const [reengagementOtherReason, setReengagementOtherReason] = useState("");
  const [reengagementTouchDate, setReengagementTouchDate] = useState("");
  const [form, setForm] = useState<Phase4FormState>({
    ...defaultState(contactId),
    ...initialData,
    contactId,
  });

  function updateField<T extends keyof Phase4FormState>(
    field: T,
    value: Phase4FormState[T],
  ) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  function save() {
    startTransition(async () => {
      const result = await updatePhase4Pipeline(form);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Phase 4 pipeline saved.");
      router.refresh();
    });
  }

  function proceedToProcessing() {
    startTransition(async () => {
      const result = await updatePhase4DecisionBranch({
        contactId,
        decisionBranch: DecisionBranch.PROCEED_TO_PROCESSING,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      updateField("decisionBranch", DecisionBranch.PROCEED_TO_PROCESSING);
      toast.success("Contact routed to processing.");
      router.refresh();
    });
  }

  function routeToReengagement() {
    const reasonCode =
      reengagementReason === "Other"
        ? reengagementOtherReason.trim()
        : reengagementReason;

    startTransition(async () => {
      const result = await updatePhase4DecisionBranch({
        contactId,
        decisionBranch: DecisionBranch.RE_ENGAGEMENT,
        nextTouchDate: reengagementTouchDate,
        reasonCode,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      updateField("decisionBranch", DecisionBranch.RE_ENGAGEMENT);
      toast.success("Contact routed to re-engagement.");
      router.refresh();
    });
  }

  const canConfirmReengagement =
    Boolean(reengagementTouchDate) &&
    Boolean(
      reengagementReason === "Other"
        ? reengagementOtherReason.trim()
        : reengagementReason,
    );

  return (
    <Card className="border-mafi-border bg-mafi-bg-white">
      <CardHeader className="border-b border-mafi-border bg-mafi-bg-light">
        <CardTitle className="text-mafi-blue-primary">
          Phase 4 Pipeline Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 pt-5">
        <div className="rounded-lg border border-mafi-border bg-mafi-bg-light p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mafi-blue-primary">
                Decision Branch
              </p>
              <h3 className="mt-1 text-lg font-semibold text-mafi-text-dark">
                {decisionBranchLabels[form.decisionBranch]}
              </h3>
              <p className="mt-1 text-sm text-mafi-text-mid">
                Choose whether this file keeps moving forward or goes back to
                nurture.
              </p>
            </div>

            {canEdit ? (
              <div className="flex flex-col gap-2 sm:flex-row">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button disabled={isPending} type="button">
                      Proceed to Processing
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Proceed to Processing?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will keep the contact in Phase 4 processing.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={proceedToProcessing}>
                        Confirm
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button disabled={isPending} type="button" variant="outline">
                      Route to Re-engagement
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Route to Re-engagement?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will move the contact to the Command Center for BDR
                        follow-up.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-4 py-2">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">Reason</Label>
                        <Select
                          onValueChange={setReengagementReason}
                          value={reengagementReason}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a reason" />
                          </SelectTrigger>
                          <SelectContent>
                            {[
                              "Chose another lender",
                              "Rates changed",
                              "Not ready now",
                              "Lost contact",
                              "Other",
                            ].map((reason) => (
                              <SelectItem key={reason} value={reason}>
                                {reason}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {reengagementReason === "Other" ? (
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold">
                            Other reason
                          </Label>
                          <Input
                            onChange={(event) =>
                              setReengagementOtherReason(event.target.value)
                            }
                            placeholder="Enter reason"
                            value={reengagementOtherReason}
                          />
                        </div>
                      ) : null}

                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">
                          Next touch date
                        </Label>
                        <Input
                          onChange={(event) =>
                            setReengagementTouchDate(event.target.value)
                          }
                          type="date"
                          value={reengagementTouchDate}
                        />
                      </div>
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        disabled={!canConfirmReengagement}
                        onClick={routeToReengagement}
                      >
                        Confirm
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <EnumSelect
            disabled={!canEdit}
            label="Pricing Lock / Float"
            labels={pricingLockFloatLabels}
            onChange={(value) =>
              updateField("pricingLockFloat", value as PricingLockFloat)
            }
            value={form.pricingLockFloat}
          />
          <EnumSelect
            disabled={!canEdit}
            label="Loan Approval"
            labels={loanApprovalStatusLabels}
            onChange={(value) =>
              updateField("loanApprovalStatus", value as LoanApprovalStatus)
            }
            value={form.loanApprovalStatus}
          />
          <EnumSelect
            disabled={!canEdit}
            label="Credit Authorization"
            labels={creditAuthorizationStatusLabels}
            onChange={(value) =>
              updateField(
                "creditAuthorizationStatus",
                value as CreditAuthorizationStatus,
              )
            }
            value={form.creditAuthorizationStatus}
          />
          <EnumSelect
            disabled={!canEdit}
            label="Loan Application"
            labels={loanApplicationStatusLabels}
            onChange={(value) =>
              updateField(
                "loanApplicationStatus",
                value as LoanApplicationStatus,
              )
            }
            value={form.loanApplicationStatus}
          />
          <EnumSelect
            disabled={!canEdit}
            label="Disclosures"
            labels={disclosuresStatusLabels}
            onChange={(value) =>
              updateField("disclosuresStatus", value as DisclosuresStatus)
            }
            value={form.disclosuresStatus}
          />
          <EnumSelect
            disabled={!canEdit}
            label="Appraisal"
            labels={appraisalStatusLabels}
            onChange={(value) =>
              updateField("appraisalStatus", value as AppraisalStatus)
            }
            value={form.appraisalStatus}
          />
          <DateField
            disabled={!canEdit}
            label="Closing Schedule Date"
            onChange={(value) => updateField("closingScheduleDate", value)}
            value={form.closingScheduleDate}
          />
          <DateField
            disabled={!canEdit}
            label="Funding Date"
            onChange={(value) => updateField("fundingDate", value)}
            value={form.fundingDate}
          />
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <ToggleField
            checked={form.loanLockConfirmed}
            disabled={!canEdit}
            label="Loan Lock Confirmed"
            onChange={(value) => updateField("loanLockConfirmed", value)}
          />
          <ToggleField
            checked={form.allInvoicesCollected}
            disabled={!canEdit}
            label="All Invoices Collected"
            onChange={(value) => updateField("allInvoicesCollected", value)}
          />
          <ToggleField
            checked={form.ctcNotified}
            disabled={!canEdit}
            label="CTC Notified"
            onChange={(value) => updateField("ctcNotified", value)}
          />
          <ToggleField
            checked={form.closingDocsSignedOut}
            disabled={!canEdit}
            label="Closing Docs Signed Out"
            onChange={(value) => updateField("closingDocsSignedOut", value)}
          />
          <ToggleField
            checked={form.postClosingComplete}
            disabled={!canEdit}
            label="Post Closing Complete"
            onChange={(value) => updateField("postClosingComplete", value)}
          />
        </div>

        {canEdit ? (
          <div className="flex justify-end">
            <Button disabled={isPending} onClick={save} type="button">
              Save Pipeline
            </Button>
          </div>
        ) : (
          <p className="text-sm text-mafi-text-mid">
            Your access to this Phase 4 file is read-only.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function EnumSelect({
  disabled,
  label,
  labels,
  onChange,
  value,
}: {
  disabled: boolean;
  label: string;
  labels: Record<string, string>;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-semibold">{label}</Label>
      <Select disabled={disabled} onValueChange={onChange} value={value}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(labels).map(([optionValue, optionLabel]) => (
            <SelectItem key={optionValue} value={optionValue}>
              {optionLabel}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function DateField({
  disabled,
  label,
  onChange,
  value,
}: {
  disabled: boolean;
  label: string;
  onChange: (value: string) => void;
  value?: string;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-semibold">{label}</Label>
      <Input
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        type="date"
        value={value ?? ""}
      />
    </div>
  );
}

function ToggleField({
  checked,
  disabled,
  label,
  onChange,
}: {
  checked: boolean;
  disabled: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-11 items-center gap-3 rounded-md border border-mafi-border bg-mafi-bg-off px-3 text-sm text-mafi-text-dark">
      <input
        checked={checked}
        className="size-4 accent-mafi-blue-primary"
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      {label}
    </label>
  );
}
