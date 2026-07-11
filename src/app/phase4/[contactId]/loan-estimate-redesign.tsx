"use client";

import * as Tabs from "@radix-ui/react-tabs";
import { AnimatePresence, motion } from "framer-motion";
import {
  BadgeDollarSign,
  BriefcaseBusiness,
  Calculator,
  ChartNoAxesCombined,
  FileText,
  Home,
  Landmark,
  LockKeyhole,
  PiggyBank,
  Printer,
  RefreshCcw,
  ShieldCheck,
  Signature,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/loan-estimate-design/ui/badge";
import { Button } from "@/components/loan-estimate-design/ui/button";
import { Input } from "@/components/loan-estimate-design/ui/input";
import { Label } from "@/components/loan-estimate-design/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/loan-estimate-design/ui/select";
import {
  LoanProgram,
  LoanState,
  calculateLoanEstimate,
  formatCurrency,
  formatNumber,
  formatPercent,
} from "@/lib/loan-estimate-design";
import { formatUSPhone } from "@/lib/phone";
import { cn } from "@/lib/utils";
import {
  TraceabilityTrigger,
  type LoanEstimateTraceability,
} from "./loan-estimate-traceability";

type TabId = "main" | "costs" | "marketing" | "legal" | "formulas";
type NumericField = {
  [K in keyof LoanState]: LoanState[K] extends number ? K : never;
}[keyof LoanState];
type StringField = {
  [K in keyof LoanState]: LoanState[K] extends string ? K : never;
}[keyof LoanState];
type LoanResults = ReturnType<typeof calculateLoanEstimate>;
type FieldInsight = {
  title: string;
  body: string;
  kind: "Formula" | "Source";
};

const closingCostNumericFields = [
  "originationPct",
  "originationFlatFee",
  "brokerFeePct",
  "brokerFeeFlatFee",
  "appraisalFee",
  "applicationFee",
  "underwritingFee",
  "processingFee",
  "adminFee",
  "interestDays",
  "settlementFee",
  "titleSearchFee",
  "miscTitleFee",
  "titleInsuranceFee",
  "endorsements",
  "recordingFees",
  "cityTaxStamps",
  "stateTaxStamps",
  "stampsOnDeed",
  "surveyFee",
  "transamericaFee",
  "floodZoneCertFee",
  "miscFilingFee",
] as const satisfies readonly NumericField[];

type ClosingCostSnapshot = Pick<
  LoanState,
  (typeof closingCostNumericFields)[number] | "brokerFeeMode" | "originationMode"
>;

const tabs: Array<{ id: TabId; label: string; icon: typeof Calculator; audience: "internal" | "client" }> = [
  { id: "main", label: "Main To Complete", icon: Calculator, audience: "internal" },
  { id: "costs", label: "Summary Costs", icon: ChartNoAxesCombined, audience: "internal" },
  { id: "marketing", label: "Summary Marketing", icon: FileText, audience: "client" },
  { id: "legal", label: "Marketing Complete Legal Size", icon: Landmark, audience: "client" },
];

const chartColors = {
  downPayment: "#315fbe",
  closingCosts: "#c7771b",
  prepaid: "#2f7d4f",
  reserves: "#0f766e",
  principal: "#102a43",
  taxes: "#9a640f",
  hazard: "#0f766e",
  flood: "#667085",
  hoa: "#be6a16",
};

const numericInputClassName = "numeric text-right tabular-nums";

const loanPrograms: Array<{ value: LoanProgram; label: string }> = [
  { value: "30 YR FIXED", label: "30 Yr Fixed" },
  { value: "15 YR FIXED", label: "15 Yr Fixed" },
  { value: "1/1 ARM", label: "1/1 ARM" },
  { value: "3/1 ARM", label: "3/1 ARM" },
  { value: "5/1 ARM", label: "5/1 ARM" },
  { value: "7/1 ARM", label: "7/1 ARM" },
  { value: "10/1 ARM", label: "10/1 ARM" },
  { value: "IO", label: "Interest Only (IO)" },
];

function formulaInsights(state: LoanState, results: LoanResults): FieldInsight[] {
  const basisLabel = valueBasisLabel(state);
  const borrowerEquityLabel = equityLabel(state);
  const equityApplied = equityAppliedLabel(state);
  const fixedLoanCostParts = [
    term("Loan Origination", formatCurrency(results.loanOrigination)),
    term("Broker Fee", formatCurrency(results.brokerFee)),
    term("Appraisal Fee", formatCurrency(results.appraisalFee)),
    term("Application Fee", formatCurrency(results.applicationFee)),
    term("Underwriting Fee", formatCurrency(results.underwritingFee)),
    term("Processing Fee", formatCurrency(results.processingFee)),
    term("Admin Fee", formatCurrency(results.adminFee)),
  ];
  const fixedTitleCostParts = [
    term("Settlement Fee", formatCurrency(results.settlementFee)),
    term("Title Search", formatCurrency(results.titleSearchFee)),
    term("Miscellaneous Title Company", formatCurrency(results.miscTitleFee)),
    term("Title Insurance Fee", formatCurrency(results.titleInsuranceFee)),
    term("Endorsements", formatCurrency(results.endorsements)),
    term("Recording Fees", formatCurrency(results.recordingFees)),
    term("City/County Tax Stamps", formatCurrency(results.cityTaxStamps)),
    term("State Tax Stamps", formatCurrency(results.stateTaxStamps)),
    term("Stamps on Deed", formatCurrency(results.stampsOnDeed)),
    term("Survey", formatCurrency(results.surveyFee)),
    term("Transamerica Tax Fee", formatCurrency(results.transamericaFee)),
    term("Flood Zone Certification", formatCurrency(results.floodZoneCertFee)),
    term("Miscellaneous Filing/Couriers", formatCurrency(results.miscFilingFee)),
  ];
  const prepaidParts = [
    term("Taxes Escrowed", formatCurrency(results.taxesEscrow)),
    term("Hazard Insurance Escrow", formatCurrency(results.hazardInsEscrow)),
    term("Developer Fee", formatCurrency(results.developFeeContract)),
    term("Capital Contribution", formatCurrency(results.capitalContribution)),
    term("Flood/HO6 Insurance", formatCurrency(results.floodHO6Escrow)),
    term("Per-Diem Interest", formatCurrency(results.interestPerDiem)),
  ];

  return [
    { title: borrowerEquityLabel, body: `${term(basisLabel, formatCurrency(results.purchasePrice))} x ${term(borrowerEquityLabel, formatPercent(results.downPaymentPct))} = ${term(borrowerEquityLabel, formatCurrency(results.downPayment))}`, kind: "Formula" },
    { title: "Loan Amount", body: `${term(basisLabel, formatCurrency(results.purchasePrice))} - ${term(borrowerEquityLabel, formatCurrency(results.downPayment))} = ${term("Loan Amount", formatCurrency(results.loanAmount))}`, kind: "Formula" },
    { title: "LTV", body: `${term("Loan Amount", formatCurrency(results.loanAmount))} / ${term(basisLabel, formatCurrency(results.purchasePrice))} = ${term("LTV", formatPercent(results.ltv))}`, kind: "Formula" },
    { title: "Loan Origination", body: state.originationMode === "flat" ? `${term("Flat Fee", formatCurrency(state.originationFlatFee))} = ${term("Loan Origination", formatCurrency(results.loanOrigination))}` : `${term("Loan Amount", formatCurrency(results.loanAmount))} x ${term("Origination Fee", formatPercent(state.originationPct))} = ${term("Loan Origination", formatCurrency(results.loanOrigination))}`, kind: "Formula" },
    { title: "Broker Fee", body: state.brokerFeeMode === "flat" ? `${term("Flat Fee", formatCurrency(state.brokerFeeFlatFee))} = ${term("Broker Fee", formatCurrency(results.brokerFee))}` : `${term("Loan Amount", formatCurrency(results.loanAmount))} x ${term("Broker Fee", formatPercent(state.brokerFeePct))} = ${term("Broker Fee", formatCurrency(results.brokerFee))}`, kind: "Formula" },
    { title: "Per-Diem Interest", body: `(${term("Loan Amount", formatCurrency(results.loanAmount))} x ${term("Interest Rate", formatPercent(state.rate))} / ${term("Days in Year", "365")}) x ${term("Interest Days", `${formatNumber(state.interestDays)} days`)} = ${term("Per-Diem Interest", formatCurrency(results.interestPerDiem))}`, kind: "Formula" },
    { title: "Fixed Loan Costs", body: `${fixedLoanCostParts.join(" + ")} = ${term("Fixed Loan Costs", formatCurrency(results.fixedLoanCosts))}`, kind: "Formula" },
    { title: "Fixed Title Costs", body: `${fixedTitleCostParts.join(" + ")} = ${term("Fixed Title Costs", formatCurrency(results.fixedTitleCosts))}`, kind: "Formula" },
    { title: "Total Closing Costs", body: `${term("Fixed Loan Costs", formatCurrency(results.fixedLoanCosts))} + ${term("Fixed Title Costs", formatCurrency(results.fixedTitleCosts))} = ${term("Total Closing Costs", formatCurrency(results.totalClosingCosts))}`, kind: "Formula" },
    { title: "Taxes Escrowed", body: `${term("Property Taxes / Month", formatCurrency(results.monthlyPropertyTax))} x ${term("Property Tax Escrow", `${formatNumber(state.taxMonths)} months`)} = ${term("Taxes Escrowed", formatCurrency(results.taxesEscrow))}`, kind: "Formula" },
    { title: "Developer Fee (Per Contract)", body: state.developFee === "Yes" ? `${term(basisLabel, formatCurrency(results.purchasePrice))} x ${term("Developer Fee", formatPercent(state.developFeeContractPct))} = ${term("Developer Fee (Per Contract)", formatCurrency(results.developFeeContract))}` : `${term("Developer Fee Applies", "No")} = ${term("Developer Fee (Per Contract)", formatCurrency(results.developFeeContract))}`, kind: "Formula" },
    { title: "Capital Contribution", body: state.newOrUsed === "New" ? `${term("HOA/Condo Fee", formatCurrency(state.hoaMonthly))} x ${term("New Property Multiplier", "2")} = ${term("Capital Contribution", formatCurrency(results.capitalContribution))}` : `${term("New / Used", state.newOrUsed)} = ${term("Capital Contribution", formatCurrency(results.capitalContribution))}`, kind: "Formula" },
    { title: "Total Pre-Paid Items", body: `${prepaidParts.join(" + ")} = ${term("Total Pre-Paid Items", formatCurrency(results.totalPrepaid))}`, kind: "Formula" },
    { title: "Closing + Pre-Paid", body: `${term("Total Closing Costs", formatCurrency(results.totalClosingCosts))} + ${term("Total Pre-Paid Items", formatCurrency(results.totalPrepaid))} = ${term("Closing + Pre-Paid", formatCurrency(results.totalClosingAndPrepaid))}`, kind: "Formula" },
    { title: "Total Cash to Close", body: `${term(borrowerEquityLabel, formatCurrency(results.downPayment))} + ${term("Closing + Pre-Paid", formatCurrency(results.totalClosingAndPrepaid))} - ${term(equityApplied, formatCurrency(results.downPaymentGivenToSeller))} - ${term("Seller Credit", formatCurrency(results.sellerCredit))} - ${term("Other Credits", formatCurrency(results.otherCredits))} = ${term("Total Cash to Close", formatCurrency(results.totalCashToClose))}`, kind: "Formula" },
    { title: "Principal & Interest", body: `${term("Loan Program", state.program)} on ${term("Loan Amount", formatCurrency(results.loanAmount))} at ${term("Interest Rate", formatPercent(state.rate))} = ${term("Principal & Interest", formatCurrency(results.principalInterest))}`, kind: "Formula" },
    { title: "Total Monthly Payment", body: `${term("Principal & Interest", formatCurrency(results.principalInterest))} + ${term("Property Taxes / Month", formatCurrency(results.monthlyPropertyTax))} + ${term("Hazard Insurance / Month", formatCurrency(results.monthlyHazard))} + ${term("Flood/HO6 / Month", formatCurrency(results.monthlyFlood))} + ${term("HOA/Condo Fee", formatCurrency(results.monthlyHOA))} = ${term("Total Monthly Payment", formatCurrency(results.totalMonthlyPayment))}`, kind: "Formula" },
    { title: "Property Taxes / Month", body: `${term(basisLabel, formatCurrency(results.purchasePrice))} x ${term("Annual Property Tax Rate", formatPercent(state.propertyTaxRatePct))} / ${term("Months", "12")} = ${term("Property Taxes / Month", formatCurrency(results.monthlyPropertyTax))}`, kind: "Formula" },
    { title: "Reserves", body: `${term("Total Monthly Payment", formatCurrency(results.totalMonthlyPayment))} x ${term("Reserve Months", `${formatNumber(results.reserveMonths)} months`)} = ${term("Reserves", formatCurrency(results.reserves))}`, kind: "Formula" },
    { title: "Total Assets Required", body: `${term("Total Cash to Close", formatCurrency(results.totalCashToClose))} + ${term("Reserves", formatCurrency(results.reserves))} = ${term("Total Assets Required", formatCurrency(results.totalAssetsRequired))}`, kind: "Formula" },
  ];
}

function term(label: string, value: string) {
  return `${label} (${value})`;
}

function formulaInsightMap(state: LoanState, results: LoanResults) {
  return Object.fromEntries(formulaInsights(state, results).map((insight) => [insight.title, insight]));
}

function sourceInsight(title: string, source: string): FieldInsight {
  return {
    title,
    body: `Sourced from ${source}.`,
    kind: "Source",
  };
}

function isRefinanceLoan(loanPurpose: string) {
  const normalized = loanPurpose.toLowerCase();
  return normalized.includes("refi") || normalized.includes("cash-out");
}

function valueBasisLabel(state: Pick<LoanState, "loanPurpose">) {
  return isRefinanceLoan(state.loanPurpose) ? "Property Value" : "Purchase Price";
}

function equityLabel(state: Pick<LoanState, "loanPurpose">) {
  return isRefinanceLoan(state.loanPurpose) ? "Equity Position" : "Down Payment";
}

function equityAppliedLabel(state: Pick<LoanState, "loanPurpose">) {
  return isRefinanceLoan(state.loanPurpose) ? "Equity Already in Property" : "Down Payment Given to Seller";
}

function numberInputValue(value: number) {
  if (!Number.isFinite(value)) {
    return "";
  }

  return Number.isInteger(value) ? value : Number(value.toFixed(4));
}

function selectInputText(event: React.FocusEvent<HTMLInputElement>) {
  event.currentTarget.select();
}

export type LoanEstimateRedesignProps = {
  initialState: LoanState;
  onGenerate: (state: LoanState) => void;
  isGenerating: boolean;
  generatedAt?: string;
  downloadUrl?: string;
  traceability: LoanEstimateTraceability;
};

export function LoanEstimateRedesign({
  initialState,
  onGenerate,
  isGenerating,
  generatedAt,
  downloadUrl,
  traceability,
}: LoanEstimateRedesignProps) {
  const [state, setState] = useState<LoanState>(initialState);
  const [activeTab, setActiveTab] = useState<TabId>("main");
  const [liveMessage, setLiveMessage] = useState("");
  const results = useMemo(() => calculateLoanEstimate(state), [state]);
  const insights = useMemo(() => formulaInsightMap(state, results), [state, results]);

  const assetSegments = useMemo(
    () => [
      { name: equityLabel(state), value: results.downPayment, color: chartColors.downPayment },
      { name: "Closing Costs", value: results.totalClosingCosts, color: chartColors.closingCosts },
      { name: "Pre-Paid Items", value: results.totalPrepaid, color: chartColors.prepaid },
      { name: "Reserves", value: results.reserves, color: chartColors.reserves },
    ],
    [results, state],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLiveMessage(
        `Recalculated. Total cash to close ${formatCurrency(results.totalCashToClose)}. Total monthly payment ${formatCurrency(results.totalMonthlyPayment)}. Total assets required ${formatCurrency(results.totalAssetsRequired)}.`,
      );
    }, 400);

    return () => window.clearTimeout(timer);
  }, [results.totalAssetsRequired, results.totalCashToClose, results.totalMonthlyPayment]);

  function updateNumber(field: NumericField, value: string) {
    const parsed = Number.parseFloat(value);
    const nextValue = value.trim() && Number.isFinite(parsed) ? parsed : Number.NaN;
    setState((current) => {
      if (Object.is(current[field], nextValue)) return current;
      return { ...current, [field]: nextValue };
    });
  }

  function updateChoice<K extends StringField>(field: K, value: LoanState[K]) {
    setState((current) => ({ ...current, [field]: value }));
  }

  function resetToPulledForwardValues() {
    setState(initialState);
  }

  function matchComputedDownPayment() {
    setState((current) => ({ ...current, downPaymentGivenToSeller: results.downPayment }));
  }

  return (
    <main className="loan-estimate-design print-root -m-6 min-h-[calc(100vh-4rem)] bg-[var(--le-page)] px-6 py-5">
      <div className="mx-auto max-w-[1380px]">
      <span className="sr-only" role="status" aria-live="polite">
        {liveMessage}
      </span>

      <header className="mb-5 overflow-hidden rounded-md bg-[var(--le-navy)] shadow-[var(--shadow-soft)] print-panel">
        <div className="grid gap-0 print:grid-cols-[1.1fr_0.9fr]">
          <div className="bg-[linear-gradient(135deg,#102f50_0%,#071d36_100%)] px-5 py-5 text-white sm:px-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/8 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
                  <Home className="h-8 w-8 text-white/85" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-[length:var(--type-sm)] font-extrabold uppercase tracking-wide text-sky-200/80">MLG Home Financial</p>
                  <h1 className="mt-1 truncate text-[length:var(--type-2xl)] font-black text-white">Fee Sheet & Loan Estimate</h1>
                  <p className="mt-1 truncate text-[length:var(--type-md)] text-white/80" title={`Prepared by ${state.presentedBy} · NMLS ID ${state.nmlsId} · MLO ID ${state.mloId}`}>
                    Prepared by {state.presentedBy} · NMLS ID {state.nmlsId} · MLO ID {state.mloId}
                  </p>
                </div>
              </div>
              <div className="grid min-w-0 flex-[1.6] grid-cols-1 gap-y-3 text-left print:hidden sm:grid-cols-2 xl:grid-cols-4">
                <BannerMeta label="Loan Purpose" value={state.loanPurpose} />
                <BannerMeta label="Lender / Product" value={state.lenderAndProduct} />
                <BannerMeta label="Property Address" value={state.propertyAddress} />
                <BannerMeta label="Program & Rate" value={`${state.program} \u00b7 ${formatPercent(state.rate)}`} />
              </div>
            </div>
          </div>

          <div className="hidden bg-[var(--le-gold-soft)] p-6 print:block">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-[length:var(--type-xs)] font-bold uppercase text-[var(--le-gold)]">
                  Total Assets Required
                </p>
                <AnimatedValue
                  value={results.totalAssetsRequired}
                  format="currency"
                  className="mt-1 block text-[length:var(--type-3xl)] font-black text-[var(--le-navy)]"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge tone="gold">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Estimate
                  </Badge>
                  <Badge tone="navy">
                    <LockKeyhole className="h-3.5 w-3.5" />
                    Sensitive Totals
                  </Badge>
                </div>
              </div>
              <div className="text-right text-[length:var(--type-sm)] text-[var(--le-muted)]">
                <p className="font-bold text-[var(--le-navy)]">{state.applicantName}</p>
                <p>Loan #{state.loanNumber}</p>
                <p>{state.loanPurpose}</p>
                <p>{state.lenderAndProduct}</p>
                <p>{state.propertyAddress}</p>
                <p>{state.program} · {formatPercent(state.rate)}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div
        data-loan-summary="top"
        className="no-print sticky top-16 z-30 mb-2.5 grid gap-2 rounded-md border border-slate-200 bg-white/95 p-2 shadow-[var(--shadow-soft)] backdrop-blur md:grid-cols-3"
      >
        <CompactSummaryValue
          label="Total Assets Required"
          value={results.totalAssetsRequired}
          emphasis
        />
        <CompactSummaryValue label="Total Monthly Payment" value={results.totalMonthlyPayment} />
        <CompactSummaryValue label="Total Cash to Close" value={results.totalCashToClose} />
      </div>

      <Tabs.Root value={activeTab} onValueChange={(value) => setActiveTab(value as TabId)}>
        <div className="no-print sticky top-[132px] z-20 mb-4 flex flex-wrap items-center justify-between gap-2 rounded-md border border-[var(--le-line)] bg-white/92 p-2 shadow-[var(--shadow-soft)] backdrop-blur">
          <Tabs.List className="flex min-w-0 flex-wrap items-center gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const selected = activeTab === tab.id;
              return (
                <Tabs.Trigger
                  key={tab.id}
                  value={tab.id}
                  className={cn(
                    "relative flex h-9 items-center gap-2 rounded-md px-3 text-[length:var(--type-sm)] font-bold text-[var(--le-muted)] transition hover:bg-[var(--le-panel)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--le-blue)]",
                    selected && "text-[var(--le-navy)]",
                  )}
                >
                  {selected ? (
                    <motion.span
                      layoutId="tab-active-bg"
                      className="absolute inset-0 rounded-md bg-[var(--le-navy-soft)]"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  ) : null}
                  <span className="relative flex items-center gap-2">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {tab.label}
                    {tab.audience === "client" ? <Badge tone="teal" className="px-2 py-0.5">Client</Badge> : null}
                  </span>
                </Tabs.Trigger>
              );
            })}
          </Tabs.List>
          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden text-[length:var(--type-xs)] text-[var(--le-muted)] lg:inline">
              {generatedAt ? (
                <>
                  Last generated {generatedAt}
                  {downloadUrl ? (
                    <>
                      {" · "}
                      <a
                        className="font-bold text-[var(--le-blue)] underline underline-offset-2"
                        href={downloadUrl}
                        rel="noopener"
                        target="_blank"
                      >
                        View stored PDF
                      </a>
                    </>
                  ) : null}
                </>
              ) : (
                "No stored PDF yet"
              )}
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={isGenerating}
              onClick={() => onGenerate(state)}
            >
              <Printer className="h-3.5 w-3.5" aria-hidden="true" />
              {isGenerating ? "Saving PDF..." : "Print / Save as PDF"}
            </Button>
            <Button
              aria-label="Reset to pulled-forward values"
              title="Reset to pulled-forward values"
              variant="secondary"
              size="icon"
              onClick={resetToPulledForwardValues}
            >
              <RefreshCcw className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </div>
        </div>

        <div
          className={cn(
            "items-start gap-4",
            activeTab !== "marketing" && "loan-estimate-sidebar-layout",
          )}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              data-tab-panel="active"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              {activeTab === "main" ? (
                <MainTab
                  state={state}
                  results={results}
                  insights={insights}
                  assetSegments={assetSegments}
                  updateNumber={updateNumber}
                  updateChoice={updateChoice}
                  matchComputedDownPayment={matchComputedDownPayment}
                />
              ) : null}
              {activeTab === "costs" ? <SummaryCostsTab state={state} results={results} /> : null}
              {activeTab === "marketing" ? (
                <SummaryMarketingTab
                  state={state}
                  results={results}
                  insights={insights}
                  assetSegments={assetSegments}
                  traceability={traceability}
                />
              ) : null}
              {activeTab === "legal" ? <LegalSizeTab state={state} results={results} /> : null}
              {activeTab === "formulas" ? (
                <FormulaTab state={state} results={results} updateNumber={updateNumber} />
              ) : null}
            </motion.div>
          </AnimatePresence>
          {activeTab !== "marketing" ? (
            <LoanSummarySidebar
              state={state}
              results={results}
              insights={insights}
              traceability={traceability}
            />
          ) : null}
        </div>
      </Tabs.Root>

      <footer className="mt-8 text-center text-[length:var(--type-xs)] text-[var(--le-muted)] print:hidden">
        <p className="font-bold text-[var(--le-navy)]">MLG Home Financial</p>
        <p>3570 NW 87th Avenue, Suite 700, Doral, FL 33178 · (786) 689-2939 · Fax (561) 287-8126</p>
      </footer>
      </div>
    </main>
  );
}

