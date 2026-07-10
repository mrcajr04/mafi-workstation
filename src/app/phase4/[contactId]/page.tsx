import Link from "next/link";
import {
  BorrowerType,
  PropertyType,
  RoleType,
  ScenarioDeskStatus,
} from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import {
  loanEstimateProductionDefaults,
  parseStoredLoanEstimateState,
  type LoanEstimateState,
} from "@/lib/loan-estimate-calc";
import { getLatestLoanEstimateGeneration } from "@/lib/loan-estimate-storage";
import type { LoanEstimateHeaderExtras } from "@/lib/loan-estimate-bridge";
import {
  decimalToNumber,
  formatCurrencyDisplay,
  formatCurrencyDisplayWithCents,
  formatInterestRateDisplay,
  formatRatioPercentDisplay,
} from "@/lib/currency";
import { formatTimestampForDisplay } from "@/lib/dates";
import {
  assetLabels,
  borrowerTypeLabels,
  ficoSourceLabels,
  insuranceLabels,
  labelFromMap,
  loanPurposeLabels,
  opportunityStatusLabels,
  propertyTypeLabels,
  realtorLabels,
  vestingLabels,
} from "@/lib/labels";
import { getLoanTermMetadata } from "@/lib/mortgage/scenario-calculations";
import { formatUSPhone } from "@/lib/phone";
import { scenarioProgramLabels } from "@/lib/scenario-program";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { LoanEstimateBuilder } from "./loan-estimate-builder";
import type { LoanEstimateTraceability } from "./loan-estimate-traceability";

const EMPTY_VALUE = "Not provided";

function moneyString(value?: { toString(): string } | number | null) {
  const parsed =
    typeof value === "number" ? value : Number(value?.toString() ?? "");

  return Number.isFinite(parsed) && parsed > 0 ? String(parsed) : "";
}

// High precision (not just display rounding): downPaymentPct/propertyTaxRatePct
// drive the fee-sheet calculator, which reconstructs dollar amounts by
// multiplying purchasePrice back by this percentage. Truncating to too few
// decimals here silently drifts the recomputed Loan Amount / Property Tax away
// from the source OpportunityValue/PropertyDetails dollar figures (e.g. a
// $500,000 loan on a $700,000 price becomes "28.571%", which reconstructs to
// $500,003 instead of $500,000). 10 decimals keeps the round-trip accurate to
// the cent for realistic purchase prices.
function percentString(value: number) {
  return Number.isFinite(value) && value > 0
    ? value.toFixed(10).replace(/\.?0+$/, "")
    : "";
}

function mapPropertyType(value?: PropertyType | null) {
  if (value === PropertyType.CONDO) {
    return "CONDO";
  }

  if (value === PropertyType.COMMERCIAL || value === PropertyType.BUSINESS) {
    return "COMMERCIAL";
  }

  return "SINGLE FAMILY";
}

function mapOccupancy(value: BorrowerType) {
  if (value === BorrowerType.PRIMARY) {
    return "PRIMARY";
  }

  if (value === BorrowerType.SECOND_HOME) {
    return "SECOND HOME";
  }

  if (value === BorrowerType.INVESTMENT) {
    return "INVESTMENT";
  }

  return "OTHER";
}

