"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
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
import { ScenarioProgram } from "@prisma/client";
import {
  finalizeScenarioDesk,
  saveScenarioDesk,
  ScenarioInput,
} from "@/lib/actions/scenario-actions";
import {
  currencyInputToNumber,
  currencyInputToRaw,
  formatCurrencyDisplayWithCents,
  formatCurrencyInput,
} from "@/lib/currency";
import { scenarioProgramOptions } from "@/lib/scenario-program";

type ScenarioDraft = ScenarioInput;

type ScenarioFormProps = {
  annualPropertyTaxes: string;
  contactId: string;
  initialScenarios: ScenarioInput[];
  loanAmount: string;
  monthlyHoa: string;
  readOnly?: boolean;
  selectedScenarioNumber?: number | null;
};

const emptyScenario = (number: number): ScenarioDraft => ({
  escrowed: false,
  interestRate: "",
  lenderAndProduct: "",
  loanTerm: "30",
  monthlyInsurance: "",
  originationPay: "",
  pitia: "",
  principalAndInterest: "",
  processingFee: "",
  program: ScenarioProgram.FIXED_30,
  scenarioNumber: number,
});

function scenarioSet(initialScenarios: ScenarioInput[], readOnly: boolean) {
  if (readOnly) {
    return initialScenarios.length ? initialScenarios : [emptyScenario(1)];
  }

  return [1, 2, 3].map(
    (number) =>
      initialScenarios.find(
        (scenario) => scenario.scenarioNumber === number,
      ) ?? emptyScenario(number),
  );
}