function MainTab({
  state,
  results,
  insights,
  assetSegments,
  updateNumber,
  updateChoice,
  matchComputedDownPayment,
}: {
  state: LoanState;
  results: LoanResults;
  insights: Record<string, FieldInsight>;
  assetSegments: Array<{ name: string; value: number; color: string }>;
  updateNumber: (field: NumericField, value: string) => void;
  updateChoice: <K extends StringField>(field: K, value: LoanState[K]) => void;
  matchComputedDownPayment: () => void;
}) {
  const [closingCostsOpen, setClosingCostsOpen] = useState(false);
  const closingCostsSnapshotRef = useRef<ClosingCostSnapshot | null>(null);
  const closingCostsTriggerRef = useRef<HTMLButtonElement | null>(null);
  const closingCostsDialogRef = useRef<HTMLDivElement | null>(null);
  const cancelClosingCostsRef = useRef<() => void>(() => undefined);
  const monthlyBars = [
    { name: "Principal & Interest", value: results.principalInterest, fill: chartColors.principal },
    { name: "Property Taxes", value: results.monthlyPropertyTax, fill: chartColors.taxes },
    { name: "Hazard Insurance", value: results.monthlyHazard, fill: chartColors.hazard },
    { name: "Flood / HO6", value: results.monthlyFlood, fill: chartColors.flood },
    { name: "HOA / Condo Fee", value: results.monthlyHOA, fill: chartColors.hoa },
  ];
  const basisLabel = valueBasisLabel(state);
  const borrowerEquityLabel = equityLabel(state);
  const equityApplied = equityAppliedLabel(state);

  function captureClosingCosts(): ClosingCostSnapshot {
    return closingCostNumericFields.reduce(
      (snapshot, field) => ({ ...snapshot, [field]: state[field] }),
      {
        brokerFeeMode: state.brokerFeeMode,
        originationMode: state.originationMode,
      } as ClosingCostSnapshot,
    );
  }

  function openClosingCosts() {
    closingCostsSnapshotRef.current = captureClosingCosts();
    setClosingCostsOpen(true);
  }

  function restoreClosingCostSnapshot() {
    const snapshot = closingCostsSnapshotRef.current;
    if (!snapshot) return;

    for (const field of closingCostNumericFields) {
      const value = snapshot[field];
      updateNumber(field, Number.isFinite(value) ? String(value) : "");
    }
    updateChoice("brokerFeeMode", snapshot.brokerFeeMode);
    updateChoice("originationMode", snapshot.originationMode);
  }

  function returnFocusToClosingCostsTrigger() {
    window.requestAnimationFrame(() => closingCostsTriggerRef.current?.focus());
  }

  function cancelClosingCosts() {
    restoreClosingCostSnapshot();
    setClosingCostsOpen(false);
    returnFocusToClosingCostsTrigger();
  }
  useEffect(() => {
    cancelClosingCostsRef.current = cancelClosingCosts;
  });

  function finishClosingCosts() {
    closingCostsSnapshotRef.current = null;
    setClosingCostsOpen(false);
    returnFocusToClosingCostsTrigger();
  }

  useEffect(() => {
    if (!closingCostsOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const dialog = closingCostsDialogRef.current;
    const focusable = dialog?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    focusable?.[0]?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        cancelClosingCostsRef.current();
        return;
      }

      if (event.key !== "Tab" || !focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closingCostsOpen]);

  return (
    <div className="space-y-2.5">
      <Panel title="Purchase & Loan Details" icon={Home}>
        <div className="space-y-2.5">
          <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
            <NumberField label={borrowerEquityLabel} field="downPaymentPct" value={state.downPaymentPct} step="0.5" onChange={updateNumber} />
            <ChoiceField
              label="Property Class"
              value={state.sfrOrCondo}
              options={[
                { value: "condo", label: "Condo" },
                { value: "sfr", label: "SFR (Single Family)" },
              ]}
              onValueChange={(value) => updateChoice("sfrOrCondo", value)}
            />
            <ChoiceField
              label="Property Type"
              value={state.propertyType}
              options={[
                { value: "CONDO", label: "Condo" },
                { value: "CONDO-HOTEL", label: "Condo-Hotel" },
                { value: "SINGLE FAMILY", label: "Single Family" },
                { value: "COMMERCIAL", label: "Commercial" },
              ]}
              onValueChange={(value) => updateChoice("propertyType", value)}
            />
            <ChoiceField
              label="Occupancy"
              value={state.occupancy}
              options={[
                { value: "PRIMARY", label: "Primary" },
                { value: "SECONDARY", label: "Secondary" },
                { value: "INVESTMENT", label: "Investment" },
                { value: "OTHER", label: "Other" },
              ]}
              onValueChange={(value) => updateChoice("occupancy", value)}
            />
            <ChoiceField
              label="Loan Category"
              value={state.foreignOrDomestic}
              options={[
                { value: "F", label: "Foreign National Loan" },
                { value: "D", label: "Domestic Loan" },
              ]}
              onValueChange={(value) => updateChoice("foreignOrDomestic", value)}
            />
            <ChoiceField
              label="New / Used"
              value={state.newOrUsed}
              options={[
                { value: "New", label: "New" },
                { value: "Used", label: "Used" },
              ]}
              onValueChange={(value) => updateChoice("newOrUsed", value)}
            />
            <ChoiceField
              label="Developer Fee Applies"
              value={state.developFee}
              options={[
                { value: "Yes", label: "Yes" },
                { value: "No", label: "No" },
              ]}
              onValueChange={(value) => updateChoice("developFee", value)}
            />
            <ChoiceField
              label="Loan Program"
              value={state.program}
              options={loanPrograms}
              onValueChange={(value) => updateChoice("program", value)}
            />
          </div>

          <div className="grid gap-2.5 rounded-md border border-slate-100 bg-[var(--le-gold-soft)] px-3 py-2 md:grid-cols-2 xl:grid-cols-5">
            <Readout label={basisLabel} value={state.purchasePrice} align="left" insight={sourceInsight(basisLabel, "Scenario Desk")} />
            <Readout label={borrowerEquityLabel} value={results.downPayment} align="left" insight={insights[borrowerEquityLabel]} />
            <Readout label="Loan Amount" value={results.loanAmount} align="left" insight={insights["Loan Amount"]} />
            <Readout label="Loan-to-Value (LTV)" value={results.ltv} format="percent" align="left" insight={insights.LTV} />
            <Readout label="Interest Rate" value={state.rate} format="percent" align="left" insight={sourceInsight("Interest Rate", "Scenario Desk")} />
          </div>
        </div>
      </Panel>

      <Panel title="Closing Costs" icon={Calculator}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[length:var(--type-sm)] text-[var(--le-muted)]">
              Review and adjust lender, title, government, and third-party fees.
            </p>
            <div className="mt-3 flex flex-wrap items-end gap-x-4 gap-y-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Closing Costs</p>
                <AnimatedValue
                  value={results.totalClosingCosts}
                  format="currency"
                  className="numeric mt-0.5 block text-[length:var(--type-2xl)] font-black text-[var(--le-navy)]"
                />
              </div>
              <Badge tone="gold">Preliminary estimate</Badge>
            </div>
          </div>
          <Button ref={closingCostsTriggerRef} type="button" variant="primary" onClick={openClosingCosts}>
            <Calculator className="h-3.5 w-3.5" aria-hidden="true" />
            Review / Edit Closing Costs
          </Button>
        </div>
      </Panel>

      {closingCostsOpen && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-[2px] sm:p-6"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) cancelClosingCosts();
              }}
            >
              <div
                ref={closingCostsDialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="closing-costs-dialog-title"
                aria-describedby="closing-costs-dialog-description"
                className="grid max-h-[calc(100vh-1.5rem)] w-full max-w-[1100px] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-md border border-slate-200 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.32)] sm:max-h-[calc(100vh-3rem)]"
              >
                <header className="flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3 sm:px-5">
                  <div>
                    <h2 id="closing-costs-dialog-title" className="text-[length:var(--type-xl)] font-black text-[var(--le-navy)]">
                      Closing Costs
                    </h2>
                    <p id="closing-costs-dialog-description" className="mt-1 text-[length:var(--type-sm)] text-[var(--le-muted)]">
                      Review and adjust estimated loan, title, government, and third-party fees.
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <div className="hidden text-right sm:block">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current total</p>
                      <AnimatedValue value={results.totalClosingCosts} format="currency" className="font-black text-[var(--le-navy)]" />
                    </div>
                    <Button type="button" size="icon" aria-label="Cancel and close closing costs" onClick={cancelClosingCosts}>
                      <X className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </header>

                <div className="min-h-0 overflow-y-auto px-3 py-3 sm:px-5">
                  <ClosingCostsEditor
                    state={state}
                    results={results}
                    insights={insights}
                    updateNumber={updateNumber}
                    updateChoice={updateChoice}
                  />
                </div>

                <footer className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <div className="flex items-baseline justify-between gap-4 sm:justify-start">
                    <span className="text-[length:var(--type-sm)] font-black text-[var(--le-navy)]">Total Closing Costs</span>
                    <AnimatedValue value={results.totalClosingCosts} format="currency" className="numeric text-[length:var(--type-lg)] font-black text-[var(--le-navy)]" />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="secondary" onClick={cancelClosingCosts}>Cancel</Button>
                    <Button type="button" variant="primary" onClick={finishClosingCosts}>Done</Button>
                  </div>
                </footer>
              </div>
            </div>,
            document.body,
          )
        : null}

      <Panel title="Pre-Paid Items" icon={PiggyBank}>
        <div className="space-y-2.5">
          <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-5">
            <NumberField label="Property Tax Escrow (Months)" field="taxMonths" value={state.taxMonths} step="1" onChange={updateNumber} />
            <NumberField label="Annual Property Tax Rate" field="propertyTaxRatePct" value={state.propertyTaxRatePct} step="0.1" onChange={updateNumber} />
            <NumberField label="Hazard Insurance Escrow" field="hazardInsEscrow" value={state.hazardInsEscrow} step="10" onChange={updateNumber} />
            <NumberField label="Developer Fee - % of Price" field="developFeeContractPct" value={state.developFeeContractPct} step="0.05" onChange={updateNumber} />
            <NumberField label="Flood / HO6 Insurance - Annual" field="floodHO6Annual" value={state.floodHO6Annual} step="10" onChange={updateNumber} />
          </div>

          <div className="grid gap-2.5 rounded-md border border-slate-100 bg-[var(--le-gold-soft)] px-3 py-2 md:grid-cols-2 xl:grid-cols-5">
            <Readout label="Taxes Escrowed" value={results.taxesEscrow} align="left" insight={insights["Taxes Escrowed"]} />
            <Readout label="Developer Fee (Per Contract)" value={results.developFeeContract} align="left" insight={insights["Developer Fee (Per Contract)"]} />
            <Readout label="Capital Contribution" value={results.capitalContribution} sublabel="2x HOA if New" align="left" insight={insights["Capital Contribution"]} />
            <Readout label="Total Pre-Paid Items" value={results.totalPrepaid} align="left" insight={insights["Total Pre-Paid Items"]} />
            <Readout label="Closing + Pre-Paid" value={results.totalClosingAndPrepaid} align="left" insight={insights["Closing + Pre-Paid"]} />
          </div>
        </div>
      </Panel>

      <Panel title="Monthly Payment" icon={BadgeDollarSign}>
        <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
          <NumberField label="Hazard Insurance - Annual (SFR)" field="hazardInsAnnual" value={state.hazardInsAnnual} step="10" onChange={updateNumber} />
          <NumberField label="HOA / Condo Fee - Monthly" field="hoaMonthly" value={state.hoaMonthly} step="10" onChange={updateNumber} />
          <Readout label="Principal & Interest" value={results.principalInterest} insight={insights["Principal & Interest"]} />
          <Readout label="Property Taxes / Month" value={results.monthlyPropertyTax} insight={sourceInsight("Property Taxes / Month", "Scenario Desk property tax inputs")} />
        </div>
        <div className="mt-3 h-52 rounded-md border border-[var(--le-line)] bg-[var(--le-panel)] p-2.5">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyBars} layout="vertical" margin={{ top: 8, right: 24, bottom: 8, left: 18 }} barCategoryGap={10}>
              <XAxis type="number" domain={[0, "dataMax"]} hide />
              <YAxis dataKey="name" type="category" width={142} tick={{ fill: "#667085", fontSize: 11 }} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} cursor={{ fill: "rgba(16,42,67,0.05)" }} />
              <Bar dataKey="value" minPointSize={3} barSize={22} radius={[0, 6, 6, 0]} isAnimationActive={false}>
                {monthlyBars.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2.5">
          <StatCard label="Total Monthly Payment" value={results.totalMonthlyPayment} emphasis insight={insights["Total Monthly Payment"]} />
        </div>
      </Panel>

      <Panel title="Cash to Close & Reserves" icon={ShieldCheck} showComputedBadge={false}>
        <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
          <NumberField label="Seller Credit" field="sellerCredit" value={state.sellerCredit} step="100" onChange={updateNumber} />
          <NumberField label="Other Credits" field="otherCredits" value={state.otherCredits} step="100" onChange={updateNumber} />
          <CurrencyField
            label={equityApplied}
            field="downPaymentGivenToSeller"
            value={state.downPaymentGivenToSeller}
            onChange={updateNumber}
            action={{
              label: `Match computed ${borrowerEquityLabel.toLowerCase()}`,
              onClick: matchComputedDownPayment,
            }}
          />
          <NumberField label="Reserve Months" field="reserveMonths" value={state.reserveMonths} step="1" onChange={updateNumber} />
        </div>
        <div className="cash-assets-row mt-4 grid items-center gap-4 xl:grid-cols-[minmax(420px,0.95fr)_minmax(420px,1.05fr)]">
          <AssetsPieChart data={assetSegments} />
          <div className="cash-stat-grid grid auto-rows-fr items-stretch gap-3 md:grid-cols-3">
            <StatCard label="Total Cash to Close" value={results.totalCashToClose} tight insight={insights["Total Cash to Close"]} />
            <StatCard label={`Reserves (${formatNumber(results.reserveMonths)} mo.)`} value={results.reserves} tight insight={insights.Reserves} />
            <StatCard label="Total Assets Required" value={results.totalAssetsRequired} tight insight={insights["Total Assets Required"]} />
          </div>
        </div>
        <Disclaimer compact>
          These figures are estimates. Actual charges may be more or less and are not a commitment to lend.
        </Disclaimer>
      </Panel>
    </div>
  );
}

