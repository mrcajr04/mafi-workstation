"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Calculator, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  currencyInputToNumber,
  formatCurrencyDisplay,
  formatCurrencyDisplayWithCents,
  formatCurrencyInput,
} from "@/lib/currency";
import {
  calculatePaymentScenario,
  paymentCalculatorDefaults,
  syncAnnualAmountFromPercentage,
  syncAnnualPercentageFromAmount,
  syncAnnualPercentageFromMonthlyAmount,
  syncDownPaymentFromAmount,
  syncDownPaymentFromPercentage,
  syncMonthlyAmountFromAnnualPercentage,
  type PaymentCalculatorInput,
} from "@/lib/payment-calculator";

type CalculatorTab = "summary" | "amortization";

type FormState = {
  homePrice: string;
  downPayment: string;
  downPaymentPercent: string;
  termYears: string;
  interestRate: string;
  annualPropertyTaxes: string;
  propertyTaxPercent: string;
  monthlyHoa: string;
  monthlyHomeownersInsurance: string;
  insuranceAnnualPercent: string;
  monthlyMortgageInsurance: string;
  otherMonthlyCosts: string;
};

const paymentColors = {
  principalAndInterest: "#2F75C8",
  propertyTaxes: "#D99A2B",
  homeownersInsurance: "#2E8B7C",
  hoa: "#6B7F99",
  mortgageInsurance: "#7657A8",
  other: "#A45E68",
};

function currency(value: number) {
  return formatCurrencyDisplayWithCents(value, "$0.00");
}

function percent(value: number, digits = 3) {
  return Number.isFinite(value) ? value.toFixed(digits) : "0.000";
}

function calculatedCurrencyInput(value: number) {
  return formatCurrencyInput(String(Math.round(value * 100) / 100));
}

function initialFormState(): FormState {
  const defaults = paymentCalculatorDefaults;
  return {
    homePrice: formatCurrencyInput(String(defaults.homePrice)),
    downPayment: formatCurrencyInput(String(defaults.downPayment)),
    downPaymentPercent: percent((defaults.downPayment / defaults.homePrice) * 100, 2),
    termYears: String(defaults.termYears),
    interestRate: percent(defaults.interestRate),
    annualPropertyTaxes: formatCurrencyInput(String(defaults.annualPropertyTaxes)),
    propertyTaxPercent: percent((defaults.annualPropertyTaxes / defaults.homePrice) * 100),
    monthlyHoa: formatCurrencyInput(String(defaults.monthlyHoa)),
    monthlyHomeownersInsurance: formatCurrencyInput(String(defaults.monthlyHomeownersInsurance)),
    insuranceAnnualPercent: percent(((defaults.monthlyHomeownersInsurance * 12) / defaults.homePrice) * 100),
    monthlyMortgageInsurance: "",
    otherMonthlyCosts: "",
  };
}

function toInput(state: FormState): PaymentCalculatorInput {
  return {
    homePrice: currencyInputToNumber(state.homePrice),
    downPayment: currencyInputToNumber(state.downPayment),
    termYears: Number(state.termYears),
    interestRate: Number(state.interestRate),
    annualPropertyTaxes: currencyInputToNumber(state.annualPropertyTaxes),
    monthlyHoa: currencyInputToNumber(state.monthlyHoa),
    monthlyHomeownersInsurance: currencyInputToNumber(state.monthlyHomeownersInsurance),
    monthlyMortgageInsurance: currencyInputToNumber(state.monthlyMortgageInsurance),
    otherMonthlyCosts: currencyInputToNumber(state.otherMonthlyCosts),
  };
}

