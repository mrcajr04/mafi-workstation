"use client";

import { useRouter } from "next/navigation";
import type React from "react";
import { useId, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
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

type ScenarioFormProps = {
  annualInsurance?: string;
  annualPropertyTaxes: string;
  contactId: string;
  initialComments?: string;
  initialScenarios: ScenarioInput[];
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
  const usedNumbers = new Set(scenarios.map((scenario) => scenario.scenarioNumber));

  for (const number of [1, 2, 3]) {
    if (!usedNumbers.has(number)) {
      return number;
    }
  }

  return scenarios.length + 1;
}

function hasInsuranceValue(value: string) {
  return value.trim() !== "";
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
  const shouldCalculate = scenario.interestRate.trim() !== "" && loanAmountValue > 0;
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
          annualPropertyTaxes: currencyInputToNumber(context.annualPropertyTaxes),
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

export function ScenarioForm({
  annualInsurance = "",
  annualPropertyTaxes,
  contactId,
  initialComments = "",
  initialScenarios,
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
  const missingAnnualInsurance = !hasInsuranceValue(annualInsurance);
  const realScenarios = useMemo(
    () => scenarios.filter(hasRealScenario).sort((a, b) => a.scenarioNumber - b.scenarioNumber),
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
          scenario.scenarioNumber === selectedScenario && hasRealScenario(scenario),
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

  return (
    <>
      <section className="scenario-desk-screen-only space-y-5">
      {missingAnnualInsurance ? (
        <div
          className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium leading-6 text-amber-900"
          role="status"
        >
          {missingInsuranceMessage}
        </div>
      ) : null}

      {ltvWarning ? (
        <div
          className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900"
          role="status"
        >
          Loan amount does not match the stated LTV. Implied loan amount is{" "}
          {formatCurrencyDisplayWithCents(ltvWarning.impliedLoanAmount)}.
        </div>
      ) : null}

      <Card className="border-mafi-border shadow-sm">
        <CardHeader className="border-b border-mafi-border bg-mafi-bg-light">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base text-mafi-blue-primary">
              Opportunity Comments
            </CardTitle>
            <span className="text-xs font-medium text-mafi-text-light">
              Saves with draft or finalize
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <Label className="sr-only" htmlFor={`${formId}-comments`}>
            Opportunity Comments
          </Label>
          <textarea
            className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm leading-6 text-mafi-text-dark shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mafi-blue-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
            id={`${formId}-comments`}
            onChange={(event) => setComments(event.target.value)}
            placeholder="Capture scenario notes, compensating factors, pricing assumptions, and follow-up items."
            readOnly={readOnly}
            value={comments}
          />
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-mafi-text-dark">
            Scenario Options
          </h2>
          <p className="text-sm text-mafi-text-mid">
            Add up to three options. P&I and PITIA calculate from loan amount,
            rate, loan term, annual taxes, annual insurance, and monthly HOA.
          </p>
        </div>
        {readOnly ? null : (
          <Button
            className="scenario-desk-no-print"
            disabled={isPending || scenarios.length >= 3}
            onClick={addScenario}
            type="button"
            variant="outline"
          >
            Add Scenario
          </Button>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {scenarios
          .slice()
          .sort((a, b) => a.scenarioNumber - b.scenarioNumber)
          .map((scenario) => {
            const annualRate = parsePercent(scenario.interestRate);
            const rateWarning = isInterestRateOutsideExpectedRange(annualRate);
            const isSelected = selectedScenario === scenario.scenarioNumber;

            return (
              <Card
                className={`overflow-hidden border-mafi-border shadow-sm ${
                  isSelected
                    ? "border-mafi-blue-primary bg-mafi-blue-primary/5 ring-2 ring-mafi-blue-primary/30"
                    : "bg-mafi-bg-white"
                }`}
                key={scenario.scenarioNumber}
              >
                <CardHeader className="border-b border-mafi-border bg-mafi-bg-light px-4 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-mafi-text-light">
                        Option {scenario.scenarioNumber}
                      </p>
                      <CardTitle className="mt-1 text-base text-mafi-blue-primary">
                        Scenario {scenario.scenarioNumber}
                      </CardTitle>
                    </div>
                    <div className="scenario-desk-no-print flex flex-wrap items-center justify-end gap-2">
                      {readOnly ? (
                        <span className="rounded-full bg-mafi-bg-lighter px-2.5 py-1 text-xs font-semibold text-mafi-text-mid">
                          {isSelected ? "Final selected" : "Not selected"}
                        </span>
                      ) : (
                        <>
                          <Button
                            onClick={() =>
                              setSelectedScenario(scenario.scenarioNumber)
                            }
                            size="sm"
                            type="button"
                            variant={isSelected ? "default" : "outline"}
                          >
                            {isSelected ? "Final" : "Select Final"}
                          </Button>
                          <Button
                            onClick={() => removeScenario(scenario.scenarioNumber)}
                            size="sm"
                            type="button"
                            variant="outline"
                          >
                            Remove
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 p-4">
                  <ScenarioGroup title="Loan Terms">
                    <Field className="sm:col-span-2" label="Lender & Product">
                      <Input
                        aria-label={`Scenario ${scenario.scenarioNumber} lender and product`}
                        id={`${formId}-scenario-${scenario.scenarioNumber}-lender`}
                        onChange={(event) =>
                          updateScenario(
                            scenario.scenarioNumber,
                            "lenderAndProduct",
                            event.target.value,
                          )
                        }
                        readOnly={readOnly}
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
                  </ScenarioGroup>

                  {(rateWarning || missingAnnualInsurance) && (
                    <div className="space-y-2">
                      {rateWarning ? (
                        <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium leading-5 text-amber-900">
                          Interest rate is outside the expected 2% to 12%
                          review range.
                        </p>
                      ) : null}
                      {missingAnnualInsurance ? (
                        <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium leading-5 text-amber-900">
                          {missingInsuranceMessage}
                        </p>
                      ) : null}
                    </div>
                  )}

                  <ScenarioGroup title="Payment Breakdown">
                    <Field label="Principal & Interest">
                      <Input
                        aria-label={`Scenario ${scenario.scenarioNumber} principal and interest`}
                        className="cursor-default bg-mafi-bg-light text-right font-semibold tabular-nums text-mafi-text-dark"
                        id={`${formId}-scenario-${scenario.scenarioNumber}-pi`}
                        readOnly
                        value={scenario.principalAndInterest}
                      />
                    </Field>
                    <Field label="PITIA">
                      <Input
                        aria-label={`Scenario ${scenario.scenarioNumber} PITIA`}
                        className="cursor-default bg-mafi-bg-light text-right font-bold tabular-nums text-mafi-blue-primary"
                        id={`${formId}-scenario-${scenario.scenarioNumber}-pitia`}
                        readOnly
                        value={scenario.pitia}
                      />
                    </Field>
                    <Field label="Escrowed">
                      <Select
                        disabled={readOnly}
                        onValueChange={(value) =>
                          updateScenario(
                            scenario.scenarioNumber,
                            "escrowed",
                            value === "true",
                          )
                        }
                        value={String(scenario.escrowed)}
                      >
                        <SelectTrigger
                          aria-label={`Scenario ${scenario.scenarioNumber} escrowed`}
                          id={`${formId}-scenario-${scenario.scenarioNumber}-escrowed`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Yes</SelectItem>
                          <SelectItem value="false">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Mortgage Insurance Premium">
                      <Select
                        disabled={readOnly}
                        onValueChange={(value) =>
                          updateScenario(
                            scenario.scenarioNumber,
                            "mortgageInsurance",
                            value === "true",
                          )
                        }
                        value={String(scenario.mortgageInsurance ?? false)}
                      >
                        <SelectTrigger
                          aria-label={`Scenario ${scenario.scenarioNumber} mortgage insurance premium`}
                          id={`${formId}-scenario-${scenario.scenarioNumber}-mi`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Yes</SelectItem>
                          <SelectItem value="false">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </ScenarioGroup>
                </CardContent>
              </Card>
            );
          })}
      </div>

      {realScenarios.length >= 2 ? (
        <Card className="border-mafi-border shadow-sm">
          <CardHeader className="border-b border-mafi-border bg-mafi-bg-light">
            <CardTitle className="text-base text-mafi-blue-primary">
              Scenario Comparison
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[760px] table-fixed text-sm">
              <thead className="bg-mafi-bg-light text-left text-xs font-bold uppercase text-mafi-text-mid">
                <tr>
                  <th className="w-32 px-4 py-3">Scenario</th>
                  <th className="w-72 px-4 py-3">Lender & Product</th>
                  <th className="w-24 px-4 py-3 text-right">Rate</th>
                  <th className="w-32 px-4 py-3">Term</th>
                  <th className="w-28 px-4 py-3 text-right">P&I</th>
                  <th className="w-28 px-4 py-3 text-right">PITIA</th>
                  <th className="w-20 px-4 py-3">MI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mafi-border">
                {realScenarios.map((scenario) => {
                  const isSelected = selectedScenario === scenario.scenarioNumber;

                  return (
                    <tr
                      className={
                        isSelected
                          ? "border-l-4 border-mafi-blue-primary bg-mafi-blue-primary/10"
                          : ""
                      }
                      key={scenario.scenarioNumber}
                    >
                      <td className="px-4 py-3 font-semibold text-mafi-text-dark">
                        Scenario {scenario.scenarioNumber}
                        {isSelected ? " (Final)" : ""}
                      </td>
                      <td className="break-words px-4 py-3 text-mafi-text-mid">
                        {scenario.lenderAndProduct}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-mafi-text-mid">
                        {scenario.interestRate || "-"}
                      </td>
                      <td className="px-4 py-3 text-mafi-text-mid">
                        {getLoanTermMetadata(
                          normalizeLoanTerm(scenario.loanTerm, scenario.program),
                        ).label}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-mafi-text-mid">
                        {scenario.principalAndInterest || "-"}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums text-mafi-text-dark">
                        {scenario.pitia || "-"}
                      </td>
                      <td className="px-4 py-3 text-mafi-text-mid">
                        {scenario.mortgageInsurance ? "Yes" : "No"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : null}

      {readOnly ? null : (
        <div className="scenario-desk-no-print sticky bottom-0 z-10 -mx-1 rounded-t-lg border border-mafi-border bg-mafi-bg-white/95 p-3 shadow-lg backdrop-blur">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-xs font-medium text-mafi-text-mid">
              {selectedRealScenario
                ? `Scenario ${selectedScenario} selected as final.`
                : "Select a real scenario before sending to Phase 4."}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button disabled={isPending} onClick={save} type="button" variant="outline">
              Save
            </Button>
            <Button
              disabled={isPending}
              onClick={() => window.print()}
              type="button"
              variant="outline"
            >
              Print as PDF
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  disabled={isPending || !selectedRealScenario}
                  type="button"
                >
                  Send to Loan Estimate & Pre-Approval
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Finalize Scenario Desk?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will lock the selected scenario and move the contact to
                    Phase 4 for Loan Estimate and Pre-Approval work.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                {missingAnnualInsurance ? (
                  <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
                    {missingInsuranceMessage}
                  </p>
                ) : null}
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isPending}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    disabled={
                      isPending || missingAnnualInsurance || !selectedRealScenario
                    }
                    onClick={finalize}
                  >
                    Finalize and Move to Phase 4
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            </div>
          </div>
        </div>
      )}
      </section>
      <ProspectScenarioPrintDocument
        {...printContext}
        documentState="draft"
        scenarios={printScenarios}
        selectedScenarioNumber={selectedScenario}
      />
    </>
  );
}

function ScenarioGroup({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-bold uppercase text-mafi-text-mid">
        {title}
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </div>
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