function ClosingCostsEditor({
  state,
  results,
  insights,
  updateNumber,
  updateChoice,
}: {
  state: LoanState;
  results: LoanResults;
  insights: Record<string, FieldInsight>;
  updateNumber: (field: NumericField, value: string) => void;
  updateChoice: <K extends StringField>(field: K, value: LoanState[K]) => void;
}) {
  return (
    <FinancialTable
      columns={["Line", "Input", "Amount"]}
      rows={[
        {
          kind: "dual",
          label: "801. Loan Origination",
          input: (
            <DualFeeInput
              groupName="originationMode"
              mode={state.originationMode}
              percent={state.originationPct}
              flat={state.originationFlatFee}
              percentLabel="Loan origination percent of loan amount"
              flatLabel="Loan origination flat fee dollars"
              onModeChange={(value) => updateChoice("originationMode", value)}
              onPercentChange={(value) => updateNumber("originationPct", value)}
              onFlatChange={(value) => updateNumber("originationFlatFee", value)}
            />
          ),
          value:
            state.originationMode === "flat"
              ? Number.isFinite(state.originationFlatFee)
                ? results.loanOrigination
                : Number.NaN
              : Number.isFinite(state.originationPct)
                ? results.loanOrigination
                : Number.NaN,
        },
        {
          kind: "dual",
          label: "802. Broker Fee",
          input: (
            <DualFeeInput
              groupName="brokerFeeMode"
              mode={state.brokerFeeMode}
              percent={state.brokerFeePct}
              flat={state.brokerFeeFlatFee}
              percentLabel="Broker fee percent of loan amount"
              flatLabel="Broker fee flat fee dollars"
              onModeChange={(value) => updateChoice("brokerFeeMode", value)}
              onPercentChange={(value) => updateNumber("brokerFeePct", value)}
              onFlatChange={(value) => updateNumber("brokerFeeFlatFee", value)}
            />
          ),
          value:
            state.brokerFeeMode === "flat"
              ? Number.isFinite(state.brokerFeeFlatFee)
                ? results.brokerFee
                : Number.NaN
              : Number.isFinite(state.brokerFeePct)
                ? results.brokerFee
                : Number.NaN,
        },
        feeInputRow("803. Appraisal Fee & Final Inspection", "appraisalFee", state.appraisalFee, results.appraisalFee, updateNumber, "10"),
        feeInputRow("804. Application Fee (Credit Report)", "applicationFee", state.applicationFee, results.applicationFee, updateNumber, "10"),
        feeInputRow("811. Underwriting Fee", "underwritingFee", state.underwritingFee, results.underwritingFee, updateNumber, "10"),
        feeInputRow("812. Processing Fee", "processingFee", state.processingFee, results.processingFee, updateNumber, "10"),
        feeInputRow("813. Admin Fee (Broker)", "adminFee", state.adminFee, results.adminFee, updateNumber, "10"),
        {
          kind: "standard",
          label: "901. Per-Diem Interest",
          note: "days shown; prepaid item",
          input: (
            <InlineNumberInput
              ariaLabel="Number of days of interest"
              value={state.interestDays}
              step="1"
              suffix="days"
              onChange={(value) => updateNumber("interestDays", value)}
            />
          ),
          value: Number.isFinite(state.interestDays) ? results.interestPerDiem : Number.NaN,
        },
        feeInputRow("1101. Settlement / Closing Fee", "settlementFee", state.settlementFee, results.settlementFee, updateNumber, "10"),
        feeInputRow("1102. Abstract / Title Search", "titleSearchFee", state.titleSearchFee, results.titleSearchFee, updateNumber, "10"),
        feeInputRow("1107. Miscellaneous Title Company", "miscTitleFee", state.miscTitleFee, results.miscTitleFee, updateNumber, "10"),
        feeInputRow("1108. Title Insurance Fee", "titleInsuranceFee", state.titleInsuranceFee, results.titleInsuranceFee, updateNumber, "10"),
        feeInputRow("1109. Endorsements", "endorsements", state.endorsements, results.endorsements, updateNumber, "1"),
        feeInputRow("1201. Recording Fees", "recordingFees", state.recordingFees, results.recordingFees, updateNumber, "5"),
        feeInputRow("1202. City/County Tax Stamps", "cityTaxStamps", state.cityTaxStamps, results.cityTaxStamps, updateNumber, "10"),
        feeInputRow("1203. State Tax Stamps", "stateTaxStamps", state.stateTaxStamps, results.stateTaxStamps, updateNumber, "10"),
        feeInputRow("1300. Stamps on Deed", "stampsOnDeed", state.stampsOnDeed, results.stampsOnDeed, updateNumber, "10"),
        feeInputRow("1301. Survey", "surveyFee", state.surveyFee, results.surveyFee, updateNumber, "10"),
        feeInputRow("1303. Transamerica Tax Fee", "transamericaFee", state.transamericaFee, results.transamericaFee, updateNumber, "1"),
        feeInputRow("1304. Flood Zone Certification", "floodZoneCertFee", state.floodZoneCertFee, results.floodZoneCertFee, updateNumber, "1"),
        feeInputRow("1306. Miscellaneous (Filing, Couriers)", "miscFilingFee", state.miscFilingFee, results.miscFilingFee, updateNumber, "10"),
      ]}
      footerLabel="Total Closing Costs"
      footerValue={results.totalClosingCosts}
      footerInsight={insights["Total Closing Costs"]}
    />
  );
}

