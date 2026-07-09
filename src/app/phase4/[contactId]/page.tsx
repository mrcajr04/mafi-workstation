import {
  BorrowerType,
  PropertyType,
  RoleType,
  ScenarioDeskStatus,
} from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import {
  loanEstimateDefaults,
  type LoanEstimateState,
} from "@/lib/loan-estimate-calc";
import { getLatestLoanEstimateGeneration } from "@/lib/loan-estimate-storage";
import { formatTimestampForDisplay } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { LoanEstimateBuilder } from "./loan-estimate-builder";

function decimalToNumber(value?: { toString(): string } | null) {
  const parsed = Number(value?.toString() ?? "");
  return Number.isFinite(parsed) ? parsed : 0;
}

function moneyString(value?: { toString(): string } | number | null) {
  const parsed =
    typeof value === "number" ? value : Number(value?.toString() ?? "");

  return Number.isFinite(parsed) && parsed > 0 ? String(parsed) : "";
}

function percentString(value: number) {
  return Number.isFinite(value) && value > 0
    ? value.toFixed(3).replace(/\.?0+$/, "")
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

function mapProgram(loanTerm?: number | null, lenderAndProduct?: string | null) {
  const product = lenderAndProduct?.toUpperCase() ?? "";

  if (product.includes("IO")) {
    return "IO";
  }

  if (loanTerm === 15 || product.includes("15")) {
    return "15 YR FIXED";
  }

  return "30 YR FIXED";
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
      opportunityValue: true,
      propertyDetails: true,
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
  const monthlyInsurance = decimalToNumber(selectedScenario?.monthlyInsurance);
  const downPaymentAmount =
    realPurchasePrice && loanAmount ? realPurchasePrice - loanAmount : 0;

  const initialState: LoanEstimateState = {
    ...loanEstimateDefaults,
    applicantName: contact.prospectName,
    cellPhone: access.data.phone ?? "",
    developFee: "No",
    downPaymentGivenToSeller: moneyString(downPaymentAmount),
    downPaymentPct: percentString(downPaymentPct),
    email: access.data.email,
    hazardInsAnnual: moneyString(monthlyInsurance * 12),
    hoaMonthly: moneyString(hoaMonthly),
    loanNumber: contact.id.slice(0, 8).toUpperCase(),
    newOrUsed: "Used",
    occupancy: mapOccupancy(contact.borrowerType),
    officePhone: "",
    originationFlatFee: moneyString(selectedScenario?.originationPay),
    originationMode: "flat",
    originationPct: "0",
    presentedBy: access.data.fullName,
    processingFee: moneyString(selectedScenario?.processingFee),
    program: mapProgram(
      selectedScenario?.loanTerm,
      selectedScenario?.lenderAndProduct,
    ),
    propertyTaxRatePct: percentString(taxRatePct),
    propertyType: mapPropertyType(property?.propertyType),
    purchasePrice: moneyString(realPurchasePrice),
    rate: selectedScenario?.interestRate.toString() ?? "",
    sfrOrCondo: property?.propertyType === PropertyType.CONDO ? "condo" : "sfr",
  };
  const latestLoanEstimateGeneration =
    await getLatestLoanEstimateGeneration(contactId);

  return (
    <div className="mx-auto max-w-[1500px]">
      <LoanEstimateBuilder
        contactId={contactId}
        initialGeneratedAt={
          latestLoanEstimateGeneration
            ? formatTimestampForDisplay(latestLoanEstimateGeneration.generatedAt)
            : undefined
        }
        initialDownloadUrl={latestLoanEstimateGeneration?.downloadUrl}
        initialState={initialState}
      />
    </div>
  );
}
