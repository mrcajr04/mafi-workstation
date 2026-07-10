"use client";

import { useRouter } from "next/navigation";
import type React from "react";
import { useId, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Beaker,
  Check,
  MessageSquareText,
  Pencil,
  Plus,
  Printer,
  Save,
  Send,
  Trash2,
  X,
} from "lucide-react";
import {
  ProspectScenarioPrintDocument,
  type ProspectScenarioPrintContext,
} from "@/app/scenario-desk/[contactId]/prospect-scenario-print-document";
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
import { NewProspectModal } from "@/components/workstation/new-prospect-modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScenarioLoanTerm, ScenarioProgram } from "@prisma/client";
import {
  finalizeScenarioDesk,
  saveScenarioDesk,
  ScenarioInput,
} from "@/lib/actions/scenario-actions";
import {
  currencyInputToNumber,
  currencyInputToRaw,
  formatCurrencyDisplayWithCents,
} from "@/lib/currency";
import {
  calculateLtvMismatch,
  calculatePitia,
  calculatePrincipalAndInterest,
  getLoanTermMetadata,
  isInterestRateOutsideExpectedRange,
  numericValue,
  roundMoney,
  scenarioDeskTermOptions,
} from "@/lib/mortgage/scenario-calculations";

type ScenarioDraft = ScenarioInput;
type CommentDialogMode = "edit" | "read";

type ScenarioFormProps = {
  annualInsurance?: string;
  annualPropertyTaxes: string;
  canEditInsurance: boolean;
  contactId: string;
  contextRail: React.ReactNode;
  initialComments?: string;
  initialScenarios: ScenarioInput[];
  insuranceDeterminationComplete: boolean;
  loanAmount: string;
  monthlyHoa: string;
  printContext: ProspectScenarioPrintContext;
  propertyValue?: string;
  readOnly?: boolean;
  selectedScenarioNumber?: number | null;
  statedLtv?: string;
};

const missingInsuranceMessage =
  "Estimated insurance is missing. PITIA may be understated.";
const missingInsuranceWarning =
  "Insurance estimate missing — PITIA excludes homeowners insurance.";

const emptyScenario = (number: number): ScenarioDraft => ({
  comments: "",
  escrowed: false,
  interestRate: "",
  lenderAndProduct: "",
  loanTerm: ScenarioLoanTerm.FIXED_30,
  mortgageInsurance: false,
  monthlyInsurance: "",
  originationPay: "",
  pitia: "",
  principalAndInterest: "",
  processingFee: "",
  program: ScenarioProgram.FIXED_30,
  scenarioNumber: number,
});

const developmentSeedScenarios = [
  {
    escrowed: true,
    interestRate: "6.125%",
    lenderAndProduct:
      "Summit Home Lending \u2014 30-Year Fixed Conventional",
    loanTerm: ScenarioLoanTerm.FIXED_30,
    mortgageInsurance: false,
    scenarioNumber: 1,
  },
  {
    escrowed: true,
    interestRate: "5.875%",
    lenderAndProduct: "Coastal Capital \u2014 5/1 ARM Conventional",
    loanTerm: ScenarioLoanTerm.ARM_5_1,
    mortgageInsurance: false,
    scenarioNumber: 2,
  },
  {
    escrowed: false,
    interestRate: "5.625%",
    lenderAndProduct:
      "Pinnacle Mortgage \u2014 15-Year Fixed Conventional",
    loanTerm: ScenarioLoanTerm.FIXED_15,
    mortgageInsurance: true,
    scenarioNumber: 3,
  },
] satisfies Array<
  Pick<
    ScenarioDraft,
    | "escrowed"
    | "interestRate"
    | "lenderAndProduct"
    | "loanTerm"
    | "mortgageInsurance"
    | "scenarioNumber"
  >
>;

function normalizeLoanTerm(value: string, program?: ScenarioProgram) {
  if (value in ScenarioLoanTerm) {
    return value as ScenarioLoanTerm;
  }

  if (value === "15") {
    return ScenarioLoanTerm.FIXED_15;
  }

  if (value === "20") {
    return ScenarioLoanTerm.FIXED_20;
  }

  if (program === ScenarioProgram.ARM_3_1) {
    return ScenarioLoanTerm.ARM_3_1;
  }

  if (program === ScenarioProgram.ARM_5_1) {
    return ScenarioLoanTerm.ARM_5_1;
  }

  if (program === ScenarioProgram.ARM_7_1) {
    return ScenarioLoanTerm.ARM_7_1;
  }

  if (program === ScenarioProgram.IO) {
    return ScenarioLoanTerm.INTEREST_ONLY;
  }

  return ScenarioLoanTerm.FIXED_30;
}

function programFromLoanTerm(value: string) {
  if (value === ScenarioLoanTerm.INTEREST_ONLY) {
    return ScenarioProgram.IO;
  }

  if (value === ScenarioLoanTerm.ARM_3_1) {
    return ScenarioProgram.ARM_3_1;
  }

  if (value === ScenarioLoanTerm.ARM_5_1) {
    return ScenarioProgram.ARM_5_1;
  }

  if (value === ScenarioLoanTerm.ARM_7_1) {
    return ScenarioProgram.ARM_7_1;
  }

  return value === ScenarioLoanTerm.FIXED_15
    ? ScenarioProgram.FIXED_15
    : ScenarioProgram.FIXED_30;
}