export function PaymentCalculator() {
  const [form, setForm] = useState<FormState>(initialFormState);
  const [activeTab, setActiveTab] = useState<CalculatorTab>("summary");
  const [errors, setErrors] = useState<string[]>([]);
  const [calculatedInput, setCalculatedInput] = useState<PaymentCalculatorInput>(paymentCalculatorDefaults);
  const [confirmation, setConfirmation] = useState("Sample estimate loaded");
  const calculation = useMemo(() => calculatePaymentScenario(calculatedInput), [calculatedInput]);
  const result = calculation.result;

  function setCurrencyField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: formatCurrencyInput(value) }));
  }

  function updateHomePrice(value: string) {
    const homePrice = currencyInputToNumber(value);
    const downPayment = syncDownPaymentFromPercentage(homePrice, Number(form.downPaymentPercent));
    const taxes = syncAnnualAmountFromPercentage(homePrice, Number(form.propertyTaxPercent));
    const insurance = syncMonthlyAmountFromAnnualPercentage(homePrice, Number(form.insuranceAnnualPercent));
    setForm((current) => ({
      ...current,
      homePrice: formatCurrencyInput(value),
      downPayment: calculatedCurrencyInput(downPayment.amount),
      annualPropertyTaxes: calculatedCurrencyInput(taxes.amount),
      monthlyHomeownersInsurance: calculatedCurrencyInput(insurance.amount),
    }));
  }

  function updateDownPaymentAmount(value: string) {
    const synced = syncDownPaymentFromAmount(currencyInputToNumber(form.homePrice), currencyInputToNumber(value));
    setForm((current) => ({
      ...current,
      downPayment: calculatedCurrencyInput(synced.amount),
      downPaymentPercent: percent(synced.percentage, 2),
    }));
  }

  function updateDownPaymentPercent(value: string) {
    const synced = syncDownPaymentFromPercentage(currencyInputToNumber(form.homePrice), Number(value));
    setForm((current) => ({
      ...current,
      downPayment: calculatedCurrencyInput(synced.amount),
      downPaymentPercent: percent(synced.percentage, 2),
    }));
  }

  function updateTaxAmount(value: string) {
    const synced = syncAnnualPercentageFromAmount(currencyInputToNumber(form.homePrice), currencyInputToNumber(value));
    setForm((current) => ({
      ...current,
      annualPropertyTaxes: calculatedCurrencyInput(synced.amount),
      propertyTaxPercent: percent(synced.percentage),
    }));
  }

  function updateTaxPercent(value: string) {
    const synced = syncAnnualAmountFromPercentage(currencyInputToNumber(form.homePrice), Number(value));
    setForm((current) => ({
      ...current,
      annualPropertyTaxes: calculatedCurrencyInput(synced.amount),
      propertyTaxPercent: percent(synced.percentage),
    }));
  }

  function updateInsuranceAmount(value: string) {
    const synced = syncAnnualPercentageFromMonthlyAmount(currencyInputToNumber(form.homePrice), currencyInputToNumber(value));
    setForm((current) => ({
      ...current,
      monthlyHomeownersInsurance: calculatedCurrencyInput(synced.amount),
      insuranceAnnualPercent: percent(synced.percentage),
    }));
  }

  function updateInsurancePercent(value: string) {
    const synced = syncMonthlyAmountFromAnnualPercentage(currencyInputToNumber(form.homePrice), Number(value));
    setForm((current) => ({
      ...current,
      monthlyHomeownersInsurance: calculatedCurrencyInput(synced.amount),
      insuranceAnnualPercent: percent(synced.percentage),
    }));
  }

  function calculate() {
    const nextInput = toInput(form);
    const requiredErrors = [
      !form.homePrice ? "Enter a home price." : "",
      form.interestRate === "" ? "Enter an interest rate, including 0% when applicable." : "",
    ].filter(Boolean);
    const nextCalculation = calculatePaymentScenario(nextInput);
    const nextErrors = [...requiredErrors, ...nextCalculation.errors];
    setErrors(nextErrors);
    if (nextErrors.length) {
      setConfirmation("");
      return;
    }
    setCalculatedInput(nextInput);
    setConfirmation("Estimate updated");
  }

  function reset() {
    setForm(initialFormState());
    setCalculatedInput(paymentCalculatorDefaults);
    setErrors([]);
    setConfirmation("Sample defaults restored");
    setActiveTab("summary");
  }

  return (
    <div className="space-y-5">
      <PaymentCalculatorInputs
        form={form}
        errors={errors}
        confirmation={confirmation}
        onCalculate={calculate}
        onReset={reset}
        onHomePriceChange={updateHomePrice}
        onDownPaymentAmountChange={updateDownPaymentAmount}
        onDownPaymentPercentChange={updateDownPaymentPercent}
        onTaxAmountChange={updateTaxAmount}
        onTaxPercentChange={updateTaxPercent}
        onInsuranceAmountChange={updateInsuranceAmount}
        onInsurancePercentChange={updateInsurancePercent}
        setForm={setForm}
        setCurrencyField={setCurrencyField}
      />

      <section className="overflow-hidden rounded-md border border-mafi-border bg-white">
        <div className="flex border-b border-mafi-border bg-mafi-bg-light px-4" role="tablist" aria-label="Payment calculator results">
          <ResultTab active={activeTab === "summary"} controls="payment-summary" onClick={() => setActiveTab("summary")}>Payment Summary</ResultTab>
          <ResultTab active={activeTab === "amortization"} controls="amortization-table" onClick={() => setActiveTab("amortization")}>Amortization Table</ResultTab>
        </div>

        {result ? (
          activeTab === "summary" ? (
            <PaymentSummary input={calculatedInput} result={result} />
          ) : (
            <AmortizationTable rows={result.amortization} />
          )
        ) : (
          <p className="p-8 text-center text-sm text-mafi-text-mid">Correct the highlighted inputs and calculate again.</p>
        )}
      </section>

      {result ? <AmortizationChart rows={result.amortization} /> : null}
    </div>
  );
}

