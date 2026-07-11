"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Calculator, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { currencyInputToNumber, formatCurrencyDisplayWithCents, formatCurrencyInput } from "@/lib/currency";
import {
  calculateRefinanceScenario,
  calculateRemainingTermMonths,
  refinanceCalculatorDefaults,
  type RefinanceCalculationResult,
  type RefinanceCalculatorInput,
} from "@/lib/refinance-calculator";

type ResultTab = "details" | "amortization";
type LoanView = "current" | "new";
type FormState = {
  currentBalance: string;
  currentInterestRate: string;
  originalTermMonths: string;
  originationMonth: string;
  originationYear: string;
  newLoanAmount: string;
  newInterestRate: string;
  newTermMonths: string;
  refinanceFees: string;
  cashOut: string;
  rollFeesIntoLoan: boolean;
};

const termOptions = [360, 240, 180, 120];
const monthOptions = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function initialForm(): FormState {
  const value = refinanceCalculatorDefaults;
  return {
    currentBalance: formatCurrencyInput(String(value.currentBalance)),
    currentInterestRate: value.currentInterestRate.toFixed(3),
    originalTermMonths: String(value.originalTermMonths),
    originationMonth: String(value.originationMonth),
    originationYear: String(value.originationYear),
    newLoanAmount: formatCurrencyInput(String(value.newLoanAmount)),
    newInterestRate: value.newInterestRate.toFixed(3),
    newTermMonths: String(value.newTermMonths),
    refinanceFees: formatCurrencyInput(String(value.refinanceFees)),
    cashOut: "$0",
    rollFeesIntoLoan: value.rollFeesIntoLoan,
  };
}

function toInput(form: FormState): RefinanceCalculatorInput {
  return {
    currentBalance: currencyInputToNumber(form.currentBalance),
    currentInterestRate: Number(form.currentInterestRate),
    originalTermMonths: Number(form.originalTermMonths),
    originationMonth: Number(form.originationMonth),
    originationYear: Number(form.originationYear),
    newLoanAmount: currencyInputToNumber(form.newLoanAmount),
    newInterestRate: Number(form.newInterestRate),
    newTermMonths: Number(form.newTermMonths),
    refinanceFees: currencyInputToNumber(form.refinanceFees),
    cashOut: currencyInputToNumber(form.cashOut),
    rollFeesIntoLoan: form.rollFeesIntoLoan,
  };
}

const money = (value: number) => formatCurrencyDisplayWithCents(value, "$0.00");

export function RefinanceCalculator() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [calculatedInput, setCalculatedInput] = useState<RefinanceCalculatorInput>(refinanceCalculatorDefaults);
  const [asOfDate, setAsOfDate] = useState(() => new Date());
  const [errors, setErrors] = useState<string[]>([]);
  const [confirmation, setConfirmation] = useState("Sample comparison loaded");
  const [activeTab, setActiveTab] = useState<ResultTab>("details");
  const [loanView, setLoanView] = useState<LoanView>("current");
  const calculation = useMemo(() => calculateRefinanceScenario(calculatedInput, asOfDate), [calculatedInput, asOfDate]);
  const result = calculation.result;
  const previewRemaining = calculateRemainingTermMonths(Number(form.originalTermMonths), Number(form.originationMonth), Number(form.originationYear), new Date());

  function setCurrency(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: formatCurrencyInput(value) }));
  }

  function calculate() {
    const input = toInput(form);
    const now = new Date();
    const required = [
      !form.currentBalance ? "Enter a current loan balance." : "",
      form.currentInterestRate === "" ? "Enter the current interest rate, including 0% when applicable." : "",
      !form.newLoanAmount ? "Enter a proposed new loan amount." : "",
      form.newInterestRate === "" ? "Enter the new interest rate, including 0% when applicable." : "",
    ].filter(Boolean);
    const next = calculateRefinanceScenario(input, now);
    const nextErrors = [...required, ...next.errors];
    setErrors(nextErrors);
    if (nextErrors.length) {
      setConfirmation("");
      return;
    }
    setCalculatedInput(input);
    setAsOfDate(now);
    setConfirmation("Refinance comparison updated");
  }

  function reset() {
    setForm(initialForm());
    setCalculatedInput(refinanceCalculatorDefaults);
    setAsOfDate(new Date());
    setErrors([]);
    setConfirmation("Sample defaults restored");
    setActiveTab("details");
    setLoanView("current");
  }

  return (
    <div className="space-y-5">
      <RefinanceCalculatorInputs form={form} setForm={setForm} setCurrency={setCurrency} onCalculate={calculate} onReset={reset} errors={errors} confirmation={confirmation} remainingText={previewRemaining.months ? `${previewRemaining.months} months` : previewRemaining.error ?? "Review required"} />

      <section className="overflow-hidden rounded-md border border-mafi-border bg-white">
        <div className="flex border-b border-mafi-border bg-mafi-bg-light px-4" role="tablist" aria-label="Refinance calculator results">
          <Tab active={activeTab === "details"} controls="refinance-details" onClick={() => setActiveTab("details")}>Details</Tab>
          <Tab active={activeTab === "amortization"} controls="refinance-amortization" onClick={() => setActiveTab("amortization")}>Amortization Table</Tab>
        </div>
        {result ? activeTab === "details" ? <RefinanceDetails input={calculatedInput} result={result} /> : <LoanAmortizationTable result={result} loanView={loanView} setLoanView={setLoanView} /> : <p className="p-8 text-center text-sm text-mafi-text-mid">Correct the inputs above and calculate again.</p>}
      </section>
    </div>
  );
}

