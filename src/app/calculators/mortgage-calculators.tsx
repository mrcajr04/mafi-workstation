"use client";

import type { ReactNode } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type CalculatorTab = "standard" | "amortization" | "ltv" | "dti";

type SharedMortgageInputProps = {
  interestRate: string;
  loanAmount: string;
  loanTerm: string;
  setInterestRate: (value: string) => void;
  setLoanAmount: (value: string) => void;
  setLoanTerm: (value: string) => void;
};

const tabs: { id: CalculatorTab; label: string }[] = [
  { id: "standard", label: "Standard" },
  { id: "amortization", label: "Amortization" },
  { id: "ltv", label: "LTV" },
  { id: "dti", label: "DTI" },
];

function parseNumber(value: string) {
  const parsed = Number(value.replace(/[$,%\s,]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value: number) {
  return value.toLocaleString("en-US", {
    currency: "USD",
    maximumFractionDigits: 2,
    style: "currency",
  });
}

function formatPercent(value: number) {
  return `${value.toFixed(2)}%`;
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

export function MortgageCalculators() {
  const [activeTab, setActiveTab] = useState<CalculatorTab>("standard");
  const [loanAmount, setLoanAmount] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [loanTerm, setLoanTerm] = useState("30");
  const sharedMortgageInputs = {
    interestRate,
    loanAmount,
    loanTerm,
    setInterestRate,
    setLoanAmount,
    setLoanTerm,
  };

  return (
    <Card className="border-mafi-border bg-mafi-bg-white">
      <CardHeader className="border-b border-mafi-border bg-mafi-bg-light">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button
              className={cn(
                "min-h-10 shrink-0 rounded-md px-4 text-sm font-semibold transition",
                activeTab === tab.id
                  ? "bg-mafi-blue-primary text-white"
                  : "bg-white text-mafi-text-dark hover:bg-mafi-bg-lighter hover:text-mafi-blue-primary",
              )}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <CalculatorPanel active={activeTab === "standard"}>
          <StandardCalculator {...sharedMortgageInputs} />
        </CalculatorPanel>
        <CalculatorPanel active={activeTab === "amortization"}>
          <AmortizationCalculator {...sharedMortgageInputs} />
        </CalculatorPanel>
        <CalculatorPanel active={activeTab === "ltv"}>
          <LtvCalculator />
        </CalculatorPanel>
        <CalculatorPanel active={activeTab === "dti"}>
          <DtiCalculator />
        </CalculatorPanel>
      </CardContent>
    </Card>
  );
}

function CalculatorPanel({
  active,
  children,
}: {
  active: boolean;
  children: ReactNode;
}) {
  return (
    <div className={cn(!active && "hidden")} hidden={!active}>
      {children}
    </div>
  );
}

function StandardCalculator({
  interestRate,
  loanAmount,
  loanTerm,
  setInterestRate,
  setLoanAmount,
  setLoanTerm,
}: SharedMortgageInputProps) {
  const [propertyTax, setPropertyTax] = useState("");
  const [insurance, setInsurance] = useState("");
  const [hoa, setHoa] = useState("");
  const principalAndInterest = monthlyPrincipalAndInterest(
    parseNumber(loanAmount),
    parseNumber(interestRate),
    parseNumber(loanTerm),
  );
  const totalMonthly =
    principalAndInterest +
    parseNumber(propertyTax) / 12 +
    parseNumber(insurance) / 12 +
    parseNumber(hoa);

  return (
    <CalculatorShell
      description="Estimate principal, interest, and total monthly payment."
      title="Standard Calculator"
    >
      <MortgageInputGrid>
        <Field label="Loan Amount">
          <Input value={loanAmount} onChange={(event) => setLoanAmount(event.target.value)} />
        </Field>
        <Field label="Interest Rate (%)">
          <Input value={interestRate} onChange={(event) => setInterestRate(event.target.value)} />
        </Field>
        <Field label="Loan Term (years)">
          <Input value={loanTerm} onChange={(event) => setLoanTerm(event.target.value)} />
        </Field>
        <Field label="Property Tax (annual)">
          <Input value={propertyTax} onChange={(event) => setPropertyTax(event.target.value)} />
        </Field>
        <Field label="Home Insurance (annual)">
          <Input value={insurance} onChange={(event) => setInsurance(event.target.value)} />
        </Field>
        <Field label="HOA (monthly)">
          <Input value={hoa} onChange={(event) => setHoa(event.target.value)} />
        </Field>
      </MortgageInputGrid>
      <OutputGrid>
        <Output label="Monthly Principal & Interest" value={formatCurrency(principalAndInterest)} />
        <Output label="Estimated PITIA-style Payment" value={formatCurrency(totalMonthly)} />
      </OutputGrid>
    </CalculatorShell>
  );
}

function AmortizationCalculator({
  interestRate,
  loanAmount,
  loanTerm,
  setInterestRate,
  setLoanAmount,
  setLoanTerm,
}: SharedMortgageInputProps) {
  const [showFullSchedule, setShowFullSchedule] = useState(false);
  const schedule = useMemo(
    () =>
      buildAmortizationSchedule(
        parseNumber(loanAmount),
        parseNumber(interestRate),
        parseNumber(loanTerm),
      ),
    [interestRate, loanAmount, loanTerm],
  );
  const visibleSchedule = showFullSchedule ? schedule : schedule.slice(0, 12);

  return (
    <CalculatorShell
      description="Review principal, interest, and balance by payment."
      title="Amortization Calculator"
    >
      <MortgageInputGrid>
        <Field label="Loan Amount">
          <Input value={loanAmount} onChange={(event) => setLoanAmount(event.target.value)} />
        </Field>
        <Field label="Interest Rate (%)">
          <Input value={interestRate} onChange={(event) => setInterestRate(event.target.value)} />
        </Field>
        <Field label="Loan Term (years)">
          <Input value={loanTerm} onChange={(event) => setLoanTerm(event.target.value)} />
        </Field>
      </MortgageInputGrid>
      <div className="overflow-x-auto rounded-md border border-mafi-border">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-mafi-bg-lighter text-mafi-text-dark">
            <tr>
              <th className="px-3 py-2">Payment</th>
              <th className="px-3 py-2">Principal</th>
              <th className="px-3 py-2">Interest</th>
              <th className="px-3 py-2">Balance</th>
            </tr>
          </thead>
          <tbody>
            {visibleSchedule.length ? (
              visibleSchedule.map((row) => (
                <tr className="border-t border-mafi-border" key={row.paymentNumber}>
                  <td className="px-3 py-2">{row.paymentNumber}</td>
                  <td className="px-3 py-2">{formatCurrency(row.principalPaid)}</td>
                  <td className="px-3 py-2">{formatCurrency(row.interestPaid)}</td>
                  <td className="px-3 py-2">{formatCurrency(row.remainingBalance)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-3 py-8 text-center text-mafi-text-light" colSpan={4}>
                  Enter loan details to view the schedule.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {schedule.length > 12 ? (
        <Button
          onClick={() => setShowFullSchedule((current) => !current)}
          type="button"
          variant="outline"
        >
          {showFullSchedule ? "Show first 12 months" : "Show full schedule"}
        </Button>
      ) : null}
    </CalculatorShell>
  );
}

function LtvCalculator() {
  const [propertyValue, setPropertyValue] = useState("");
  const [loanAmount, setLoanAmount] = useState("");
  const parsedPropertyValue = parseNumber(propertyValue);
  const parsedLoanAmount = parseNumber(loanAmount);
  const ltv =
    parsedPropertyValue && parsedLoanAmount
      ? (parsedLoanAmount / parsedPropertyValue) * 100
      : 0;

  return (
    <CalculatorShell
      description="Calculate loan-to-value based on property value and loan amount."
      title="LTV Calculator"
    >
      <MortgageInputGrid>
        <Field label="Property Value">
          <Input value={propertyValue} onChange={(event) => setPropertyValue(event.target.value)} />
        </Field>
        <Field label="Loan Amount">
          <Input value={loanAmount} onChange={(event) => setLoanAmount(event.target.value)} />
        </Field>
      </MortgageInputGrid>
      <OutputGrid>
        <Output label="LTV" value={parsedPropertyValue ? formatPercent(ltv) : "—"} />
      </OutputGrid>
    </CalculatorShell>
  );
}

function DtiCalculator() {
  const [grossIncome, setGrossIncome] = useState("");
  const [debts, setDebts] = useState([""]);
  const totalDebts = debts.reduce((sum, debt) => sum + parseNumber(debt), 0);
  const income = parseNumber(grossIncome);
  const dti = income ? (totalDebts / income) * 100 : 0;

  return (
    <CalculatorShell
      description="Calculate debt-to-income from monthly income and monthly debts."
      title="DTI Calculator"
    >
      <MortgageInputGrid>
        <Field label="Monthly Gross Income">
          <Input value={grossIncome} onChange={(event) => setGrossIncome(event.target.value)} />
        </Field>
      </MortgageInputGrid>
      <div className="rounded-md border border-mafi-border bg-mafi-bg-off p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-mafi-text-dark">
            Monthly Debt Payments
          </h3>
          <Button
            onClick={() =>
              setDebts((current) => [...current, ""])
            }
            size="sm"
            type="button"
            variant="outline"
          >
            <Plus className="mr-1 size-4" />
            Add debt
          </Button>
        </div>
        <div className="mt-4 space-y-3">
          {debts.map((debt, index) => (
            <div className="flex gap-2" key={`debt-${index}`}>
              <Input
                aria-label="Monthly debt payment"
                value={debt}
                onChange={(event) =>
                  setDebts((current) =>
                    current.map((currentDebt, currentIndex) =>
                      currentIndex === index ? event.target.value : currentDebt,
                    ),
                  )
                }
              />
              <Button
                aria-label="Remove debt"
                onClick={() =>
                  setDebts((current) =>
                    current.filter((_, currentIndex) => currentIndex !== index),
                  )
                }
                size="icon"
                type="button"
                variant="outline"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
      <OutputGrid>
        <Output label="Total Monthly Debts" value={formatCurrency(totalDebts)} />
        <Output label="DTI" value={income ? formatPercent(dti) : "—"} />
      </OutputGrid>
    </CalculatorShell>
  );
}

function buildAmortizationSchedule(
  loanAmount: number,
  annualRate: number,
  termYears: number,
) {
  if (!loanAmount || !termYears) {
    return [];
  }

  const monthlyPayment = monthlyPrincipalAndInterest(
    loanAmount,
    annualRate,
    termYears,
  );
  const monthlyRate = annualRate / 100 / 12;
  let balance = loanAmount;

  return Array.from({ length: termYears * 12 }, (_, index) => {
    const interestPaid = balance * monthlyRate;
    const principalPaid = Math.min(monthlyPayment - interestPaid, balance);
    balance = Math.max(balance - principalPaid, 0);

    return {
      interestPaid,
      paymentNumber: index + 1,
      principalPaid,
      remainingBalance: balance,
    };
  });
}

function CalculatorShell({
  children,
  description,
  title,
}: {
  children: React.ReactNode;
  description: string;
  title: string;
}) {
  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-mafi-blue-primary">{title}</h2>
        <p className="mt-1 text-sm text-mafi-text-mid">{description}</p>
      </div>
      {children}
    </section>
  );
}

function MortgageInputGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-3">{children}</div>;
}

function Field({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function OutputGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2">{children}</div>;
}

function Output({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-mafi-border bg-mafi-bg-light p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-mafi-text-mid">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-mafi-blue-primary">{value}</p>
    </div>
  );
}