type InputsProps = {
  form: FormState;
  errors: string[];
  confirmation: string;
  onCalculate: () => void;
  onReset: () => void;
  onHomePriceChange: (value: string) => void;
  onDownPaymentAmountChange: (value: string) => void;
  onDownPaymentPercentChange: (value: string) => void;
  onTaxAmountChange: (value: string) => void;
  onTaxPercentChange: (value: string) => void;
  onInsuranceAmountChange: (value: string) => void;
  onInsurancePercentChange: (value: string) => void;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  setCurrencyField: (field: keyof FormState, value: string) => void;
};

function PaymentCalculatorInputs(props: InputsProps) {
  const { form } = props;
  return (
    <section className="rounded-md border border-mafi-border bg-white">
      <div className="flex flex-col gap-3 border-b border-mafi-border bg-mafi-bg-light px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-bold text-mafi-text-dark">Loan assumptions</h2>
          <p className="mt-0.5 text-xs text-mafi-text-mid">Enter the property, financing, and recurring housing costs.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={props.onReset} type="button" variant="outline"><RotateCcw className="h-3.5 w-3.5" />Reset</Button>
          <Button className="bg-mafi-blue-primary text-white hover:bg-mafi-blue-dark" onClick={props.onCalculate} type="button"><Calculator className="h-3.5 w-3.5" />Calculate</Button>
        </div>
      </div>

      <div className="grid gap-x-4 gap-y-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Home Price" required><Input aria-label="Home Price" inputMode="decimal" value={form.homePrice} onChange={(event) => props.onHomePriceChange(event.target.value)} /></Field>
        <Field label="Down Payment">
          <div className="grid grid-cols-[minmax(0,1fr)_5.5rem] gap-2">
            <Input aria-label="Down payment amount" inputMode="decimal" value={form.downPayment} onChange={(event) => props.onDownPaymentAmountChange(event.target.value)} />
            <UnitInput label="Percent" suffix="%" value={form.downPaymentPercent} onChange={props.onDownPaymentPercentChange} />
          </div>
        </Field>
        <Field label="Loan Type">
          <select aria-label="Loan Type" className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm font-medium text-mafi-text-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mafi-blue-primary/30" value={form.termYears} onChange={(event) => props.setForm((current) => ({ ...current, termYears: event.target.value }))}>
            <option value="30">30 Year Fixed</option><option value="20">20 Year Fixed</option><option value="15">15 Year Fixed</option><option value="10">10 Year Fixed</option>
          </select>
        </Field>
        <Field label="Interest Rate" required><UnitInput label="Interest rate" suffix="%" value={form.interestRate} onChange={(value) => props.setForm((current) => ({ ...current, interestRate: value }))} /></Field>

        <Field label="Property Taxes">
          <div className="grid grid-cols-[minmax(0,1fr)_5.5rem] gap-2">
            <Input aria-label="Annual property taxes" inputMode="decimal" value={form.annualPropertyTaxes} onChange={(event) => props.onTaxAmountChange(event.target.value)} />
            <UnitInput label="Annual tax percentage" suffix="%" value={form.propertyTaxPercent} onChange={props.onTaxPercentChange} />
          </div>
          <p className="text-[11px] text-mafi-text-light">Annual amount and % of price</p>
        </Field>
        <Field label="Homeowners Insurance">
          <div className="grid grid-cols-[minmax(0,1fr)_5.5rem] gap-2">
            <Input aria-label="Monthly homeowners insurance" inputMode="decimal" value={form.monthlyHomeownersInsurance} onChange={(event) => props.onInsuranceAmountChange(event.target.value)} />
            <UnitInput label="Annual insurance percentage" suffix="%" value={form.insuranceAnnualPercent} onChange={props.onInsurancePercentChange} />
          </div>
          <p className="text-[11px] text-mafi-text-light">Monthly amount and annual % of price</p>
        </Field>
        <Field label="HOA Dues"><Input aria-label="Monthly HOA dues" inputMode="decimal" value={form.monthlyHoa} onChange={(event) => props.setCurrencyField("monthlyHoa", event.target.value)} /><p className="text-[11px] text-mafi-text-light">Monthly</p></Field>
        <Field label="Optional Monthly Costs">
          <div className="grid grid-cols-2 gap-2">
            <Input aria-label="Monthly mortgage insurance" inputMode="decimal" placeholder="Mortgage insurance" value={form.monthlyMortgageInsurance} onChange={(event) => props.setCurrencyField("monthlyMortgageInsurance", event.target.value)} />
            <Input aria-label="Other monthly costs" inputMode="decimal" placeholder="Other costs" value={form.otherMonthlyCosts} onChange={(event) => props.setCurrencyField("otherMonthlyCosts", event.target.value)} />
          </div>
        </Field>
      </div>

      {(props.errors.length > 0 || props.confirmation) ? (
        <div aria-live="polite" className="border-t border-mafi-border px-4 py-2.5 text-xs">
          {props.errors.length ? <ul className="space-y-1 text-red-700">{props.errors.map((error) => <li key={error}>{error}</li>)}</ul> : <p className="font-medium text-emerald-700">{props.confirmation}</p>}
        </div>
      ) : null}
    </section>
  );
}

