import Link from "next/link";
import {
  ContactStatus,
  OpportunityStatus,
  Prisma,
  RoleType,
  ScenarioDeskStatus,
} from "@prisma/client";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CircleCheck,
  LockKeyhole,
  UserRound,
} from "lucide-react";
import {
  ProspectScenarioPrintDocument,
  type ProspectScenarioPrintContext,
} from "@/app/scenario-desk/[contactId]/prospect-scenario-print-document";
import { ScenarioForm } from "@/app/scenario-desk/[contactId]/scenario-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  StatusBadge,
  type StatusBadgeTone,
} from "@/components/ui/status-badge";
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

type ScenarioDeskContact = Prisma.ContactGetPayload<{
  include: {
    assets: true;
    bdr: { select: { email: true; fullName: true } };
    coBorrowers: true;
    ficoInfo: true;
    opportunityValue: true;
    propertyDetails: true;
    scenarioDesk: { include: { scenarios: true } };
  };
}>;

function formatDate(value: Date) {
  return formatDateForDisplay(value);
}

function PhaseProgress({ finalized }: { finalized: boolean }) {
  const phases = [
    "Intake",
    "Opportunity",
    "Scenario Review",
    "Loan Estimate & Pre-Approval",
  ];
  const activePhase = finalized ? 4 : 3;

  return (
    <ol
      aria-label="Engagement phases"
      className="hidden w-[min(500px,42vw)] shrink-0 grid-cols-4 min-[1180px]:grid"
    >
      {phases.map((phase, index) => {
        const phaseNumber = index + 1;
        const isComplete = phaseNumber < activePhase || finalized;
        const isActive = phaseNumber === activePhase;

        return (
          <li className="relative min-w-0 pt-5" key={phase}>
            {index < phases.length - 1 ? (
              <span
                aria-hidden="true"
                className={`absolute top-[6px] left-3 h-0.5 w-[calc(100%-12px)] ${
                  phaseNumber < activePhase
                    ? "bg-mafi-blue-primary"
                    : "bg-mafi-border"
                }`}
              />
            ) : null}
            <span
              aria-hidden="true"
              className={`absolute top-0 left-0 grid size-3 place-items-center rounded-full border-2 ${
                isActive
                  ? "size-4 -translate-x-0.5 border-4 border-mafi-blue-primary bg-white"
                  : isComplete
                    ? "border-mafi-blue-primary bg-mafi-blue-primary"
                    : "border-mafi-border bg-white"
              }`}
            >
              {isComplete && !isActive ? (
                <CircleCheck className="size-2.5 text-white" />
              ) : null}
            </span>
            <span className="block text-[9px] font-bold uppercase tracking-wide text-mafi-text-light">
              Phase {phaseNumber}
            </span>
            <strong
              className={`mt-0.5 block pr-3 text-[10px] leading-4 ${
                isActive ? "text-mafi-blue-primary" : "text-mafi-text-mid"
              }`}
            >
              {phase}
            </strong>
          </li>
        );
      })}
    </ol>
  );
}

