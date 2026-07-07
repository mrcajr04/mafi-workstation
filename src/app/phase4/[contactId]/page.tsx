import Link from "next/link";
import {
  RoleType,
  ScenarioDeskStatus,
} from "@prisma/client";
import { Phase4Documents } from "@/app/phase4/[contactId]/phase4-documents";
import { Phase4Form } from "@/app/phase4/[contactId]/phase4-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PropertyDuplicateNotice } from "@/components/workstation/property-duplicate-notice";
import {
  formatCurrencyDisplay,
  formatInterestRateDisplay,
  formatRatioPercentDisplay,
} from "@/lib/currency";
import { formatTimestampForDisplay } from "@/lib/dates";
import { getVisibleDuplicatePropertyContacts } from "@/lib/duplicate-property-contacts";
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
import { formatUSPhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

const EMPTY_VALUE = "Not provided";

function formatDateInput(value?: Date | null) {
  if (!value) {
    return "";
  }

  return value.toISOString().slice(0, 10);
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
      phase4Pipeline: true,
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
      <div className="mx-auto max-w-6xl space-y-4">
        <Link
          className="text-sm font-semibold text-mafi-blue-primary hover:text-mafi-blue-dark"
          href="/phase4"
        >
          Back to Loan Pre-Approval
        </Link>
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
  const phase4WriteRoles: RoleType[] = [
    RoleType.LICENSED_LO,
    RoleType.LOAN_PROCESSOR,
    RoleType.OWNER,
  ];
  const canEdit = phase4WriteRoles.includes(access.data.role);
  const duplicatePropertyContacts = await getVisibleDuplicatePropertyContacts({
    address: contact.propertyDetails?.address,
    contactId: contact.id,
    viewerId: access.data.id,
    viewerRole: access.data.role,
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="space-y-3">
        <Link
          className="text-sm font-semibold text-mafi-blue-primary hover:text-mafi-blue-dark"
          href="/phase4"
        >
          Back to Loan Pre-Approval
        </Link>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-mafi-blue-primary">
            Phase 4
          </p>
          <h1 className="mt-2 text-3xl font-bold text-mafi-text-dark">
            {contact.prospectName}
          </h1>
          <p className="mt-2 text-sm text-mafi-text-mid">
            {loanPurposeLabels[contact.loanPurpose]} - BDR {contact.bdr.fullName}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <SummaryCard title="Contact">
          <SummaryItem label="Phone" value={formatUSPhone(contact.prospectPhone)} />
          <SummaryItem label="Email" value={contact.prospectEmail ?? EMPTY_VALUE} />
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
            items={contact.coBorrowers.map(
              (coBorrower) =>
                `${coBorrower.name} - ${formatUSPhone(coBorrower.phone, EMPTY_VALUE)} - ${
                  coBorrower.email ?? EMPTY_VALUE
                }`,
            )}
            label="Co-borrowers"
          />
          <SummaryList
            items={contact.assets.map(
              (asset) =>
                `${assetLabels[asset.type]} - ${formatCurrencyDisplay(asset.amount)}`,
            )}
            label="Assets"
          />
        </SummaryCard>

        <SummaryCard title="Property">
          <PropertyDuplicateNotice matches={duplicatePropertyContacts} />
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
            value={formatCurrencyDisplay(contact.propertyDetails?.propertyTaxesLastYear)}
          />
          <SummaryItem
            label="Taxes Present Year"
            value={formatCurrencyDisplay(
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
        </SummaryCard>

        <SummaryCard title="Opportunity">
          <SummaryItem
            label="Property Value"
            value={formatCurrencyDisplay(contact.opportunityValue?.propertyValue)}
          />
          <SummaryItem
            label="Loan Amount"
            value={formatCurrencyDisplay(contact.opportunityValue?.loanAmount)}
          />
          <SummaryItem label="LTV" value={formatRatioPercentDisplay(contact.opportunityValue?.ltv)} />
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
        </SummaryCard>

        <SummaryCard title="Final Scenario">
          <SummaryItem
            label="Scenario"
            value={
              selectedScenario
                ? `Scenario ${selectedScenario.scenarioNumber}`
                : EMPTY_VALUE
            }
          />
          <SummaryItem
            label="Lender & Product"
            value={selectedScenario?.lenderAndProduct ?? EMPTY_VALUE}
          />
          <SummaryItem
            label="Interest Rate"
            value={selectedScenario ? formatInterestRateDisplay(selectedScenario.interestRate) : EMPTY_VALUE}
          />
          <SummaryItem
            label="P&I"
            value={formatCurrencyDisplay(selectedScenario?.principalAndInterest)}
          />
          <SummaryItem
            label="PITIA"
            value={formatCurrencyDisplay(selectedScenario?.pitia)}
          />
          <SummaryItem
            label="Escrowed"
            value={selectedScenario ? (selectedScenario.escrowed ? "Yes" : "No") : EMPTY_VALUE}
          />
          <SummaryItem
            label="Origination Pay"
            value={formatCurrencyDisplay(selectedScenario?.originationPay)}
          />
          <SummaryItem
            label="Processing Fee"
            value={formatCurrencyDisplay(selectedScenario?.processingFee)}
          />
        </SummaryCard>
      </div>

      {canEdit ? (
        <Phase4Documents
          contactId={contact.id}
          loanEstimateGeneratedAt={
            contact.phase4Pipeline?.loanEstimateHtml
              ? formatTimestampForDisplay(contact.phase4Pipeline.updatedAt)
              : undefined
          }
          loanPreApprovalGeneratedAt={
            contact.phase4Pipeline?.loanPreApprovalHtml
              ? formatTimestampForDisplay(contact.phase4Pipeline.updatedAt)
              : undefined
          }
          prospectName={contact.prospectName}
        />
      ) : null}

      <Phase4Form
        canEdit={canEdit}
        contactId={contact.id}
        initialData={
          contact.phase4Pipeline
            ? {
                allInvoicesCollected: contact.phase4Pipeline.allInvoicesCollected,
                appraisalStatus: contact.phase4Pipeline.appraisalStatus,
                closingDocsSignedOut: contact.phase4Pipeline.closingDocsSignedOut,
                closingScheduleDate: formatDateInput(
                  contact.phase4Pipeline.closingScheduleDate,
                ),
                creditAuthorizationStatus:
                  contact.phase4Pipeline.creditAuthorizationStatus,
                ctcNotified: contact.phase4Pipeline.ctcNotified,
                decisionBranch: contact.phase4Pipeline.decisionBranch,
                disclosuresStatus: contact.phase4Pipeline.disclosuresStatus,
                fundingDate: formatDateInput(contact.phase4Pipeline.fundingDate),
                loanApplicationStatus:
                  contact.phase4Pipeline.loanApplicationStatus,
                loanApprovalStatus: contact.phase4Pipeline.loanApprovalStatus,
                loanLockConfirmed: contact.phase4Pipeline.loanLockConfirmed,
                postClosingComplete: contact.phase4Pipeline.postClosingComplete,
                pricingLockFloat: contact.phase4Pipeline.pricingLockFloat,
              }
            : undefined
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
      <p className="text-sm text-mafi-text-dark">{value}</p>
    </div>
  );
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

function withEmptyValue(value: string) {
  return value === "N/A" ? EMPTY_VALUE : value;
}