function SummaryCostsTab({
  state,
  results,
}: {
  state: LoanState;
  results: ReturnType<typeof calculateLoanEstimate>;
}) {
  return (
    <div className="space-y-5">
      <Panel title="Loan Snapshot" icon={ChartNoAxesCombined} dense>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Applicant" textValue={state.applicantName} compact />
          <StatCard label="Loan Purpose" textValue={state.loanPurpose} compact />
          <StatCard label={valueBasisLabel(state)} value={results.purchasePrice} compact />
          <StatCard label={equityLabel(state)} value={results.downPayment} compact />
          <StatCard label="Loan Amount" value={results.loanAmount} compact />
          <StatCard label="LTV" value={results.ltv} format="percent" compact />
          <StatCard label="Lender / Product" textValue={state.lenderAndProduct} compact />
          <StatCard label="Program" textValue={state.program} compact />
          <StatCard label="Rate" value={state.rate} format="percent" compact />
          <StatCard label="Loan Type" textValue={state.foreignOrDomestic === "F" ? "Foreign National" : "Domestic"} compact />
        </div>
      </Panel>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Monthly Payments" icon={BadgeDollarSign} dense>
          <SimpleTable
            rows={[
              ["Principal & Interest", formatCurrency(results.principalInterest)],
              ["Monthly Property Taxes", formatCurrency(results.monthlyPropertyTax)],
              ["Hazard Insurance", formatCurrency(results.monthlyHazard)],
              ["Flood / HO6 Insurance", formatCurrency(results.monthlyFlood)],
              ["HOA / Condo Fee", formatCurrency(results.monthlyHOA)],
            ]}
            footer={["Total Monthly Payment", formatCurrency(results.totalMonthlyPayment)]}
          />
        </Panel>

        <Panel title="Closing Costs & Pre-Paids" icon={Calculator} dense>
          <SimpleTable
            rows={[
              ["Fixed Loan Costs", formatCurrency(results.fixedLoanCosts)],
              ["Fixed Title Costs", formatCurrency(results.fixedTitleCosts)],
              ["Total Closing Costs", formatCurrency(results.totalClosingCosts)],
              ["Developer Fee", formatCurrency(results.developFeeContract)],
              ["Capital Contribution", formatCurrency(results.capitalContribution)],
              ["Other Prepaids", formatCurrency(results.otherPrepaid)],
            ]}
            footer={["Total Pre-Paid Items", formatCurrency(results.totalPrepaid)]}
          />
        </Panel>
      </div>

      <Panel title="Credits & Cash Required" icon={ShieldCheck} dense>
        <SimpleTable
          rows={[
            [equityLabel(state), formatCurrency(results.downPayment)],
            ["Total Closing + Pre-Paid", formatCurrency(results.totalClosingAndPrepaid)],
            [equityAppliedLabel(state), formatCurrency(results.downPaymentGivenToSeller)],
            ["Seller Credit", formatCurrency(results.sellerCredit)],
            ["Other Credits", formatCurrency(results.otherCredits)],
            ["Total Cash to Close", formatCurrency(results.totalCashToClose)],
            ["Reserves", formatCurrency(results.reserves)],
          ]}
          footer={["Total Assets Required", formatCurrency(results.totalAssetsRequired)]}
        />
      </Panel>
    </div>
  );
}

