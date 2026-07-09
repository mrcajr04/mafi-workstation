"use client";

import * as Tabs from "@radix-ui/react-tabs";
import { AnimatePresence, motion } from "framer-motion";
import {
  BadgeDollarSign,
  BriefcaseBusiness,
  Calculator,
  ChartNoAxesCombined,
  CheckCircle2,
  FileText,
  Home,
  Landmark,
  LockKeyhole,
  PiggyBank,
  Printer,
  RefreshCcw,
  ShieldCheck,
  Signature,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
  DEFAULT_STATE,
  LoanProgram,
  LoanState,
  calculateLoanEstimate,
  formatCurrency,
  formatNumber,
  formatPercent,
} from "@/lib/loan-estimate-design";
import { formatUSPhone } from "@/lib/phone";
import { cn } from "@/lib/utils";

type TabId = "main" | "costs" | "marketing" | "legal" | "formulas";
type NumericField = {
  [K in keyof LoanState]: LoanState[K] extends number ? K : never;
}[keyof LoanState];
type StringField = {
  [K in keyof LoanState]: LoanState[K] extends string ? K : never;
}[keyof LoanState];

const tabs: Array<{ id: TabId; label: string; icon: typeof Calculator; audience: "internal" | "client" }> = [
  { id: "main", label: "Main To Complete", icon: Calculator, audience: "internal" },
  { id: "costs", label: "Summary Costs", icon: ChartNoAxesCombined, audience: "internal" },
  { id: "marketing", label: "Summary Marketing", icon: FileText, audience: "client" },
  { id: "legal", label: "Marketing Complete Legal Size", icon: Landmark, audience: "client" },
  { id: "formulas", label: "Formula Title", icon: BriefcaseBusiness, audience: "internal" },
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

export default function LoanEstimatePage() {
  const [state, setState] = useState<LoanState>(DEFAULT_STATE);
  const [activeTab, setActiveTab] = useState<TabId>("main");
  const [liveMessage, setLiveMessage] = useState("");
  const results = useMemo(() => calculateLoanEstimate(state), [state]);

  const assetSegments = useMemo(
    () => [
      { name: "Down Payment", value: results.downPayment, color: chartColors.downPayment },
      { name: "Closing Costs", value: results.totalClosingCosts, color: chartColors.closingCosts },
      { name: "Pre-Paid Items", value: results.totalPrepaid, color: chartColors.prepaid },
      { name: "Reserves", value: results.reserves, color: chartColors.reserves },
    ],
    [results],
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
    const nextValue = Number.isFinite(parsed) ? parsed : 0;
    setState((current) => {
      if (Object.is(current[field], nextValue)) return current;
      return { ...current, [field]: nextValue };
    });
  }

  function updateChoice<K extends StringField>(field: K, value: LoanState[K]) {
    setState((current) => ({ ...current, [field]: value }));
  }

  function resetToPulledForwardValues() {
    setState(DEFAULT_STATE);
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

      <header className="mb-5 overflow-hidden rounded-md bg-[var(--le-paper)] shadow-[var(--shadow-soft)] print-panel">
        <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="bg-[var(--le-navy)] p-6 text-white">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-white/10">
                <Home className="h-7 w-7 text-[var(--le-gold-soft)]" aria-hidden="true" />
              </div>
              <div>
                <p className="text-[length:var(--type-xs)] font-bold uppercase text-white/70">MLG Home Financial</p>
                <h1 className="mt-1 text-[length:var(--type-2xl)] font-black text-white">Fee Sheet & Loan Estimate</h1>
                <p className="mt-2 max-w-xl text-[length:var(--type-sm)] text-white/75">
                  Prepared by {state.presentedBy} · NMLS ID {state.nmlsId} · MLO ID {state.mloId}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[var(--le-gold-soft)] p-6">
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
                <p>{state.program} · {formatPercent(state.rate)}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <Tabs.Root value={activeTab} onValueChange={(value) => setActiveTab(value as TabId)}>
        <div className="no-print sticky top-0 z-20 mb-5 flex flex-wrap items-center justify-between gap-2 rounded-md border border-[var(--le-line)] bg-white/92 p-2 shadow-[var(--shadow-soft)] backdrop-blur">
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
          <div className="flex shrink-0 items-center gap-1.5">
            <Button variant="secondary" size="sm" onClick={() => window.print()}>
              <Printer className="h-3.5 w-3.5" aria-hidden="true" />
              Print / PDF
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
                assetSegments={assetSegments}
                updateNumber={updateNumber}
                updateChoice={updateChoice}
                matchComputedDownPayment={matchComputedDownPayment}
              />
            ) : null}
            {activeTab === "costs" ? <SummaryCostsTab state={state} results={results} /> : null}
            {activeTab === "marketing" ? (
              <SummaryMarketingTab state={state} results={results} assetSegments={assetSegments} />
            ) : null}
            {activeTab === "legal" ? <LegalSizeTab state={state} results={results} /> : null}
            {activeTab === "formulas" ? (
              <FormulaTab state={state} results={results} updateNumber={updateNumber} />
            ) : null}
          </motion.div>
        </AnimatePresence>
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
  assetSegments,
  updateNumber,
  updateChoice,
  matchComputedDownPayment,
}: {
  state: LoanState;
  results: ReturnType<typeof calculateLoanEstimate>;
  assetSegments: Array<{ name: string; value: number; color: string }>;
  updateNumber: (field: NumericField, value: string) => void;
  updateChoice: <K extends StringField>(field: K, value: LoanState[K]) => void;
  matchComputedDownPayment: () => void;
}) {
  const monthlyBars = [
    { name: "Principal & Interest", value: results.principalInterest, fill: chartColors.principal },
    { name: "Property Taxes", value: results.monthlyPropertyTax, fill: chartColors.taxes },
    { name: "Hazard Insurance", value: results.monthlyHazard, fill: chartColors.hazard },
    { name: "Flood / HO6", value: results.monthlyFlood, fill: chartColors.flood },
    { name: "HOA / Condo Fee", value: results.monthlyHOA, fill: chartColors.hoa },
  ];

  return (
    <div className="space-y-3">
      <Panel title="Loan Officer & Applicant" icon={Users}>
        <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
          <ReadOnlyField label="Presented By" value={state.presentedBy} />
          <ReadOnlyField label="Cell Phone" value={formatUSPhone(state.cellPhone)} />
          <ReadOnlyField label="Office Phone" value={formatUSPhone(state.officePhone)} />
          <ReadOnlyField label="Email" value={state.email} />
          <ReadOnlyField label="NMLS ID" value={state.nmlsId} />
          <ReadOnlyField label="MLO ID" value={state.mloId} />
          <ReadOnlyField label="Applicant's Name" value={state.applicantName} />
          <ReadOnlyField label="Loan Number" value={state.loanNumber} />
        </div>
      </Panel>

      <Panel title="Purchase & Loan Details" icon={Home}>
        <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-5">
          <Readout label="Purchase Price" value={state.purchasePrice} />
          <NumberField label="Down Payment (%)" field="downPaymentPct" value={state.downPaymentPct} step="0.5" onChange={updateNumber} />
          <Readout label="Down Payment ($)" value={results.downPayment} />
          <Readout label="Loan Amount ($)" value={results.loanAmount} emphasis />
          <Readout label="Loan-to-Value (LTV)" value={results.ltv} format="percent" />
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
          <Readout label="Interest Rate (%)" value={state.rate} format="percent" />
        </div>
      </Panel>

      <Panel title="Closing Costs (Sections 800-1300)" icon={Calculator}>
        <FinancialTable
          columns={["Line", "Input", "Amount"]}
          rows={[
            {
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
              value: results.loanOrigination,
            },
            {
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
              value: results.brokerFee,
            },
            feeInputRow("803. Appraisal Fee & Final Inspection", "appraisalFee", state.appraisalFee, results.appraisalFee, updateNumber, "10"),
            feeInputRow("804. Application Fee (Credit Report)", "applicationFee", state.applicationFee, results.applicationFee, updateNumber, "10"),
            feeInputRow("811. Underwriting Fee", "underwritingFee", state.underwritingFee, results.underwritingFee, updateNumber, "10"),
            feeInputRow("812. Processing Fee", "processingFee", state.processingFee, results.processingFee, updateNumber, "10"),
            feeInputRow("813. Admin Fee (Broker)", "adminFee", state.adminFee, results.adminFee, updateNumber, "10"),
            {
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
              value: results.interestPerDiem,
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
        />
      </Panel>

      <Panel title="Pre-Paid Items" icon={PiggyBank}>
        <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
          <NumberField label="Property Tax Escrow (months)" field="taxMonths" value={state.taxMonths} step="1" onChange={updateNumber} />
          <NumberField label="Annual Property Tax Rate (%)" field="propertyTaxRatePct" value={state.propertyTaxRatePct} step="0.1" onChange={updateNumber} />
          <Readout label="Taxes Escrowed" value={results.taxesEscrow} />
          <NumberField label="Hazard Insurance Escrow ($)" field="hazardInsEscrow" value={state.hazardInsEscrow} step="10" onChange={updateNumber} />
          <NumberField label="Developer Fee - % of Price" field="developFeeContractPct" value={state.developFeeContractPct} step="0.05" onChange={updateNumber} />
          <Readout label="Developer Fee (per contract)" value={results.developFeeContract} />
          <Readout label="Capital Contribution" value={results.capitalContribution} sublabel="2x HOA if New" />
          <NumberField label="Flood / HO6 Insurance - Annual ($)" field="floodHO6Annual" value={state.floodHO6Annual} step="10" onChange={updateNumber} />
        </div>
        <div className="mt-2.5 grid gap-2.5 md:grid-cols-2">
          <StatCard label="Total Pre-Paid Items" value={results.totalPrepaid} />
          <StatCard label="Closing + Pre-Paid" value={results.totalClosingAndPrepaid} />
        </div>
      </Panel>

      <Panel title="Monthly Payment" icon={BadgeDollarSign}>
        <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
          <NumberField label="Hazard Insurance - Annual ($, SFR)" field="hazardInsAnnual" value={state.hazardInsAnnual} step="10" onChange={updateNumber} />
          <NumberField label="HOA / Condo Fee - Monthly ($)" field="hoaMonthly" value={state.hoaMonthly} step="10" onChange={updateNumber} />
          <Readout label="Principal & Interest" value={results.principalInterest} />
          <Readout label="Property Taxes / Month" value={results.monthlyPropertyTax} />
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
          <StatCard label="Total Monthly Payment" value={results.totalMonthlyPayment} emphasis />
        </div>
      </Panel>

      <Panel title="Cash to Close & Reserves" icon={ShieldCheck} showComputedBadge={false}>
        <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
          <NumberField label="Seller Credit ($)" field="sellerCredit" value={state.sellerCredit} step="100" onChange={updateNumber} />
          <NumberField label="Other Credits ($)" field="otherCredits" value={state.otherCredits} step="100" onChange={updateNumber} />
          <div className="space-y-2">
            <NumberField
              label="Down Payment Given to Seller ($)"
              field="downPaymentGivenToSeller"
              value={state.downPaymentGivenToSeller}
              step="100"
              onChange={updateNumber}
            />
            <Button size="sm" onClick={matchComputedDownPayment}>
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Match computed down payment
            </Button>
          </div>
          <NumberField label="Reserve Months" field="reserveMonths" value={state.reserveMonths} step="1" onChange={updateNumber} />
        </div>
        <div className="cash-assets-row mt-5 grid items-start gap-5 lg:grid-cols-2">
          <AssetsPieChart data={assetSegments} />
          <div className="cash-stat-grid grid items-stretch gap-3 md:grid-cols-3">
            <StatCard label="Total Cash to Close" value={results.totalCashToClose} tight />
            <StatCard label={`Reserves (${formatNumber(results.reserveMonths)} mo.)`} value={results.reserves} tight />
            <StatCard label="Total Assets Required" value={results.totalAssetsRequired} accent tight />
          </div>
        </div>
        <Disclaimer compact>
          These figures are estimates. Actual charges may be more or less and are not a commitment to lend.
        </Disclaimer>
      </Panel>
    </div>
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
          <StatCard label="Purchase Price" value={results.purchasePrice} compact />
          <StatCard label="Down Payment" value={results.downPayment} compact />
          <StatCard label="Loan Amount" value={results.loanAmount} compact />
          <StatCard label="LTV" value={results.ltv} format="percent" compact />
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
            ["Down Payment", formatCurrency(results.downPayment)],
            ["Total Closing + Pre-Paid", formatCurrency(results.totalClosingAndPrepaid)],
            ["Down Payment Given to Seller", formatCurrency(results.downPaymentGivenToSeller)],
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
  assetSegments,
}: {
  state: LoanState;
  results: ReturnType<typeof calculateLoanEstimate>;
  assetSegments: Array<{ name: string; value: number; color: string }>;
}) {
  const renderBreakdownContent = () => (
    <div className="print-breakdown-content mt-4 grid gap-5 lg:grid-cols-2">
      <SimpleTable
        rows={[
          ["Total Closing Costs", formatCurrency(results.totalClosingCosts)],
          ["Total Pre-Paid Items", formatCurrency(results.totalPrepaid)],
          ["Seller Credit", formatCurrency(results.sellerCredit)],
          ["Other Credits", formatCurrency(results.otherCredits)],
          ["Down Payment Given to Seller", formatCurrency(results.downPaymentGivenToSeller)],
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
    <DocumentFrame>
      <ClientHeader state={state} subtitle="Borrower Fee Sheet Summary" />
      <section className="print-client-section print-keep-together grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-md border border-[var(--le-line)] p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[length:var(--type-xs)] font-bold uppercase text-[var(--le-muted)]">Total Assets Required</p>
              <AnimatedValue
                value={results.totalAssetsRequired}
                format="currency"
                className="numeric mt-2 block text-[length:var(--type-3xl)] font-black text-[var(--le-navy)]"
              />
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-[var(--le-gold-soft)] text-[var(--le-gold)]">
              <ShieldCheck className="h-7 w-7" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Badge tone="gold">Estimate</Badge>
            <Badge tone="danger">Rate Not Locked</Badge>
          </div>
          <Disclaimer>
            The information provided reflects estimates of charges you are likely to incur at settlement. Fees may be
            more or less and this is not a commitment to lend.
          </Disclaimer>
        </div>

        <div className="rounded-md border border-[var(--le-line)] p-5">
          <h2 className="mb-4 flex items-center gap-2 text-[length:var(--type-lg)] font-black text-[var(--le-navy)]">
            <Home className="h-5 w-5" aria-hidden="true" />
            Loan Information
          </h2>
          <SimpleTable
            rows={[
              ["Applicant", state.applicantName],
              ["Loan Type", state.foreignOrDomestic === "F" ? "Foreign National Loan" : "Domestic Loan"],
              ["Purchase Price", formatCurrency(results.purchasePrice)],
              ["Down Payment", formatCurrency(results.downPayment)],
              ["Loan Amount", formatCurrency(results.loanAmount)],
              ["LTV", formatPercent(results.ltv)],
              ["Program", state.program],
              ["Rate", formatPercent(state.rate)],
            ]}
          />
        </div>
      </section>

      <section className="print-client-section print-keep-together grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="rounded-md border border-[var(--le-line)] p-5">
          <h2 className="mb-4 flex items-center gap-2 text-[length:var(--type-lg)] font-black text-[var(--le-navy)]">
            <BadgeDollarSign className="h-5 w-5" aria-hidden="true" />
            Monthly Payment Summary
          </h2>
          <SimpleTable
            rows={[
              ["Principal & Interest", formatCurrency(results.principalInterest)],
              ["Property Taxes", formatCurrency(results.monthlyPropertyTax)],
              ["Hazard Insurance", formatCurrency(results.monthlyHazard)],
              ["Flood / HO6", formatCurrency(results.monthlyFlood)],
              ["HOA / Condo Fee", formatCurrency(results.monthlyHOA)],
            ]}
            footer={["Total Monthly Payment", formatCurrency(results.totalMonthlyPayment)]}
          />
        </div>
        <div className="rounded-md border border-[var(--le-line)] p-5">
          <AssetsPieChart data={assetSegments} compact />
        </div>
      </section>

      <details className="screen-full-breakdown print-client-section rounded-md border border-[var(--le-line)] p-5">
        <summary className="cursor-pointer text-[length:var(--type-sm)] font-black uppercase text-[var(--le-navy)]">
          View full breakdown
        </summary>
        {renderBreakdownContent()}
      </details>

      <section className="print-full-breakdown print-client-section hidden rounded-md border border-[var(--le-line)] p-5">
        {renderBreakdownContent()}
      </section>

      <SignatureBlock />
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
              ["Purchased Price", formatCurrency(results.purchasePrice)],
              ["Down Payment", formatCurrency(results.downPayment)],
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
                ["Down Payment Given to Seller", formatCurrency(results.downPaymentGivenToSeller)],
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
          <NumberField label="Low-Value Threshold ($)" field="lowThreshold" value={state.lowThreshold} step="100" onChange={updateNumber} />
          <NumberField label="Flat Fee Below Threshold ($)" field="lowFlatFee" value={state.lowFlatFee} step="10" onChange={updateNumber} />
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
                      className="numeric text-right"
                      type="number"
                      step="1000"
                      value={state[capField]}
                      aria-label={`Tier ${tier} cap`}
                      onChange={(event) => updateNumber(capField, event.target.value)}
                    />
                  </td>
                  <td className="border-b border-[var(--le-line)] px-3 py-2">
                    <Input
                      className="numeric text-right"
                      type="number"
                      step="0.05"
                      value={state[rateField]}
                      aria-label={`Tier ${tier} rate`}
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
          rows={[
            ["Down Payment", `Purchase Price x Down Payment % = ${formatCurrency(results.downPayment)}`],
            ["Loan Amount", `Purchase Price - Down Payment = ${formatCurrency(results.loanAmount)}`],
            ["LTV", `Loan Amount / Purchase Price = ${formatPercent(results.ltv)}`],
            ["Loan Origination", `% of loan amount or flat fee = ${formatCurrency(results.loanOrigination)}`],
            ["Broker Fee", `% of loan amount or flat fee = ${formatCurrency(results.brokerFee)}`],
            ["Per-Diem Interest", `(Loan Amount x Rate / 365) x Days = ${formatCurrency(results.interestPerDiem)}`],
            ["Fixed Loan Costs", `Origination + Broker + Appraisal + Application + Underwriting + Processing + Admin = ${formatCurrency(results.fixedLoanCosts)}`],
            ["Fixed Title Costs", `Title and recording line items = ${formatCurrency(results.fixedTitleCosts)}`],
            ["Total Closing Costs", `Fixed Loan Costs + Fixed Title Costs = ${formatCurrency(results.totalClosingCosts)}`],
            ["Total Pre-Paid Items", `Taxes + escrow + developer fee + capital contribution + insurance + interest = ${formatCurrency(results.totalPrepaid)}`],
            ["Total Cash to Close", `Down Payment + Closing + Prepaids - Credits = ${formatCurrency(results.totalCashToClose)}`],
            ["Principal & Interest", `Amortized payment, or interest-only when program = IO = ${formatCurrency(results.principalInterest)}`],
            ["Total Monthly Payment", `P&I + Taxes + Hazard + Flood/HO6 + HOA = ${formatCurrency(results.totalMonthlyPayment)}`],
            ["Reserves", `Total Monthly Payment x Reserve Months = ${formatCurrency(results.reserves)}`],
            ["Total Assets Required", `Total Cash to Close + Reserves = ${formatCurrency(results.totalAssetsRequired)}`],
          ]}
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
        dense ? "p-2.5" : "p-3",
      )}
    >
      <div className="mb-2.5 flex items-center justify-between gap-2.5 border-b border-slate-100 pb-2">
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
    <div className="space-y-1">
      <Label htmlFor={field}>{label}</Label>
      <Input
        id={field}
        className="numeric text-right"
        type="number"
        inputMode="decimal"
        step={step}
        value={value}
        onChange={(event) => onChange(field, event.target.value)}
      />
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
    <div className="space-y-1">
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

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <Label>{label}</Label>
        <LockKeyhole className="h-3 w-3 text-[var(--le-teal)]" aria-hidden="true" />
      </div>
      <p className="flex h-7 w-full items-center justify-end truncate rounded-md border border-[var(--le-navy-soft)] bg-[var(--le-panel)] px-2 text-right text-[length:var(--type-sm)] font-semibold text-[var(--le-navy)] shadow-sm">
        {value}
      </p>
    </div>
  );
}

function Readout({
  label,
  value,
  format = "currency",
  sublabel,
  emphasis = false,
}: {
  label: string;
  value: number;
  format?: "currency" | "percent";
  sublabel?: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-md border bg-[var(--le-panel)] p-2",
        emphasis ? "border-[var(--le-blue)] bg-white shadow-sm" : "border-[var(--le-navy-soft)]",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <Label>{label}</Label>
        <LockKeyhole className="h-3 w-3 text-[var(--le-teal)]" aria-hidden="true" />
      </div>
      <AnimatedValue
        value={value}
        format={format}
        className={cn(
          "numeric mt-1 block text-right font-black",
          emphasis ? "text-[length:var(--type-xl)] text-[var(--le-blue)]" : "text-[length:var(--type-md)] text-[var(--le-navy)]",
        )}
      />
      {sublabel ? <p className="mt-1 text-right text-[length:var(--type-xs)] text-[var(--le-muted)]">{sublabel}</p> : null}
    </div>
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
}: {
  label: string;
  value?: number;
  textValue?: string;
  format?: "currency" | "percent";
  accent?: boolean;
  emphasis?: boolean;
  compact?: boolean;
  tight?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={cn(
        "rounded-md border p-4",
        accent
          ? "border-[var(--le-gold)] bg-[var(--le-gold-soft)] shadow-sm"
          : "border-[var(--le-line)] bg-[var(--le-panel)]",
        compact && "p-3",
        tight && "p-3",
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      {textValue ? (
        <p className="mt-2 text-right text-[length:var(--type-md)] font-black text-[var(--le-navy)]">{textValue}</p>
      ) : (
        <AnimatedValue
          value={value ?? 0}
          format={format}
          className={cn(
            "mt-2 block text-right font-black",
            accent ? "text-[var(--le-blue)]" : "text-[var(--le-navy)]",
            emphasis || accent ? "text-[length:var(--type-2xl)]" : "text-[length:var(--type-xl)]",
            tight && (accent ? "text-[length:var(--type-xl)]" : "text-[length:var(--type-lg)]"),
          )}
        />
      )}
    </motion.div>
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
        className={cn("numeric h-7 text-right", widthClassName)}
        type="number"
        step={step}
        value={value}
        disabled={disabled}
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
        className="numeric h-7 text-right"
        type="number"
        step={step}
        value={value}
        disabled={disabled}
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
    label,
    input: (
      <InlineNumberInput
        ariaLabel={`${label} dollars`}
        value={stateValue}
        step={step}
        onChange={(value) => updateNumber(field, value)}
      />
    ),
    value: resultValue,
  };
}

function FinancialTable({
  columns,
  rows,
  footerLabel,
  footerValue,
}: {
  columns: string[];
  rows: Array<{ label: string; note?: string; input: React.ReactNode; value: number }>;
  footerLabel: string;
  footerValue: number;
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
          {rows.map((row) => (
            <tr key={row.label} className="align-middle even:bg-slate-50/40">
              <td className="border-b border-slate-100 px-2 py-1 text-left font-semibold text-[var(--le-ink)]">
                {row.label}
                {row.note ? <span className="ml-2 text-[length:var(--type-xs)] font-medium text-[var(--le-muted)]">{row.note}</span> : null}
              </td>
              <td className="border-b border-slate-100 px-2 py-1 text-right">{row.input}</td>
              <td className="numeric border-b border-slate-100 px-2 py-1 text-right font-mono font-black tabular-nums text-[var(--le-navy)]">
                <AnimatedValue value={row.value} format="currency" />
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-[var(--le-gold-soft)] text-[var(--le-navy)]">
            <td className="px-2 py-1.5 font-black" colSpan={2}>{footerLabel}</td>
            <td className="numeric px-2 py-1.5 text-right font-mono font-black tabular-nums">{formatCurrency(footerValue)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function SimpleTable({
  rows,
  footer,
}: {
  rows: Array<[string, string]>;
  footer?: [string, string];
}) {
  return (
    <table className="w-full border-collapse text-[length:var(--type-sm)]">
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={`${label}-${value}`}>
            <td className="border-b border-[var(--le-line)] px-0 py-2.5 font-semibold text-[var(--le-ink)]">{label}</td>
            <td className="numeric border-b border-[var(--le-line)] px-0 py-2.5 text-right font-bold text-[var(--le-navy)]">
              {value}
            </td>
          </tr>
        ))}
      </tbody>
      {footer ? (
        <tfoot>
          <tr>
            <td className="pt-3 text-[length:var(--type-sm)] font-black text-[var(--le-navy)]">{footer[0]}</td>
            <td className="numeric pt-3 text-right text-[length:var(--type-md)] font-black text-[var(--le-navy)]">{footer[1]}</td>
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
    <div className={cn("grid items-center gap-4", compact ? "grid-cols-1" : "md:grid-cols-[180px_minmax(220px,1fr)]")}>
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
      <ul className="min-w-[220px] space-y-2">
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