type InputsProps = {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  setCurrency: (field: keyof FormState, value: string) => void;
  onCalculate: () => void;
  onReset: () => void;
  errors: string[];
  confirmation: string;
  remainingText: string;
};

function RefinanceCalculatorInputs({ form, setForm, setCurrency, onCalculate, onReset, errors, confirmation, remainingText }: InputsProps) {
  return (
    <section className="rounded-md border border-mafi-border bg-white">
      <div className="flex flex-col gap-3 border-b border-mafi-border bg-mafi-bg-light px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="text-sm font-bold text-mafi-text-dark">Refinance assumptions</h2><p className="mt-0.5 text-xs text-mafi-text-mid">Compare remaining current-loan costs with a proposed fixed-rate refinance.</p></div>
        <div className="flex gap-2"><Button onClick={onReset} type="button" variant="outline"><RotateCcw className="h-3.5 w-3.5" />Reset</Button><Button className="bg-mafi-blue-primary text-white hover:bg-mafi-blue-dark" onClick={onCalculate} type="button"><Calculator className="h-3.5 w-3.5" />Calculate</Button></div>
      </div>
      <div className="grid lg:grid-cols-2">
        <LoanInputGroup title="Current Loan" tone="border-amber-500" description="Existing unpaid balance and remaining term.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Current Loan Balance" required><Input aria-label="Current Loan Balance" inputMode="decimal" value={form.currentBalance} onChange={(event) => setCurrency("currentBalance", event.target.value)} /></Field>
            <Field label="Current Interest Rate" required><PercentInput label="Current Interest Rate" value={form.currentInterestRate} onChange={(value) => setForm((current) => ({ ...current, currentInterestRate: value }))} /></Field>
            <Field label="Current Original Term"><TermSelect label="Current Original Term" value={form.originalTermMonths} onChange={(value) => setForm((current) => ({ ...current, originalTermMonths: value }))} /></Field>
            <Field label="Original Loan Origination Date"><div className="grid grid-cols-[minmax(0,1fr)_6.5rem] gap-2"><select aria-label="Origination Month" className="h-10 rounded-md border border-input bg-white px-3 text-sm" value={form.originationMonth} onChange={(event) => setForm((current) => ({ ...current, originationMonth: event.target.value }))}>{monthOptions.map((month, index) => <option value={index + 1} key={month}>{month}</option>)}</select><Input aria-label="Origination Year" inputMode="numeric" value={form.originationYear} onChange={(event) => setForm((current) => ({ ...current, originationYear: event.target.value }))} /></div></Field>
          </div>
          <div className="mt-4 flex items-center justify-between rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs"><span className="font-semibold text-amber-800">Calculated Remaining Term</span><span className="font-mono font-bold tabular-nums text-mafi-text-dark">{remainingText}</span></div>
        </LoanInputGroup>
        <LoanInputGroup title="Proposed New Loan" tone="border-teal-600" description="Proposed principal, rate, term, and transaction costs.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="New Loan Amount" required><Input aria-label="New Loan Amount" inputMode="decimal" value={form.newLoanAmount} onChange={(event) => setCurrency("newLoanAmount", event.target.value)} /><p className="text-[11px] leading-4 text-mafi-text-light">Include any cash-out proceeds being financed.</p></Field>
            <Field label="New Interest Rate" required><PercentInput label="New Interest Rate" value={form.newInterestRate} onChange={(value) => setForm((current) => ({ ...current, newInterestRate: value }))} /></Field>
            <Field label="New Term"><TermSelect label="New Term" value={form.newTermMonths} onChange={(value) => setForm((current) => ({ ...current, newTermMonths: value }))} /></Field>
            <Field label="Refinance Fees"><Input aria-label="Refinance Fees" inputMode="decimal" value={form.refinanceFees} onChange={(event) => setCurrency("refinanceFees", event.target.value)} /></Field>
            <Field label="Cash Out"><Input aria-label="Cash Out" inputMode="decimal" value={form.cashOut} onChange={(event) => setCurrency("cashOut", event.target.value)} /><p className="text-[11px] leading-4 text-mafi-text-light">Informational only; do not add it again to New Loan Amount.</p></Field>
            <label className="flex min-h-10 items-center gap-2 self-end rounded-md border border-mafi-border bg-mafi-bg-off px-3 text-sm font-semibold text-mafi-text-dark"><input checked={form.rollFeesIntoLoan} className="h-4 w-4 accent-mafi-blue-primary" onChange={(event) => setForm((current) => ({ ...current, rollFeesIntoLoan: event.target.checked }))} type="checkbox" />Roll refinance fees into new loan</label>
          </div>
        </LoanInputGroup>
      </div>
      {(errors.length || confirmation) ? <div aria-live="polite" className="border-t border-mafi-border px-4 py-2.5 text-xs">{errors.length ? <ul className="space-y-1 text-red-700">{errors.map((error) => <li key={error}>{error}</li>)}</ul> : <p className="font-medium text-emerald-700">{confirmation}</p>}</div> : null}
    </section>
  );
}

