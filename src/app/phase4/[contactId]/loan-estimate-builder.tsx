"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import {
  Printer,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
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
  calculateLoanEstimate,
  type LoanEstimateResult,
  type LoanEstimateState,
} from "@/lib/loan-estimate-calc";
import {
  currencyInputToRaw,
  formatCurrencyDisplay,
  formatCurrencyDisplayWithCents,
  formatCurrencyInput,
  formatInterestRateDisplay,
  formatRatioPercentDisplay,
} from "@/lib/currency";
import { generateLoanEstimatePdf } from "@/lib/actions/loan-estimate-actions";
import { cn } from "@/lib/utils";

type LoanEstimateBuilderProps = {
  contactId: string;
  initialDownloadUrl?: string;
  initialGeneratedAt?: string;
  initialState: LoanEstimateState;
};

type LoanEstimateTab =
  | "main"
  | "summary-costs"
  | "summary-marketing"
  | "legal"
  | "formula-title";

const tabs: Array<{ id: LoanEstimateTab; label: string }> = [
  { id: "main", label: "Main To Complete" },
  { id: "summary-costs", label: "Summary Costs" },
  { id: "summary-marketing", label: "Summary Marketing" },
  { id: "legal", label: "Marketing Complete Legal Size" },
  { id: "formula-title", label: "Formula Title" },
];

const assetChartColors = ["#3676C2", "#F79A0F", "#2E9D63", "#2F9E9A"];

const readOnlySourceFields = new Set<keyof LoanEstimateState>([
  "applicantName",
  "cellPhone",
  "email",
  "hazardInsAnnual",
  "hoaMonthly",
  "officePhone",
  "presentedBy",
  "program",
  "propertyTaxRatePct",
  "purchasePrice",
  "rate",
]);

const currencyInputFields = new Set<keyof LoanEstimateState>([
  "adminFee",
  "appraisalFee",
  "applicationFee",
  "brokerFeeFlatFee",
  "cityTaxStamps",
  "downPaymentGivenToSeller",
  "endorsements",
  "floodHO6Annual",
  "floodZoneCertFee",
  "hazardInsAnnual",
  "hazardInsEscrow",
  "hoaMonthly",
  "lowFlatFee",
  "lowThreshold",
  "miscFilingFee",
  "miscTitleFee",
  "originationFlatFee",
  "otherCredits",
  "processingFee",
  "purchasePrice",
  "recordingFees",
  "sellerCredit",
  "settlementFee",
  "stampsOnDeed",
  "stateTaxStamps",
  "surveyFee",
  "tier1Cap",
  "tier2Cap",
  "tier3Cap",
  "tier4Cap",
  "tier5Cap",
  "tier6Cap",
  "titleInsuranceFee",
  "titleSearchFee",
  "transamericaFee",
  "underwritingFee",
]);

const percentInputFields = new Set<keyof LoanEstimateState>([
  "brokerFeePct",
  "developFeeContractPct",
  "downPaymentPct",
  "originationPct",
  "propertyTaxRatePct",
  "rate",
  "tier1Rate",
  "tier2Rate",
  "tier3Rate",
  "tier4Rate",
  "tier5Rate",
  "tier6Rate",
]);

const referenceLookups = [
  {
    label: "Occupancy",
    values: ["Primary", "Second Home", "Investment", "Other"],
  },
  {
    label: "Programs",
    values: [
      "30 YR FIXED",
      "15 YR FIXED",
      "1/1 ARM",
      "3/1 ARM",
      "5/1 ARM",
      "7/1 ARM",
      "10/1 ARM",
      "IO",
    ],
  },
  {
    label: "Loan Category",
    values: ["Domestic", "Foreign National"],
  },
  {
    label: "Property Types",
    values: ["Condo", "Condo-Hotel", "Single Family", "Commercial"],
  },
];