function Field({ children, label, required }: { children: React.ReactNode; label: string; required?: boolean }) {
  return <div className="space-y-1.5"><Label className="text-xs font-bold text-mafi-text-dark">{label}{required ? <span className="ml-1 text-red-600">*</span> : null}</Label>{children}</div>;
}

function UnitInput({ label, suffix, value, onChange }: { label: string; suffix: string; value: string; onChange: (value: string) => void }) {
  return <div className="relative"><Input aria-label={label} className="pr-7" inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value)} /><span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-xs font-semibold text-mafi-text-light">{suffix}</span></div>;
}

function ResultTab({ active, children, controls, onClick }: { active: boolean; children: React.ReactNode; controls: string; onClick: () => void }) {
  return <button aria-controls={controls} aria-selected={active} className={`border-b-2 px-4 py-3 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-mafi-blue-primary ${active ? "border-mafi-blue-primary text-mafi-blue-primary" : "border-transparent text-mafi-text-mid hover:text-mafi-text-dark"}`} onClick={onClick} role="tab" type="button">{children}</button>;
}

type CalculationResult = NonNullable<ReturnType<typeof calculatePaymentScenario>["result"]>;

function PaymentSummary({ input, result }: { input: PaymentCalculatorInput; result: CalculationResult }) {
  const segments = [
    { name: "Principal & Interest", value: result.principalAndInterest, color: paymentColors.principalAndInterest },
    { name: "Property Taxes", value: result.monthlyPropertyTaxes, color: paymentColors.propertyTaxes },
    { name: "Homeowners Insurance", value: input.monthlyHomeownersInsurance, color: paymentColors.homeownersInsurance },
    { name: "HOA", value: input.monthlyHoa, color: paymentColors.hoa },
    { name: "Mortgage Insurance", value: input.monthlyMortgageInsurance, color: paymentColors.mortgageInsurance },
    { name: "Other Monthly Costs", value: input.otherMonthlyCosts, color: paymentColors.other },
  ].filter((segment) => segment.value > 0);

  return (
    <div id="payment-summary" role="tabpanel" className="grid gap-0 lg:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]">
      <div className="grid gap-4 border-b border-mafi-border p-5 sm:grid-cols-[15rem_minmax(0,1fr)] lg:border-b-0 lg:border-r">
        <PaymentBreakdownChart segments={segments} total={result.totalMonthlyPayment} />
        <div className="space-y-1 self-center">
          <h3 className="mb-3 text-sm font-bold text-mafi-text-dark">Monthly payment breakdown</h3>
          {segments.map((segment) => <div className="flex items-center justify-between gap-3 border-b border-mafi-border/70 py-2 text-sm" key={segment.name}><span className="flex items-center gap-2 text-mafi-text-mid"><span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: segment.color }} />{segment.name}</span><span className="font-mono font-bold tabular-nums text-mafi-text-dark">{currency(segment.value)}</span></div>)}
          <div className="flex items-center justify-between pt-3"><span className="font-bold text-mafi-text-dark">Total monthly payment</span><span className="font-mono text-xl font-bold tabular-nums text-mafi-blue-primary">{currency(result.totalMonthlyPayment)}</span></div>
        </div>
      </div>
      <IncomeAndSavingsGuidance result={result} />
    </div>
  );
}

