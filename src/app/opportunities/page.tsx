import Link from "next/link";
import {
  FicoSource,
  InsuranceType,
  OpportunityStatus,
  PropertyType,
  RealtorStatus,
  RoleType,
} from "@prisma/client";
import {
  OpportunityDesktopRow,
  OpportunityMobileCard,
} from "@/app/opportunities/opportunity-list-item";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NewProspectModal } from "@/components/workstation/new-prospect-modal";
import {
  borrowerTypeLabels,
  labelFromMap,
  loanPurposeLabels,
} from "@/lib/labels";
import { getContactsNeedingOpportunityValue } from "@/lib/queries/engagement-queries";

function formatFico(ficoInfo: { score: number | null } | null) {
  return ficoInfo?.score ? String(ficoInfo.score) : "N/A";
}

const PAGE_SIZE = 15;

function formatCreatedAt(createdAt: Date | string) {
  return new Date(createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(value?: { toString(): string } | string | null) {
  if (!value) {
    return "";
  }

  return Number(value.toString()).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const currentPage = Math.max(1, Number(pageParam ?? 1) || 1);
  const { contacts, totalCount, viewerRole } = await getContactsNeedingOpportunityValue({
    page: currentPage,
    pageSize: PAGE_SIZE,
  });
  const canEditContacts =
    viewerRole === RoleType.BDR || viewerRole === RoleType.OWNER;
  const canCreateContacts = canEditContacts;
  const showBdrColumn =
    viewerRole === RoleType.OWNER ||
    viewerRole === RoleType.COMPLIANCE_OFFICER;
  const emptyMessage =
    viewerRole === RoleType.LICENSED_LO ||
    viewerRole === RoleType.LOAN_PROCESSOR
      ? "Assigned prospects view coming soon"
      : "No opportunities yet.";
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;
  const firstRecordNumber =
    totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const lastRecordNumber = Math.min(currentPage * PAGE_SIZE, totalCount);
  const contactItems = contacts.map((contact) => ({
    id: contact.id,
    bdrName: contact.bdr.fullName,
    createdLabel: formatCreatedAt(contact.createdAt),
    createdBy: `${contact.bdr.fullName} (${contact.bdr.email})`,
    prospectName: contact.prospectName,
    prospectPhone: contact.prospectPhone,
    prospectEmail: contact.prospectEmail ?? "",
    borrowerType: labelFromMap(contact.borrowerType, borrowerTypeLabels),
    propertyAddress: contact.propertyDetails?.address ?? "",
    loanPurposeLabel: loanPurposeLabels[contact.loanPurpose],
    ficoLabel: formatFico(contact.ficoInfo),
    hasFicoInfo: Boolean(contact.ficoInfo?.score),
    initialData: {
      contactId: contact.id,
      prospectName: contact.prospectName,
      prospectPhone: contact.prospectPhone,
      prospectEmail: contact.prospectEmail ?? "",
      borrowerType: contact.borrowerType,
      loanPurpose: contact.loanPurpose,
      vesting: contact.vesting ?? "",
      coBorrowers: contact.coBorrowers.map((coBorrower) => ({
        name: coBorrower.name,
        phone: coBorrower.phone ?? "",
        email: coBorrower.email ?? "",
      })),
      assets: contact.assets.map((asset) => ({
        type: asset.type,
        amount: formatCurrency(asset.amount),
      })),
      ficoSource: contact.ficoInfo?.source ?? FicoSource.UNKNOWN,
      ficoScore: contact.ficoInfo?.score ? String(contact.ficoInfo.score) : "",
      propertyAddress: contact.propertyDetails?.address ?? "",
      propertyType: contact.propertyDetails?.propertyType ?? PropertyType.SFR,
      propertyTaxesLastYear: formatCurrency(
        contact.propertyDetails?.propertyTaxesLastYear,
      ),
      propertyTaxesPresentYear: formatCurrency(
        contact.propertyDetails?.propertyTaxesPresentYear,
      ),
      insuranceType: contact.propertyDetails?.insuranceType
        ? (contact.propertyDetails.insuranceType as InsuranceType)
        : ("" as const),
      hoaName: contact.propertyDetails?.hoaName ?? "",
      hoaManagementInfo: contact.propertyDetails?.hoaManagementInfo ?? "",
      additionalHoaFees: formatCurrency(
        contact.propertyDetails?.additionalHoaFees,
      ),
      opportunityPropertyValue: formatCurrency(
        contact.opportunityValue?.propertyValue,
      ),
      opportunityPurchasePrice: formatCurrency(
        contact.opportunityValue?.purchasePrice,
      ),
      opportunityLoanAmount: formatCurrency(contact.opportunityValue?.loanAmount),
      opportunityLtv: contact.opportunityValue?.ltv?.toString() ?? "",
      hasRealtor: contact.opportunityValue?.hasRealtor ?? RealtorStatus.NO,
      opportunityStatus:
        contact.opportunityValue?.status ?? OpportunityStatus.NOT_DECIDED,
      notMovingForwardReason:
        contact.opportunityValue?.notMovingForwardReason &&
        [
          "Chose another lender",
          "Not ready financially",
          "Timing not right",
          "Lost contact",
        ].includes(contact.opportunityValue.notMovingForwardReason)
          ? contact.opportunityValue.notMovingForwardReason
          : contact.opportunityValue?.notMovingForwardReason
            ? "Other"
            : "",
      notMovingForwardOtherReason:
        contact.opportunityValue?.notMovingForwardReason &&
        ![
          "Chose another lender",
          "Not ready financially",
          "Timing not right",
          "Lost contact",
        ].includes(contact.opportunityValue.notMovingForwardReason)
          ? contact.opportunityValue.notMovingForwardReason
          : "",
    },
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-mafi-blue-primary">
            Phase 1-2
          </p>
          <h1 className="mt-2 text-3xl font-bold text-mafi-text-dark">
            Opportunities
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-mafi-text-mid">
            Add new prospects and complete opportunity value details before
            scenario review.
          </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <Input
              className="min-h-11 w-full sm:w-72"
              placeholder="Search prospects..."
              type="search"
            />
            {canCreateContacts ? <NewProspectModal /> : null}
          </div>
        </div>
      </div>

      <Card className="border-mafi-border bg-mafi-bg-white">
        <CardContent className="p-0">
          {contacts.length ? (
            <>
              <div className="space-y-3 p-4 md:hidden">
                {contactItems.map((contact) => (
                  <OpportunityMobileCard
                    canEdit={canEditContacts}
                    contact={contact}
                    key={contact.id}
                    showBdrColumn={showBdrColumn}
                  />
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <div className="w-full">
                  <div
                    className={
                      showBdrColumn
                        ? "grid grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,0.85fr)_minmax(0,1.15fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,0.55fr)] items-center border-b border-mafi-border bg-mafi-bg-lighter text-[13px] text-mafi-text-dark"
                        : "grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)_minmax(0,0.9fr)_minmax(0,1.25fr)_minmax(0,0.95fr)_minmax(0,0.95fr)_minmax(0,0.6fr)] items-center border-b border-mafi-border bg-mafi-bg-lighter text-[13px] text-mafi-text-dark"
                    }
                  >
                    <div className="px-4 py-2 font-semibold">
                      Date Created
                    </div>
                    {showBdrColumn ? (
                      <div className="px-4 py-2 font-semibold">BDR</div>
                    ) : null}
                    <div className="px-4 py-2 font-semibold">Prospect</div>
                    <div className="px-4 py-2 font-semibold">Phone</div>
                    <div className="px-4 py-2 font-semibold">Email</div>
                    <div className="px-4 py-2 font-semibold">
                      Borrower Type
                    </div>
                    <div className="px-4 py-2 font-semibold">
                      Loan purpose
                    </div>
                    <div className="px-4 py-2 font-semibold">FICO</div>
                  </div>
                  {contactItems.map((contact) => (
                    <OpportunityDesktopRow
                      canEdit={canEditContacts}
                      contact={contact}
                      key={contact.id}
                      showBdrColumn={showBdrColumn}
                    />
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="px-6 py-10 text-center text-sm text-mafi-text-mid">
                {emptyMessage}
              </div>
            </>
          )}
          {totalCount > 0 ? (
            <div className="flex flex-col gap-3 border-t border-mafi-border bg-mafi-bg-off px-4 py-3 text-sm text-mafi-text-mid sm:flex-row sm:items-center sm:justify-end">
              <span>Rows per page&nbsp; {PAGE_SIZE}</span>
              <span className="font-semibold text-mafi-text-dark">
                {firstRecordNumber}-{lastRecordNumber} of {totalCount}
              </span>
              <div className="flex items-center gap-1">
                {hasPreviousPage ? (
                  <Link
                    aria-label="Previous page"
                    className="inline-flex size-8 items-center justify-center rounded-md text-mafi-text-mid hover:bg-mafi-bg-light hover:text-mafi-blue-primary"
                    href={`/opportunities?page=${currentPage - 1}`}
                  >
                    {"<"}
                  </Link>
                ) : (
                  <span className="inline-flex size-8 items-center justify-center rounded-md text-mafi-text-light">
                    {"<"}
                  </span>
                )}
                {hasNextPage ? (
                  <Link
                    aria-label="Next page"
                    className="inline-flex size-8 items-center justify-center rounded-md text-mafi-text-mid hover:bg-mafi-bg-light hover:text-mafi-blue-primary"
                    href={`/opportunities?page=${currentPage + 1}`}
                  >
                    {">"}
                  </Link>
                ) : (
                  <span className="inline-flex size-8 items-center justify-center rounded-md text-mafi-text-light">
                    {">"}
                  </span>
                )}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
