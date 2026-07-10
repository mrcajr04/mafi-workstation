import Link from "next/link";
import {
  ContactStatus,
  OpportunityStatus,
  Prisma,
  RoleType,
  ScenarioDeskStatus,
} from "@prisma/client";
import { ScenarioForm } from "@/app/scenario-desk/[contactId]/scenario-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, type StatusBadgeTone } from "@/components/ui/status-badge";
import { PropertyDuplicateNotice } from "@/components/workstation/property-duplicate-notice";
import {
  decimalToNumber,
  formatCurrencyDisplay,
  formatCurrencyDisplayWithCents,
  formatInterestRateDisplay,
  formatRatioPercentDisplay,
} from "@/lib/currency";
import { formatDateForDisplay, formatTimestampForDisplay } from "@/lib/dates";
import { getVisibleDuplicatePropertyContacts } from "@/lib/duplicate-property-contacts";
import {
  auditActionLabels,
  borrowerTypeLabels,
  isRefinanceLoanPurpose,
  labelFromMap,
  loanPurposeLabels,
  opportunityStatusLabels,
  propertyTypeLabels,
  realtorLabels,
  vestingLabels,
} from "@/lib/labels";
import {
  calculateVerifiedAssets,
  getLoanTermMetadata,
} from "@/lib/mortgage/scenario-calculations";
import { formatUSPhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

const EMPTY_VALUE = "Not provided";

type ScenarioDeskWithScenarios = Prisma.ScenarioDeskGetPayload<{
  include: {
    scenarios: true;
  };
}>;

function formatDate(value: Date) {
  return formatDateForDisplay(value);
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
      OR: [
        { status: ContactStatus.IN_SCENARIO_REVIEW },
        {
          scenarioDesk: { status: ScenarioDeskStatus.FINALIZED },
          status: ContactStatus.IN_PROCESSING,
        },
      ],
    },
    include: {
      assets: true,
      bdr: { select: { email: true, fullName: true } },
      coBorrowers: { orderBy: { order: "asc" } },
      ficoInfo: true,
      opportunityValue: true,
      propertyDetails: true,
      scenarioDesk: {
        include: {
          scenarios: { orderBy: { scenarioNumber: "asc" } },
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

  const annualPropertyTaxes =
    contact.propertyDetails?.propertyTaxesPresentYear ??
    contact.propertyDetails?.propertyTaxesLastYear ??
    null;
  const initialScenarios =
    contact.scenarioDesk?.scenarios.map((scenario) => ({
      escrowed: scenario.escrowed,
      interestRate: formatInterestRateDisplay(scenario.interestRate, ""),
      lenderAndProduct: scenario.lenderAndProduct,
      loanTerm: scenario.loanTermCode,
      mortgageInsurance: scenario.mortgageInsurance,
      monthlyInsurance: formatCurrencyDisplay(scenario.monthlyInsurance, ""),
      originationPay: formatCurrencyDisplay(scenario.originationPay, ""),
      pitia: formatCurrencyDisplayWithCents(scenario.pitia, ""),
      principalAndInterest: formatCurrencyDisplayWithCents(
        scenario.principalAndInterest,
        "",
      ),
      processingFee: formatCurrencyDisplay(scenario.processingFee, ""),
      program: scenario.program,
      scenarioNumber: scenario.scenarioNumber,
    })) ?? [];
  const duplicatePropertyContacts = await getVisibleDuplicatePropertyContacts({
    address: contact.propertyDetails?.address,
    contactId: contact.id,
    viewerId: access.data.id,
    viewerRole: access.data.role,
  });
  const isFinalizedReadOnly =
    contact.status === ContactStatus.IN_PROCESSING &&
    contact.scenarioDesk?.status === ScenarioDeskStatus.FINALIZED;
  const auditLogs = contact.scenarioDesk
    ? await prisma.auditLog.findMany({
        where: {
          OR: [
            {
              entityId: contact.scenarioDesk.id,
              entityType: "ScenarioDesk",
            },
            {
              entityId: contact.id,
              entityType: "Contact",
            },
          ],
        },
        include: {
          user: {
            select: {
              email: true,
              fullName: true,
            },
          },
        },
        orderBy: {
          timestamp: "desc",
        },
        take: 20,
      })
    : [];
  const opportunityPropertyValue = decimalToNumber(
    contact.opportunityValue?.propertyValue,
  );
  const impliedDownPaymentAmount =
    opportunityPropertyValue && contact.opportunityValue?.loanAmount != null
      ? opportunityPropertyValue - decimalToNumber(contact.opportunityValue.loanAmount)
      : null;
  const impliedDownPaymentPercent =
    impliedDownPaymentAmount !== null && opportunityPropertyValue
      ? (impliedDownPaymentAmount / opportunityPropertyValue) * 100
      : null;

  return (
    <div className="scenario-desk-print mx-auto max-w-6xl space-y-6">
      <div className="space-y-3">
        <Link
          className="scenario-desk-no-print text-sm font-semibold text-mafi-blue-primary hover:text-mafi-blue-dark"
          href="/scenario-desk"
        >
          Back to Scenario Desk
        </Link>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-mafi-blue-primary">
            Phase 3
          </p>
          <h1 className="mt-2 flex flex-wrap items-center gap-2 text-3xl font-bold text-mafi-text-dark">
            {contact.prospectName}
            <StatusBadge
              label={isFinalizedReadOnly ? "Finalized" : "In Review"}
              tone={isFinalizedReadOnly ? "success" : "neutral"}
            />
          </h1>
          <p className="mt-2 text-sm text-mafi-text-mid">
            {loanPurposeLabels[contact.loanPurpose]} - Created{" "}
            {formatDate(contact.createdAt)} - BDR {contact.bdr.fullName}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SummaryCard title="Contact Information">
          <SummaryItem label="Name" value={contact.prospectName} />
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
            label="Qualifying FICO"
            value={contact.ficoInfo?.score ? String(contact.ficoInfo.score) : EMPTY_VALUE}
          />
          <SummaryItem
            label="Additional Borrowers"
            value={
              contact.coBorrowers.length
                ? `${contact.coBorrowers.length} additional`
                : "None"
            }
          />
          <SummaryItem
            label="Verified Assets"
            value={formatCurrencyDisplay(calculateVerifiedAssets(contact.assets))}
          />
        </SummaryCard>

        <SummaryCard title="Property Details">
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
            label="Estimated Taxes"
            value={formatCurrencyDisplay(annualPropertyTaxes)}
          />
          <SummaryItem
            label="Estimated Insurance"
            value={formatCurrencyDisplay(
              contact.propertyDetails?.estimatedInsuranceAnnual,
            )}
          />
          <SummaryItem
            label="HOA Fees"
            value={formatCurrencyDisplay(contact.propertyDetails?.additionalHoaFees)}
          />
        </SummaryCard>

        <SummaryCard title="Opportunity Value">
          <SummaryItem
            label="Property Value"
            value={formatCurrencyDisplay(contact.opportunityValue?.propertyValue)}
          />
          <SummaryItem
            label="Loan Amount"
            value={formatCurrencyDisplay(contact.opportunityValue?.loanAmount)}
          />
          <SummaryItem
            label="LTV"
            value={formatRatioPercentDisplay(contact.opportunityValue?.ltv)}
          />
          <SummaryItem
            label={
              isRefinanceLoanPurpose(contact.loanPurpose)
                ? "Implied Equity Position"
                : "Implied Down Payment"
            }
            value={
              impliedDownPaymentAmount !== null && impliedDownPaymentPercent !== null
                ? `${formatCurrencyDisplay(impliedDownPaymentAmount)} - ${formatRatioPercentDisplay(impliedDownPaymentPercent)}`
                : EMPTY_VALUE
            }
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
            valueNode={
              <StatusBadge
                label={
                  contact.opportunityValue
                    ? opportunityStatusLabels[contact.opportunityValue.status]
                    : EMPTY_VALUE
                }
                tone={opportunityStatusTone(contact.opportunityValue?.status)}
              />
            }
          />
          <SummaryItem
            label="Comments"
            value={contact.opportunityValue?.comments ?? EMPTY_VALUE}
          />
        </SummaryCard>
      </div>

      {isFinalizedReadOnly ? (
        <LockedFinalizedScenarioDesk
          auditLogs={auditLogs}
          contactId={contact.id}
          scenarioDesk={contact.scenarioDesk}
        />
      ) : (
        <ScenarioForm
          annualInsurance={formatCurrencyDisplay(
            contact.propertyDetails?.estimatedInsuranceAnnual,
            "",
          )}
          annualPropertyTaxes={formatCurrencyDisplay(annualPropertyTaxes, "")}
          contactId={contact.id}
          initialComments={contact.opportunityValue?.comments ?? ""}
          initialScenarios={initialScenarios}
          loanAmount={formatCurrencyDisplay(contact.opportunityValue?.loanAmount, "")}
          monthlyHoa={formatCurrencyDisplay(
            contact.propertyDetails?.additionalHoaFees,
            "",
          )}
          propertyValue={formatCurrencyDisplay(
            contact.opportunityValue?.propertyValue,
            "",
          )}
          selectedScenarioNumber={contact.scenarioDesk?.selectedScenarioNumber ?? null}
          statedLtv={formatRatioPercentDisplay(contact.opportunityValue?.ltv, "")}
        />
      )}
    </div>
  );
}

function LockedFinalizedScenarioDesk({
  auditLogs,
  contactId,
  scenarioDesk,
}: {
  auditLogs: Array<{
    action: string;
    entityType: string;
    fieldDiffs: unknown;
    id: string;
    timestamp: Date;
    user: {
      email: string;
      fullName: string;
    };
  }>;
  contactId: string;
  scenarioDesk: ScenarioDeskWithScenarios | null;
}) {
  if (!scenarioDesk) {
    return (
      <IntegrityErrorCard message="This finalized contact is missing its Scenario Desk record." />
    );
  }

  const finalScenario = scenarioDesk.scenarios.find(
    (scenario) => scenario.scenarioNumber === scenarioDesk.selectedScenarioNumber,
  );
  const alternativeScenarios = scenarioDesk.scenarios.filter(
    (scenario) => scenario.id !== finalScenario?.id,
  );

  if (!scenarioDesk.selectedScenarioNumber || !finalScenario) {
    return (
      <IntegrityErrorCard message="This finalized Scenario Desk is missing its selected final scenario. Saved values were not recalculated." />
    );
  }

  return (
    <section className="space-y-5">
      <Card className="border-mafi-status-green bg-mafi-status-green/10">
        <CardContent className="space-y-2 px-4 py-4 text-sm text-mafi-text-dark">
          <p className="font-bold">Scenario Desk is locked.</p>
          <p>
            This scenario has been finalized and sent to Loan Estimate &
            Pre-Approval / Phase 4. The values shown below are the saved
            finalized values and are not recalculated on page load.
          </p>
        </CardContent>
      </Card>

      <Card className="border-mafi-blue-primary bg-mafi-bg-white">
        <CardHeader className="border-b border-mafi-border bg-mafi-bg-light">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase text-mafi-text-light">
                Selected Final Scenario
              </p>
              <CardTitle className="mt-1 text-xl text-mafi-blue-primary">
                Scenario {finalScenario.scenarioNumber}
              </CardTitle>
            </div>
            <StatusBadge label="Finalized" tone="success" />
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 pt-4 md:grid-cols-2 lg:grid-cols-4">
          <SummaryItem
            label="Lender & Product"
            value={finalScenario.lenderAndProduct}
          />
          <SummaryItem
            label="Interest Rate"
            value={formatInterestRateDisplay(finalScenario.interestRate, EMPTY_VALUE)}
          />
          <SummaryItem
            label="Loan Term"
            value={getLoanTermMetadata(finalScenario.loanTermCode).label}
          />
          <SummaryItem
            label="Escrowed"
            value={finalScenario.escrowed ? "Yes" : "No"}
          />
          <SummaryItem
            label="Mortgage Insurance"
            value={finalScenario.mortgageInsurance ? "Yes" : "No"}
          />
          <SummaryItem
            label="Saved Principal & Interest"
            value={formatCurrencyDisplayWithCents(
              finalScenario.principalAndInterest,
              EMPTY_VALUE,
            )}
          />
          <SummaryItem
            label="Saved PITIA"
            value={formatCurrencyDisplayWithCents(finalScenario.pitia, EMPTY_VALUE)}
          />
        </CardContent>
      </Card>

      {alternativeScenarios.length ? (
        <Card className="border-mafi-border bg-mafi-bg-white">
          <CardHeader className="border-b border-mafi-border bg-mafi-bg-light">
            <CardTitle className="text-base text-mafi-blue-primary">
              Saved Alternatives
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-mafi-bg-light text-left text-xs font-bold uppercase text-mafi-text-mid">
                <tr>
                  <th className="px-4 py-3">Scenario</th>
                  <th className="px-4 py-3">Lender & Product</th>
                  <th className="px-4 py-3">Rate</th>
                  <th className="px-4 py-3">Term</th>
                  <th className="px-4 py-3">P&I</th>
                  <th className="px-4 py-3">PITIA</th>
                  <th className="px-4 py-3">MI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mafi-border">
                {alternativeScenarios.map((scenario) => (
                  <tr key={scenario.id}>
                    <td className="px-4 py-3 font-semibold text-mafi-text-dark">
                      Scenario {scenario.scenarioNumber}
                    </td>
                    <td className="px-4 py-3 text-mafi-text-mid">
                      {scenario.lenderAndProduct}
                    </td>
                    <td className="px-4 py-3 text-mafi-text-mid">
                      {formatInterestRateDisplay(scenario.interestRate, EMPTY_VALUE)}
                    </td>
                    <td className="px-4 py-3 text-mafi-text-mid">
                      {getLoanTermMetadata(scenario.loanTermCode).label}
                    </td>
                    <td className="px-4 py-3 text-mafi-text-mid">
                      {formatCurrencyDisplayWithCents(
                        scenario.principalAndInterest,
                        EMPTY_VALUE,
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold text-mafi-text-dark">
                      {formatCurrencyDisplayWithCents(scenario.pitia, EMPTY_VALUE)}
                    </td>
                    <td className="px-4 py-3 text-mafi-text-mid">
                      {scenario.mortgageInsurance ? "Yes" : "No"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : null}

      <div className="scenario-desk-no-print flex flex-wrap gap-2">
        <Link
          className="inline-flex h-10 items-center justify-center rounded-md bg-mafi-blue-primary px-4 text-sm font-semibold text-white hover:bg-mafi-blue-dark"
          href={`/phase4/${contactId}`}
        >
          Open Phase 4
        </Link>
        <button
          className="inline-flex h-10 cursor-not-allowed items-center justify-center rounded-md border border-mafi-border bg-mafi-bg-light px-4 text-sm font-semibold text-mafi-text-light"
          disabled
          type="button"
        >
          Request amend / reopen
        </button>
        <p className="basis-full text-xs text-mafi-text-mid">
          Amend/reopen workflow has not been implemented yet. This control does
          not change the contact, Scenario Desk, Phase 4, or audit records.
        </p>
      </div>

      <AuditHistoryCard auditLogs={auditLogs} />
    </section>
  );
}

function IntegrityErrorCard({ message }: { message: string }) {
  return (
    <Card className="border-mafi-status-red bg-mafi-status-red/10">
      <CardContent className="px-4 py-4 text-sm font-semibold text-mafi-text-dark">
        {message}
      </CardContent>
    </Card>
  );
}

function AuditHistoryCard({
  auditLogs,
}: {
  auditLogs: Array<{
    action: string;
    entityType: string;
    fieldDiffs: unknown;
    id: string;
    timestamp: Date;
    user: {
      email: string;
      fullName: string;
    };
  }>;
}) {
  return (
    <Card className="border-mafi-border bg-mafi-bg-white">
      <CardHeader className="border-b border-mafi-border bg-mafi-bg-light">
        <CardTitle className="text-base text-mafi-blue-primary">
          Audit History
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {auditLogs.length ? (
          <div className="divide-y divide-mafi-border">
            {auditLogs.map((log) => (
              <div
                className="grid gap-3 px-4 py-3 text-sm md:grid-cols-[1fr_0.9fr_1fr_1.2fr]"
                key={log.id}
              >
                <div>
                  <p className="font-semibold text-mafi-text-dark">
                    {auditActionLabels[log.action] ?? log.action}
                  </p>
                  <p className="text-xs text-mafi-text-light">
                    {log.entityType}
                  </p>
                </div>
                <p className="text-mafi-text-mid">{log.user.fullName}</p>
                <p className="text-mafi-text-mid">
                  {formatTimestampForDisplay(log.timestamp)}
                </p>
                <pre className="max-h-28 overflow-auto rounded-md bg-mafi-bg-light p-2 text-xs text-mafi-text-dark">
                  {auditDetailsText(log.fieldDiffs)}
                </pre>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 py-6 text-sm text-mafi-text-mid">
            No audit events are attached to this Scenario Desk yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function auditDetailsText(fieldDiffs: unknown) {
  if (!fieldDiffs) {
    return "No details recorded.";
  }

  return JSON.stringify(fieldDiffs, null, 2);
}

function SummaryCard({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <Card className="break-inside-avoid border-mafi-border bg-mafi-bg-white">
      <CardHeader className="border-b border-mafi-border bg-mafi-bg-light py-3">
        <CardTitle className="text-base text-mafi-blue-primary">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 pt-4">{children}</CardContent>
    </Card>
  );
}

function SummaryItem({
  label,
  value,
  valueNode,
}: {
  label: string;
  value?: string;
  valueNode?: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase text-mafi-text-light">
        {label}
      </p>
      {valueNode ? (
        <div className="mt-1">{valueNode}</div>
      ) : (
        <p className="truncate text-sm text-mafi-text-dark">{value}</p>
      )}
    </div>
  );
}

function withEmptyValue(value: string) {
  return value === "N/A" ? EMPTY_VALUE : value;
}

function opportunityStatusTone(
  status?: OpportunityStatus | null,
): StatusBadgeTone {
  if (!status) {
    return "muted";
  }

  if (status === OpportunityStatus.NOT_MOVING_FORWARD) {
    return "warning";
  }

  return "neutral";
}