function PaymentBreakdownChart({ segments, total }: { segments: Array<{ name: string; value: number; color: string }>; total: number }) {
  return <div className="relative mx-auto h-60 w-full max-w-60" aria-label={`Total estimated monthly payment ${currency(total)}`} role="img"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={segments} dataKey="value" nameKey="name" innerRadius={68} outerRadius={94} paddingAngle={2} stroke="none">{segments.map((segment) => <Cell fill={segment.color} key={segment.name} />)}</Pie><Tooltip formatter={(value) => currency(Number(value))} /></PieChart></ResponsiveContainer><div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="font-mono text-xl font-bold tabular-nums text-mafi-text-dark">{formatCurrencyDisplay(total, "$0")}</span><span className="text-xs text-mafi-text-light">per month</span></div></div>;
}

function IncomeAndSavingsGuidance({ result }: { result: CalculationResult }) {
  return <div className="grid gap-4 bg-mafi-bg-off p-5 sm:grid-cols-2 lg:grid-cols-1"><GuidanceCard title="Recommended Minimum Income" value={formatCurrencyDisplay(result.recommendedAnnualIncome, "$0")}><p>Estimated annual household income.</p><p className="mt-2 text-[11px] leading-4">Based on a 38% housing-expense ratio. Actual qualification varies by lender and borrower profile.</p></GuidanceCard><GuidanceCard title="Recommended Savings" value={formatCurrencyDisplay(result.recommendedSavings, "$0")}><div className="mt-3 space-y-2"><GuidanceRow label="Minimum Down Payment (5%)" value={currency(result.minimumDownPayment)} /><GuidanceRow label="Estimated Closing Costs (1.9%)" value={currency(result.estimatedClosingCosts)} /></div><p className="mt-3 text-[11px] leading-4">Planning estimate only. Actual cash requirements vary by transaction and loan program.</p></GuidanceCard></div>;
}