function parsePercent(value: string) {
  const parsed = Number(value.replace(/[%\s,]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatPercentInput(value: string) {
  const cleaned = value.replace(/[^\d.]/g, "");
  const [wholePart = "", ...fractionParts] = cleaned.split(".");
  const fractionPart = fractionParts.join("");
  const percentValue = fractionParts.length
    ? `${wholePart}.${fractionPart.slice(0, 3)}`
    : wholePart;

  return percentValue ? `${percentValue}%` : "";
}

function normalizeScenario(scenario: ScenarioInput): ScenarioDraft {
  const loanTerm = normalizeLoanTerm(scenario.loanTerm, scenario.program);

  return {
    ...scenario,
    loanTerm,
    mortgageInsurance: scenario.mortgageInsurance ?? false,
    program: programFromLoanTerm(loanTerm),
  };
}

function sortedInitialScenarios(initialScenarios: ScenarioInput[]) {
  return initialScenarios
    .slice(0, 3)
    .map(normalizeScenario)
    .sort((a, b) => a.scenarioNumber - b.scenarioNumber);
}

function nextScenarioNumber(scenarios: ScenarioDraft[]) {
  const usedNumbers = new Set(
    scenarios.map((scenario) => scenario.scenarioNumber),
  );

  for (const number of [1, 2, 3]) {
    if (!usedNumbers.has(number)) {
      return number;
    }
  }

  return scenarios.length + 1;
}

function hasRealScenario(scenario: ScenarioDraft) {
  return scenario.lenderAndProduct.trim() !== "";
}

function withCalculatedPayments(
  scenario: ScenarioDraft,
  context: {
    annualInsurance: string;
    annualPropertyTaxes: string;
    loanAmount: string;
    monthlyHoa: string;
  },
) {
  const annualRate = parsePercent(scenario.interestRate);
  const loanAmountValue = currencyInputToNumber(context.loanAmount);
  const loanTerm = normalizeLoanTerm(scenario.loanTerm, scenario.program);
  const shouldCalculate =
    scenario.interestRate.trim() !== "" && loanAmountValue > 0;
  const principalAndInterest = shouldCalculate
    ? roundMoney(
        calculatePrincipalAndInterest({
          annualRate,
          loanAmount: loanAmountValue,
          loanTerm,
        }),
      )
    : 0;
  const pitia = shouldCalculate
    ? roundMoney(
        calculatePitia({
          annualInsurance: currencyInputToNumber(context.annualInsurance),
          annualPropertyTaxes: currencyInputToNumber(
            context.annualPropertyTaxes,
          ),
          monthlyHoa: currencyInputToNumber(context.monthlyHoa),
          principalAndInterest,
        }),
      )
    : 0;

  return {
    ...scenario,
    loanTerm,
    pitia: shouldCalculate ? formatCurrencyDisplayWithCents(pitia, "") : "",
    principalAndInterest: shouldCalculate
      ? formatCurrencyDisplayWithCents(principalAndInterest, "")
      : "",
    program: programFromLoanTerm(loanTerm),
  };
}

function printAsPdf() {
  toast.info(
    "For a clean PDF, open More settings and turn off Headers and footers.",
    {
      className: "scenario-desk-print-guidance scenario-desk-no-print",
      duration: 7000,
    },
  );
  window.setTimeout(() => window.print(), 750);
}

export function ScenarioForm({
  annualInsurance = "",
  annualPropertyTaxes,
  canEditInsurance,
  contactId,
  contextRail,
  initialComments = "",
  initialScenarios,
  insuranceDeterminationComplete,
  loanAmount,
  monthlyHoa,
  printContext,
  propertyValue = "",
  readOnly = false,
  selectedScenarioNumber,
  statedLtv = "",
}: ScenarioFormProps) {
  const router = useRouter();
  const formId = useId();
  const [isPending, startTransition] = useTransition();
  const calculationContext = {
    annualInsurance,
    annualPropertyTaxes,
    loanAmount,
    monthlyHoa,
  };
  const [comments, setComments] = useState(initialComments);
  const [commentDialogMode, setCommentDialogMode] =
    useState<CommentDialogMode>(initialComments.trim() ? "read" : "edit");
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [commentDraft, setCommentDraft] = useState(initialComments);
  const [insuranceEditorOpen, setInsuranceEditorOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [seedDialogOpen, setSeedDialogOpen] = useState(false);
  const [scenarios, setScenarios] = useState<ScenarioDraft[]>(() => {
    const initial = sortedInitialScenarios(initialScenarios);
    const normalized = initial.length ? initial : [emptyScenario(1)];
    return normalized.map((scenario) =>
      withCalculatedPayments(scenario, calculationContext),
    );
  });
  const [selectedScenario, setSelectedScenario] = useState<number | null>(
    selectedScenarioNumber ?? null,
  );
  const missingAnnualInsurance = !insuranceDeterminationComplete;
  const hasComment = comments.trim() !== "";
  const realScenarios = useMemo(
    () =>
      scenarios
        .filter(hasRealScenario)
        .sort((a, b) => a.scenarioNumber - b.scenarioNumber),
    [scenarios],
  );
  const printScenarios = useMemo(
    () =>
      realScenarios.map((scenario) => ({
        escrowed: scenario.escrowed,
        interestRate: parsePercent(scenario.interestRate),
        lenderAndProduct: scenario.lenderAndProduct,
        loanTerm: normalizeLoanTerm(scenario.loanTerm, scenario.program),
        mortgageInsurance: scenario.mortgageInsurance ?? false,
        pitia: currencyInputToNumber(scenario.pitia),
        principalAndInterest: currencyInputToNumber(
          scenario.principalAndInterest,
        ),
        scenarioNumber: scenario.scenarioNumber,
      })),
    [realScenarios],
  );
  const selectedRealScenario = selectedScenario
    ? scenarios.some(
        (scenario) =>
          scenario.scenarioNumber === selectedScenario &&
          hasRealScenario(scenario),
      )
    : false;
  const ltvWarning = useMemo(() => {
    const propertyValueNumber = currencyInputToNumber(propertyValue);
    const loanAmountNumber = currencyInputToNumber(loanAmount);
    const ltvNumber = numericValue(statedLtv);

    if (!propertyValueNumber || !loanAmountNumber || !ltvNumber) {
      return null;
    }

    const result = calculateLtvMismatch({
      loanAmount: loanAmountNumber,
      ltv: ltvNumber,
      propertyValue: propertyValueNumber,
    });

    return result.hasMismatch ? result : null;
  }, [loanAmount, propertyValue, statedLtv]);

  function updateScenario<T extends keyof ScenarioDraft>(
    scenarioNumber: number,
    field: T,
    value: ScenarioDraft[T],
  ) {
    setIsDirty(true);
    setScenarios((currentScenarios) =>
      currentScenarios.map((scenario) =>
        scenario.scenarioNumber === scenarioNumber
          ? withCalculatedPayments(
              {
                ...scenario,
                [field]: value,
                ...(field === "loanTerm"
                  ? { program: programFromLoanTerm(String(value)) }
                  : {}),
              },
              calculationContext,
            )
          : scenario,
      ),
    );
  }

  function addScenario() {
    setScenarios((currentScenarios) => {
      if (currentScenarios.length >= 3) {
        return currentScenarios;
      }

      setIsDirty(true);

      return [
        ...currentScenarios,
        withCalculatedPayments(
          emptyScenario(nextScenarioNumber(currentScenarios)),
          calculationContext,
        ),
      ].sort((a, b) => a.scenarioNumber - b.scenarioNumber);
    });
  }

  function removeScenario(scenarioNumber: number) {
    setIsDirty(true);
    setScenarios((currentScenarios) => {
      const remainingScenarios = currentScenarios.filter(
        (scenario) => scenario.scenarioNumber !== scenarioNumber,
      );

      if (selectedScenario === scenarioNumber) {
        setSelectedScenario(null);
      }

      return remainingScenarios.length
        ? remainingScenarios
        : [withCalculatedPayments(emptyScenario(1), calculationContext)];
    });
  }

  function scenarioPayload() {
    return scenarios.map((scenario) => ({
      comments: scenario.comments,
      escrowed: scenario.escrowed,
      interestRate: scenario.interestRate,
      lenderAndProduct: scenario.lenderAndProduct,
      loanTerm: normalizeLoanTerm(scenario.loanTerm, scenario.program),
      mortgageInsurance: scenario.mortgageInsurance ?? false,
      monthlyInsurance: "",
      originationPay: currencyInputToRaw(scenario.originationPay),
      pitia: currencyInputToRaw(scenario.pitia),
      principalAndInterest: currencyInputToRaw(scenario.principalAndInterest),
      processingFee: currencyInputToRaw(scenario.processingFee),
      program: programFromLoanTerm(scenario.loanTerm),
      scenarioNumber: scenario.scenarioNumber,
    }));
  }

  function seedTestData() {
    setScenarios(
      developmentSeedScenarios.map((seedScenario) =>
        withCalculatedPayments(
          {
            ...emptyScenario(seedScenario.scenarioNumber),
            ...seedScenario,
            program: programFromLoanTerm(seedScenario.loanTerm),
          },
          calculationContext,
        ),
      ),
    );
    setSelectedScenario(null);
    setIsDirty(true);
  }

  function handleCommentDialogOpenChange(open: boolean) {
    if (open) {
      setCommentDraft(comments);
      setCommentDialogMode(hasComment ? "read" : "edit");
    } else {
      setCommentDraft(comments);
    }

    setCommentDialogOpen(open);
  }

  function applyCommentDraft() {
    const nextComment = commentDraft.trim() ? commentDraft : "";

    if (nextComment !== comments) {
      setComments(nextComment);
      setIsDirty(true);
    }

    setCommentDialogOpen(false);
  }

  function save() {
    startTransition(async () => {
      const result = await saveScenarioDesk({
        comments,
        contactId,
        scenarios: scenarioPayload(),
        selectedScenarioNumber: selectedScenario,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Scenario Desk saved.");
      setIsDirty(false);
      router.refresh();
    });
  }

  function finalize() {
    if (!selectedScenario) {
      toast.error("Select a final scenario before finalizing.");
      return;
    }

    if (!selectedRealScenario) {
      toast.error("Select a final scenario with a lender and product.");
      return;
    }

    if (missingAnnualInsurance) {
      toast.error(missingInsuranceMessage);
      return;
    }

    startTransition(async () => {
      const result = await finalizeScenarioDesk({
        comments,
        contactId,
        scenarios: scenarioPayload(),
        selectedScenarioNumber: selectedScenario,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Scenario Desk finalized.");
      router.push("/scenario-desk");
      router.refresh();
    });
  }

  function openInsuranceEditor() {
    if (!canEditInsurance) {
      toast.error(
        "An Owner or the assigned BDR must add the insurance determination in Prospect Intake.",
      );
      return;
    }

    setInsuranceEditorOpen(true);
  }

  return (
    <>
      <section className="scenario-desk-screen-only pb-14">
        {readOnly ? null : (
          <div className="scenario-desk-no-print sticky top-[57px] z-30 border-b border-mafi-border bg-mafi-bg-light/95 backdrop-blur-md">
            <div className="mx-auto flex min-h-[58px] max-w-[1530px] flex-col gap-2 px-4 py-2 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
              <p className="flex items-center gap-2 text-xs font-semibold text-mafi-text-mid">
                <span
                  className={`size-2 rounded-full ${isDirty ? "bg-mafi-gold" : "bg-mafi-status-green"}`}
                  aria-hidden="true"
                />
                {isDirty ? "Unsaved changes" : "All changes saved"}
                {selectedRealScenario ? (
                  <span className="hidden text-mafi-text-light sm:inline">
                    / Scenario {selectedScenario} selected as final
                  </span>
                ) : null}
              </p>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
                <AlertDialog
                  onOpenChange={handleCommentDialogOpenChange}
                  open={commentDialogOpen}
                >
                  <AlertDialogTrigger asChild>
                    <Button
                      className={
                        hasComment
                          ? "border-mafi-blue-primary/25 bg-mafi-blue-primary/5 text-mafi-blue-primary hover:bg-mafi-blue-primary/10"
                          : ""
                      }
                      disabled={isPending}
                      type="button"
                      variant="outline"
                    >
                      <MessageSquareText aria-hidden="true" />
                      {hasComment ? "View Comment" : "Add Comment"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="scenario-desk-comment-dialog scenario-desk-no-print max-h-[calc(100vh-2rem)] overflow-hidden sm:max-w-xl">
                    <AlertDialogHeader>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <AlertDialogTitle>
                            {commentDialogMode === "read"
                              ? "View Comment"
                              : hasComment
                                ? "Edit Comment"
                                : "Add Comment"}
                          </AlertDialogTitle>
                          <AlertDialogDescription
                            className="mt-1"
                            id={`${formId}-comment-description`}
                          >
                            {commentDialogMode === "read"
                              ? "Case-level context saved with this Scenario Desk draft."
                              : hasComment
                                ? "Changes will update this Scenario Desk draft. Click Save to persist them."
                                : "The comment will be added to this Scenario Desk draft. Click Save to persist it."}
                          </AlertDialogDescription>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          {commentDialogMode === "read" ? (
                            <Button
                              aria-label="Edit Comment"
                              onClick={() => {
                                setCommentDraft(comments);
                                setCommentDialogMode("edit");
                              }}
                              size="icon"
                              type="button"
                              variant="ghost"
                            >
                              <Pencil aria-hidden="true" />
                            </Button>
                          ) : null}
                          <AlertDialogCancel asChild>
                            <Button
                              aria-label="Close comment dialog"
                              size="icon"
                              type="button"
                              variant="ghost"
                            >
                              <X aria-hidden="true" />
                            </Button>
                          </AlertDialogCancel>
                        </div>
                      </div>
                    </AlertDialogHeader>

                    {commentDialogMode === "edit" ? (
                      <div className="min-h-0 overflow-y-auto pr-1">
                        <Label htmlFor={`${formId}-comment-draft`}>
                          Overall Comment
                        </Label>
                        <textarea
                          aria-describedby={`${formId}-comment-helper ${formId}-comment-count`}
                          autoFocus
                          className="mt-2 min-h-[180px] w-full resize-y rounded-lg border border-input bg-background px-3 py-2.5 text-sm leading-6 text-mafi-text-dark outline-none transition placeholder:text-muted-foreground focus-visible:border-mafi-blue-primary focus-visible:ring-2 focus-visible:ring-mafi-blue-primary/20"
                          id={`${formId}-comment-draft`}
                          maxLength={800}
                          onChange={(event) =>
                            setCommentDraft(event.target.value)
                          }
                          placeholder="Document the rationale, tradeoffs, and next-step guidance for this scenario review."
                          value={commentDraft}
                        />
                        <div className="mt-1.5 flex items-start justify-between gap-4 text-xs text-mafi-text-mid">
                          <p id={`${formId}-comment-helper`}>
                            Changes remain local until you click Save or
                            finalize the Scenario Desk.
                          </p>
                          <p
                            className="shrink-0 font-medium text-mafi-text-light"
                            id={`${formId}-comment-count`}
                          >
                            {commentDraft.length}/800
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="max-h-[50vh] overflow-y-auto rounded-lg border border-mafi-border bg-mafi-bg-light px-4 py-3">
                        <p className="whitespace-pre-wrap break-words text-sm leading-6 text-mafi-text-dark [overflow-wrap:anywhere]">
                          {comments}
                        </p>
                      </div>
                    )}

                    <AlertDialogFooter>
                      <AlertDialogCancel>
                        {commentDialogMode === "read" ? "Close" : "Cancel"}
                      </AlertDialogCancel>
                      {commentDialogMode === "edit" ? (
                        <AlertDialogAction
                          disabled={!hasComment && !commentDraft.trim()}
                          onClick={applyCommentDraft}
                        >
                          {hasComment ? "Apply Changes" : "Add Comment"}
                        </AlertDialogAction>
                      ) : null}
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                {process.env.NODE_ENV === "development" ? (
                  <AlertDialog
                    onOpenChange={setSeedDialogOpen}
                    open={seedDialogOpen}
                  >
                    <AlertDialogTrigger asChild>
                      <Button
                        aria-label="Seed Scenario Desk test data"
                        className="scenario-desk-no-print"
                        disabled={isPending}
                        type="button"
                        variant="outline"
                      >
                        <Beaker aria-hidden="true" />
                        Seed Test Data
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Replace current scenario draft?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Seeding test data will replace the current unsaved
                          scenario options. Nothing will be saved until you
                          click Save.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={seedTestData}>
                          Replace with Test Data
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : null}
                <Button
                  disabled={isPending}
                  onClick={save}
                  type="button"
                  variant="outline"
                >
                  <Save aria-hidden="true" />
                  {isPending ? "Saving..." : "Save"}
                </Button>
                <Button
                  className="col-span-2 sm:col-auto"
                  disabled={isPending}
                  onClick={printAsPdf}
                  type="button"
                  variant="outline"
                >
                  <Printer aria-hidden="true" />
                  Print as PDF
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      className="col-span-2 bg-[#23805F] text-white hover:bg-[#1B684D] active:bg-[#15543F] focus-visible:border-[#15543F] focus-visible:ring-[#23805F]/35 disabled:bg-[#23805F] disabled:text-white disabled:hover:bg-[#23805F] sm:col-auto"
                      disabled={isPending || !selectedRealScenario}
                      type="button"
                    >
                      <Send aria-hidden="true" />
                      Send to Loan Estimate & Pre-Approval
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {missingAnnualInsurance
                          ? "Annual insurance estimate required"
                          : "Finalize Scenario Desk?"}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {missingAnnualInsurance
                          ? "PITIA cannot be finalized until homeowners insurance has been determined."
                          : "This will lock the selected scenario and move the contact to Phase 4 for Loan Estimate and Pre-Approval work."}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isPending}>
                        Cancel
                      </AlertDialogCancel>
                      {missingAnnualInsurance ? (
                        <AlertDialogAction onClick={openInsuranceEditor}>
                          Add Insurance Estimate
                        </AlertDialogAction>
                      ) : (
                        <AlertDialogAction
                          disabled={isPending || !selectedRealScenario}
                          onClick={finalize}
                        >
                          Finalize and Move to Phase 4
                        </AlertDialogAction>
                      )}
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        )}

        <div className="mx-auto grid max-w-[1530px] items-start gap-5 px-4 pt-5 sm:px-6 lg:px-8 min-[1180px]:grid-cols-[minmax(0,1fr)_330px] min-[1280px]:grid-cols-[minmax(0,1fr)_minmax(330px,390px)]">
          <div className="flex min-w-0 flex-col gap-4">
            {ltvWarning ? (
              <div
                className="order-1 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900"
                role="status"
              >
                Loan amount does not match the stated LTV. Implied loan amount
                is{" "}
                {formatCurrencyDisplayWithCents(ltvWarning.impliedLoanAmount)}.
              </div>
            ) : null}

            <div className="order-2 flex flex-wrap items-end justify-between gap-3 rounded-lg border border-mafi-border bg-mafi-bg-white px-4 py-3 shadow-sm">
              <div>
                <h2 className="text-xl font-bold text-mafi-text-dark">
                  Build Financing Scenarios
                </h2>
                <p className="text-sm text-mafi-text-mid">
                  Add up to three options. P&I and PITIA calculate from loan
                  amount, rate, loan term, annual taxes, annual insurance, and
                  monthly HOA.
                </p>
                {missingAnnualInsurance ? (
                  <div
                    className="mt-2 inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-1 rounded-md border border-amber-300/80 bg-amber-50 px-2.5 py-1 text-xs font-medium leading-5 text-amber-900"
                    role="status"
                  >
                    <span>{missingInsuranceWarning}</span>
                    <button
                      className="font-bold text-amber-950 underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700/40"
                      onClick={openInsuranceEditor}
                      type="button"
                    >
                      Add estimate
                    </button>
                  </div>
                ) : null}
              </div>
              {readOnly ? null : (
                <Button
                  className="scenario-desk-no-print"
                  disabled={isPending || scenarios.length >= 3}
                  onClick={addScenario}
                  type="button"
                >
                  <Plus aria-hidden="true" />
                  Add Scenario
                </Button>
              )}
            </div>

            <div
              aria-label="Select final financing scenario"
              className={`order-2 grid gap-3 ${
                scenarios.length === 1
                  ? "grid-cols-1"
                  : "grid-cols-1 min-[720px]:grid-cols-2 min-[1380px]:grid-cols-3"
              }`}
              role="radiogroup"
            >
              {scenarios
                .slice()
                .sort((a, b) => a.scenarioNumber - b.scenarioNumber)
                .map((scenario) => {
                  const annualRate = parsePercent(scenario.interestRate);
                  const rateWarning =
                    isInterestRateOutsideExpectedRange(annualRate);
                  const isSelected =
                    selectedScenario === scenario.scenarioNumber;

                  return (
                    <Card
                      className={`relative overflow-visible rounded-[14px] border-mafi-border bg-mafi-bg-white shadow-sm ${
                        isSelected
                          ? "border-2 border-mafi-blue-primary ring-[3px] ring-mafi-blue-primary/15"
                          : "hover:border-mafi-text-light/50"
                      }`}
                      key={scenario.scenarioNumber}
                    >
                      {isSelected ? (
                        <span className="absolute -top-2.5 left-3 z-10 rounded-full bg-mafi-blue-primary px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.08em] text-white">
                          Final Selection
                        </span>
                      ) : null}
                      <CardHeader className="rounded-t-[13px] border-b border-mafi-border bg-mafi-bg-light px-3.5 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-2.5">
                            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-mafi-blue-dark text-sm font-extrabold text-white">
                              {scenario.scenarioNumber}
                            </span>
                            <div className="min-w-0">
                              <CardTitle className="text-sm font-bold text-mafi-text-dark">
                                Scenario {scenario.scenarioNumber}
                              </CardTitle>
                              <p className="mt-0.5 text-[10px] text-mafi-text-light">
                                {hasRealScenario(scenario)
                                  ? "Configured option"
                                  : "New option"}
                              </p>
                            </div>
                          </div>
                          {isSelected ? (
                            <span className="rounded-full border border-mafi-blue-primary/20 bg-mafi-blue-primary/10 px-2 py-1 text-[10px] font-bold text-mafi-blue-primary">
                              Selected
                            </span>
                          ) : null}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3 p-3.5">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Field
                            className="sm:col-span-2"
                            label="Lender & Product"
                          >
                            <textarea
                              aria-label={`Scenario ${scenario.scenarioNumber} lender and product`}
                              className="min-h-[58px] w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm leading-5 text-mafi-text-dark outline-none transition placeholder:text-muted-foreground focus-visible:border-mafi-blue-primary focus-visible:ring-2 focus-visible:ring-mafi-blue-primary/20 disabled:opacity-50"
                              id={`${formId}-scenario-${scenario.scenarioNumber}-lender`}
                              onChange={(event) =>
                                updateScenario(
                                  scenario.scenarioNumber,
                                  "lenderAndProduct",
                                  event.target.value,
                                )
                              }
                              placeholder="Type lender or product"
                              readOnly={readOnly}
                              rows={2}
                              value={scenario.lenderAndProduct}
                            />
                          </Field>
                          <Field label="Interest Rate">
                            <Input
                              aria-label={`Scenario ${scenario.scenarioNumber} interest rate`}
                              id={`${formId}-scenario-${scenario.scenarioNumber}-rate`}
                              inputMode="decimal"
                              onChange={(event) =>
                                updateScenario(
                                  scenario.scenarioNumber,
                                  "interestRate",
                                  formatPercentInput(event.target.value),
                                )
                              }
                              className="h-[41px] rounded-lg"
                              readOnly={readOnly}
                              value={scenario.interestRate}
                            />
                          </Field>
                          <Field label="Loan Term">
                            <Select
                              disabled={readOnly}
                              onValueChange={(value) =>
                                updateScenario(
                                  scenario.scenarioNumber,
                                  "loanTerm",
                                  value,
                                )
                              }
                              value={normalizeLoanTerm(
                                scenario.loanTerm,
                                scenario.program,
                              )}
                            >
                              <SelectTrigger
                                aria-label={`Scenario ${scenario.scenarioNumber} loan term`}
                                id={`${formId}-scenario-${scenario.scenarioNumber}-term`}
                                className="h-[41px] rounded-lg"
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {scenarioDeskTermOptions.map((term) => (
                                  <SelectItem key={term} value={term}>
                                    {getLoanTermMetadata(term).label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </Field>
                        </div>

                        {rateWarning ? (
                          <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium leading-5 text-amber-900">
                            Interest rate is outside the expected 2% to 12%
                            review range.
                          </p>
                        ) : null}

                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Escrowed">
                            <SegmentedControl
                              ariaLabel={`Scenario ${scenario.scenarioNumber} escrowed`}
                              disabled={readOnly}
                              onChange={(value) =>
                                updateScenario(
                                  scenario.scenarioNumber,
                                  "escrowed",
                                  value,
                                )
                              }
                              value={scenario.escrowed}
                            />
                          </Field>
                          <Field label="Mortgage Insurance">
                            <SegmentedControl
                              ariaLabel={`Scenario ${scenario.scenarioNumber} mortgage insurance`}
                              disabled={readOnly}
                              onChange={(value) =>
                                updateScenario(
                                  scenario.scenarioNumber,
                                  "mortgageInsurance",
                                  value,
                                )
                              }
                              value={scenario.mortgageInsurance ?? false}
                            />
                          </Field>
                        </div>

                        <div
                          aria-live="polite"
                          className="grid grid-cols-2 overflow-hidden rounded-[10px] border border-mafi-border bg-mafi-border"
                        >
                          <div className="bg-mafi-bg-light px-3 py-2.5">
                            <span className="block text-[9px] font-extrabold uppercase tracking-[0.06em] text-mafi-text-light">
                              Principal & Interest
                            </span>
                            <strong className="mt-1 block text-base font-bold tabular-nums text-mafi-text-dark">
                              {scenario.principalAndInterest || "-"}
                            </strong>
                          </div>
                          <div className="border-l border-mafi-blue-primary/20 bg-mafi-blue-primary/8 px-3 py-2.5">
                            <span className="block text-[10px] font-extrabold uppercase tracking-[0.06em] text-mafi-blue-primary">
                              PITIA
                            </span>
                            <strong className="mt-1 block text-lg font-extrabold tabular-nums text-mafi-blue-primary">
                              {scenario.pitia || "-"}
                            </strong>
                            {missingAnnualInsurance ? (
                              <span className="mt-0.5 block whitespace-nowrap text-[9px] font-semibold leading-none text-amber-800">
                                Insurance excluded
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </CardContent>
                      <div className="scenario-desk-no-print flex items-center justify-between gap-2 rounded-b-[13px] border-t border-mafi-border bg-mafi-bg-light/60 px-3.5 py-2.5">
                        <button
                          aria-checked={isSelected}
                          className="inline-flex min-h-9 items-center gap-2 rounded-md px-1 text-xs font-bold text-mafi-text-mid focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mafi-blue-primary/30"
                          onClick={() => {
                            setSelectedScenario(scenario.scenarioNumber);
                            setIsDirty(true);
                          }}
                          role="radio"
                          type="button"
                        >
                          <span
                            className={`grid size-[18px] place-items-center rounded-full border ${
                              isSelected
                                ? "border-mafi-blue-primary bg-mafi-blue-primary text-white"
                                : "border-mafi-border bg-white text-transparent"
                            }`}
                          >
                            <Check className="size-3" aria-hidden="true" />
                          </span>
                          {isSelected ? "Selected as Final" : "Select as Final"}
                        </button>
                        <Button
                          aria-label={`Remove Scenario ${scenario.scenarioNumber}`}
                          onClick={() =>
                            removeScenario(scenario.scenarioNumber)
                          }
                          size="sm"
                          type="button"
                          variant="ghost"
                        >
                          <Trash2 aria-hidden="true" />
                          Remove
                        </Button>
                      </div>
                    </Card>
                  );
                })}
            </div>

            {realScenarios.length >= 2 ? (
              <Card className="order-4 overflow-hidden border-mafi-border shadow-sm">
                <CardHeader className="border-b border-mafi-border bg-mafi-bg-light px-4 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base font-bold text-mafi-text-dark">
                        Scenario Comparison
                      </CardTitle>
                      <p className="mt-1 text-xs text-mafi-text-mid">
                        Review the options using a consistent monthly-payment
                        lens.
                      </p>
                    </div>
                    <span
                      className={`rounded-full border px-2 py-1 text-[10px] font-bold ${
                        selectedRealScenario
                          ? "border-mafi-blue-primary/20 bg-mafi-blue-primary/10 text-mafi-blue-primary"
                          : "border-mafi-gold/30 bg-mafi-gold-light/40 text-mafi-gold-dark"
                      }`}
                    >
                      {selectedRealScenario
                        ? "Final selected"
                        : "Select a final option"}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-3.5">
                  <div className="hidden overflow-hidden rounded-xl border border-mafi-border bg-mafi-border min-[720px]:block">
                    {[
                      {
                        label: "Scenario",
                        value: (scenario: ScenarioDraft) =>
                          `Scenario ${scenario.scenarioNumber}`,
                      },
                      {
                        label: "Lender & Product",
                        value: (scenario: ScenarioDraft) =>
                          scenario.lenderAndProduct,
                      },
                      {
                        label: "Interest Rate",
                        value: (scenario: ScenarioDraft) =>
                          scenario.interestRate || "-",
                      },
                      {
                        label: "Loan Term",
                        value: (scenario: ScenarioDraft) =>
                          getLoanTermMetadata(
                            normalizeLoanTerm(
                              scenario.loanTerm,
                              scenario.program,
                            ),
                          ).label,
                      },
                      {
                        label: "Principal & Interest",
                        value: (scenario: ScenarioDraft) =>
                          scenario.principalAndInterest || "-",
                      },
                      {
                        label: "PITIA",
                        value: (scenario: ScenarioDraft) =>
                          scenario.pitia || "-",
                        emphasize: true,
                      },
                      {
                        label: "Mortgage Insurance",
                        value: (scenario: ScenarioDraft) =>
                          scenario.mortgageInsurance ? "Yes" : "No",
                      },
                    ].map((row) => (
                      <div
                        className="grid gap-px border-b border-mafi-border last:border-b-0"
                        key={row.label}
                        style={{
                          gridTemplateColumns: `150px repeat(${realScenarios.length}, minmax(0, 1fr))`,
                        }}
                      >
                        <div className="bg-mafi-bg-light px-3 py-2.5 text-[10px] font-extrabold uppercase tracking-wide text-mafi-text-light">
                          {row.label}
                        </div>
                        {realScenarios.map((scenario) => {
                          const isSelected =
                            selectedScenario === scenario.scenarioNumber;
                          return (
                            <div
                              className={`min-w-0 break-words px-3 py-2.5 text-xs font-semibold ${
                                isSelected
                                  ? "bg-mafi-blue-primary/[0.03] text-mafi-text-dark ring-1 ring-inset ring-mafi-blue-primary/25"
                                  : "bg-white text-mafi-text-mid"
                              } ${row.emphasize ? "font-extrabold text-mafi-blue-primary" : ""}`}
                              key={scenario.scenarioNumber}
                            >
                              <span className="inline-flex items-center gap-1.5">
                                {row.label === "Scenario" ? (
                                  <span className="grid size-6 shrink-0 place-items-center rounded-md bg-mafi-blue-dark text-[10px] font-extrabold text-white">
                                    {scenario.scenarioNumber}
                                  </span>
                                ) : null}
                                {row.value(scenario)}
                                {row.label === "Scenario" && isSelected ? (
                                  <span className="rounded-full bg-mafi-blue-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-mafi-blue-primary">
                                    Final
                                  </span>
                                ) : null}
                              </span>
                              {row.label === "PITIA" &&
                              missingAnnualInsurance ? (
                                <span className="mt-0.5 block whitespace-nowrap text-[9px] font-medium leading-none text-amber-800">
                                  Insurance excluded
                                </span>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-2.5 min-[720px]:hidden">
                    {realScenarios.map((scenario) => {
                      const isSelected =
                        selectedScenario === scenario.scenarioNumber;
                      return (
                        <article
                          className={`overflow-hidden rounded-xl border ${
                            isSelected
                              ? "border-2 border-mafi-blue-primary bg-mafi-blue-primary/5"
                              : "border-mafi-border bg-white"
                          }`}
                          key={scenario.scenarioNumber}
                        >
                          <div className="flex items-center justify-between border-b border-mafi-border px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <span className="grid size-7 place-items-center rounded-lg bg-mafi-blue-dark text-xs font-extrabold text-white">
                                {scenario.scenarioNumber}
                              </span>
                              <strong className="text-sm">
                                Scenario {scenario.scenarioNumber}
                              </strong>
                            </div>
                            {isSelected ? (
                              <span className="rounded-full bg-mafi-blue-primary/10 px-2 py-1 text-[10px] font-bold text-mafi-blue-primary">
                                Final
                              </span>
                            ) : null}
                          </div>
                          <dl className="grid grid-cols-2 gap-px bg-mafi-border">
                            {[
                              [
                                "Lender & Product",
                                scenario.lenderAndProduct,
                                true,
                              ],
                              ["Rate", scenario.interestRate || "-", false],
                              [
                                "Term",
                                getLoanTermMetadata(
                                  normalizeLoanTerm(
                                    scenario.loanTerm,
                                    scenario.program,
                                  ),
                                ).label,
                                false,
                              ],
                              [
                                "P&I",
                                scenario.principalAndInterest || "-",
                                false,
                              ],
                              ["PITIA", scenario.pitia || "-", false],
                              [
                                "Mortgage Insurance",
                                scenario.mortgageInsurance ? "Yes" : "No",
                                true,
                              ],
                            ].map(([label, value, full]) => (
                              <div
                                className={`bg-white px-3 py-2.5 ${full ? "col-span-2" : ""}`}
                                key={String(label)}
                              >
                                <dt className="text-[9px] font-bold uppercase tracking-wide text-mafi-text-light">
                                  {label}
                                </dt>
                                <dd
                                  className={`mt-1 break-words text-xs font-bold ${label === "PITIA" ? "text-mafi-blue-primary" : "text-mafi-text-dark"}`}
                                >
                                  {value}
                                  {label === "PITIA" &&
                                  missingAnnualInsurance ? (
                                    <span className="mt-0.5 block whitespace-nowrap text-[9px] font-medium leading-none text-amber-800">
                                      Insurance excluded
                                    </span>
                                  ) : null}
                                </dd>
                              </div>
                            ))}
                          </dl>
                        </article>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="order-4 border-mafi-border shadow-sm">
                <CardHeader className="border-b border-mafi-border bg-mafi-bg-light px-4 py-3">
                  <CardTitle className="text-base font-bold text-mafi-text-dark">
                    Scenario Comparison
                  </CardTitle>
                  <p className="text-xs text-mafi-text-mid">
                    Comparison appears after at least two options have a lender
                    and product.
                  </p>
                </CardHeader>
                <CardContent className="px-5 py-8 text-center text-sm text-mafi-text-mid">
                  Add a lender and product to another scenario to compare
                  payment options side by side.
                </CardContent>
              </Card>
            )}

          </div>
          <div className="min-w-0">{contextRail}</div>
        </div>
      </section>
      {canEditInsurance ? (
        <NewProspectModal
          contactId={contactId}
          initialFocusField="estimatedInsuranceAnnual"
          onOpenChange={setInsuranceEditorOpen}
          open={insuranceEditorOpen}
          trigger={() => null}
        />
      ) : null}
      <ProspectScenarioPrintDocument
        {...printContext}
        documentState="draft"
        scenarios={printScenarios}
        selectedScenarioNumber={selectedScenario}
      />
    </>
  );
}

function Field({
  children,
  className = "",
  label,
}: {
  children: React.ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <div className={`space-y-1 ${className}`}>
      <Label className="text-xs font-semibold text-mafi-text-mid">
        {label}
      </Label>
      {children}
    </div>
  );
}

function SegmentedControl({
  ariaLabel,
  disabled,
  onChange,
  value,
}: {
  ariaLabel: string;
  disabled: boolean;
  onChange: (value: boolean) => void;
  value: boolean;
}) {
  return (
    <div
      aria-label={ariaLabel}
      className="grid grid-cols-2 gap-1 rounded-lg bg-mafi-bg-lighter p-1"
      role="group"
    >
      {[true, false].map((option) => (
        <button
          aria-pressed={value === option}
          className={`min-h-8 rounded-md px-2 text-[11px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mafi-blue-primary/30 ${
            value === option
              ? "bg-white text-mafi-text-dark shadow-sm"
              : "text-mafi-text-mid hover:text-mafi-text-dark"
          }`}
          disabled={disabled}
          key={String(option)}
          onClick={() => onChange(option)}
          type="button"
        >
          {option ? "Yes" : "No"}
        </button>
      ))}
    </div>
  );
}