function LoanInputGroup({ children, description, title, tone }: { children: React.ReactNode; description: string; title: string; tone: string }) {
  return <div className={`border-l-2 p-4 lg:first:border-r lg:first:border-mafi-border ${tone}`}><div className="mb-4"><h3 className="text-sm font-bold text-mafi-text-dark">{title}</h3><p className="mt-0.5 text-xs text-mafi-text-mid">{description}</p></div>{children}</div>;
}

function Field({ children, label, required }: { children: React.ReactNode; label: string; required?: boolean }) {
  return <div className="space-y-1.5"><Label className="text-xs font-bold text-mafi-text-dark">{label}{required ? <span className="ml-1 text-red-600">*</span> : null}</Label>{children}</div>;
}

function PercentInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <div className="relative"><Input aria-label={label} className="pr-7" inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value)} /><span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-xs font-semibold text-mafi-text-light">%</span></div>;
}

function TermSelect({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <select aria-label={label} className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm font-medium text-mafi-text-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mafi-blue-primary/30" value={value} onChange={(event) => onChange(event.target.value)}>{termOptions.map((months) => <option value={months} key={months}>{months} months ({months / 12} years)</option>)}</select>;
}

function Tab({ active, children, controls, onClick }: { active: boolean; children: React.ReactNode; controls: string; onClick: () => void }) {
  return <button aria-controls={controls} aria-selected={active} className={`border-b-2 px-4 py-3 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-mafi-blue-primary ${active ? "border-mafi-blue-primary text-mafi-blue-primary" : "border-transparent text-mafi-text-mid hover:text-mafi-text-dark"}`} onClick={onClick} role="tab" type="button">{children}</button>;
}

function RefinanceDetails({ input, result }: { input: RefinanceCalculatorInput; result: RefinanceCalculationResult }) {
  const assessment = result.monthlySavings <= 0
    ? "The proposed refinance does not reduce the monthly principal-and-interest payment under the current assumptions."
    : result.breakEvenMonths && result.breakEvenMonths > result.comparisonHorizonMonths
      ? `The proposed refinance lowers principal and interest by ${money(result.monthlySavings)} per month, but the estimated break-even period is longer than the comparison period.`
      : `Refinancing may be worth considering: principal and interest could decrease by ${money(result.monthlySavings)} per month, with an estimated break-even of ${formatBreakEven(result.breakEvenMonths)}.`;
  return <div id="refinance-details" role="tabpanel" className="space-y-5 p-4 sm:p-5"><div className={`rounded-md border px-4 py-3 ${result.monthlySavings > 0 ? "border-teal-200 bg-teal-50" : "border-amber-200 bg-amber-50"}`}><p className="text-xs font-bold uppercase tracking-[0.1em] text-mafi-text-mid">Refinance assessment</p><p className="mt-1 text-sm font-semibold leading-6 text-mafi-text-dark">{assessment}</p><p className="mt-1 text-xs text-mafi-text-mid">Planning estimate based on the assumptions entered. Actual terms and qualification vary.</p></div><RefinanceSummaryMetrics input={input} result={result} /><div className="grid gap-5 xl:grid-cols-2"><MonthlyCostComparison input={input} result={result} /><RefinanceSavingsChart result={result} /></div></div>;
}

function RefinanceSummaryMetrics({ input, result }: { input: RefinanceCalculatorInput; result: RefinanceCalculationResult }) {
  const metrics = [
    ["Current Monthly P&I", money(result.currentMonthlyPayment)], ["New Monthly P&I", money(result.newMonthlyPayment)],
    ["Monthly Savings", money(result.monthlySavings)], ["Annual Savings", money(result.annualSavings)],
    ["Refinance Fees", money(input.refinanceFees)], ["Break-Even Period", result.breakEvenMonths ? formatBreakEven(result.breakEvenMonths) : "No payment-based break-even"],
    ["Current Remaining Interest", money(result.currentRemainingInterest)], ["New Loan Interest", money(result.newLoanInterest)],
    ["Estimated Interest Difference", money(result.interestDifference)],
  ];
  return <div className="grid gap-px overflow-hidden rounded-md border border-mafi-border bg-mafi-border sm:grid-cols-3 xl:grid-cols-5">{metrics.map(([label, value]) => <div className="bg-white px-3 py-3" key={label}><p className="text-[10px] font-bold uppercase tracking-[0.08em] text-mafi-text-light">{label}</p><p className="mt-1 font-mono text-sm font-bold tabular-nums text-mafi-text-dark">{value}</p></div>)}</div>;
}

function MonthlyCostComparison({ input, result }: { input: RefinanceCalculatorInput; result: RefinanceCalculationResult }) {
  const data = [{ label: "Monthly P&I", Current: result.currentMonthlyPayment, New: result.newMonthlyPayment }];
  return <section className="rounded-md border border-mafi-border"><div className="border-b border-mafi-border bg-mafi-bg-light px-4 py-3"><h3 className="text-sm font-bold text-mafi-text-dark">Monthly Principal & Interest</h3><p className="mt-0.5 text-xs text-mafi-text-mid">Current versus proposed monthly cost.</p></div><div className="grid gap-3 p-4 sm:grid-cols-2"><ComparisonCard label="Current" tone="text-amber-700" payment={result.currentMonthlyPayment} details={[`${result.remainingTermMonths} months remaining`, `${input.currentInterestRate.toFixed(3)}%`, `${money(input.currentBalance)} balance`]} /><ComparisonCard label="New" tone="text-teal-700" payment={result.newMonthlyPayment} details={[`${input.newTermMonths} months`, `${input.newInterestRate.toFixed(3)}%`, `${money(result.effectiveNewPrincipal)} effective principal`]} /></div><div className="h-48 px-3 pb-3"><ResponsiveContainer width="100%" height="100%"><BarChart data={data} layout="vertical" margin={{ top: 8, right: 18, left: 8, bottom: 4 }}><CartesianGrid stroke="#E1E7EF" strokeDasharray="3 3" /><XAxis type="number" tickFormatter={(value) => `$${Math.round(Number(value))}`} tick={{ fontSize: 10 }} /><YAxis dataKey="label" type="category" hide /><Tooltip formatter={(value) => money(Number(value))} /><Legend wrapperStyle={{ fontSize: 11 }} /><Bar dataKey="Current" fill="#D99A2B" radius={[0, 3, 3, 0]} /><Bar dataKey="New" fill="#2E8B7C" radius={[0, 3, 3, 0]} /></BarChart></ResponsiveContainer></div></section>;
}

function ComparisonCard({ details, label, payment, tone }: { details: string[]; label: string; payment: number; tone: string }) {
  return <article className="rounded-md border border-mafi-border bg-mafi-bg-off p-3"><p className={`text-[11px] font-bold uppercase tracking-[0.1em] ${tone}`}>{label}</p><p className="mt-1 font-mono text-xl font-bold tabular-nums text-mafi-text-dark">{money(payment)}</p><p className="mt-1 text-[11px] leading-5 text-mafi-text-mid">{details.join(" · ")}</p></article>;
}

function RefinanceSavingsChart({ result }: { result: RefinanceCalculationResult }) {
  return <section className="rounded-md border border-mafi-border"><div className="border-b border-mafi-border bg-mafi-bg-light px-4 py-3"><h3 className="text-sm font-bold text-mafi-text-dark">Estimated Savings from Refinancing, by Year</h3><p className="mt-0.5 text-xs text-mafi-text-mid">Cumulative payment savings after refinance costs.</p></div>{result.monthlySavings > 0 ? <div className="h-72 p-3"><ResponsiveContainer width="100%" height="100%"><LineChart data={result.savingsByYear} margin={{ top: 10, right: 12, left: 8, bottom: 4 }}><CartesianGrid stroke="#E1E7EF" strokeDasharray="3 3" /><XAxis dataKey="year" tickFormatter={(value) => `Yr ${Math.round(Number(value))}`} tick={{ fontSize: 10 }} /><YAxis width={58} tickFormatter={(value) => `$${Math.round(Number(value) / 1000)}k`} tick={{ fontSize: 10 }} /><Tooltip formatter={(value) => money(Number(value))} labelFormatter={(value) => `Year ${Number(value).toFixed(1)}`} /><ReferenceLine y={0} stroke="#8B98A9" strokeWidth={1.5} />{result.breakEvenMonths ? <ReferenceLine x={result.breakEvenMonths / 12} stroke="#2E8B7C" strokeDasharray="4 3" label={{ value: "Break-even", fill: "#2E6F64", fontSize: 10, position: "insideTopRight" }} /> : null}<Line dataKey="cumulativeSavings" name="Cumulative Savings" stroke="#2F75C8" strokeWidth={2.5} dot={false} type="monotone" /></LineChart></ResponsiveContainer><p className="mt-1 text-center text-xs font-medium text-mafi-text-mid">Estimated break-even: {formatBreakEven(result.breakEvenMonths)}{result.breakEvenDate ? ` · ${result.breakEvenDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}` : ""}</p></div> : <div className="flex h-72 items-center justify-center p-6 text-center text-sm text-amber-700">No payment-based break-even under the current assumptions.</div>}</section>;
}

function LoanAmortizationTable({ loanView, result, setLoanView }: { loanView: LoanView; result: RefinanceCalculationResult; setLoanView: (view: LoanView) => void }) {
  const rows = loanView === "current" ? result.currentAmortization : result.newAmortization;
  const totalInterest = loanView === "current" ? result.currentRemainingInterest : result.newLoanInterest;
  return <div id="refinance-amortization" role="tabpanel"><div className="flex flex-col gap-3 border-b border-mafi-border bg-mafi-bg-off px-4 py-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold text-mafi-text-mid">{loanView === "current" ? "Remaining current-loan schedule" : "Full proposed-loan schedule"}</p><p className="mt-0.5 font-mono text-sm font-bold tabular-nums text-mafi-text-dark">Total interest: {money(totalInterest)}</p></div><div className="inline-flex rounded-md border border-mafi-border bg-white p-0.5" aria-label="Amortization loan selection"><LoanToggle active={loanView === "current"} onClick={() => setLoanView("current")}>Current Loan</LoanToggle><LoanToggle active={loanView === "new"} onClick={() => setLoanView("new")}>New Loan</LoanToggle></div></div><div className="max-h-[34rem] overflow-auto"><table className="min-w-[760px] w-full text-left text-xs"><thead className="sticky top-0 z-10 bg-mafi-bg-lighter uppercase tracking-wide text-mafi-text-mid"><tr><th className="px-4 py-2.5">Year</th><th className="px-4 py-2.5 text-right">Beginning Balance</th><th className="px-4 py-2.5 text-right">Principal Paid</th><th className="px-4 py-2.5 text-right">Interest Paid</th><th className="px-4 py-2.5 text-right">Ending Balance</th></tr></thead><tbody className="divide-y divide-mafi-border">{rows.map((row) => <tr key={row.year} className="hover:bg-mafi-bg-light"><td className="px-4 py-2 font-bold">{row.year}</td>{[row.beginningBalance, row.principalPaid, row.interestPaid, row.endingBalance].map((value, index) => <td className="px-4 py-2 text-right font-mono tabular-nums" key={index}>{money(value)}</td>)}</tr>)}</tbody></table></div></div>;
}

function LoanToggle({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return <button aria-pressed={active} className={`rounded px-3 py-1.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mafi-blue-primary ${active ? "bg-mafi-blue-primary text-white" : "text-mafi-text-mid hover:bg-mafi-bg-light"}`} onClick={onClick} type="button">{children}</button>;
}

function formatBreakEven(months: number | null) {
  if (months === null || !Number.isFinite(months)) return "No payment-based break-even";
  const rounded = Math.ceil(months);
  const years = Math.floor(rounded / 12);
  const remaining = rounded % 12;
  const parts = [years ? `${years} ${years === 1 ? "year" : "years"}` : "", remaining ? `${remaining} ${remaining === 1 ? "month" : "months"}` : ""].filter(Boolean);
  return `${rounded} months (${parts.join(" ") || "less than one month"})`;
}