function GuidanceCard({ children, title, value }: { children: React.ReactNode; title: string; value: string }) {
  return <article className="rounded-md border border-mafi-border bg-white p-4"><p className="text-[11px] font-bold uppercase tracking-[0.1em] text-mafi-text-light">{title}</p><p className="mt-1 font-mono text-2xl font-bold tabular-nums text-mafi-text-dark">{value}</p><div className="mt-1 text-xs text-mafi-text-mid">{children}</div></article>;
}

function GuidanceRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-3"><span>{label}</span><span className="font-mono font-bold tabular-nums text-mafi-text-dark">{value}</span></div>;
}

function AmortizationTable({ rows }: { rows: CalculationResult["amortization"] }) {
  return <div id="amortization-table" role="tabpanel" className="overflow-x-auto"><table className="min-w-[760px] w-full text-left text-xs"><thead className="bg-mafi-bg-lighter uppercase tracking-wide text-mafi-text-mid"><tr><th className="px-4 py-2.5">Year</th><th className="px-4 py-2.5 text-right">Beginning Balance</th><th className="px-4 py-2.5 text-right">Principal Paid</th><th className="px-4 py-2.5 text-right">Interest Paid</th><th className="px-4 py-2.5 text-right">Ending Balance</th></tr></thead><tbody className="divide-y divide-mafi-border">{rows.map((row) => <tr key={row.year} className="hover:bg-mafi-bg-light"><td className="px-4 py-2 font-bold text-mafi-text-dark">{row.year}</td>{[row.beginningBalance, row.principalPaid, row.interestPaid, row.endingBalance].map((value, index) => <td className="px-4 py-2 text-right font-mono tabular-nums text-mafi-text-dark" key={index}>{currency(value)}</td>)}</tr>)}</tbody></table></div>;
}

function AmortizationChart({ rows }: { rows: CalculationResult["amortization"] }) {
  return <section className="rounded-md border border-mafi-border bg-white"><div className="border-b border-mafi-border bg-mafi-bg-light px-4 py-3"><h2 className="text-sm font-bold text-mafi-text-dark">Mortgage Amortization</h2><p className="mt-0.5 text-xs text-mafi-text-mid">Remaining balance, cumulative principal, and cumulative interest by year.</p></div><div className="h-80 min-h-80 p-3 sm:p-5" aria-label="Mortgage amortization graph" role="img"><ResponsiveContainer width="100%" height="100%"><LineChart data={rows} margin={{ top: 8, right: 12, left: 8, bottom: 4 }}><CartesianGrid stroke="#E1E7EF" strokeDasharray="3 3" /><XAxis dataKey="year" tick={{ fontSize: 11 }} tickFormatter={(value) => `Yr ${value}`} /><YAxis tick={{ fontSize: 11 }} tickFormatter={(value) => `$${Math.round(Number(value) / 1000)}k`} width={58} /><Tooltip formatter={(value) => currency(Number(value))} labelFormatter={(label) => `Year ${label}`} /><Legend wrapperStyle={{ fontSize: 12 }} /><Line type="monotone" dataKey="endingBalance" name="Remaining Balance" stroke="#173B63" strokeWidth={2.5} dot={false} /><Line type="monotone" dataKey="cumulativePrincipal" name="Cumulative Principal" stroke="#2F75C8" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="cumulativeInterest" name="Cumulative Interest" stroke="#D99A2B" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></div></section>;
}