function parsePercent(value: string) {
  const parsed = Number(value.replace(/[%\s,]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function monthlyPrincipalAndInterest(
  loanAmount: number,
  annualRate: number,
  termYears: number,
) {
  if (!loanAmount || !termYears) {
    return 0;
  }

  const monthlyRate = annualRate / 100 / 12;
  const totalPayments = termYears * 12;

  if (!monthlyRate) {
    return loanAmount / totalPayments;
  }

  return (
    loanAmount *
    ((monthlyRate * (1 + monthlyRate) ** totalPayments) /
      ((1 + monthlyRate) ** totalPayments - 1))
  );
}

function withCalculatedPayments(
  scenario: ScenarioDraft,
  context: {
    annualPropertyTaxes: string;
    loanAmount: string;
    monthlyHoa: string;
  },
) {
  const principalAndInterest = monthlyPrincipalAndInterest(
    currencyInputToNumber(context.loanAmount),
    parsePercent(scenario.interestRate),
    Number(scenario.loanTerm),
  );
  const pitia =
    principalAndInterest +
    currencyInputToNumber(context.annualPropertyTaxes) / 12 +
    currencyInputToNumber(scenario.monthlyInsurance) +
    currencyInputToNumber(context.monthlyHoa);

  return {
    ...scenario,
    pitia: principalAndInterest ? formatCurrencyDisplayWithCents(pitia, "") : "",
    principalAndInterest: principalAndInterest
      ? formatCurrencyDisplayWithCents(principalAndInterest, "")
      : "",
  };
}

export function ScenarioForm({
  annualPropertyTaxes,
  contactId,
  initialScenarios,
  loanAmount,
  monthlyHoa,
  readOnly = false,
  selectedScenarioNumber,
}: ScenarioFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const calculationContext = { annualPropertyTaxes, loanAmount, monthlyHoa };
  const [scenarios, setScenarios] = useState<ScenarioDraft[]>(
    () => scenarioSet(initialScenarios, readOnly),
  );
  const [selectedScenario, setSelectedScenario] = useState<number | null>(
    selectedScenarioNumber ?? null,
  );

  function updateScenario<T extends keyof ScenarioDraft>(
    scenarioNumber: number,
    field: T,
    value: ScenarioDraft[T],
  ) {
    setScenarios((currentScenarios) =>
      currentScenarios.map((scenario) =>
        scenario.scenarioNumber === scenarioNumber
          ? withCalculatedPayments(
              { ...scenario, [field]: value },
              calculationContext,
            )
          : scenario,
      ),
    );
  }

  function scenarioPayload() {
    return scenarios.map((scenario) => ({
      escrowed: scenario.escrowed,
      interestRate: scenario.interestRate,
      lenderAndProduct: scenario.lenderAndProduct,
      loanTerm: scenario.loanTerm,
      monthlyInsurance: currencyInputToRaw(scenario.monthlyInsurance),
      originationPay: currencyInputToRaw(scenario.originationPay),
      pitia: currencyInputToRaw(scenario.pitia),
      principalAndInterest: currencyInputToRaw(scenario.principalAndInterest),
      processingFee: currencyInputToRaw(scenario.processingFee),
      program: scenario.program,
      scenarioNumber: scenario.scenarioNumber,
    }));
  }

  function save() {
    startTransition(async () => {
      const result = await saveScenarioDesk({
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

    startTransition(async () => {
      const result = await finalizeScenarioDesk({
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
    <section className="space-y-4">
      <div>
        <div>
          <h2 className="text-xl font-bold text-mafi-text-dark">
            Scenario Options
          </h2>
          <p className="text-sm text-mafi-text-mid">
            Add up to three options. P&I and PITIA calculate from the pulled-forward loan amount, current-year taxes, monthly insurance, HOA, rate, and term.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {scenarios
          .sort((a, b) => a.scenarioNumber - b.scenarioNumber)
          .map((scenario) => (
            <Card className="border-mafi-border" key={scenario.scenarioNumber}>
              <CardHeader className="border-b border-mafi-border bg-mafi-bg-light">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-base text-mafi-blue-primary">
                    Scenario {scenario.scenarioNumber}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {readOnly ? (
                      <span
                        className={`text-xs font-semibold ${
                          selectedScenario === scenario.scenarioNumber
                            ? "text-mafi-blue-primary"
                            : "text-mafi-text-light"
                        }`}
                      >
                        {selectedScenario === scenario.scenarioNumber
                          ? "Final selected"
                          : "Not selected"}
                      </span>
                    ) : (
                      <>
                        <button
                          className="text-xs font-semibold text-mafi-blue-primary hover:text-mafi-blue-dark"
                          onClick={() =>
                            setSelectedScenario(scenario.scenarioNumber)
                          }
                          type="button"
                        >
                          <span
                            className={
                              selectedScenario === scenario.scenarioNumber
                                ? "text-mafi-blue-primary"
                                : "text-mafi-text-light"
                            }
                          >
                            {selectedScenario === scenario.scenarioNumber
                              ? "Final selected"
                              : "Select as Final"}
                          </span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <ScenarioGroup title="Loan Terms">
                  <Field className="sm:col-span-2" label="Lender & Product">
                    <Input
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
                      inputMode="decimal"
                      onChange={(event) =>
                        updateScenario(
                          scenario.scenarioNumber,
                          "interestRate",
                          event.target.value,
                        )
                      }
                      readOnly={readOnly}
                      value={scenario.interestRate}
                    />
                  </Field>
                  <Field label="Loan Term (years)">
                    <Input
                      inputMode="numeric"
                      onChange={(event) =>
                        updateScenario(
                          scenario.scenarioNumber,
                          "loanTerm",
                          event.target.value,
                        )
                      }
                      readOnly={readOnly}
                      value={scenario.loanTerm}
                    />
                  </Field>
                  <Field label="Program">
                    <Select
                      disabled={readOnly}
                      onValueChange={(value) =>
                        updateScenario(
                          scenario.scenarioNumber,
                          "program",
                          value as ScenarioProgram,
                        )
                      }
                      value={scenario.program}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {scenarioProgramOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </ScenarioGroup>

                <ScenarioGroup title="Payment Breakdown">
                  <Field label="Principal & Interest (P&I)">
                    <Input
                      className="cursor-default bg-mafi-bg-light text-mafi-text-mid"
                      inputMode="decimal"
                      readOnly
                      value={scenario.principalAndInterest}
                    />
                  </Field>
                  <Field label="Monthly Insurance">
                    <Input
                      inputMode="decimal"
                      onChange={(event) =>
                        updateScenario(
                          scenario.scenarioNumber,
                          "monthlyInsurance",
                          formatCurrencyInput(event.target.value),
                        )
                      }
                      readOnly={readOnly}
                      value={scenario.monthlyInsurance}
                    />
                  </Field>
                  <Field label="PITIA">
                    <Input
                      className="cursor-default bg-mafi-bg-light text-mafi-text-mid"
                      inputMode="decimal"
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
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </ScenarioGroup>

                <ScenarioGroup title="Fees">
                  <Field label="Origination Pay">
                    <Input
                      inputMode="decimal"
                      onChange={(event) =>
                        updateScenario(
                          scenario.scenarioNumber,
                          "originationPay",
                          formatCurrencyInput(event.target.value),
                        )
                      }
                      readOnly={readOnly}
                      value={scenario.originationPay}
                    />
                  </Field>
                  <Field label="Processing Fee">
                    <Input
                      inputMode="decimal"
                      onChange={(event) =>
                        updateScenario(
                          scenario.scenarioNumber,
                          "processingFee",
                          formatCurrencyInput(event.target.value),
                        )
                      }
                      readOnly={readOnly}
                      value={scenario.processingFee}
                    />
                  </Field>
                </ScenarioGroup>
              </CardContent>
            </Card>
          ))}
      </div>

      {readOnly ? null : (
        <div className="flex justify-end gap-2">
          <Button disabled={isPending} onClick={save} type="button" variant="outline">
            Save
          </Button>
          <Button disabled={isPending} onClick={finalize} type="button">
            Finalize Scenario Desk
          </Button>
        </div>
      )}
    </section>
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
      <h3 className="text-xs font-bold uppercase tracking-wide text-mafi-text-mid">
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
      <Label className="text-xs font-semibold">{label}</Label>
      {children}
    </div>
  );
}