function SummaryMarketingTab({
  state,
  results,
  insights,
  assetSegments,
  traceability,
}: {
  state: LoanState;
  results: ReturnType<typeof calculateLoanEstimate>;
  insights: Record<string, FieldInsight>;
  assetSegments: Array<{ name: string; value: number; color: string }>;
  traceability: LoanEstimateTraceability;
}) {
  const renderBreakdownContent = () => (
    <div className="print-breakdown-content mt-4 grid gap-5 lg:grid-cols-2">
      <SimpleTable
        rows={[
          ["Total Closing Costs", formatCurrency(results.totalClosingCosts)],
          ["Total Pre-Paid Items", formatCurrency(results.totalPrepaid)],
          ["Seller Credit", formatCurrency(results.sellerCredit)],
          ["Other Credits", formatCurrency(results.otherCredits)],
          [equityAppliedLabel(state), formatCurrency(results.downPaymentGivenToSeller)],
          ["Total Cash Required at Closing", formatCurrency(results.totalCashToClose)],
          ["Reserves Savings", formatCurrency(results.reserves)],
        ]}
        footer={["Total Assets Required to Approve Loan", formatCurrency(results.totalAssetsRequired)]}
      />
      <SimpleTable
        rows={[
          ["Fixed Loan Costs", formatCurrency(results.fixedLoanCosts)],
          ["Fixed Title Costs", formatCurrency(results.fixedTitleCosts)],
          ["Taxes Escrow", formatCurrency(results.taxesEscrow)],
          ["Developer Fee", formatCurrency(results.developFeeContract)],
          ["Capital Contribution", formatCurrency(results.capitalContribution)],
          ["Per-Diem Interest", formatCurrency(results.interestPerDiem)],
        ]}
      />
    </div>
  );

  return (
    <DocumentFrame className="!max-w-[1390px]">
      <div className="loan-estimate-marketing-layout grid items-start gap-5">
        <div className="space-y-5 print:col-span-2">
          <ClientHeader state={state} subtitle="Borrower Fee Sheet Summary" />
          <section
            data-summary-marketing="core"
            className="print-client-section print-keep-together grid gap-5 lg:grid-cols-2"
          >
        <div data-summary-marketing-card="loan" className="rounded-md border border-[var(--le-line)] p-5">
          <h2 className="mb-4 flex items-center gap-2 text-[length:var(--type-lg)] font-black text-[var(--le-navy)]">
            <Home className="h-5 w-5" aria-hidden="true" />
            Loan Information
          </h2>
          <SimpleTable
            rows={[
              ["Applicant", state.applicantName],
              ["Loan Type", state.foreignOrDomestic === "F" ? "Foreign National Loan" : "Domestic Loan"],
              [valueBasisLabel(state), formatCurrency(results.purchasePrice)],
              [equityLabel(state), formatCurrency(results.downPayment)],
              ["Loan Amount", formatCurrency(results.loanAmount)],
              ["LTV", formatPercent(results.ltv)],
            ]}
          />
          <h2 className="mb-4 mt-5 flex items-center gap-2 text-[length:var(--type-lg)] font-black text-[var(--le-navy)]">
            <BadgeDollarSign className="h-5 w-5" aria-hidden="true" />
            Monthly Payment Summary
          </h2>
          <SimpleTable
            rows={[
              ["Program", state.program],
              ["Rate", formatPercent(state.rate)],
              ["Principal & Interest", formatCurrency(results.principalInterest)],
              ["Property Taxes", formatCurrency(results.monthlyPropertyTax)],
              ["Hazard Insurance", formatCurrency(results.monthlyHazard)],
              ["Flood / HO6", formatCurrency(results.monthlyFlood)],
              ["HOA / Condo Fee", formatCurrency(results.monthlyHOA)],
            ]}
            footer={["Total Monthly Payment", formatCurrency(results.totalMonthlyPayment)]}
          />
        </div>

        <div data-summary-marketing-card="costs" className="rounded-md border border-[var(--le-line)] p-5">
          <h2 className="mb-4 flex items-center gap-2 text-[length:var(--type-lg)] font-black text-[var(--le-navy)]">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            Prepaid &amp; Closing Costs
          </h2>
          <SimpleTable
            rows={[
              ["Flood / HO6", formatCurrency(results.floodHO6Escrow)],
              ["Developer Fee (per contract)", formatCurrency(results.developFeeContract)],
              ["Capital Contribution", formatCurrency(results.capitalContribution)],
              ["Total Prepaid Costs", formatCurrency(results.totalPrepaid)],
              ["Fixed Loan Costs", formatCurrency(results.fixedLoanCosts)],
              ["Fixed Title Costs", formatCurrency(results.fixedTitleCosts)],
              ["Total Closing Costs", formatCurrency(results.totalClosingCosts)],
              ["Seller Credit", formatCurrency(results.sellerCredit)],
              ["Other Credits", formatCurrency(results.otherCredits)],
              [equityAppliedLabel(state), formatCurrency(results.downPaymentGivenToSeller)],
              ["Total Cash Required at Closing", formatCurrency(results.totalCashToClose)],
              ["Reserves Savings", formatCurrency(results.reserves)],
            ]}
            emphasizedRows={["Total Closing Costs"]}
            footer={["Total Assets Required to Approve Loan", formatCurrency(results.totalAssetsRequired)]}
          />
        </div>
          </section>
        </div>

        <LoanSummarySidebar
          state={state}
          results={results}
          insights={insights}
          traceability={traceability}
        />

        <section
          data-summary-marketing="assets"
          className="print-client-section print-keep-together rounded-md border border-[var(--le-line)] p-5 xl:col-span-2"
        >
          <AssetsPieChart data={assetSegments} />
        </section>

        <details className="screen-full-breakdown print-client-section rounded-md border border-[var(--le-line)] p-5 xl:col-span-2">
          <summary className="cursor-pointer text-[length:var(--type-sm)] font-black uppercase text-[var(--le-navy)]">
            View full breakdown
          </summary>
          {renderBreakdownContent()}
        </details>

        <section className="print-full-breakdown print-client-section hidden rounded-md border border-[var(--le-line)] p-5 xl:col-span-2">
          {renderBreakdownContent()}
        </section>

        <section
          data-summary-marketing="disclosure"
          className="print-client-section print-keep-together rounded-md border border-[var(--le-line)] p-5 xl:col-span-2"
        >
          <Disclaimer>
            The information provided reflects estimates of charges you are likely to incur at settlement. Fees may be
            more or less and this is not a commitment to lend.
          </Disclaimer>
          <SignatureBlock />
        </section>
      </div>
    </DocumentFrame>
  );
}