function ScenarioContextRail({
  annualPropertyTaxes,
  contact,
  duplicatePropertyContacts,
  impliedPositionAmount,
  impliedPositionPercent,
}: {
  annualPropertyTaxes: Prisma.Decimal | null;
  contact: ScenarioDeskContact;
  duplicatePropertyContacts: React.ComponentProps<
    typeof PropertyDuplicateNotice
  >["matches"];
  impliedPositionAmount: number | null;
  impliedPositionPercent: number | null;
}) {
  return (
    <aside
      aria-label="Borrower and opportunity context"
      className="min-w-0 space-y-4 min-[1180px]:sticky min-[1180px]:top-[76px]"
    >
      <SummaryCard kicker="Borrower snapshot" title="Contact Information">
        <SummaryItem
          className="col-span-2"
          label="Name"
          value={contact.prospectName}
        />
        <SummaryItem
          label="Phone"
          value={formatUSPhone(contact.prospectPhone)}
        />
        <SummaryItem
          className="col-span-2"
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
          featured
          label="Qualifying FICO"
          value={
            contact.ficoInfo?.score
              ? String(contact.ficoInfo.score)
              : EMPTY_VALUE
          }
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
          className="col-span-2"
          featured
          label="Verified Assets"
          value={formatCurrencyDisplay(calculateVerifiedAssets(contact.assets))}
        />
      </SummaryCard>

      <Card className="overflow-hidden border-mafi-border bg-mafi-bg-white shadow-sm">
        <section className="p-4" aria-labelledby="property-details-title">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-mafi-text-light">
            Scenario assumptions
          </p>
          <div className="mt-1 flex items-start justify-between gap-3">
            <h2
              id="property-details-title"
              className="text-base font-bold text-mafi-text-dark"
            >
              Property Details
            </h2>
            <span className="rounded-full border border-mafi-blue-primary/15 bg-mafi-blue-primary/5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-mafi-blue-primary">
              From intake
            </span>
          </div>
          <PropertyDuplicateNotice matches={duplicatePropertyContacts} />
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3.5">
            <SummaryItem
              className="col-span-2"
              label="Address"
              value={contact.propertyDetails?.address ?? EMPTY_VALUE}
            />
            <SummaryItem
              className="col-span-2"
              label="Property Type"
              value={
                contact.propertyDetails
                  ? propertyTypeLabels[contact.propertyDetails.propertyType]
                  : EMPTY_VALUE
              }
            />
            <SummaryItem
              label="Annual Taxes"
              value={formatCurrencyDisplay(annualPropertyTaxes)}
            />
            <SummaryItem
              label="Annual Insurance"
              value={formatCurrencyDisplay(
                contact.propertyDetails?.estimatedInsuranceAnnual,
              )}
            />
            <SummaryItem
              className="col-span-2"
              label="Monthly HOA"
              value={formatCurrencyDisplay(
                contact.propertyDetails?.additionalHoaFees,
              )}
            />
          </dl>
        </section>

        <section
          className="border-t border-mafi-border p-4"
          aria-labelledby="opportunity-value-title"
        >
          <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-mafi-text-light">
            Deal economics
          </p>
          <h2
            id="opportunity-value-title"
            className="mt-1 text-base font-bold text-mafi-text-dark"
          >
            Opportunity Value
          </h2>
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3.5">
            <SummaryItem
              featured
              label="Property Value"
              value={formatCurrencyDisplay(
                contact.opportunityValue?.propertyValue,
              )}
            />
            <SummaryItem
              featured
              label="Loan Amount"
              value={formatCurrencyDisplay(
                contact.opportunityValue?.loanAmount,
              )}
            />
            <SummaryItem
              label="Stored LTV"
              value={formatRatioPercentDisplay(contact.opportunityValue?.ltv)}
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
              className="col-span-2"
              label={
                isRefinanceLoanPurpose(contact.loanPurpose)
                  ? "Implied Equity Position"
                  : "Implied Down Payment"
              }
              value={
                impliedPositionAmount !== null &&
                impliedPositionPercent !== null
                  ? `${formatCurrencyDisplay(impliedPositionAmount)} (${formatRatioPercentDisplay(impliedPositionPercent)} of property value)`
                  : EMPTY_VALUE
              }
            />
            <SummaryItem
              className="col-span-2"
              label="Opportunity Status"
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
          </dl>
        </section>
      </Card>
    </aside>
  );
}

