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
import {
  finalizeScenarioDesk,
  ScenarioInput,
} from "@/lib/actions/scenario-actions";

type ScenarioFormProps = {
  contactId: string;
  initialScenarios: ScenarioInput[];
  selectedScenarioNumber?: number | null;
};

const emptyScenario = (number: number): ScenarioInput => ({
  escrowed: false,
  interestRate: "",
  lenderAndProduct: "",
  originationPay: "",
  pitia: "",
  principalAndInterest: "",
  processingFee: "",
  scenarioNumber: number,
});

export function ScenarioForm({
  contactId,
  initialScenarios,
  selectedScenarioNumber,
}: ScenarioFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [scenarios, setScenarios] = useState<ScenarioInput[]>(
    initialScenarios.length ? initialScenarios : [emptyScenario(1)],
  );
  const [selectedScenario, setSelectedScenario] = useState<number | null>(
    selectedScenarioNumber ?? null,
  );

  function updateScenario<T extends keyof ScenarioInput>(
    scenarioNumber: number,
    field: T,
    value: ScenarioInput[T],
  ) {
    setScenarios((currentScenarios) =>
      currentScenarios.map((scenario) =>
        scenario.scenarioNumber === scenarioNumber
          ? { ...scenario, [field]: value }
          : scenario,
      ),
    );
  }

  function addScenario() {
    const usedNumbers = scenarios.map((scenario) => scenario.scenarioNumber);
    const nextNumber = [1, 2, 3].find((number) => !usedNumbers.includes(number));

    if (!nextNumber) {
      return;
    }

    setScenarios((currentScenarios) => [
      ...currentScenarios,
      emptyScenario(nextNumber),
    ]);
  }

  function removeScenario(scenarioNumber: number) {
    setScenarios((currentScenarios) => {
      const nextScenarios = currentScenarios.filter(
        (scenario) => scenario.scenarioNumber !== scenarioNumber,
      );

      if (selectedScenario === scenarioNumber) {
        setSelectedScenario(null);
      }

      return nextScenarios.length ? nextScenarios : [emptyScenario(1)];
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
        scenarios,
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-mafi-text-dark">
            Scenario Options
          </h2>
          <p className="text-sm text-mafi-text-mid">
            Add up to three options, select one final scenario, then finalize.
          </p>
        </div>
        <Button
          disabled={scenarios.length >= 3}
          onClick={addScenario}
          type="button"
          variant="outline"
        >
          Add Scenario
        </Button>
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
                  <button
                    className="text-xs font-semibold text-mafi-blue-primary hover:text-mafi-blue-dark"
                    onClick={() => setSelectedScenario(scenario.scenarioNumber)}
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
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                <Field label="Lender & Product">
                  <Input
                    onChange={(event) =>
                      updateScenario(
                        scenario.scenarioNumber,
                        "lenderAndProduct",
                        event.target.value,
                      )
                    }
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
                    value={scenario.interestRate}
                  />
                </Field>
                <Field label="Principal & Interest (P&I)">
                  <Input
                    inputMode="decimal"
                    onChange={(event) =>
                      updateScenario(
                        scenario.scenarioNumber,
                        "principalAndInterest",
                        event.target.value,
                      )
                    }
                    value={scenario.principalAndInterest}
                  />
                </Field>
                <Field label="PITIA">
                  <Input
                    inputMode="decimal"
                    onChange={(event) =>
                      updateScenario(
                        scenario.scenarioNumber,
                        "pitia",
                        event.target.value,
                      )
                    }
                    value={scenario.pitia}
                  />
                </Field>
                <Field label="Escrowed">
                  <Select
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
                <Field label="Origination Pay">
                  <Input
                    inputMode="decimal"
                    onChange={(event) =>
                      updateScenario(
                        scenario.scenarioNumber,
                        "originationPay",
                        event.target.value,
                      )
                    }
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
                        event.target.value,
                      )
                    }
                    value={scenario.processingFee}
                  />
                </Field>
                <Button
                  className="w-full"
                  onClick={() => removeScenario(scenario.scenarioNumber)}
                  type="button"
                  variant="outline"
                >
                  Remove
                </Button>
              </CardContent>
            </Card>
          ))}
      </div>

      <div className="flex justify-end">
        <Button disabled={isPending} onClick={finalize} type="button">
          Finalize Scenario Desk
        </Button>
      </div>
    </section>
  );
}

function Field({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-semibold">{label}</Label>
      {children}
    </div>
  );
}