export function LoanEstimateBuilder({
  contactId,
  initialDownloadUrl,
  initialGeneratedAt,
  initialState,
}: LoanEstimateBuilderProps) {
  const [activeTab, setActiveTab] = useState<LoanEstimateTab>("main");
  const [downloadUrl, setDownloadUrl] = useState(initialDownloadUrl);
  const [generatedAt, setGeneratedAt] = useState(initialGeneratedAt);
  const [isGenerating, startGenerationTransition] = useTransition();
  const [state, setState] = useState(initialState);
  const result = useMemo(() => calculateLoanEstimate(state), [state]);
  const assetSegments = getAssetSegments(result);

  function updateField<Key extends keyof LoanEstimateState>(
    key: Key,
    value: LoanEstimateState[Key],
  ) {
    if (readOnlySourceFields.has(key)) {
      return;
    }

    setState((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function resetEditableFields() {
    setState((current) => {
      const nextState = { ...current };

      for (const key of Object.keys(initialState) as Array<
        keyof LoanEstimateState
      >) {
        if (!readOnlySourceFields.has(key)) {
          Object.assign(nextState, { [key]: initialState[key] });
        }
      }

      return nextState;
    });
  }

  function printAndSavePdf() {
    const capturedState = { ...state };

    startGenerationTransition(async () => {
      const generationResult = await generateLoanEstimatePdf(
        contactId,
        capturedState,
      );

      if (!generationResult.success) {
        toast.error(generationResult.error);
        return;
      }

      setGeneratedAt(generationResult.data.generatedAt);
      setDownloadUrl(generationResult.data.downloadUrl);
      toast.success("Loan Estimate PDF saved.");
      window.print();
    });
  }

  return (
    <div className="loan-estimate-builder-shell space-y-5">
      <style jsx global>{`
        .loan-estimate-builder-shell .loan-estimate-print-card {
          box-shadow: 0 2px 12px rgba(54, 118, 194, 0.1);
        }

        @media print {
          @page {
            size: letter;
            margin: 0.5in;
          }

          .loan-estimate-builder-shell {
            max-width: none !important;
          }

          .loan-estimate-no-print {
            display: none !important;
          }

          .loan-estimate-print-card {
            box-shadow: none !important;
            break-inside: avoid;
          }

          .loan-estimate-legal-print {
            width: 8.5in;
            min-height: 14in;
            margin: 0 auto;
          }

          body:has(.loan-estimate-legal-print) {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      <div className="loan-estimate-no-print space-y-3">
        <div
          aria-label="Loan estimate tabs"
          className="flex gap-2 overflow-x-auto"
          role="tablist"
        >
          {tabs.map((tab) => (
            <button
              aria-controls={`loan-estimate-panel-${tab.id}`}
              aria-selected={activeTab === tab.id}
              className={cn(
                "shrink-0 rounded-lg border px-3 py-2 text-sm font-semibold transition",
                activeTab === tab.id
                  ? "border-mafi-blue-primary bg-mafi-blue-primary text-white"
                  : "border-mafi-border bg-mafi-bg-white text-mafi-text-mid hover:border-mafi-blue-primary hover:text-mafi-blue-primary",
              )}
              id={`loan-estimate-tab-${tab.id}`}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-mafi-text-mid">
            {generatedAt ? (
              <p>
                Last generated: {generatedAt}
                {downloadUrl ? (
                  <>
                    {" "}
                    /{" "}
                    <a
                      className="font-semibold text-mafi-blue-primary underline underline-offset-4"
                      href={downloadUrl}
                      rel="noopener"
                      target="_blank"
                    >
                      View stored PDF
                    </a>
                  </>
                ) : null}
              </p>
            ) : (
              <p>No stored Loan Estimate PDF generated yet.</p>
            )}
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <Button
              onClick={resetEditableFields}
              type="button"
              variant="outline"
            >
              <RotateCcw className="size-4" />
              Reset to pulled-forward values
            </Button>
            <Button
              disabled={isGenerating}
              onClick={printAndSavePdf}
              type="button"
            >
              <Printer className="size-4" />
              {isGenerating ? "Saving PDF..." : "Print / Save as PDF"}
            </Button>
          </div>
        </div>
      </div>

      <section
        aria-labelledby={`loan-estimate-tab-${activeTab}`}
        id={`loan-estimate-panel-${activeTab}`}
        role="tabpanel"
      >
        {activeTab === "main" ? (
          <MainTab
            assetSegments={assetSegments}
            onChange={updateField}
            result={result}
            state={state}
          />
        ) : null}
        {activeTab === "summary-costs" ? (
          <SummaryCostsTab assetSegments={assetSegments} result={result} state={state} />
        ) : null}
        {activeTab === "summary-marketing" ? (
          <SummaryMarketingTab
            assetSegments={assetSegments}
            result={result}
            state={state}
          />
        ) : null}
        {activeTab === "legal" ? (
          <LegalSizeTab result={result} state={state} />
        ) : null}
        {activeTab === "formula-title" ? (
          <FormulaTitleTab onChange={updateField} result={result} state={state} />
        ) : null}
      </section>
    </div>
  );
}

function MainTab({
  assetSegments,
  onChange,
  result,
  state,
}: {
  assetSegments: Array<{ label: string; value: number }>;
  onChange: <Key extends keyof LoanEstimateState>(
    key: Key,
    value: LoanEstimateState[Key],
  ) => void;
  result: LoanEstimateResult;
  state: LoanEstimateState;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="loan-estimate-print-card border-mafi-border bg-mafi-bg-white">
          <CardHeader className="border-b border-mafi-border bg-mafi-bg-light">
            <HeaderTitle>
              Loan Officer & Applicant
            </HeaderTitle>
          </CardHeader>
          <CardContent className="grid content-start gap-3 pt-4 md:grid-cols-2">
            <TextField
              label="Presented by"
              name="presentedBy"
              onChange={onChange}
              readOnly
              value={state.presentedBy}
            />
            <TextField
              label="Applicant name"
              name="applicantName"
              onChange={onChange}
              readOnly
              value={state.applicantName}
            />
            <TextField
              label="Cell phone"
              name="cellPhone"
              onChange={onChange}
              readOnly
              value={state.cellPhone}
            />
            <TextField
              label="Office phone"
              name="officePhone"
              onChange={onChange}
              readOnly
              value={state.officePhone}
            />
            <TextField
              label="Email"
              name="email"
              onChange={onChange}
              readOnly
              value={state.email}
            />
            <TextField
              label="Loan number"
              name="loanNumber"
              onChange={onChange}
              value={state.loanNumber}
            />
          </CardContent>
        </Card>

        <Card className="loan-estimate-print-card border-mafi-border bg-mafi-bg-white">
          <CardHeader className="border-b border-mafi-border bg-mafi-bg-light">
            <HeaderTitle>
              Purchase & Loan Details
            </HeaderTitle>
          </CardHeader>
          <CardContent className="grid gap-3 pt-4 md:grid-cols-3">
            <TextField
              label="Purchase price"
              name="purchasePrice"
              onChange={onChange}
              readOnly
              value={state.purchasePrice}
            />
            <TextField
              label="Down payment %"
              name="downPaymentPct"
              onChange={onChange}
              value={state.downPaymentPct}
            />
            <TextField
              label="Rate"
              name="rate"
              onChange={onChange}
              readOnly
              value={state.rate}
            />
            <SelectField
              label="SFR or Condo"
              name="sfrOrCondo"
              onChange={onChange}
              options={[
                ["condo", "Condo"],
                ["sfr", "SFR"],
              ]}
              value={state.sfrOrCondo}
            />
            <SelectField
              label="Property type"
              name="propertyType"
              onChange={onChange}
              options={[
                ["CONDO", "Condo"],
                ["CONDO-HOTEL", "Condo-Hotel"],
                ["SINGLE FAMILY", "Single Family"],
                ["COMMERCIAL", "Commercial"],
              ]}
              value={state.propertyType}
            />
            <SelectField
              label="Occupancy"
              name="occupancy"
              onChange={onChange}
              options={[
                ["PRIMARY", "Primary"],
                ["SECOND HOME", "Second Home"],
                ["INVESTMENT", "Investment"],
                ["OTHER", "Other"],
              ]}
              value={state.occupancy}
            />
            <SelectField
              label="Loan category"
              name="foreignOrDomestic"
              onChange={onChange}
              options={[
                ["D", "Domestic"],
                ["F", "Foreign National"],
              ]}
              value={state.foreignOrDomestic}
            />
            <SelectField
              label="Program"
              name="program"
              onChange={onChange}
              options={[
                ["30 YR FIXED", "30 YR FIXED"],
                ["15 YR FIXED", "15 YR FIXED"],
                ["1/1 ARM", "1/1 ARM"],
                ["3/1 ARM", "3/1 ARM"],
                ["5/1 ARM", "5/1 ARM"],
                ["7/1 ARM", "7/1 ARM"],
                ["10/1 ARM", "10/1 ARM"],
                ["IO", "IO"],
              ]}
              readOnly
              value={state.program}
            />
            <SelectField
              label="New or used"
              name="newOrUsed"
              onChange={onChange}
              options={[
                ["New", "New"],
                ["Used", "Used"],
              ]}
              value={state.newOrUsed}
            />
            <OutputTile
              label="Down payment"
              value={formatWholeCurrency(result.downPayment)}
            />
            <OutputTile
              label="Loan amount"
              value={formatWholeCurrency(result.loanAmount)}
            />
            <OutputTile label="LTV" value={formatRatioPercentDisplay(result.ltv)} />
          </CardContent>
        </Card>
      </div>

      <ClosingCostsSection
        onChange={onChange}
        result={result}
        state={state}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <PrePaidSection onChange={onChange} result={result} state={state} />
        <MonthlyPaymentSection
          onChange={onChange}
          result={result}
          state={state}
        />
      </div>

      <CashToCloseSection
        assetSegments={assetSegments}
        onChange={onChange}
        result={result}
        state={state}
      />
    </div>
  );
}

function SummaryCostsTab({
  assetSegments,
  result,
  state,
}: {
  assetSegments: Array<{ label: string; value: number }>;
  result: LoanEstimateResult;
  state: LoanEstimateState;
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="space-y-5">
        <Card className="loan-estimate-print-card border-mafi-border bg-mafi-bg-white">
          <CardHeader className="border-b border-mafi-border bg-mafi-bg-light">
            <HeaderTitle>
              Loan Snapshot
            </HeaderTitle>
          </CardHeader>
          <CardContent className="grid gap-3 pt-5 md:grid-cols-4">
            <OutputTile label="Applicant" value={state.applicantName || "Not provided"} />
            <OutputTile label="Loan number" value={state.loanNumber || "Not provided"} />
            <OutputTile label="Program" value={state.program} />
            <OutputTile label="Rate" value={formatInterestRateDisplay(state.rate)} />
            <OutputTile
              label="Purchase price"
              value={formatWholeCurrency(result.purchasePrice)}
            />
            <OutputTile
              label="Loan amount"
              value={formatWholeCurrency(result.loanAmount)}
            />
            <OutputTile label="LTV" value={formatRatioPercentDisplay(result.ltv)} />
            <OutputTile label="Loan type" value={loanTypeLabel(state)} />
          </CardContent>
        </Card>

        <Card className="loan-estimate-print-card border-mafi-border bg-mafi-bg-white">
          <CardHeader className="border-b border-mafi-border bg-mafi-bg-light">
            <HeaderTitle>
              Monthly Payment
            </HeaderTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <SummaryTable
              rows={[
                ["Principal & Interest", result.principalInterest],
                ["Property Taxes", result.monthlyPropertyTax],
                ["Hazard Insurance", result.monthlyHazard],
                ["Flood / HO6", result.monthlyFlood],
                ["HOA / Condo Fee", result.monthlyHOA],
                ["Total Monthly Payment", result.totalMonthlyPayment, true],
              ]}
            />
          </CardContent>
        </Card>

        <Card className="loan-estimate-print-card border-mafi-border bg-mafi-bg-white">
          <CardHeader className="border-b border-mafi-border bg-mafi-bg-light">
            <HeaderTitle emphasis>
              Closing Costs, Prepaids & Credits
            </HeaderTitle>
          </CardHeader>
          <CardContent className="grid gap-5 pt-5 lg:grid-cols-2">
            <SummaryTable
              rows={[
                ["Loan costs", result.fixedLoanCosts],
                ["Title costs", result.fixedTitleCosts],
                ["Total closing costs", result.totalClosingCosts, true],
                ["Taxes escrow", result.taxesEscrow],
                ["Developer fee", result.developFeeContract],
                ["Capital contribution", result.capitalContribution],
                ["Total pre-paid", result.totalPrepaid, true],
              ]}
            />
            <SummaryTable
              rows={[
                ["Down payment", result.downPayment],
                ["Closing & pre-paid", result.totalClosingAndPrepaid],
                ["Down payment given to seller", -result.downPaymentGivenToSeller],
                ["Seller credit", -result.sellerCredit],
                ["Other credits", -result.otherCredits],
                ["Total cash to close", result.totalCashToClose, true],
                ["Reserves", result.reserves],
                ["Total assets required", result.totalAssetsRequired, true],
              ]}
            />
          </CardContent>
        </Card>
      </div>

      <AssetsRequiredSidebar assetSegments={assetSegments} result={result} />
    </div>
  );
}

function SummaryMarketingTab({
  assetSegments,
  result,
  state,
}: {
  assetSegments: Array<{ label: string; value: number }>;
  result: LoanEstimateResult;
  state: LoanEstimateState;
}) {
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <MarketingHeader state={state} title="Loan Estimate Summary" />
      <div className="grid gap-5 lg:grid-cols-3">
        <MarketingStat label="Purchase Price" value={formatWholeCurrency(result.purchasePrice)} />
        <MarketingStat label="Loan Amount" value={formatWholeCurrency(result.loanAmount)} />
        <MarketingStat label="Total Monthly Payment" value={formatCentsCurrency(result.totalMonthlyPayment)} />
      </div>
      <Card className="loan-estimate-print-card border-mafi-border bg-mafi-bg-white">
        <CardContent className="grid gap-6 pt-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-5">
            <section>
              <h2 className="text-xl font-semibold text-mafi-blue-primary">
                Monthly Payment Summary
              </h2>
              <SummaryTable
                rows={[
                  ["Principal & Interest", result.principalInterest],
                  ["Taxes", result.monthlyPropertyTax],
                  ["Insurance", result.monthlyHazard + result.monthlyFlood],
                  ["HOA / Condo Fee", result.monthlyHOA],
                  ["Total Monthly Payment", result.totalMonthlyPayment, true],
                ]}
              />
            </section>
            <section>
              <h2 className="text-xl font-semibold text-mafi-blue-primary">
                Cash Required Summary
              </h2>
              <SummaryTable
                rows={[
                  ["Down Payment", result.downPayment],
                  ["Closing Costs", result.totalClosingCosts],
                  ["Pre-Paid Items", result.totalPrepaid],
                  ["Reserves", result.reserves],
                  ["Total Assets Required", result.totalAssetsRequired, true],
                ]}
              />
            </section>
          </div>
          <AssetDonut assetSegments={assetSegments} />
        </CardContent>
      </Card>
      <CompanyFooter />
      <SignatureLines />
    </div>
  );
}

function LegalSizeTab({
  result,
  state,
}: {
  result: LoanEstimateResult;
  state: LoanEstimateState;
}) {
  return (
    <div className="loan-estimate-legal-print mx-auto max-w-5xl space-y-5">
      <MarketingHeader state={state} title="Complete Loan Estimate Fee Sheet" />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="loan-estimate-print-card border-mafi-border bg-mafi-bg-white">
          <CardHeader className="border-b border-mafi-border bg-mafi-bg-light">
            <HeaderTitle size="lg">
              Fixed Loan Costs
            </HeaderTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <SummaryTable
              rows={[
                ["Appraisal Fee", result.appraisalFee],
                ["Application Fee", result.applicationFee],
                ["Loan Origination", result.loanOrigination],
                ["Broker Fee", result.brokerFee],
                ["Underwriting Fee", result.underwritingFee],
                ["Processing Fee", result.processingFee],
                ["Admin Fee", result.adminFee],
                ["Fixed Loan Costs", result.fixedLoanCosts, true],
              ]}
            />
          </CardContent>
        </Card>
        <Card className="loan-estimate-print-card border-mafi-border bg-mafi-bg-white">
          <CardHeader className="border-b border-mafi-border bg-mafi-bg-light">
            <HeaderTitle size="lg">
              Fixed Title Costs
            </HeaderTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <SummaryTable
              rows={[
                ["Settlement Fee", result.settlementFee],
                ["Title Search Fee", result.titleSearchFee],
                ["Misc Title Fee", result.miscTitleFee],
                ["Title Insurance Fee", result.titleInsuranceFee],
                ["Endorsements", result.endorsements],
                ["Recording Fees", result.recordingFees],
                ["City Tax Stamps", result.cityTaxStamps],
                ["State Tax Stamps", result.stateTaxStamps],
                ["Stamps on Deed", result.stampsOnDeed],
                ["Survey Fee", result.surveyFee],
                ["Transamerica Fee", result.transamericaFee],
                ["Flood Zone Cert Fee", result.floodZoneCertFee],
                ["Misc Filing Fee", result.miscFilingFee],
                ["Fixed Title Costs", result.fixedTitleCosts, true],
              ]}
            />
          </CardContent>
        </Card>
      </div>
      <Card className="loan-estimate-print-card border-mafi-border bg-mafi-bg-white">
        <CardHeader className="border-b border-mafi-border bg-mafi-bg-light">
          <HeaderTitle size="lg">
            Prepaids, Payment & Assets
          </HeaderTitle>
        </CardHeader>
        <CardContent className="grid gap-5 pt-5 lg:grid-cols-3">
          <SummaryTable
            rows={[
              ["Taxes Escrow", result.taxesEscrow],
              ["Hazard Insurance Escrow", result.hazardInsEscrow],
              ["Developer Fee Contract", result.developFeeContract],
              ["Capital Contribution", result.capitalContribution],
              ["Flood / HO6 Escrow", result.floodHO6Escrow],
              ["Interest Per Diem", result.interestPerDiem],
              ["Total Pre-Paid", result.totalPrepaid, true],
            ]}
          />
          <SummaryTable
            rows={[
              ["Principal & Interest", result.principalInterest],
              ["Monthly Property Tax", result.monthlyPropertyTax],
              ["Monthly Hazard", result.monthlyHazard],
              ["Monthly Flood", result.monthlyFlood],
              ["Monthly HOA", result.monthlyHOA],
              ["Total Monthly Payment", result.totalMonthlyPayment, true],
            ]}
          />
          <SummaryTable
            rows={[
              ["Total Closing Costs", result.totalClosingCosts],
              ["Total Pre-Paid", result.totalPrepaid],
              ["Total Cash to Close", result.totalCashToClose, true],
              ["Reserves", result.reserves],
              ["Total Assets Required", result.totalAssetsRequired, true],
            ]}
          />
        </CardContent>
      </Card>
      <CompanyFooter />
      <SignatureLines />
    </div>
  );
}

function FormulaTitleTab({
  onChange,
  result,
  state,
}: {
  onChange: <Key extends keyof LoanEstimateState>(
    key: Key,
    value: LoanEstimateState[Key],
  ) => void;
  result: LoanEstimateResult;
  state: LoanEstimateState;
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="space-y-5">
        <Card className="loan-estimate-print-card border-mafi-border bg-mafi-bg-white">
          <CardHeader className="border-b border-mafi-border bg-mafi-bg-light">
            <HeaderTitle>
              Title Insurance Tier Calculator
            </HeaderTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-5">
            <p className="text-sm text-mafi-text-mid">
              Reference only. These tiers calculate the suggested title premium
              and endorsements but do not auto-fill the Main To Complete fee
              lines.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <TextField
                label="Low threshold"
                name="lowThreshold"
                onChange={onChange}
                value={state.lowThreshold}
              />
              <TextField
                label="Low flat fee"
                name="lowFlatFee"
                onChange={onChange}
                value={state.lowFlatFee}
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {[1, 2, 3, 4, 5, 6].map((tier) => (
                <div
                  className="grid gap-3 rounded-md border border-mafi-border bg-mafi-bg-off p-3 sm:grid-cols-2"
                  key={tier}
                >
                  <TextField
                    label={`Tier ${tier} cap`}
                    name={`tier${tier}Cap` as keyof LoanEstimateState}
                    onChange={onChange}
                    value={state[`tier${tier}Cap` as keyof LoanEstimateState]}
                  />
                  <TextField
                    label={`Tier ${tier} rate`}
                    name={`tier${tier}Rate` as keyof LoanEstimateState}
                    onChange={onChange}
                    value={state[`tier${tier}Rate` as keyof LoanEstimateState]}
                  />
                  <OutputTile
                    label={`Tier ${tier} contribution`}
                    value={formatCentsCurrency(
                      result.tierContrib[tier - 1] ?? 0,
                    )}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="loan-estimate-print-card border-mafi-border bg-mafi-bg-white">
          <CardHeader className="border-b border-mafi-border bg-mafi-bg-light">
            <HeaderTitle>
              Formula Glossary
            </HeaderTitle>
          </CardHeader>
          <CardContent className="grid gap-3 pt-5 md:grid-cols-2">
            <FormulaItem
              label="Loan Amount"
              text={`${formatWholeCurrency(result.purchasePrice)} - ${formatWholeCurrency(result.downPayment)} = ${formatWholeCurrency(result.loanAmount)}`}
            />
            <FormulaItem
              label="LTV"
              text={`${formatWholeCurrency(result.loanAmount)} / ${formatWholeCurrency(result.purchasePrice)} = ${formatRatioPercentDisplay(result.ltv)}`}
            />
            <FormulaItem
              label="Interest per diem"
              text={`Loan amount x rate / 365 x ${state.interestDays} day(s) = ${formatCentsCurrency(result.interestPerDiem)}`}
            />
            <FormulaItem
              label="Total monthly payment"
              text={`P&I + taxes + insurance + HOA = ${formatCentsCurrency(result.totalMonthlyPayment)}`}
            />
            <FormulaItem
              label="Reserves"
              text={`${state.reserveMonths} month(s) x total monthly payment = ${formatCentsCurrency(result.reserves)}`}
            />
            <FormulaItem
              label="Suggested endorsements"
              text={`(Title premium + $100) x 10% + $180 = ${formatCentsCurrency(result.suggestedEndorsements)}`}
            />
          </CardContent>
        </Card>
      </div>

      <aside className="space-y-5 xl:sticky xl:top-20 xl:self-start">
        <Card className="loan-estimate-print-card border-mafi-border bg-mafi-bg-white">
          <CardHeader className="border-b border-mafi-border bg-mafi-bg-light">
            <HeaderTitle>
              Title Reference
            </HeaderTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-5">
            <OutputTile
              label="Title premium"
              value={formatCentsCurrency(result.titlePremium)}
            />
            <OutputTile
              label="Premium + $100"
              value={formatCentsCurrency(result.titlePremiumPlus100)}
            />
            <OutputTile
              label="Suggested endorsements"
              value={formatCentsCurrency(result.suggestedEndorsements)}
            />
          </CardContent>
        </Card>
        <Card className="loan-estimate-print-card border-mafi-border bg-mafi-bg-white">
          <CardHeader className="border-b border-mafi-border bg-mafi-bg-light">
            <HeaderTitle>
              Lookup Lists
            </HeaderTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            {referenceLookups.map((lookup) => (
              <div key={lookup.label}>
                <p className="text-xs font-semibold uppercase tracking-wide text-mafi-text-light">
                  {lookup.label}
                </p>
                <p className="mt-1 text-sm text-mafi-text-mid">
                  {lookup.values.join(", ")}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}

function ClosingCostsSection({
  onChange,
  result,
  state,
}: {
  onChange: <Key extends keyof LoanEstimateState>(
    key: Key,
    value: LoanEstimateState[Key],
  ) => void;
  result: LoanEstimateResult;
  state: LoanEstimateState;
}) {
  return (
    <Card className="loan-estimate-print-card border-mafi-border bg-mafi-bg-white">
      <CardHeader className="border-b border-mafi-border bg-mafi-bg-light">
        <HeaderTitle emphasis>
          Closing Costs
        </HeaderTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        <div className="grid gap-3 lg:grid-cols-2">
          <DualFeeField
            flatName="originationFlatFee"
            label="Loan origination"
            modeName="originationMode"
            onChange={onChange}
            pctName="originationPct"
            resultValue={result.loanOrigination}
            state={state}
          />
          <DualFeeField
            flatName="brokerFeeFlatFee"
            label="Broker fee"
            modeName="brokerFeeMode"
            onChange={onChange}
            pctName="brokerFeePct"
            resultValue={result.brokerFee}
            state={state}
          />
        </div>

        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          <TextField label="Appraisal fee" name="appraisalFee" onChange={onChange} value={state.appraisalFee} />
          <TextField label="Application fee" name="applicationFee" onChange={onChange} value={state.applicationFee} />
          <TextField label="Underwriting fee" name="underwritingFee" onChange={onChange} value={state.underwritingFee} />
          <TextField label="Processing fee" name="processingFee" onChange={onChange} value={state.processingFee} />
          <TextField label="Admin fee" name="adminFee" onChange={onChange} value={state.adminFee} />
          <TextField label="Interest days" name="interestDays" onChange={onChange} value={state.interestDays} />
        </div>

        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          <TextField label="Settlement fee" name="settlementFee" onChange={onChange} value={state.settlementFee} />
          <TextField label="Title search fee" name="titleSearchFee" onChange={onChange} value={state.titleSearchFee} />
          <TextField label="Misc title fee" name="miscTitleFee" onChange={onChange} value={state.miscTitleFee} />
          <TextField label="Title insurance fee" name="titleInsuranceFee" onChange={onChange} value={state.titleInsuranceFee} />
          <TextField label="Endorsements" name="endorsements" onChange={onChange} value={state.endorsements} />
          <TextField label="Recording fees" name="recordingFees" onChange={onChange} value={state.recordingFees} />
          <TextField label="City tax stamps" name="cityTaxStamps" onChange={onChange} value={state.cityTaxStamps} />
          <TextField label="State tax stamps" name="stateTaxStamps" onChange={onChange} value={state.stateTaxStamps} />
          <TextField label="Stamps on deed" name="stampsOnDeed" onChange={onChange} value={state.stampsOnDeed} />
          <TextField label="Survey fee" name="surveyFee" onChange={onChange} value={state.surveyFee} />
          <TextField label="Transamerica fee" name="transamericaFee" onChange={onChange} value={state.transamericaFee} />
          <TextField label="Flood zone cert fee" name="floodZoneCertFee" onChange={onChange} value={state.floodZoneCertFee} />
          <TextField label="Misc filing fee" name="miscFilingFee" onChange={onChange} value={state.miscFilingFee} />
        </div>

        <div className="grid gap-2 rounded-md bg-mafi-bg-light p-3 md:grid-cols-3">
          <OutputTile label="Loan costs" value={formatCentsCurrency(result.fixedLoanCosts)} />
          <OutputTile label="Title costs" value={formatCentsCurrency(result.fixedTitleCosts)} />
          <OutputTile label="Total closing costs" value={formatCentsCurrency(result.totalClosingCosts)} />
        </div>
      </CardContent>
    </Card>
  );
}

function PrePaidSection({
  onChange,
  result,
  state,
}: {
  onChange: <Key extends keyof LoanEstimateState>(
    key: Key,
    value: LoanEstimateState[Key],
  ) => void;
  result: LoanEstimateResult;
  state: LoanEstimateState;
}) {
  return (
    <Card className="loan-estimate-print-card border-mafi-border bg-mafi-bg-white">
      <CardHeader className="border-b border-mafi-border bg-mafi-bg-light">
        <HeaderTitle>
          Pre-Paid Items
        </HeaderTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          <TextField label="Tax escrow months" name="taxMonths" onChange={onChange} value={state.taxMonths} />
          <TextField label="Property tax rate %" name="propertyTaxRatePct" onChange={onChange} readOnly value={state.propertyTaxRatePct} />
          <TextField label="Hazard insurance escrow" name="hazardInsEscrow" onChange={onChange} value={state.hazardInsEscrow} />
          <SelectField
            label="Developer fee"
            name="developFee"
            onChange={onChange}
            options={[
              ["Yes", "Yes"],
              ["No", "No"],
            ]}
            value={state.developFee}
          />
          <TextField label="Developer fee contract %" name="developFeeContractPct" onChange={onChange} value={state.developFeeContractPct} />
          <TextField label="Flood / HO6 annual" name="floodHO6Annual" onChange={onChange} value={state.floodHO6Annual} />
        </div>
        <div className="grid gap-2 rounded-md bg-mafi-bg-light p-3 md:grid-cols-3">
          <OutputTile label="Taxes escrow" value={formatCentsCurrency(result.taxesEscrow)} />
          <OutputTile label="Developer fee contract" value={formatCentsCurrency(result.developFeeContract)} />
          <OutputTile label="Total pre-paid" value={formatCentsCurrency(result.totalPrepaid)} />
        </div>
      </CardContent>
    </Card>
  );
}

function MonthlyPaymentSection({
  onChange,
  result,
  state,
}: {
  onChange: <Key extends keyof LoanEstimateState>(
    key: Key,
    value: LoanEstimateState[Key],
  ) => void;
  result: LoanEstimateResult;
  state: LoanEstimateState;
}) {
  return (
    <Card className="loan-estimate-print-card border-mafi-border bg-mafi-bg-white">
      <CardHeader className="border-b border-mafi-border bg-mafi-bg-light">
        <HeaderTitle>
          Monthly Payment
        </HeaderTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        <div className="grid gap-2 md:grid-cols-3">
          <TextField label="Hazard insurance annual" name="hazardInsAnnual" onChange={onChange} readOnly value={state.hazardInsAnnual} />
          <TextField label="HOA monthly" name="hoaMonthly" onChange={onChange} readOnly value={state.hoaMonthly} />
          <TextField label="Reserve months" name="reserveMonths" onChange={onChange} value={state.reserveMonths} />
        </div>
        <div className="grid gap-2 rounded-md bg-mafi-bg-light p-3 md:grid-cols-3">
          <OutputTile label="Principal & Interest" value={formatCentsCurrency(result.principalInterest)} />
          <OutputTile label="Property taxes" value={formatCentsCurrency(result.monthlyPropertyTax)} />
          <OutputTile label="Hazard insurance" value={formatCentsCurrency(result.monthlyHazard)} />
          <OutputTile label="Flood / HO6" value={formatCentsCurrency(result.monthlyFlood)} />
          <OutputTile label="HOA / Condo fee" value={formatCentsCurrency(result.monthlyHOA)} />
          <OutputTile label="Total monthly payment" value={formatCentsCurrency(result.totalMonthlyPayment)} />
        </div>
      </CardContent>
    </Card>
  );
}

function CashToCloseSection({
  assetSegments,
  onChange,
  result,
  state,
}: {
  assetSegments: Array<{ label: string; value: number }>;
  onChange: <Key extends keyof LoanEstimateState>(
    key: Key,
    value: LoanEstimateState[Key],
  ) => void;
  result: LoanEstimateResult;
  state: LoanEstimateState;
}) {
  return (
    <Card className="loan-estimate-print-card border-mafi-border bg-mafi-bg-white">
      <CardHeader className="border-b border-mafi-border bg-mafi-bg-light">
        <HeaderTitle emphasis>
          Cash to Close & Reserves
        </HeaderTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        <div className="grid gap-2 md:grid-cols-3">
          <TextField label="Seller credit" name="sellerCredit" onChange={onChange} value={state.sellerCredit} />
          <TextField label="Other credits" name="otherCredits" onChange={onChange} value={state.otherCredits} />
          <div className="grid gap-1.5">
            <TextField label="Down payment given to seller" name="downPaymentGivenToSeller" onChange={onChange} value={state.downPaymentGivenToSeller} />
            <Button
              className="h-auto justify-start px-0 py-0 text-mafi-blue-primary"
              onClick={() =>
                onChange(
                  "downPaymentGivenToSeller",
                  String(Math.round(result.downPayment * 100) / 100),
                )
              }
              type="button"
              variant="link"
            >
              Match computed down payment
            </Button>
          </div>
        </div>
        <div className="grid gap-2 rounded-md bg-mafi-bg-light p-3 md:grid-cols-3">
          <OutputTile label="Total cash to close" value={formatCentsCurrency(result.totalCashToClose)} />
          <OutputTile label="Reserves" value={formatCentsCurrency(result.reserves)} />
          <OutputTile label="Total assets required" value={formatCentsCurrency(result.totalAssetsRequired)} />
        </div>
        <div className="grid gap-4 rounded-md bg-mafi-bg-light p-3 xl:grid-cols-[18rem_minmax(0,1fr)]">
          <div>
            <AssetDonut
              assetSegments={assetSegments}
              centerLabel="Total Assets Required"
              centerValue={formatCentsCurrency(result.totalAssetsRequired)}
            />
          </div>
          <div className="space-y-1.5 xl:self-center">
            {assetSegments.map((segment, index) => (
              <div
                className="flex items-center justify-between gap-3 rounded-md bg-mafi-bg-white px-2.5 py-1.5 text-xs"
                key={segment.label}
              >
                <span className="flex min-w-0 items-center gap-2 text-mafi-text-mid">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: assetChartColors[index] }}
                  />
                  <span>{segment.label}</span>
                </span>
                <span className="font-semibold text-mafi-text-dark">
                  {formatCentsCurrency(segment.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-mafi-text-mid">
          The fees listed are ESTIMATES &mdash; the actual charges may be more or less.
        </p>
      </CardContent>
    </Card>
  );
}

function AssetsRequiredSummary({
  assetSegments,
  result,
}: {
  assetSegments: Array<{ label: string; value: number }>;
  result: LoanEstimateResult;
}) {
  return (
    <Card className="loan-estimate-print-card border-mafi-border bg-mafi-bg-white">
      <CardHeader className="border-b border-mafi-border bg-mafi-bg-light">
        <HeaderTitle emphasis>
          Assets Required
        </HeaderTitle>
      </CardHeader>
      <CardContent className="grid gap-4 pt-4 xl:grid-cols-[18rem_minmax(0,1fr)]">
        <div>
          <AssetDonut
            assetSegments={assetSegments}
            centerLabel="Total Assets Required"
            centerValue={formatCentsCurrency(result.totalAssetsRequired)}
          />
        </div>
        <div className="space-y-1.5 xl:self-center">
          {assetSegments.map((segment, index) => (
            <div
              className="flex items-center justify-between gap-3 rounded-md bg-mafi-bg-light px-2.5 py-1.5 text-xs"
              key={segment.label}
            >
              <span className="flex min-w-0 items-center gap-2 text-mafi-text-mid">
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: assetChartColors[index] }}
                />
                <span>{segment.label}</span>
              </span>
              <span className="font-semibold text-mafi-text-dark">
                {formatCentsCurrency(segment.value)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function AssetsRequiredSidebar({
  assetSegments,
  result,
}: {
  assetSegments: Array<{ label: string; value: number }>;
  result: LoanEstimateResult;
}) {
  return (
    <aside className="xl:sticky xl:top-20 xl:self-start">
      <AssetsRequiredSummary assetSegments={assetSegments} result={result} />
    </aside>
  );
}

function AssetDonut({
  assetSegments,
  centerLabel,
  centerValue,
}: {
  assetSegments: Array<{ label: string; value: number }>;
  centerLabel?: string;
  centerValue?: string;
}) {
  return (
    <div className="relative h-64">
      <ResponsiveContainer height="100%" width="100%">
        <PieChart>
          <Pie
            cx="50%"
            cy="50%"
            data={assetSegments}
            dataKey="value"
            innerRadius={70}
            nameKey="label"
            outerRadius={112}
            paddingAngle={2}
          >
            {assetSegments.map((entry, index) => (
              <Cell fill={assetChartColors[index]} key={entry.label} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => formatCentsCurrency(Number(value))}
          />
        </PieChart>
      </ResponsiveContainer>
      {centerValue ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-center">
          <div className="max-w-36">
            {centerLabel ? (
              <p className="text-[9px] font-semibold uppercase tracking-wide text-mafi-text-light">
                {centerLabel}
              </p>
            ) : null}
            <p className="mt-1 text-2xl font-extrabold leading-tight text-mafi-gold">
              {centerValue}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DualFeeField({
  flatName,
  label,
  modeName,
  onChange,
  pctName,
  resultValue,
  state,
}: {
  flatName: "brokerFeeFlatFee" | "originationFlatFee";
  label: string;
  modeName: "brokerFeeMode" | "originationMode";
  onChange: <Key extends keyof LoanEstimateState>(
    key: Key,
    value: LoanEstimateState[Key],
  ) => void;
  pctName: "brokerFeePct" | "originationPct";
  resultValue: number;
  state: LoanEstimateState;
}) {
  const isFlat = state[modeName] === "flat";

  return (
    <div className="rounded-md border border-mafi-border bg-mafi-bg-off p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold text-mafi-text-dark">{label}</p>
        <p className="text-sm font-semibold text-mafi-blue-primary">
          {formatCentsCurrency(resultValue)}
        </p>
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-3">
        <SelectField
          label="Mode"
          name={modeName}
          onChange={onChange}
          options={[
            ["percent", "Percent"],
            ["flat", "Flat"],
          ]}
          value={state[modeName]}
        />
        <TextField
          disabled={isFlat}
          label="Percent"
          name={pctName}
          onChange={onChange}
          value={state[pctName]}
        />
        <TextField
          disabled={!isFlat}
          label="Flat fee"
          name={flatName}
          onChange={onChange}
          value={state[flatName]}
        />
      </div>
    </div>
  );
}

function formatWholeCurrency(value: number) {
  return formatCurrencyDisplay(value, "$0");
}

function formatCentsCurrency(value: number) {
  return formatCurrencyDisplayWithCents(value, "$0.00");
}

function HeaderTitle({
  children,
  emphasis,
  size = "xl",
}: {
  children: ReactNode;
  emphasis?: boolean;
  size?: "lg" | "xl";
}) {
  return (
    <CardTitle
      className={cn(
        "flex items-center gap-2 text-mafi-blue-primary",
        size === "lg" ? "text-lg" : "text-xl",
        emphasis && "font-extrabold",
      )}
    >
      <span>{children}</span>
    </CardTitle>
  );
}

function formatInputValue<Key extends keyof LoanEstimateState>(
  name: Key,
  value: LoanEstimateState[Key],
) {
  const stringValue = String(value ?? "");

  if (currencyInputFields.has(name)) {
    return formatCurrencyInput(stringValue);
  }

  if (percentInputFields.has(name)) {
    return formatPercentInput(name, stringValue);
  }

  return stringValue;
}

function normalizeInputValue<Key extends keyof LoanEstimateState>(
  name: Key,
  value: string,
) {
  if (currencyInputFields.has(name)) {
    return currencyInputToRaw(value);
  }

  if (percentInputFields.has(name)) {
    return normalizePercentInput(value);
  }

  return value;
}

function formatPercentInput(name: keyof LoanEstimateState, value: string) {
  const normalized = normalizePercentInput(value);

  if (!normalized) {
    return "";
  }

  if (name === "rate") {
    return formatInterestRateDisplay(normalized, "");
  }

  if (name === "propertyTaxRatePct") {
    return formatRatioPercentDisplay(normalized, "");
  }

  return `${normalized}%`;
}

function normalizePercentInput(value: string) {
  const cleaned = value.replace(/[%\s,]/g, "");
  const isNegative = cleaned.startsWith("-");
  const unsigned = isNegative ? cleaned.slice(1) : cleaned;
  const [whole = "", ...fractionParts] = unsigned.split(".");
  const wholeDigits = whole.replace(/\D/g, "");
  const fractionDigits = fractionParts.join("").replace(/\D/g, "");
  const prefix = isNegative ? "-" : "";

  if (!wholeDigits && !fractionDigits) {
    return "";
  }

  if (unsigned.includes(".")) {
    return `${prefix}${wholeDigits || "0"}.${fractionDigits}`;
  }

  return `${prefix}${wholeDigits}`;
}

function TextField<Key extends keyof LoanEstimateState>({
  disabled,
  label,
  name,
  onChange,
  readOnly,
  value,
}: {
  disabled?: boolean;
  label: string;
  name: Key;
  onChange: (key: Key, value: LoanEstimateState[Key]) => void;
  readOnly?: boolean;
  value: LoanEstimateState[Key];
}) {
  const formattedValue = formatInputValue(name, value);

  return (
    <div className="grid gap-1.5">
      <Label className="text-xs font-semibold text-mafi-text-dark">
        {label}
      </Label>
      <Input
        className={cn(
          "border-mafi-border",
          readOnly
            ? "cursor-default bg-mafi-bg-light text-mafi-text-mid focus-visible:ring-0 focus-visible:ring-offset-0"
            : "bg-mafi-bg-white",
        )}
        disabled={disabled}
        onChange={(event) =>
          onChange(name, normalizeInputValue(name, event.target.value) as LoanEstimateState[Key])
        }
        readOnly={readOnly}
        value={formattedValue}
      />
    </div>
  );
}

function SelectField<Key extends keyof LoanEstimateState>({
  label,
  name,
  onChange,
  options,
  readOnly,
  value,
}: {
  label: string;
  name: Key;
  onChange: (key: Key, value: LoanEstimateState[Key]) => void;
  options: Array<[string, string]>;
  readOnly?: boolean;
  value: LoanEstimateState[Key];
}) {
  const selectedOption = options.find(([optionValue]) => optionValue === value);

  return (
    <div className="grid gap-1.5">
      <Label className="text-xs font-semibold text-mafi-text-dark">
        {label}
      </Label>
      {readOnly ? (
        <div className="flex h-10 w-full items-center rounded-md border border-mafi-border bg-mafi-bg-light px-3 py-2 text-sm text-mafi-text-mid">
          {selectedOption?.[1] ?? String(value)}
        </div>
      ) : (
      <Select
        onValueChange={(nextValue) =>
          onChange(name, nextValue as LoanEstimateState[Key])
        }
        value={String(value)}
      >
        <SelectTrigger className="border-mafi-border bg-mafi-bg-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(([optionValue, optionLabel]) => (
            <SelectItem key={optionValue} value={optionValue}>
              {optionLabel}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      )}
    </div>
  );
}

function OutputTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-mafi-border bg-mafi-bg-white px-2.5 py-1.5">
      <p className="text-[9px] font-semibold uppercase tracking-wide text-mafi-text-light">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-mafi-text-dark">
        {value}
      </p>
    </div>
  );
}

function SummaryTable({
  rows,
}: {
  rows: Array<[string, number, boolean?]>;
}) {
  return (
    <div className="overflow-hidden rounded-md border border-mafi-border">
      {rows.map(([label, value, isTotal]) => (
        <div
          className={cn(
            "flex items-center justify-between gap-3 border-b border-mafi-border px-2.5 py-1.5 text-xs last:border-b-0",
            isTotal ? "bg-mafi-bg-light font-semibold text-mafi-text-dark" : "",
          )}
          key={label}
        >
          <span className="text-mafi-text-mid">{label}</span>
          <span className="font-semibold text-mafi-text-dark">
            {formatCentsCurrency(value)}
          </span>
        </div>
      ))}
    </div>
  );
}

function MarketingHeader({
  state,
  title,
}: {
  state: LoanEstimateState;
  title: string;
}) {
  return (
    <Card className="loan-estimate-print-card overflow-hidden border-mafi-border bg-mafi-bg-white">
      <div className="bg-gradient-hero px-6 py-5 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.25em]">
          MLG Home Financial
        </p>
        <h2 className="mt-1 text-2xl font-bold">{title}</h2>
      </div>
      <CardContent className="grid gap-4 pt-5 md:grid-cols-4">
        <OutputTile label="Applicant" value={state.applicantName || "Not provided"} />
        <OutputTile label="Presented by" value={state.presentedBy || "Not provided"} />
        <OutputTile label="Cell" value={state.cellPhone || "Not provided"} />
        <OutputTile label="Email" value={state.email || "Not provided"} />
      </CardContent>
    </Card>
  );
}

function MarketingStat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="loan-estimate-print-card border-mafi-border bg-mafi-bg-white">
      <CardContent className="pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-mafi-blue-primary">
          {label}
        </p>
        <p className="mt-1 text-xl font-bold text-mafi-text-dark">{value}</p>
      </CardContent>
    </Card>
  );
}

function CompanyFooter() {
  return (
    <div className="loan-estimate-print-card rounded-lg bg-gradient-hero px-6 py-4 text-center text-sm text-white">
      <p>
        <strong>MLG Home Financial</strong> · 3570 NW 87th Avenue, Suite 700,
        Doral, FL 33178
      </p>
      <p className="mt-1">
        +1.786.689.2939 (Office) · 561.287.8126 (Fax) ·{" "}
        <a
          className="font-semibold underline underline-offset-4"
          href="https://www.mlghomefinancial.com"
          rel="noopener"
          target="_blank"
        >
          www.mlghomefinancial.com
        </a>
      </p>
    </div>
  );
}

function SignatureLines() {
  return (
    <Card className="loan-estimate-print-card border-mafi-border bg-mafi-bg-white">
      <CardContent className="grid gap-8 pt-8 md:grid-cols-2">
        <div>
          <div className="h-px bg-mafi-border" />
          <p className="mt-2 text-sm font-semibold text-mafi-text-dark">
            Applicant Signature
          </p>
        </div>
        <div>
          <div className="h-px bg-mafi-border" />
          <p className="mt-2 text-sm font-semibold text-mafi-text-dark">
            Date
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function FormulaItem({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-md border border-mafi-border bg-mafi-bg-off p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-mafi-text-light">
        {label}
      </p>
      <p className="mt-1 text-sm text-mafi-text-dark">{text}</p>
    </div>
  );
}

function getAssetSegments(result: LoanEstimateResult) {
  return [
    { label: "Down Payment", value: result.downPayment },
    { label: "Closing Costs", value: result.totalClosingCosts },
    { label: "Pre-Paid Items", value: result.totalPrepaid },
    { label: "Reserves", value: result.reserves },
  ];
}

function loanTypeLabel(state: LoanEstimateState) {
  return state.foreignOrDomestic === "F"
    ? "Foreign National Loan"
    : "Domestic Loan";
}