export default async function ScenarioDeskDetailPage({
  params,
}: {
  params: Promise<{ contactId: string }>;
}) {
  const access = await requireRole([RoleType.LICENSED_LO, RoleType.OWNER]);

  if (!access.success) {
    return (
      <div className="mx-auto grid min-h-[60vh] max-w-xl place-items-center">
        <Card className="w-full border-mafi-border bg-mafi-bg-white shadow-sm">
          <CardContent className="px-6 py-12 text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl border border-mafi-gold/30 bg-mafi-gold-light/40 text-mafi-gold-dark">
              <LockKeyhole className="size-6" aria-hidden="true" />
            </span>
            <h1 className="mt-4 text-2xl font-bold text-mafi-text-dark">
              Scenario Desk access required
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-mafi-text-mid">
              This workspace is available only to Licensed Loan Originator and
              Owner roles.
            </p>
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
      <div className="mx-auto max-w-2xl space-y-4">
        <Link
          className="text-sm font-semibold text-mafi-blue-primary hover:text-mafi-blue-dark"
          href="/scenario-desk"
        >
          Back to Scenario Desk
        </Link>
        <Card className="border-mafi-border bg-mafi-bg-white shadow-sm">
          <CardContent className="px-6 py-12 text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl border border-mafi-border bg-mafi-bg-light text-mafi-text-mid">
              <LockKeyhole className="size-6" aria-hidden="true" />
            </span>
            <h1 className="mt-4 text-xl font-bold text-mafi-text-dark">
              Scenario review unavailable
            </h1>
            <p className="mt-2 text-sm text-mafi-text-mid">
              This contact is not available in the current Scenario Review
              workflow.
            </p>
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
  const opportunityLoanAmount = decimalToNumber(
    contact.opportunityValue?.loanAmount,
  );
  const impliedDownPaymentAmount =
    opportunityPropertyValue && contact.opportunityValue?.loanAmount != null
      ? opportunityPropertyValue - opportunityLoanAmount
      : null;
  const impliedDownPaymentPercent =
    impliedDownPaymentAmount !== null && opportunityPropertyValue
      ? (impliedDownPaymentAmount / opportunityPropertyValue) * 100
      : null;
  const printContext: ProspectScenarioPrintContext = {
    annualInsurance:
      contact.propertyDetails?.estimatedInsuranceAnnual == null
        ? null
        : decimalToNumber(contact.propertyDetails.estimatedInsuranceAnnual),
    annualPropertyTaxes:
      annualPropertyTaxes == null ? null : decimalToNumber(annualPropertyTaxes),
    datePrepared: formatDate(new Date()),
    hoaMonthly:
      contact.propertyDetails?.additionalHoaFees == null
        ? null
        : decimalToNumber(contact.propertyDetails.additionalHoaFees),
    impliedPositionAmount: impliedDownPaymentAmount,
    impliedPositionLabel: isRefinanceLoanPurpose(contact.loanPurpose)
      ? "Implied Equity Position"
      : "Implied Down Payment",
    impliedPositionPercent: impliedDownPaymentPercent,
    loanAmount:
      contact.opportunityValue?.loanAmount == null
        ? null
        : opportunityLoanAmount,
    loanPurpose: loanPurposeLabels[contact.loanPurpose],
    preparedBy: access.data.fullName,
    propertyAddress: contact.propertyDetails?.address ?? null,
    propertyValue:
      contact.opportunityValue?.propertyValue == null
        ? null
        : opportunityPropertyValue,
    prospectName: contact.prospectName,
    statedLtv:
      contact.opportunityValue?.ltv == null
        ? null
        : decimalToNumber(contact.opportunityValue.ltv),
  };

  const contextRail = (
    <ScenarioContextRail
      annualPropertyTaxes={annualPropertyTaxes}
      contact={contact}
      duplicatePropertyContacts={duplicatePropertyContacts}
      impliedPositionAmount={impliedDownPaymentAmount}
      impliedPositionPercent={impliedDownPaymentPercent}
    />
  );

  return (
    <div className="scenario-desk-print-scope -mx-4 -mt-4 overflow-x-clip sm:-mx-6 sm:-mt-6">
      <header className="scenario-desk-screen-only border-b border-mafi-border bg-mafi-bg-white px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1530px]">
          <Link
            className="scenario-desk-no-print inline-flex min-h-8 items-center gap-1.5 text-xs font-bold text-mafi-text-mid transition hover:text-mafi-blue-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mafi-blue-primary/30"
            href="/scenario-desk"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            Back to Scenario Desk
          </Link>
          <div className="mt-2.5 flex items-end justify-between gap-8">
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-mafi-blue-primary">
                {isFinalizedReadOnly
                  ? "Phase 4 handoff complete"
                  : "Phase 3 / Scenario Review"}
              </p>
              <h1 className="mt-1.5 flex flex-wrap items-center gap-2 text-2xl font-bold text-mafi-text-dark sm:text-3xl">
                <span className="break-words">{contact.prospectName}</span>
                <StatusBadge
                  className="shrink-0"
                  label={isFinalizedReadOnly ? "Finalized" : "In Review"}
                  tone={isFinalizedReadOnly ? "success" : "neutral"}
                />
              </h1>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-mafi-text-mid">
                <span className="rounded-full border border-mafi-blue-primary/20 bg-mafi-blue-primary/5 px-2 py-0.5 font-bold text-mafi-blue-primary">
                  {loanPurposeLabels[contact.loanPurpose]}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays
                    className="size-3.5 text-mafi-text-light"
                    aria-hidden="true"
                  />
                  Contact created {formatDate(contact.createdAt)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <UserRound
                    className="size-3.5 text-mafi-text-light"
                    aria-hidden="true"
                  />
                  Assigned BDR:{" "}
                  <strong className="text-mafi-text-dark">
                    {contact.bdr.fullName}
                  </strong>
                </span>
              </div>
            </div>
            <PhaseProgress finalized={isFinalizedReadOnly} />
          </div>
        </div>
      </header>

      {isFinalizedReadOnly ? (
        <>
          <LockedFinalizedScenarioDesk
            auditLogs={auditLogs}
            contactCreatedAt={contact.createdAt}
            contactId={contact.id}
            contactName={contact.prospectName}
            loanPurpose={loanPurposeLabels[contact.loanPurpose]}
            assignedBdr={contact.bdr.fullName}
            scenarioDesk={contact.scenarioDesk}
          />
          <ProspectScenarioPrintDocument
            {...printContext}
            documentState="finalized"
            scenarios={
              contact.scenarioDesk?.scenarios.map((scenario) => ({
                escrowed: scenario.escrowed,
                interestRate: decimalToNumber(scenario.interestRate),
                lenderAndProduct: scenario.lenderAndProduct,
                loanTerm: scenario.loanTermCode,
                mortgageInsurance: scenario.mortgageInsurance,
                pitia: decimalToNumber(scenario.pitia),
                principalAndInterest: decimalToNumber(
                  scenario.principalAndInterest,
                ),
                scenarioNumber: scenario.scenarioNumber,
              })) ?? []
            }
            selectedScenarioNumber={
              contact.scenarioDesk?.selectedScenarioNumber ?? null
            }
          />
        </>
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
          loanAmount={formatCurrencyDisplay(
            contact.opportunityValue?.loanAmount,
            "",
          )}
          monthlyHoa={formatCurrencyDisplay(
            contact.propertyDetails?.additionalHoaFees,
            "",
          )}
          contextRail={contextRail}
          printContext={printContext}
          propertyValue={formatCurrencyDisplay(
            contact.opportunityValue?.propertyValue,
            "",
          )}
          selectedScenarioNumber={
            contact.scenarioDesk?.selectedScenarioNumber ?? null
          }
          statedLtv={formatRatioPercentDisplay(
            contact.opportunityValue?.ltv,
            "",
          )}
        />
      )}
    </div>
  );
}

function LockedFinalizedScenarioDesk({
  auditLogs,
  assignedBdr,
  contactCreatedAt,
  contactId,
  contactName,
  loanPurpose,
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
  assignedBdr: string;
  contactCreatedAt: Date;
  contactId: string;
  contactName: string;
  loanPurpose: string;
  scenarioDesk: ScenarioDeskWithScenarios | null;
}) {
  if (!scenarioDesk) {
    return (
      <IntegrityErrorCard message="This finalized contact is missing its Scenario Desk record." />
    );
  }

  const finalScenario = scenarioDesk.scenarios.find(
    (scenario) =>
      scenario.scenarioNumber === scenarioDesk.selectedScenarioNumber,
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
    <section className="scenario-desk-screen-only mx-auto max-w-[1530px] space-y-4 px-4 py-5 sm:px-6 lg:px-8">
      <div className="flex items-start gap-3 rounded-xl border border-mafi-status-green/30 bg-mafi-status-green/10 px-4 py-3.5 text-mafi-text-dark">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-mafi-status-green/15 text-mafi-status-green">
          <LockKeyhole className="size-4.5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-bold">
            Scenario finalized and sent to Phase 4
          </p>
          <p className="mt-1 text-xs leading-5 text-mafi-text-mid">
            This view is read-only. Payment values are saved historical values
            and are not recalculated from current property data.
          </p>
        </div>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
        <div className="min-w-0 space-y-4">
          <Card className="border-mafi-blue-primary bg-mafi-bg-white shadow-sm">
            <CardHeader className="border-b border-mafi-border bg-mafi-bg-light px-4 py-3.5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-lg bg-mafi-blue-dark text-sm font-extrabold text-white">
                    {finalScenario.scenarioNumber}
                  </span>
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-wide text-mafi-text-light">
                      Selected Final Scenario
                    </p>
                    <CardTitle className="mt-0.5 text-base font-bold text-mafi-text-dark">
                      Scenario {finalScenario.scenarioNumber}
                    </CardTitle>
                  </div>
                </div>
                <StatusBadge label="Finalized" tone="success" />
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <h2 className="break-words text-xl font-bold text-mafi-text-dark sm:text-2xl">
                {finalScenario.lenderAndProduct}
              </h2>
              <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <SummaryItem
                  featured
                  label="Interest Rate"
                  value={formatInterestRateDisplay(
                    finalScenario.interestRate,
                    EMPTY_VALUE,
                  )}
                />
                <SummaryItem
                  featured
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
              </dl>
              <div className="mt-5 grid overflow-hidden rounded-xl border border-mafi-border sm:grid-cols-2">
                <div className="bg-mafi-bg-light p-4">
                  <p className="text-[10px] font-extrabold uppercase tracking-wide text-mafi-text-light">
                    Saved Principal & Interest
                  </p>
                  <p className="mt-1.5 text-2xl font-bold tabular-nums text-mafi-text-dark">
                    {formatCurrencyDisplayWithCents(
                      finalScenario.principalAndInterest,
                      EMPTY_VALUE,
                    )}
                  </p>
                </div>
                <div className="border-t border-mafi-blue-primary/20 bg-mafi-blue-primary/8 p-4 sm:border-t-0 sm:border-l">
                  <p className="text-[10px] font-extrabold uppercase tracking-wide text-mafi-blue-primary">
                    Saved PITIA
                  </p>
                  <p className="mt-1.5 text-3xl font-extrabold tabular-nums text-mafi-blue-primary">
                    {formatCurrencyDisplayWithCents(
                      finalScenario.pitia,
                      EMPTY_VALUE,
                    )}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-xs text-mafi-text-mid">
                Historical snapshot retained at finalization.
              </p>
            </CardContent>
          </Card>

          {alternativeScenarios.length ? (
            <Card className="overflow-hidden border-mafi-border bg-mafi-bg-white shadow-sm">
              <CardHeader className="border-b border-mafi-border bg-mafi-bg-light px-4 py-3">
                <CardTitle className="text-base font-bold text-mafi-text-dark">
                  Saved Alternatives
                </CardTitle>
                <p className="text-xs text-mafi-text-mid">
                  Historical alternatives retained for the case record.
                </p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[680px] table-fixed text-sm">
                    <thead className="bg-mafi-bg-light text-left text-xs font-bold uppercase text-mafi-text-mid">
                      <tr>
                        <th className="w-32 px-4 py-3">Scenario</th>
                        <th className="w-72 px-4 py-3">Lender & Product</th>
                        <th className="w-24 px-4 py-3 text-right">Rate</th>
                        <th className="w-32 px-4 py-3">Term</th>
                        <th className="w-28 px-4 py-3 text-right">P&I</th>
                        <th className="w-28 px-4 py-3 text-right">PITIA</th>
                        <th className="w-20 px-4 py-3">MI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-mafi-border">
                      {alternativeScenarios.map((scenario) => (
                        <tr key={scenario.id}>
                          <td className="px-4 py-3 font-semibold text-mafi-text-dark">
                            Scenario {scenario.scenarioNumber}
                          </td>
                          <td className="break-words px-4 py-3 text-mafi-text-mid">
                            {scenario.lenderAndProduct}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-mafi-text-mid">
                            {formatInterestRateDisplay(
                              scenario.interestRate,
                              EMPTY_VALUE,
                            )}
                          </td>
                          <td className="px-4 py-3 text-mafi-text-mid">
                            {getLoanTermMetadata(scenario.loanTermCode).label}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-mafi-text-mid">
                            {formatCurrencyDisplayWithCents(
                              scenario.principalAndInterest,
                              EMPTY_VALUE,
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold tabular-nums text-mafi-text-dark">
                            {formatCurrencyDisplayWithCents(
                              scenario.pitia,
                              EMPTY_VALUE,
                            )}
                          </td>
                          <td className="px-4 py-3 text-mafi-text-mid">
                            {scenario.mortgageInsurance ? "Yes" : "No"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="grid gap-2 p-3 md:hidden">
                  {alternativeScenarios.map((scenario) => (
                    <article
                      className="rounded-lg border border-mafi-border p-3"
                      key={scenario.id}
                    >
                      <div className="flex items-center gap-2">
                        <span className="grid size-7 place-items-center rounded-lg bg-mafi-blue-dark text-xs font-bold text-white">
                          {scenario.scenarioNumber}
                        </span>
                        <strong>Scenario {scenario.scenarioNumber}</strong>
                      </div>
                      <p className="mt-2 break-words text-sm font-semibold text-mafi-text-dark">
                        {scenario.lenderAndProduct}
                      </p>
                      <dl className="mt-3 grid grid-cols-2 gap-3">
                        <SummaryItem
                          label="Rate"
                          value={formatInterestRateDisplay(
                            scenario.interestRate,
                            EMPTY_VALUE,
                          )}
                        />
                        <SummaryItem
                          label="Term"
                          value={
                            getLoanTermMetadata(scenario.loanTermCode).label
                          }
                        />
                        <SummaryItem
                          label="Saved P&I"
                          value={formatCurrencyDisplayWithCents(
                            scenario.principalAndInterest,
                            EMPTY_VALUE,
                          )}
                        />
                        <SummaryItem
                          featured
                          label="Saved PITIA"
                          value={formatCurrencyDisplayWithCents(
                            scenario.pitia,
                            EMPTY_VALUE,
                          )}
                        />
                      </dl>
                    </article>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <aside className="min-w-0 space-y-4">
          <Card className="border-mafi-border bg-mafi-bg-white shadow-sm">
            <CardContent className="p-4">
              <p className="text-[10px] font-extrabold uppercase tracking-wide text-mafi-text-light">
                Phase 4 handoff
              </p>
              <h2 className="mt-1 text-base font-bold text-mafi-text-dark">
                Case Status
              </h2>
              <dl className="mt-4 grid grid-cols-2 gap-4">
                <SummaryItem
                  className="col-span-2"
                  label="Prospect"
                  value={contactName}
                />
                <SummaryItem label="Loan Purpose" value={loanPurpose} />
                <SummaryItem label="Assigned BDR" value={assignedBdr} />
                <SummaryItem
                  className="col-span-2"
                  label="Contact Created"
                  value={formatDate(contactCreatedAt)}
                />
              </dl>
              <div className="scenario-desk-no-print mt-5 grid gap-2">
                <Link
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-mafi-blue-primary px-4 text-sm font-semibold text-white hover:bg-mafi-blue-dark"
                  href={`/phase4/${contactId}`}
                >
                  Open Phase 4
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <button
                  className="inline-flex h-10 cursor-not-allowed items-center justify-center rounded-lg border border-mafi-border bg-mafi-bg-light px-4 text-sm font-semibold text-mafi-text-light"
                  disabled
                  type="button"
                >
                  Request amend / reopen
                </button>
                <p className="text-xs leading-5 text-mafi-text-mid">
                  Amend/reopen workflow has not been implemented yet. This
                  control does not change the contact, Scenario Desk, Phase 4,
                  or audit records.
                </p>
              </div>
            </CardContent>
          </Card>
          <AuditHistoryCard auditLogs={auditLogs} />
        </aside>
      </div>
    </section>
  );
}

function IntegrityErrorCard({ message }: { message: string }) {
  return (
    <Card className="mx-auto mt-5 max-w-[1530px] border-mafi-status-red bg-mafi-status-red/10 shadow-sm">
      <CardContent className="px-4 py-5 text-sm font-semibold text-mafi-text-dark">
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
    <Card className="border-mafi-border bg-mafi-bg-white shadow-sm">
      <CardHeader className="border-b border-mafi-border bg-mafi-bg-light px-4 py-3">
        <CardTitle className="text-base font-bold text-mafi-text-dark">
          Audit History
        </CardTitle>
        <p className="text-xs text-mafi-text-mid">
          Recorded events for this finalized case.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        {auditLogs.length ? (
          <div className="divide-y divide-mafi-border">
            {auditLogs.map((log) => (
              <div
                className="grid gap-2 px-4 py-3 text-sm sm:grid-cols-[minmax(0,1fr)_auto]"
                key={log.id}
              >
                <div className="min-w-0">
                  <p className="font-semibold text-mafi-text-dark">
                    {auditActionLabels[log.action] ?? log.action}
                  </p>
                  <p className="mt-1 text-xs text-mafi-text-mid">
                    {log.user.fullName} / {log.entityType}
                  </p>
                </div>
                <p className="text-[10px] text-mafi-text-light sm:text-right">
                  {formatTimestampForDisplay(log.timestamp)}
                </p>
                <pre className="max-h-28 overflow-auto whitespace-pre-wrap rounded-md bg-mafi-bg-light p-2 text-[10px] text-mafi-text-mid sm:col-span-2">
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
  kicker,
  title,
}: {
  children: React.ReactNode;
  kicker?: string;
  title: string;
}) {
  return (
    <Card className="h-full break-inside-avoid border-mafi-border bg-mafi-bg-white shadow-sm">
      <CardHeader className="border-b border-mafi-border bg-mafi-bg-light px-4 py-3">
        {kicker ? (
          <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-mafi-text-light">
            {kicker}
          </p>
        ) : null}
        <CardTitle className="text-base font-bold text-mafi-text-dark">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-x-4 gap-y-3.5 p-4">
        {children}
      </CardContent>
    </Card>
  );
}

function SummaryItem({
  className = "",
  featured = false,
  label,
  value,
  valueNode,
}: {
  className?: string;
  featured?: boolean;
  label: string;
  value?: string;
  valueNode?: React.ReactNode;
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      <p className="text-[10px] font-bold uppercase tracking-wide text-mafi-text-light">
        {label}
      </p>
      {valueNode ? (
        <div className="mt-1">{valueNode}</div>
      ) : (
        <p
          className={`mt-0.5 break-words leading-5 text-mafi-text-dark ${featured ? "text-lg font-bold tabular-nums" : "text-sm font-semibold"}`}
        >
          {value}
        </p>
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
