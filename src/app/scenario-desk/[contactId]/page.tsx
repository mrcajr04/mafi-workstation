import Link from "next/link";
import {
  ContactStatus,
  RoleType,
  ScenarioDeskStatus,
} from "@prisma/client";
import { ScenarioForm } from "@/app/scenario-desk/[contactId]/scenario-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

const EMPTY_VALUE = "Not provided";

function formatCurrency(value?: { toString(): string } | string | null) {
  if (!value) {
    return EMPTY_VALUE;
  }

  return Number(value.toString()).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function formatPercent(value?: { toString(): string } | string | null) {
  if (!value) {
    return EMPTY_VALUE;
  }

  return `${Number(value.toString()).toFixed(2)}%`;
}

function formatDate(value: Date) {
  return value.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function ScenarioDeskDetailPage({
  params,
}: {
  params: Promise<{ contactId: string }>;
}) {
  const access = await requireRole([RoleType.LICENSED_LO, RoleType.OWNER]);

  if (!access.success) {
    return (
      <div className="mx-auto max-w-6xl">
        <Card className="border-mafi-border bg-mafi-bg-white">
          <CardContent className="px-6 py-10 text-center text-sm text-mafi-text-mid">
            Not authorized. Scenario Desk is available only to Licensed LO and
            Owner roles.
          </CardContent>
        </Card>
      </div>
    );
  }

  const { contactId } = await params;
  const contact = await prisma.contact.findFirst({
    where: {
      id: contactId,
      status: ContactStatus.IN_SCENARIO_REVIEW,
    },
    include: {
      assets: true,
      bdr: {
        select: {
          email: true,
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

  if (!contact) {
    return (
      <div className="mx-auto max-w-6xl space-y-4">
        <Link
          className="text-sm font-semibold text-mafi-blue-primary hover:text-mafi-blue-dark"
          href="/scenario-desk"
        >
          Back to Scenario Desk
        </Link>
        <Card className="border-mafi-border bg-mafi-bg-white">
          <CardContent className="px-6 py-10 text-center text-sm text-mafi-text-mid">
            This contact is not available for scenario review.
          </CardContent>
        </Card>
      </div>
    );
  }

  const initialScenarios =
    contact.scenarioDesk?.scenarios.map((scenario) => ({
      escrowed: scenario.escrowed,
      interestRate: scenario.interestRate.toString(),
      lenderAndProduct: scenario.lenderAndProduct,
      originationPay: formatCurrency(scenario.originationPay),
      pitia: formatCurrency(scenario.pitia),
      principalAndInterest: formatCurrency(scenario.principalAndInterest),
      processingFee: formatCurrency(scenario.processingFee),
      scenarioNumber: scenario.scenarioNumber,
    })) ?? [];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="space-y-3">
        <Link
          className="text-sm font-semibold text-mafi-blue-primary hover:text-mafi-blue-dark"
          href="/scenario-desk"
        >
          Back to Scenario Desk
        </Link>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-mafi-blue-primary">
            Phase 3
          </p>
          <h1 className="mt-2 text-3xl font-bold text-mafi-text-dark">
            {contact.prospectName}
          </h1>
          <p className="mt-2 text-sm text-mafi-text-mid">
            {loanPurposeLabels[contact.loanPurpose]} · Created{" "}
            {formatDate(contact.createdAt)} · BDR {contact.bdr.fullName}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SummaryCard title="Contact Information">
          <SummaryItem label="Name" value={contact.prospectName} />
          <SummaryItem label="Phone" value={contact.prospectPhone} />
          <SummaryItem
            label="Email"
            value={contact.prospectEmail ?? EMPTY_VALUE}
          />
          <SummaryItem
            label="Borrower Type"
            value={withEmptyValue(
              labelFromMap(contact.borrowerType, borrowerTypeLabels),
            )}
          />
          <SummaryItem
            label="Vesting"
            value={withEmptyValue(labelFromMap(contact.vesting, vestingLabels))}
          />
          <SummaryItem
            label="FICO"
            value={
              contact.ficoInfo
                ? `${ficoSourceLabels[contact.ficoInfo.source]}${
                    contact.ficoInfo.score ? ` / ${contact.ficoInfo.score}` : ""
                  }`
                : EMPTY_VALUE
            }
          />
          <SummaryList
            items={contact.coBorrowers.map((coBorrower) =>
              `${coBorrower.name} · ${coBorrower.phone ?? EMPTY_VALUE} · ${
                coBorrower.email ?? EMPTY_VALUE
              }`,
            )}
            label="Co-borrowers"
          />
          <SummaryList
            items={contact.assets.map(
              (asset) =>
                `${assetLabels[asset.type]} · ${formatCurrency(asset.amount)}`,
            )}
            label="Assets"
          />
        </SummaryCard>

        <SummaryCard title="Property Details">
          <SummaryItem
            label="Address"
            value={contact.propertyDetails?.address ?? EMPTY_VALUE}
          />
          <SummaryItem
            label="Property Type"
            value={
              contact.propertyDetails
                ? propertyTypeLabels[contact.propertyDetails.propertyType]
                : EMPTY_VALUE
            }
          />
          <SummaryItem
            label="Taxes Last Year"
            value={formatCurrency(
              contact.propertyDetails?.propertyTaxesLastYear,
            )}
          />
          <SummaryItem
            label="Taxes Present Year"
            value={formatCurrency(
              contact.propertyDetails?.propertyTaxesPresentYear,
            )}
          />
          <SummaryItem
            label="Insurance"
            value={
              contact.propertyDetails?.insuranceType
                ? insuranceLabels[contact.propertyDetails.insuranceType]
                : EMPTY_VALUE
            }
          />
          <SummaryItem
            label="HOA"
            value={contact.propertyDetails?.hoaName ?? EMPTY_VALUE}
          />
          <SummaryItem
            label="HOA Management"
            value={contact.propertyDetails?.hoaManagementInfo ?? EMPTY_VALUE}
          />
          <SummaryItem
            label="HOA Fees"
            value={formatCurrency(contact.propertyDetails?.additionalHoaFees)}
          />
        </SummaryCard>

        <SummaryCard title="Opportunity Value">
          <SummaryItem
            label="Property Value"
            value={formatCurrency(contact.opportunityValue?.propertyValue)}
          />
          <SummaryItem
            label="Loan Amount"
            value={formatCurrency(contact.opportunityValue?.loanAmount)}
          />
          <SummaryItem
            label="LTV"
            value={formatPercent(contact.opportunityValue?.ltv)}
          />
          <SummaryItem
            label="Has Realtor"
            value={
              contact.opportunityValue
                ? realtorLabels[contact.opportunityValue.hasRealtor]
                : EMPTY_VALUE
            }
          />
          <SummaryItem
            label="Status"
            value={
              contact.opportunityValue
                ? opportunityStatusLabels[contact.opportunityValue.status]
                : EMPTY_VALUE
            }
          />
          <SummaryItem
            label="Reason"
            value={
              contact.opportunityValue?.notMovingForwardReason ?? EMPTY_VALUE
            }
          />
        </SummaryCard>
      </div>

      <ScenarioForm
        contactId={contact.id}
        initialScenarios={initialScenarios}
        selectedScenarioNumber={
          contact.scenarioDesk?.status === ScenarioDeskStatus.FINALIZED
            ? contact.scenarioDesk.selectedScenarioNumber
            : null
        }
      />
    </div>
  );
}

function SummaryCard({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <Card className="border-mafi-border bg-mafi-bg-white">
      <CardHeader className="border-b border-mafi-border bg-mafi-bg-light py-3">
        <CardTitle className="text-base text-mafi-blue-primary">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 pt-4">{children}</CardContent>
    </Card>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase text-mafi-text-light">
        {label}
      </p>
      <p className="truncate text-sm text-mafi-text-dark">{value}</p>
    </div>
  );
}

function withEmptyValue(value: string) {
  return value === "N/A" ? EMPTY_VALUE : value;
}

function SummaryList({ items, label }: { items: string[]; label: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase text-mafi-text-light">
        {label}
      </p>
      {items.length ? (
        <div className="mt-1 space-y-1">
          {items.map((item, index) => (
            <p className="text-sm text-mafi-text-dark" key={`${item}-${index}`}>
              {item}
            </p>
          ))}
        </div>
      ) : (
        <p className="text-sm text-mafi-text-light">{EMPTY_VALUE}</p>
      )}
    </div>
  );
}