function LegalSizeTab({
  state,
  results,
}: {
  state: LoanState;
  results: ReturnType<typeof calculateLoanEstimate>;
}) {
  return (
    <DocumentFrame className="legal-page">
      <Badge tone="gold" className="mb-4">Legal Size Layout - 8.5 x 14 when printed</Badge>
      <ClientHeader state={state} subtitle="Marketing Complete Legal Size" />
      <div className="grid gap-5 lg:grid-cols-2">
        <DocumentSection title="Loan Information" icon={Home}>
          <SimpleTable
            rows={[
              [valueBasisLabel(state), formatCurrency(results.purchasePrice)],
              [equityLabel(state), formatCurrency(results.downPayment)],
              ["Loan Amount", formatCurrency(results.loanAmount)],
              ["Equity / LTV", formatPercent(results.ltv)],
              ["Property Type", state.propertyType],
            ]}
          />
          <h3 className="mt-5 text-[length:var(--type-md)] font-black text-[var(--le-navy)]">Monthly Payment Summary</h3>
          <SimpleTable
            rows={[
              ["Program", state.program],
              ["Rate", formatPercent(state.rate)],
              ["Principal & Interest", formatCurrency(results.principalInterest)],
              ["Taxes", formatCurrency(results.monthlyPropertyTax)],
              [results.hoaOrHazardLabel, formatCurrency(results.hoaOrHazardValue)],
            ]}
            footer={["Total Payment", formatCurrency(results.totalMonthlyPayment)]}
          />
        </DocumentSection>

        <DocumentSection title="Fixed Loan Costs" icon={Calculator}>
          <SimpleTable
            rows={[
              ["Loan Origination", formatCurrency(results.loanOrigination)],
              ["Mortgage Broker Fee", formatCurrency(results.brokerFee)],
              ["Appraisal Fee", formatCurrency(results.appraisalFee)],
              ["Credit Report", formatCurrency(results.applicationFee)],
              ["Underwriting Fee", formatCurrency(results.underwritingFee)],
              ["Processing Fee", formatCurrency(results.processingFee)],
              ["Admin Fee", formatCurrency(results.adminFee)],
            ]}
            footer={["Total Fixed Loan Costs", formatCurrency(results.fixedLoanCosts)]}
          />
        </DocumentSection>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <DocumentSection title="Fixed Title Costs" icon={FileText}>
          <SimpleTable
            rows={[
              ["Settlement Fee", formatCurrency(results.settlementFee)],
              ["Title Search", formatCurrency(results.titleSearchFee)],
              ["Miscellaneous", formatCurrency(results.miscTitleFee)],
              ["Title Insurance", formatCurrency(results.titleInsuranceFee)],
              ["Endorsements", formatCurrency(results.endorsements)],
              ["Recording Fees (City)", formatCurrency(results.recordingFees)],
              ["City Tax Stamps", formatCurrency(results.cityTaxStamps)],
              ["State Tax Stamps", formatCurrency(results.stateTaxStamps)],
              ["Stamp on Deed", formatCurrency(results.stampsOnDeed)],
              ["Survey", formatCurrency(results.surveyFee)],
              ["Transamerica Fee", formatCurrency(results.transamericaFee)],
              ["Flood Zone Cert.", formatCurrency(results.floodZoneCertFee)],
              ["Translations / Courier / Etc.", formatCurrency(results.miscFilingFee)],
            ]}
            footer={["Total Fixed Title Costs", formatCurrency(results.fixedTitleCosts)]}
          />
        </DocumentSection>

        <DocumentSection title="Prepaid Costs & Cash to Close" icon={PiggyBank}>
          <SimpleTable
            rows={[
              ["Taxes Escrow", formatCurrency(results.taxesEscrow)],
              [`${formatNumber(state.interestDays)} Day(s) of Interest Rate`, formatCurrency(results.interestPerDiem)],
              ["Develop Fee as per Contract", formatCurrency(results.developFeeContract)],
              ["Cap Contribution as per Contract", formatCurrency(results.capitalContribution)],
              ["Flood / HO6 Insurance", formatCurrency(results.floodHO6Escrow)],
            ]}
            footer={["Total Prepaid Costs", formatCurrency(results.totalPrepaid)]}
          />
          <div className="print-cash-summary mt-4">
            <SimpleTable
              rows={[
                ["Seller Credit", formatCurrency(results.sellerCredit)],
                ["Other Credits", formatCurrency(results.otherCredits)],
                [equityAppliedLabel(state), formatCurrency(results.downPaymentGivenToSeller)],
                ["Total Cash to Close", formatCurrency(results.totalCashToClose)],
                ["Reserves Savings", formatCurrency(results.reserves)],
              ]}
              footer={["Total Assets Required to Approve Loan", formatCurrency(results.totalAssetsRequired)]}
            />
          </div>
        </DocumentSection>
      </div>

      <Disclaimer>
        The information provided reflects estimates of charges you are likely to incur at settlement. Fees may be more
        or less and this is not a commitment to lend.
      </Disclaimer>
      <SignatureBlock />
    </DocumentFrame>
  );
}

