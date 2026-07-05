import Link from "next/link";
import {
  RoleType,
} from "@prisma/client";
import {
  OpportunityDesktopRow,
  OpportunityMobileCard,
} from "@/app/opportunities/opportunity-list-item";
import { DevDataControls } from "@/app/opportunities/dev-data-controls";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NewProspectModal } from "@/components/workstation/new-prospect-modal";
import {
  opportunityStatusLabels,
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
    createdBy: contact.bdr.email,
    createdLabel: formatCreatedAt(contact.createdAt),
    prospectName: contact.prospectName,
    prospectPhone: contact.prospectPhone,
    prospectEmail: contact.prospectEmail ?? "",
    borrowerType: labelFromMap(contact.borrowerType, borrowerTypeLabels),
    loanPurposeLabel: loanPurposeLabels[contact.loanPurpose],
    ficoLabel: formatFico(contact.ficoInfo),
    hasFicoInfo: Boolean(contact.ficoInfo?.score),
    opportunityStatusLabel: contact.opportunityValue
      ? opportunityStatusLabels[contact.opportunityValue.status]
      : "No opportunity value yet",
    opportunityStatusReason:
      contact.opportunityValue?.notMovingForwardReason ?? "",
    opportunityStatusTone: contact.opportunityValue
      ? contact.opportunityValue.status
      : "NOT_STARTED",
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
                        ? "grid grid-cols-[minmax(0,0.75fr)_minmax(0,0.95fr)_minmax(0,1.1fr)_minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,0.85fr)_minmax(0,0.85fr)_minmax(0,1fr)_minmax(0,0.5fr)] items-center border-b border-mafi-border bg-mafi-bg-lighter text-[13px] text-mafi-text-dark"
                        : "grid grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)_minmax(0,0.85fr)_minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,0.85fr)_minmax(0,1fr)_minmax(0,0.5fr)] items-center border-b border-mafi-border bg-mafi-bg-lighter text-[13px] text-mafi-text-dark"
                    }
                  >
                    <div className="px-4 py-2 font-semibold">
                      Date Created
                    </div>
                    {showBdrColumn ? (
                      <div className="px-4 py-2 font-semibold">Created By</div>
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
                    <div className="px-4 py-2 font-semibold">Status</div>
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
      {canCreateContacts ? <DevDataControls /> : null}
    </div>
  );
}