export default async function Phase4DetailPage({
  params,
}: {
  params: Promise<{ contactId: string }>;
}) {
  const access = await requireRole([
    RoleType.BDR,
    RoleType.LICENSED_LO,
    RoleType.LOAN_PROCESSOR,
    RoleType.OWNER,
    RoleType.COMPLIANCE_OFFICER,
  ]);

  if (!access.success) {
    return (
      <div className="mx-auto max-w-6xl">
        <Card className="border-mafi-border bg-mafi-bg-white">
          <CardContent className="px-6 py-10 text-center text-sm text-mafi-text-mid">
            Not authorized. Phase 4 is available only to active workstation
            roles.
          </CardContent>
        </Card>
      </div>
    );
  }

  const { contactId } = await params;
  const contact = await prisma.contact.findFirst({
    where: {
      id: contactId,
      scenarioDesk: {
        status: ScenarioDeskStatus.FINALIZED,
      },
    },
    include: {
      assets: true,
      bdr: {
        select: {
          fullName: true,
        },
      },
      coBorrowers: {
        orderBy: {
          order: "asc",
        },
      },
      ficoInfo: true,
      opportunityValue: true,
      propertyDetails: true,
      phase4Pipeline: {
        select: {
          loanEstimateState: true,
        },
      },
      scenarioDesk: {
        include: {
          scenarios: {
            orderBy: {
              scenarioNumber: "asc",
            },
          },
        },
      },
    },
  });

  if (!contact?.scenarioDesk) {
    return (
      <div className="mx-auto max-w-6xl">
        <Card className="border-mafi-border bg-mafi-bg-white">
          <CardContent className="px-6 py-10 text-center text-sm text-mafi-text-mid">
            This contact is not available for Phase 4.
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedScenario = contact.scenarioDesk.scenarios.find(
    (scenario) =>
      scenario.scenarioNumber === contact.scenarioDesk?.selectedScenarioNumber,
  );
  const opportunity = contact.opportunityValue;
  const property = contact.propertyDetails;
  const estimatedPropertyValue = decimalToNumber(opportunity?.propertyValue);
  const purchasePrice = decimalToNumber(opportunity?.purchasePrice);
  const loanAmount = decimalToNumber(opportunity?.loanAmount);
  const realPurchasePrice = estimatedPropertyValue || purchasePrice || loanAmount;
  const downPaymentPct =
    realPurchasePrice && loanAmount
      ? ((realPurchasePrice - loanAmount) / realPurchasePrice) * 100
      : opportunity?.ltv
        ? 100 - decimalToNumber(opportunity.ltv)
        : 0;
  const presentYearTaxes = decimalToNumber(property?.propertyTaxesPresentYear);
  const lastYearTaxes = decimalToNumber(property?.propertyTaxesLastYear);
  const annualTaxes = presentYearTaxes || lastYearTaxes;
  const taxRatePct =
    realPurchasePrice && annualTaxes ? (annualTaxes / realPurchasePrice) * 100 : 0;
  const hoaMonthly = decimalToNumber(property?.additionalHoaFees);
  const annualInsurance =
    property?.estimatedInsuranceAnnual != null
      ? decimalToNumber(property.estimatedInsuranceAnnual)
      : decimalToNumber(selectedScenario?.monthlyInsurance) * 12;
  const downPaymentAmount =
    realPurchasePrice && loanAmount ? realPurchasePrice - loanAmount : 0;

  const sourcedInitialState: LoanEstimateState = {
    ...loanEstimateProductionDefaults,
    applicantName: contact.prospectName,
    cellPhone: access.data.phone ?? "",
    developFee: "No",
    downPaymentGivenToSeller: moneyString(downPaymentAmount),
    downPaymentPct: percentString(downPaymentPct),
    email: access.data.email,
    hazardInsEscrow:
      selectedScenario?.escrowed === false ? "0" : "",
    hazardInsAnnual: moneyString(annualInsurance),
    hoaMonthly: moneyString(hoaMonthly),
    loanNumber: contact.id.slice(0, 8).toUpperCase(),
    newOrUsed: "Used",
    occupancy: mapOccupancy(contact.borrowerType),
    officePhone: "",
    originationFlatFee: moneyString(selectedScenario?.originationPay),
    originationMode: "flat",
    originationPct: "",
    presentedBy: access.data.fullName,
    processingFee: moneyString(selectedScenario?.processingFee),
    program: selectedScenario
      ? scenarioProgramLabels[selectedScenario.program]
      : loanEstimateProductionDefaults.program,
    propertyTaxRatePct: percentString(taxRatePct),
    propertyType: mapPropertyType(property?.propertyType),
    purchasePrice: moneyString(realPurchasePrice),
    rate: selectedScenario?.interestRate.toString() ?? "",
    sfrOrCondo: property?.propertyType === PropertyType.CONDO ? "condo" : "sfr",
    taxMonths:
      selectedScenario?.escrowed === false ? "0" : "",
  };
  const storedState = parseStoredLoanEstimateState(
    contact.phase4Pipeline?.loanEstimateState,
  );
  const initialState: LoanEstimateState = {
    ...sourcedInitialState,
    ...storedState,
    applicantName: sourcedInitialState.applicantName,
    cellPhone: sourcedInitialState.cellPhone,
    email: sourcedInitialState.email,
    loanNumber: sourcedInitialState.loanNumber,
    officePhone: sourcedInitialState.officePhone,
    presentedBy: sourcedInitialState.presentedBy,
  };
  const latestLoanEstimateGeneration =
    await getLatestLoanEstimateGeneration(contactId);

  // Screen-only header fields for the redesigned UI. Additive display data only:
  // this does NOT touch initialState or the PDF-generation path. See
  // loan-estimate-bridge.ts and questions.md. mloId has no Profile source yet.
  const headerExtras: LoanEstimateHeaderExtras = {
    nmlsId: access.data.nmlsNumber ?? "",
    mloId: "",
    loanPurpose: loanPurposeLabels[contact.loanPurpose],
    lenderAndProduct: selectedScenario?.lenderAndProduct ?? "",
    propertyAddress: property?.address ?? "",
  };

  // Source-data panel for the sidebar's traceability trigger. Mirrors what a
  // reviewer sees on the Opportunity/Scenario Desk detail pages, pre-formatted
  // here so the client component stays a pure display layer.
  const traceability: LoanEstimateTraceability = {
    contact: {
      name: contact.prospectName,
      phone: formatUSPhone(contact.prospectPhone),
      email: contact.prospectEmail ?? EMPTY_VALUE,
      borrowerType: labelFromMap(contact.borrowerType, borrowerTypeLabels),
      vesting: labelFromMap(contact.vesting, vestingLabels),
      fico: contact.ficoInfo
        ? `${ficoSourceLabels[contact.ficoInfo.source]}${
            contact.ficoInfo.score ? ` / ${contact.ficoInfo.score}` : ""
          }`
        : EMPTY_VALUE,
      coBorrowers: contact.coBorrowers.map((coBorrower) =>
        [
          coBorrower.name,
          formatUSPhone(coBorrower.phone, EMPTY_VALUE),
          coBorrower.email ?? EMPTY_VALUE,
        ].join(" - "),
      ),
      assets: contact.assets.map(
        (asset) =>
          `${assetLabels[asset.type]} · ${formatCurrencyDisplay(asset.amount)}`,
      ),
      bdrName: contact.bdr.fullName,
    },
    property: {
      address: property?.address ?? EMPTY_VALUE,
      propertyType: property
        ? propertyTypeLabels[property.propertyType]
        : EMPTY_VALUE,
      taxesLastYear: formatCurrencyDisplay(property?.propertyTaxesLastYear),
      taxesPresentYear: formatCurrencyDisplay(
        property?.propertyTaxesPresentYear,
      ),
      insurance: property?.insuranceTypes.length
        ? property.insuranceTypes
            .map((insuranceType) => insuranceLabels[insuranceType])
            .join(", ")
        : property?.insuranceType
          ? insuranceLabels[property.insuranceType]
          : EMPTY_VALUE,
      insuranceAnnual: formatCurrencyDisplay(property?.estimatedInsuranceAnnual),
      hoaName: property?.hoaName ?? EMPTY_VALUE,
      hoaManagement: property?.hoaManagementInfo ?? EMPTY_VALUE,
      hoaFees: formatCurrencyDisplay(property?.additionalHoaFees),
    },
    opportunity: {
      propertyValue: formatCurrencyDisplay(opportunity?.propertyValue),
      loanAmount: formatCurrencyDisplay(opportunity?.loanAmount),
      ltv: formatRatioPercentDisplay(opportunity?.ltv),
      hasRealtor: opportunity
        ? realtorLabels[opportunity.hasRealtor]
        : EMPTY_VALUE,
      status: opportunity
        ? opportunityStatusLabels[opportunity.status]
        : EMPTY_VALUE,
    },
    scenarios: contact.scenarioDesk.scenarios.map((scenario) => ({
      scenarioNumber: scenario.scenarioNumber,
      lenderAndProduct: scenario.lenderAndProduct,
      interestRate: formatInterestRateDisplay(scenario.interestRate),
      loanTerm: getLoanTermMetadata(scenario.loanTermCode).label,
      program: scenarioProgramLabels[scenario.program],
      mortgageInsurance: scenario.mortgageInsurance ? "Yes" : "No",
      principalAndInterest: formatCurrencyDisplayWithCents(
        scenario.principalAndInterest,
      ),
      pitia: formatCurrencyDisplayWithCents(scenario.pitia),
      escrowed: scenario.escrowed ? "Yes" : "No",
      originationPay: formatCurrencyDisplay(scenario.originationPay),
      processingFee: formatCurrencyDisplay(scenario.processingFee),
      comments: scenario.comments ?? "",
      isSelected:
        scenario.scenarioNumber === contact.scenarioDesk?.selectedScenarioNumber,
    })),
  };

  return (
    <div className="mx-auto max-w-[1500px] space-y-3">
      <Link
        className="inline-flex text-sm font-semibold text-mafi-blue-primary hover:text-mafi-blue-dark"
        href="/phase4"
      >
        Back to Pipeline
      </Link>
      <LoanEstimateBuilder
        contactId={contactId}
        headerExtras={headerExtras}
        initialGeneratedAt={
          latestLoanEstimateGeneration
            ? formatTimestampForDisplay(latestLoanEstimateGeneration.generatedAt)
            : undefined
        }
        initialDownloadUrl={latestLoanEstimateGeneration?.downloadUrl}
        initialState={initialState}
        traceability={traceability}
      />
    </div>
  );
}