function FormulaTab({
  state,
  results,
  updateNumber,
}: {
  state: LoanState;
  results: ReturnType<typeof calculateLoanEstimate>;
  updateNumber: (field: NumericField, value: string) => void;
}) {
  return (
    <div className="space-y-5">
      <Panel title="Title Insurance Premium Calculator" icon={Calculator} dense>
        <div className="mb-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <NumberField label="Low-Value Threshold" field="lowThreshold" value={state.lowThreshold} step="100" onChange={updateNumber} />
          <NumberField label="Flat Fee Below Threshold" field="lowFlatFee" value={state.lowFlatFee} step="10" onChange={updateNumber} />
        </div>
        <table className="w-full border-collapse text-[length:var(--type-sm)]">
          <thead>
            <tr className="bg-[var(--le-navy-soft)] text-left text-[length:var(--type-xs)] font-black uppercase text-[var(--le-navy)]">
              <th className="border-b border-[var(--le-line)] px-3 py-2">Tier Cap ($)</th>
              <th className="border-b border-[var(--le-line)] px-3 py-2">Rate (per $1,000)</th>
              <th className="border-b border-[var(--le-line)] px-3 py-2 text-right">Contribution</th>
            </tr>
          </thead>
          <tbody>
            {([1, 2, 3, 4, 5, 6] as const).map((tier, index) => {
              const capField = `tier${tier}Cap` as NumericField;
              const rateField = `tier${tier}Rate` as NumericField;
              return (
                <tr key={tier}>
                  <td className="border-b border-[var(--le-line)] px-3 py-2">
                    <Input
                      className={numericInputClassName}
                      type="number"
                      step="1000"
                      value={state[capField]}
                      aria-label={`Tier ${tier} cap`}
                      onFocus={selectInputText}
                      onChange={(event) => updateNumber(capField, event.target.value)}
                    />
                  </td>
                  <td className="border-b border-[var(--le-line)] px-3 py-2">
                    <Input
                      className={numericInputClassName}
                      type="number"
                      step="0.05"
                      value={state[rateField]}
                      aria-label={`Tier ${tier} rate`}
                      onFocus={selectInputText}
                      onChange={(event) => updateNumber(rateField, event.target.value)}
                    />
                  </td>
                  <td className="numeric border-b border-[var(--le-line)] px-3 py-2 text-right font-bold text-[var(--le-navy)]">
                    {formatCurrency(results.tierContrib[index])}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-[var(--le-gold-soft)] font-black text-[var(--le-navy)]">
              <td className="px-3 py-3" colSpan={2}>Title Insurance Premium</td>
              <td className="numeric px-3 py-3 text-right">{formatCurrency(results.titlePremium)}</td>
            </tr>
          </tfoot>
        </table>
        <p className="mt-3 text-[length:var(--type-sm)] text-[var(--le-muted)]">
          Premium + $100 = <strong>{formatCurrency(results.titlePremiumPlus100)}</strong> · Suggested Endorsements =
          (Premium + $100) x 10% + $180 = <strong>{formatCurrency(results.suggestedEndorsements)}</strong>
        </p>
      </Panel>

      <Panel title="Formula Glossary - Open, Plain-English Formulas" icon={FileText} dense>
        <SimpleTable
          rows={formulaInsights(state, results).map((insight) => [insight.title, insight.body])}
        />
      </Panel>

      <Panel title="Reference Lookup Lists" icon={BriefcaseBusiness} dense>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <ChipGroup title="Property Class" values={["SFR", "Condo", "Condo-Hotel", "Single Family", "Commercial"]} />
          <ChipGroup title="Yes / No" values={["Yes", "No"]} />
          <ChipGroup title="New / Used" values={["New", "Used"]} />
          <ChipGroup title="Loan Programs" values={loanPrograms.map((program) => program.label)} />
          <ChipGroup title="Occupancy" values={["Primary", "Secondary", "Investment"]} />
          <ChipGroup title="Loan Category" values={["Foreign National Loan", "Domestic Loan"]} />
        </div>
      </Panel>
    </div>
  );
}

function BannerMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border-l border-white/15 pl-4">
      <p className="truncate text-[11px] font-extrabold uppercase leading-tight tracking-[0.14em] text-slate-300/80" title={label}>
        {label}
      </p>
      <p className="mt-2 truncate text-[length:var(--type-md)] font-black leading-snug text-white" title={value}>
        {value}
      </p>
    </div>
  );
}

function Panel({
  title,
  icon: Icon,
  children,
  dense = false,
  showComputedBadge = true,
}: {
  title: string;
  icon: typeof Calculator;
  children: React.ReactNode;
  dense?: boolean;
  showComputedBadge?: boolean;
}) {
  return (
    <motion.section
      whileHover={{ y: -2, boxShadow: "var(--shadow-lift)" }}
      transition={{ duration: 0.18 }}
      className={cn(
        "print-panel rounded-md border border-slate-100 bg-white shadow-[var(--shadow-soft)]",
        dense ? "p-2" : "p-2.5",
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
        <h2 className="flex items-center gap-1.5 text-base font-extrabold text-slate-900">
          <Icon className="h-4 w-4 text-[var(--le-gold)]" aria-hidden="true" />
          {title}
        </h2>
        {showComputedBadge ? (
          <Badge tone="navy">
            <LockKeyhole className="h-2.5 w-2.5" aria-hidden="true" />
            Computed fields locked
          </Badge>
        ) : null}
      </div>
      {children}
    </motion.section>
  );
}

function CompactSummaryValue({
  label,
  value,
  action,
  emphasis = false,
}: {
  label: string;
  value: number;
  action?: React.ReactNode;
  emphasis?: boolean;
}) {
  return (
    <div className={cn("rounded-md border px-3 py-2", emphasis ? "border-[var(--le-blue)] bg-blue-50/60" : "border-slate-100 bg-gray-50")}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        {action}
      </div>
      <AnimatedValue
        value={value}
        format="currency"
        className={cn(
          "mt-0.5 block text-right font-black",
          emphasis ? "text-[length:var(--type-xl)] text-[var(--le-blue)]" : "text-[length:var(--type-md)] text-[var(--le-navy)]",
        )}
      />
    </div>
  );
}

function LoanSummarySidebar({
  state,
  results,
  insights,
  traceability,
}: {
  state: LoanState;
  results: LoanResults;
  insights: Record<string, FieldInsight>;
  traceability: LoanEstimateTraceability;
}) {
  return (
    <aside
      data-loan-summary="sidebar"
      className="no-print w-full rounded-md border border-slate-100 bg-white p-3 shadow-[var(--shadow-soft)] sm:max-w-[282px] xl:sticky xl:top-[196px] xl:max-w-none"
    >
      <div className="mb-3 border-b border-slate-100 pb-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Live Summary</p>
        <p className="text-sm font-extrabold text-slate-900">Loan Identity</p>
      </div>
      <section className="mb-3 rounded-md border border-slate-100 bg-gray-50 p-2.5">
        <div className="space-y-2">
          <SidebarTextValue
            label="Applicant"
            value={state.applicantName}
            action={<TraceabilityTrigger data={traceability} />}
          />
          <SidebarTextValue label="Loan Number" value={state.loanNumber} />
          <SidebarTextValue label="Cell Phone" value={formatUSPhone(state.cellPhone)} />
          <SidebarTextValue label="Office Phone" value={formatUSPhone(state.officePhone)} />
          <SidebarTextValue label="Email" value={state.email} />
        </div>
      </section>
      <div className="mb-3 border-b border-slate-100 pb-2">
        <p className="text-sm font-extrabold text-slate-900">Payment &amp; Cash to Close</p>
      </div>
      <SidebarBreakdown
        title="Total Monthly Payment"
        total={results.totalMonthlyPayment}
        insight={insights["Total Monthly Payment"]}
        rows={[
          ["Principal & Interest", results.principalInterest],
          ["Property Taxes", results.monthlyPropertyTax],
          ["Hazard Insurance", results.monthlyHazard],
          ["Flood / HO6", results.monthlyFlood],
          ["HOA / Condo Fee", results.monthlyHOA],
        ]}
      />
      <SidebarBreakdown
        title="Total Cash to Close"
        total={results.totalCashToClose}
        insight={insights["Total Cash to Close"]}
        rows={[
          [equityLabel(state), results.downPayment],
          ["Closing Costs", results.totalClosingCosts],
          ["Pre-Paid Items", results.totalPrepaid],
          ["Seller Credit", -results.sellerCredit],
          ["Other Credits", -results.otherCredits],
        ]}
      />
    </aside>
  );
}

function SidebarTextValue({
  label,
  value,
  action,
}: {
  label: string;
  value: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="block min-w-0 rounded-sm text-left">
      <p className="text-[10px] font-semibold uppercase leading-tight tracking-wider text-slate-400">{label}</p>
      <span className="flex items-center">
        <p className="truncate text-left text-[length:var(--type-sm)] font-bold text-[var(--le-navy)]" title={value}>
          {value}
        </p>
        {action}
      </span>
    </div>
  );
}

function SidebarBreakdown({
  title,
  total,
  insight,
  rows,
}: {
  title: string;
  total: number;
  insight?: FieldInsight;
  rows: Array<[string, number]>;
}) {
  return (
    <section className="mb-3 rounded-md border border-slate-100 bg-gray-50 p-2.5 last:mb-0">
      <div className="mb-2 flex items-end justify-between gap-2">
        <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">{title}</h3>
        <ReadOnlyInsight insight={insight} className="rounded-sm">
          <AnimatedValue
            value={total}
            format="currency"
            className="text-right text-[length:var(--type-lg)] font-black text-[var(--le-navy)] transition-colors group-hover:text-[var(--le-blue)]"
          />
        </ReadOnlyInsight>
      </div>
      <dl className="space-y-1">
        {rows.map(([label, amount]) => (
          <div key={label} className="flex items-center justify-between gap-2 text-[length:var(--type-sm)]">
            <dt className="truncate text-slate-500">{label}</dt>
            <dd className="numeric font-mono font-bold tabular-nums text-slate-800">{formatCurrency(amount)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function NumberField({
  label,
  field,
  value,
  step,
  onChange,
}: {
  label: string;
  field: NumericField;
  value: number;
  step: string;
  onChange: (field: NumericField, value: string) => void;
}) {
  return (
    <div className="min-w-0 space-y-1">
      <Label className="flex min-h-[22px] items-end leading-tight" htmlFor={field}>{label}</Label>
      <Input
        id={field}
        className={numericInputClassName}
        type="number"
        inputMode="decimal"
        step={step}
        value={numberInputValue(value)}
        onFocus={selectInputText}
        onChange={(event) => onChange(field, event.target.value)}
      />
    </div>
  );
}

function CurrencyField({
  label,
  field,
  value,
  onChange,
  action,
}: {
  label: string;
  field: NumericField;
  value: number;
  onChange: (field: NumericField, value: string) => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}) {
  return (
    <div className="min-w-0 space-y-1">
      <Label htmlFor={field}>{label}</Label>
      <div className="relative">
        <Input
          id={field}
          inputMode="decimal"
          value={formatCurrency(value)}
          className={cn(numericInputClassName, action && "pr-9")}
          onFocus={selectInputText}
          onChange={(event) => onChange(field, event.target.value.replace(/[^\d.-]/g, ""))}
        />
        {action ? (
          <button
            type="button"
            className="group/action absolute right-1 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-sm text-slate-400 transition hover:bg-slate-100 hover:text-[var(--le-blue)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(49_95_190_/_0.24)]"
            aria-label={action.label}
            onClick={action.onClick}
          >
            <RefreshCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="pointer-events-none absolute bottom-full right-0 z-20 mb-1 hidden whitespace-nowrap rounded-sm bg-slate-900 px-2 py-1 text-[10px] font-semibold text-white shadow-lg group-hover/action:block group-focus-visible/action:block">
              {action.label}
            </span>
          </button>
        ) : null}
      </div>
    </div>
  );
}

function ChoiceField<T extends string>({
  label,
  value,
  options,
  onValueChange,
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onValueChange: (value: T) => void;
}) {
  return (
    <div className="min-w-0 space-y-1">
      <Label>{label}</Label>
      <Select value={value} onValueChange={(nextValue) => onValueChange(nextValue as T)}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function ReadOnlyInsight({
  insight,
  children,
  className,
}: {
  insight?: FieldInsight;
  children: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (!insight) return <>{children}</>;

  const titleId = `insight-title-${insight.title.replace(/\W+/g, "-").toLowerCase()}`;
  const modal = typeof document === "undefined" ? null : createPortal(
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="fixed inset-0 z-[80] bg-slate-950/45 backdrop-blur-[1px]"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="pointer-events-none fixed inset-0 z-[81] flex items-center justify-center p-4"
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className="pointer-events-auto max-h-[min(80vh,640px)] min-h-[280px] w-full max-w-[720px] overflow-y-auto rounded-md border border-slate-200 bg-white p-6 text-left shadow-[0_24px_80px_rgba(15,23,42,0.28)]"
            >
              <InsightContent insight={insight} onClose={() => setOpen(false)} titleId={titleId} />
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  );

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        className="group block w-full cursor-pointer rounded-sm text-inherit outline-none focus-visible:ring-2 focus-visible:ring-[rgb(49_95_190_/_0.24)]"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        {children}
      </button>
      {modal}
    </div>
  );
}

function InsightContent({ insight, onClose, titleId }: { insight: FieldInsight; onClose: () => void; titleId: string }) {
  return (
    <div>
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{insight.kind}</p>
          <h3 id={titleId} className="text-[length:var(--type-lg)] font-black text-[var(--le-navy)]">{insight.title}</h3>
        </div>
        <button
          type="button"
          className="rounded-sm p-1 text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
          aria-label="Close breakdown"
          onClick={onClose}
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
      <p className="text-[length:var(--type-md)] leading-relaxed text-slate-600">{insight.body}</p>
    </div>
  );
}

function Readout({
  label,
  value,
  format = "currency",
  sublabel,
  emphasis = false,
  align = "right",
  insight,
}: {
  label: string;
  value: number;
  format?: "currency" | "percent";
  sublabel?: string;
  emphasis?: boolean;
  align?: "left" | "right";
  insight?: FieldInsight;
}) {
  return (
    <ReadOnlyInsight
      insight={insight}
      className="flex min-h-[50px] flex-col justify-start gap-1 rounded-sm py-0.5 text-left"
    >
      <span className="flex items-center gap-1">
        <Label>{label}</Label>
      </span>
      <span className="block">
        <AnimatedValue
          value={value}
          format={format}
          className={cn(
            "numeric block font-black",
            align === "left" ? "text-left" : "text-right",
            emphasis
              ? "text-[length:var(--type-xl)] text-[var(--le-blue)]"
              : "text-[length:var(--type-md)] text-[var(--le-navy)] transition-colors group-hover:text-[var(--le-blue)]",
          )}
        />
        {sublabel ? (
          <p className={cn("mt-0.5 text-[length:var(--type-xs)] leading-tight text-[var(--le-muted)]", align === "left" ? "text-left" : "text-right")}>
            {sublabel}
          </p>
        ) : null}
      </span>
    </ReadOnlyInsight>
  );
}

function AnimatedValue({
  value,
  format,
  className,
}: {
  value: number;
  format: "currency" | "percent";
  className?: string;
}) {
  const displayValue = format === "currency" ? formatCurrency(value) : formatPercent(value);
  return (
    <motion.span
      key={displayValue}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className={cn("numeric", className)}
    >
      {displayValue}
    </motion.span>
  );
}

function StatCard({
  label,
  value,
  textValue,
  format = "currency",
  accent = false,
  emphasis = false,
  compact = false,
  tight = false,
  insight,
}: {
  label: string;
  value?: number;
  textValue?: string;
  format?: "currency" | "percent";
  accent?: boolean;
  emphasis?: boolean;
  compact?: boolean;
  tight?: boolean;
  insight?: FieldInsight;
}) {
  return (
    <ReadOnlyInsight insight={insight} className="block rounded-md">
      <motion.div
        whileHover={{ y: -2 }}
        className={cn(
          "flex min-h-[70px] min-w-0 flex-col items-start justify-start rounded-md border p-3",
          accent
            ? "border-[var(--le-gold)] bg-[var(--le-gold-soft)] shadow-sm"
            : "border-[var(--le-line)] bg-[var(--le-panel)]",
          compact && "min-h-[64px] p-2.5",
          tight && "min-h-[64px] p-2.5",
        )}
      >
        <p className="min-w-0 text-left text-[10px] font-semibold uppercase leading-tight tracking-wider text-slate-400">{label}</p>
        {textValue ? (
          <p className="mt-1 text-left text-[length:var(--type-md)] font-black text-[var(--le-navy)] transition-colors group-hover:text-[var(--le-blue)]">{textValue}</p>
        ) : (
          <AnimatedValue
            value={value ?? 0}
            format={format}
            className={cn(
              "mt-1 block text-left font-black",
              accent ? "text-[var(--le-blue)]" : "text-[var(--le-navy)] transition-colors group-hover:text-[var(--le-blue)]",
              emphasis || accent ? "text-[length:var(--type-2xl)]" : "text-[length:var(--type-xl)]",
              tight && (accent ? "text-[length:var(--type-lg)]" : "text-[length:var(--type-lg)]"),
            )}
          />
        )}
      </motion.div>
    </ReadOnlyInsight>
  );
}

function DualFeeInput({
  groupName,
  mode,
  percent,
  flat,
  percentLabel,
  flatLabel,
  onModeChange,
  onPercentChange,
  onFlatChange,
}: {
  groupName: string;
  mode: "percent" | "flat";
  percent: number;
  flat: number;
  percentLabel: string;
  flatLabel: string;
  onModeChange: (value: "percent" | "flat") => void;
  onPercentChange: (value: string) => void;
  onFlatChange: (value: string) => void;
}) {
  return (
    <fieldset className="m-0 ml-auto flex min-w-0 max-w-[560px] flex-wrap items-center justify-end gap-2 border-0 p-0">
      <legend className="sr-only">Fee input mode</legend>
      <ModeRadio
        name={groupName}
        value="percent"
        label="% of Loan"
        checked={mode === "percent"}
        onChange={() => onModeChange("percent")}
      />
      <ModeNumberInput
        ariaLabel={percentLabel}
        value={percent}
        step="0.1"
        suffix="%"
        disabled={mode === "flat"}
        widthClassName="w-20"
        onChange={onPercentChange}
      />
      <ModeRadio
        name={groupName}
        value="flat"
        label="Flat Fee ($)"
        checked={mode === "flat"}
        onChange={() => onModeChange("flat")}
      />
      <ModeNumberInput
        ariaLabel={flatLabel}
        value={flat}
        step="10"
        disabled={mode === "percent"}
        widthClassName="w-28"
        onChange={onFlatChange}
      />
    </fieldset>
  );
}

function ModeRadio({
  name,
  value,
  label,
  checked,
  onChange,
}: {
  name: string;
  value: "percent" | "flat";
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label
      className={cn(
        "inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-md border px-1.5 text-[length:var(--type-xs)] font-bold transition",
        checked
          ? "border-[var(--le-blue)] bg-[var(--le-navy-soft)] text-[var(--le-navy)]"
          : "border-[var(--le-line)] bg-white text-[var(--le-muted)]",
      )}
    >
      <input
        className="h-3 w-3 accent-[var(--le-blue)]"
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
      />
      {label}
    </label>
  );
}

function ModeNumberInput({
  value,
  step,
  suffix,
  disabled,
  ariaLabel,
  widthClassName,
  onChange,
}: {
  value: number;
  step: string;
  suffix?: string;
  disabled?: boolean;
  ariaLabel: string;
  widthClassName: string;
  onChange: (value: string) => void;
}) {
  return (
    <span className="flex h-7 items-center justify-end gap-1.5">
      <Input
        aria-label={ariaLabel}
        className={cn(numericInputClassName, "h-7", widthClassName)}
        type="number"
        step={step}
        value={numberInputValue(value)}
        disabled={disabled}
        onFocus={selectInputText}
        onChange={(event) => onChange(event.target.value)}
      />
      {suffix ? (
        <span className="min-w-4 text-left text-[length:var(--type-xs)] font-bold text-[var(--le-muted)]">{suffix}</span>
      ) : null}
    </span>
  );
}

function InlineNumberInput({
  value,
  step,
  suffix,
  disabled,
  ariaLabel,
  onChange,
}: {
  value: number;
  step: string;
  suffix?: string;
  disabled?: boolean;
  ariaLabel: string;
  onChange: (value: string) => void;
}) {
  return (
    <span className="flex items-center justify-end gap-1.5">
      <Input
        aria-label={ariaLabel}
        className={cn(numericInputClassName, "h-7")}
        type="number"
        step={step}
        value={numberInputValue(value)}
        disabled={disabled}
        onFocus={selectInputText}
        onChange={(event) => onChange(event.target.value)}
      />
      {suffix ? <span className="min-w-8 text-left text-[length:var(--type-xs)] font-bold text-[var(--le-muted)]">{suffix}</span> : null}
    </span>
  );
}

function feeInputRow(
  label: string,
  field: NumericField,
  stateValue: number,
  resultValue: number,
  updateNumber: (field: NumericField, value: string) => void,
  step: string,
) {
  return {
    kind: "standard" as const,
    label,
    input: (
      <InlineNumberInput
        ariaLabel={`${label} dollars`}
        value={stateValue}
        step={step}
        onChange={(value) => updateNumber(field, value)}
      />
    ),
    value: Number.isFinite(stateValue) ? resultValue : Number.NaN,
  };
}

type FinancialRow = {
  kind?: "standard" | "dual";
  label: string;
  note?: string;
  input: React.ReactNode;
  value: number;
};

function isInteractiveTableTarget(target: EventTarget) {
  return target instanceof Element && Boolean(target.closest("input, button, select, textarea, label, [role='button'], [role='combobox']"));
}

function FinancialTable({
  columns,
  rows,
  footerLabel,
  footerValue,
  footerInsight,
}: {
  columns: string[];
  rows: FinancialRow[];
  footerLabel: string;
  footerValue: number;
  footerInsight?: FieldInsight;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-[length:var(--type-sm)]">
        <thead>
          <tr className="bg-slate-50 text-left text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
            {columns.map((column, index) => (
              <th key={column} className={cn("border-b border-slate-100 px-2 py-1", index > 0 && "text-right")}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            return (
              <tr
                key={row.label}
                className="cursor-text bg-white align-middle hover:bg-blue-50"
                onClick={(event) => {
                  if (isInteractiveTableTarget(event.target)) return;
                  event.currentTarget.querySelector<HTMLInputElement>("input[type='number']:not(:disabled)")?.focus();
                }}
              >
                <td className="border-b border-slate-200 px-2 py-1.5 text-left font-semibold text-[var(--le-ink)]">
                  {row.label}
                  {row.note ? <span className="ml-2 text-[length:var(--type-xs)] font-medium text-[var(--le-muted)]">{row.note}</span> : null}
                </td>
                <td className="border-b border-slate-200 px-2 py-1.5 text-right">{row.input}</td>
                <td className="numeric border-b border-slate-200 px-2 py-1.5 text-right font-mono font-black tabular-nums text-[var(--le-navy)]">
                  {Number.isFinite(row.value) ? <AnimatedValue value={row.value} format="currency" /> : null}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="bg-[var(--le-gold-soft)] text-[var(--le-navy)]">
            <td className="px-2 py-1.5 font-black" colSpan={2}>{footerLabel}</td>
            <td className="numeric px-2 py-1.5 text-right font-mono font-black tabular-nums">
              <ReadOnlyInsight insight={footerInsight} className="ml-auto inline-block rounded-sm">
                <span className="transition-colors group-hover:text-[var(--le-blue)]">{formatCurrency(footerValue)}</span>
              </ReadOnlyInsight>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function SimpleTable({
  rows,
  footer,
  emphasizedRows = [],
}: {
  rows: Array<[string, string]>;
  footer?: [string, string];
  emphasizedRows?: string[];
}) {
  return (
    <table className="w-full border-collapse text-[length:var(--type-sm)]">
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={`${label}-${value}`} className={cn(emphasizedRows.includes(label) && "bg-slate-100")}>
            <td className="border-b border-[var(--le-line)] px-4 py-2.5 text-left align-middle font-semibold text-[var(--le-ink)]">{label}</td>
            <td className="numeric border-b border-[var(--le-line)] px-4 py-2.5 text-right align-middle font-bold text-[var(--le-navy)]">
              {value}
            </td>
          </tr>
        ))}
      </tbody>
      {footer ? (
        <tfoot>
          <tr className="border-t border-slate-200">
            <td className="px-4 py-2.5 text-left align-middle text-[length:var(--type-sm)] font-black text-[var(--le-navy)]">{footer[0]}</td>
            <td className="numeric px-4 py-2.5 text-right align-middle text-[length:var(--type-md)] font-black text-[var(--le-navy)]">{footer[1]}</td>
          </tr>
        </tfoot>
      ) : null}
    </table>
  );
}

function AssetsPieChart({
  data,
  compact = false,
}: {
  data: Array<{ name: string; value: number; color: string }>;
  compact?: boolean;
}) {
  return (
    <div className={cn("grid min-w-0 items-center gap-4", compact ? "grid-cols-1" : "md:grid-cols-[180px_minmax(220px,1fr)]")}>
      <div className={cn("mx-auto", compact ? "h-44 w-full" : "h-44 w-44")}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="82%" paddingAngle={2}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="min-w-[220px] space-y-2 self-center">
        {data.map((item) => (
          <li key={item.name} className="grid grid-cols-[auto_minmax(112px,1fr)_auto] items-center gap-2 text-[length:var(--type-sm)]">
            <span className="h-3 w-3 rounded-sm" style={{ background: item.color }} />
            <span className="whitespace-nowrap font-semibold text-[var(--le-ink)]">{item.name}</span>
            <span className="numeric whitespace-nowrap pl-2 text-right font-black text-[var(--le-navy)]">{formatCurrency(item.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DocumentFrame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <article
      className={cn(
        "print-sheet print-panel mx-auto max-w-[1080px] space-y-5 rounded-md border border-[var(--le-line)] bg-white p-7 shadow-[var(--shadow-soft)]",
        className,
      )}
    >
      {children}
    </article>
  );
}

function ClientHeader({ state, subtitle }: { state: LoanState; subtitle: string }) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-5 border-b-2 border-[var(--le-navy)] pb-5">
      <div>
        <p className="text-[length:var(--type-xs)] font-black uppercase text-[var(--le-gold)]">MLG Home Financial</p>
        <h1 className="mt-1 text-[length:var(--type-2xl)] font-black text-[var(--le-navy)]">FEE SHEET</h1>
        <p className="mt-1 text-[length:var(--type-sm)] font-semibold text-[var(--le-muted)]">{subtitle}</p>
        <p className="mt-3 text-[length:var(--type-sm)] text-[var(--le-muted)]">
          Applicant&apos;s Name: <strong className="text-[var(--le-navy)]">{state.applicantName}</strong>
        </p>
        <p className="text-[length:var(--type-sm)] font-bold text-[var(--le-navy)]">
          {state.foreignOrDomestic === "F" ? "FOREIGN NATIONAL LOAN" : "DOMESTIC LOAN"}
        </p>
      </div>
      <div className="text-right text-[length:var(--type-sm)] text-[var(--le-muted)]">
        <p>Presented by: <strong className="text-[var(--le-navy)]">{state.presentedBy}</strong></p>
        <p>Cell {formatUSPhone(state.cellPhone)}</p>
        <p>Off. {formatUSPhone(state.officePhone)}</p>
        <p>{state.email}</p>
        <p className="mt-2 font-bold text-[var(--le-navy)]">
          NMLS ID {state.nmlsId} · MLO ID {state.mloId}
        </p>
      </div>
    </header>
  );
}

function DocumentSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Calculator;
  children: React.ReactNode;
}) {
  return (
    <section className="print-keep-together rounded-md border border-[var(--le-line)] p-5">
      <h2 className="mb-4 flex items-center gap-2 text-[length:var(--type-lg)] font-black text-[var(--le-navy)]">
        <Icon className="h-5 w-5 text-[var(--le-gold)]" aria-hidden="true" />
        {title}
      </h2>
      {children}
    </section>
  );
}

function Disclaimer({ children, compact = false }: { children: React.ReactNode; compact?: boolean }) {
  return (
    <p
      className={cn(
        "mt-4 border-l-4 border-[var(--le-gold)] bg-[var(--le-gold-soft)] text-[length:var(--type-sm)] font-semibold leading-6 text-[var(--le-ink)]",
        compact ? "px-3 py-2" : "px-4 py-3",
      )}
    >
      {children}
    </p>
  );
}

function SignatureBlock() {
  return (
    <section className="print-signature-block grid gap-6 pt-8 md:grid-cols-[1fr_140px_1fr]">
      <SignatureLine label="Sign (x) - Applicant" />
      <SignatureLine label="Date" />
      <SignatureLine label="Sign (y) - Co-Applicant" />
    </section>
  );
}

function SignatureLine({ label }: { label: string }) {
  return (
    <div className="border-t border-[var(--le-ink)] pt-2 text-[length:var(--type-sm)] font-semibold text-[var(--le-muted)]">
      <Signature className="mr-2 inline h-4 w-4 text-[var(--le-gold)]" aria-hidden="true" />
      {label}
    </div>
  );
}

function ChipGroup({ title, values }: { title: string; values: string[] }) {
  return (
    <div>
      <h3 className="mb-2 text-[length:var(--type-sm)] font-black text-[var(--le-navy)]">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => (
          <Badge key={value} tone="muted">{value}</Badge>
        ))}
      </div>
    </div>
  );
}
