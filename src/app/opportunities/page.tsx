import Link from "next/link";
import {
  BorrowerType,
  LoanPurpose,
  OpportunityStatus,
  RoleType,
  type Prisma,
} from "@prisma/client";
import {
  borrowerTypeOptions,
  loanPurposeOptions,
  OpportunityClearFiltersButton,
  OpportunityFilterHeader,
  OpportunityMobileFilters,
  opportunityStatusOptions,
  OpportunitySortableHeader,
} from "@/app/opportunities/opportunity-table-controls";
import {
  OpportunityDesktopRow,
  OpportunityMobileCard,
} from "@/app/opportunities/opportunity-list-item";
import { opportunityDesktopGridClass } from "@/app/opportunities/opportunity-list-grid";
import { DevDataControls } from "@/app/opportunities/dev-data-controls";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NavViewMarker } from "@/components/workstation/nav-view-marker";
import { NewProspectModal } from "@/components/workstation/new-prospect-modal";
import { formatCurrencyDisplay } from "@/lib/currency";
import { formatDateForDisplay } from "@/lib/dates";
import {
  opportunityStatusLabels,
  borrowerTypeLabels,
  labelFromMap,
  loanPurposeLabels,
} from "@/lib/labels";
import { getContactsNeedingOpportunityValue } from "@/lib/queries/engagement-queries";
import type { OpportunitySortKey } from "@/lib/queries/engagement-queries";

function formatFico(ficoInfo: { score: number | null } | null) {
  return ficoInfo?.score ? String(ficoInfo.score) : "N/A";
}

const PAGE_SIZE = 15;
const opportunitySortKeys = new Set<OpportunitySortKey>([
  "borrowerType",
  "createdAt",
  "createdBy",
  "fico",
  "loanPurpose",
  "opportunityStatus",
  "opportunityValue",
  "phone",
  "prospectName",
  "updatedAt",
]);

function formatCreatedAt(createdAt: Date | string) {
  return formatDateForDisplay(createdAt);
}

function formatOpportunityValue(
  opportunityValue: { calculatedOpportunityValue: unknown } | null,
) {
  if (!opportunityValue?.calculatedOpportunityValue) {
    return "No opportunity value yet";
  }

  return formatCurrencyDisplay(opportunityValue.calculatedOpportunityValue);
}

function enumParam<T extends string>(
  value: string | undefined,
  values: readonly T[],
) {
  return value && values.includes(value as T) ? (value as T) : undefined;
}

function sortParam(value: string | undefined): OpportunitySortKey {
  return value && opportunitySortKeys.has(value as OpportunitySortKey)
    ? (value as OpportunitySortKey)
    : "updatedAt";
}

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{
    borrowerType?: string;
    direction?: string;
    loanPurpose?: string;
    opportunityStatus?: string;
    page?: string;
    search?: string;
    sort?: string;
  }>;
}) {
  const params = await searchParams;
  const {
    borrowerType: borrowerTypeParam,
    direction: directionParam,
    loanPurpose: loanPurposeParam,
    opportunityStatus: opportunityStatusParam,
    page: pageParam,
    search: searchParam,
    sort: sortParamValue,
  } = params;
  const currentPage = Math.max(1, Number(pageParam ?? 1) || 1);
  const search = searchParam?.trim() ?? "";
  const borrowerType = enumParam(
    borrowerTypeParam,
    Object.values(BorrowerType),
  );
  const loanPurpose = enumParam(loanPurposeParam, Object.values(LoanPurpose));
  const opportunityStatus = enumParam(
    opportunityStatusParam,
    ["INCOMPLETE", "NOT_STARTED", ...Object.values(OpportunityStatus)] as const,
  );
  const sort = sortParam(sortParamValue);
  const sortDirection: Prisma.SortOrder =
    directionParam === "asc" ? "asc" : "desc";
  const { contacts, totalCount, viewerRole } = await getContactsNeedingOpportunityValue({
    borrowerType,
    loanPurpose,
    opportunityStatus,
    page: currentPage,
    pageSize: PAGE_SIZE,
    search,
    sort,
    sortDirection,
  });
  const canEditContacts =
    viewerRole === RoleType.BDR || viewerRole === RoleType.OWNER;
  const canCreateContacts = canEditContacts;
  const showBdrColumn =
    viewerRole === RoleType.OWNER ||
    viewerRole === RoleType.COMPLIANCE_OFFICER ||
    viewerRole === RoleType.LICENSED_LO ||
    viewerRole === RoleType.LOAN_PROCESSOR;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;
  const firstRecordNumber =
    totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const lastRecordNumber = Math.min(currentPage * PAGE_SIZE, totalCount);
  const pageHref = (page: number) => {
    const nextParams = new URLSearchParams();
    nextParams.set("page", String(page));

    if (search) {
      nextParams.set("search", search);
    }

    if (borrowerType) {
      nextParams.set("borrowerType", borrowerType);
    }

    if (loanPurpose) {
      nextParams.set("loanPurpose", loanPurpose);
    }

    if (opportunityStatus) {
      nextParams.set("opportunityStatus", opportunityStatus);
    }

    if (sort !== "updatedAt") {
      nextParams.set("sort", sort);
    }

    if (sortDirection !== "desc") {
      nextParams.set("direction", sortDirection);
    }

    return `/opportunities?${nextParams.toString()}`;
  };
  const hasColumnFilters = Boolean(
    borrowerType || loanPurpose || opportunityStatus,
  );
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
    isPhase1Incomplete: !contact.ficoInfo || !contact.propertyDetails,
    opportunityStatusLabel: contact.opportunityValue
      ? opportunityStatusLabels[contact.opportunityValue.status]
      : "Not started",
    opportunityStatusReason:
      contact.opportunityValue?.notMovingForwardReason ?? "",
    opportunityStatusTone: contact.opportunityValue
      ? contact.opportunityValue.status
      : "NOT_STARTED",
    opportunityValueLabel: formatOpportunityValue(contact.opportunityValue),
  }));

  return (
    <div className="w-full space-y-6">
      <NavViewMarker section="opportunities" />
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
            <form action="/opportunities" className="w-full sm:w-72">
              {borrowerType ? (
                <input name="borrowerType" type="hidden" value={borrowerType} />
              ) : null}
              {loanPurpose ? (
                <input name="loanPurpose" type="hidden" value={loanPurpose} />
              ) : null}
              {opportunityStatus ? (
                <input
                  name="opportunityStatus"
                  type="hidden"
                  value={opportunityStatus}
                />
              ) : null}
              {sort !== "updatedAt" ? (
                <input name="sort" type="hidden" value={sort} />
              ) : null}
              {sortDirection !== "desc" ? (
                <input name="direction" type="hidden" value={sortDirection} />
              ) : null}
              <Input
                className="min-h-11 w-full"
                defaultValue={search}
                name="search"
                placeholder="Search prospects..."
                type="search"
              />
              <button className="sr-only" type="submit">
                Search
              </button>
            </form>
            {canCreateContacts ? <NewProspectModal /> : null}
          </div>
        </div>
      </div>

      <Card className="border-mafi-border bg-mafi-bg-white">
        <CardContent className="p-0">
          {contacts.length ? (
            <>
              <div className="space-y-3 p-4 md:hidden">
                <OpportunityMobileFilters
                  borrowerType={borrowerType}
                  loanPurpose={loanPurpose}
                  opportunityStatus={opportunityStatus}
                  showClearAll={hasColumnFilters}
                />
                {contactItems.map((contact) => (
                  <OpportunityMobileCard
                    canEdit={canEditContacts}
                    contact={contact}
                    key={contact.id}
                    showBdrColumn={showBdrColumn}
                  />
                ))}
              </div>

              <div className="hidden w-full overflow-x-auto md:block">
                <div className="min-w-[1120px] w-full">
                  <div
                    className={`grid ${opportunityDesktopGridClass(showBdrColumn)} items-center border-b border-mafi-border bg-mafi-bg-lighter text-[13px] text-mafi-text-dark`}
                  >
                    <OpportunitySortableHeader sortKey="createdAt">
                      Date Created
                    </OpportunitySortableHeader>
                    {showBdrColumn ? (
                      <OpportunitySortableHeader sortKey="createdBy">
                        Created By
                      </OpportunitySortableHeader>
                    ) : null}
                    <OpportunitySortableHeader sortKey="prospectName">
                      Prospect
                    </OpportunitySortableHeader>
                    <OpportunitySortableHeader sortKey="phone">
                      Phone
                    </OpportunitySortableHeader>
                    <OpportunityFilterHeader
                      filterLabel="Borrower type"
                      filterParam="borrowerType"
                      options={borrowerTypeOptions}
                      selectedValue={borrowerType}
                      sortKey="borrowerType"
                    >
                      Borrower Type
                    </OpportunityFilterHeader>
                    <OpportunityFilterHeader
                      filterLabel="Loan purpose"
                      filterParam="loanPurpose"
                      options={loanPurposeOptions}
                      selectedValue={loanPurpose}
                      sortKey="loanPurpose"
                    >
                      Loan purpose
                    </OpportunityFilterHeader>
                    <OpportunitySortableHeader sortKey="opportunityValue">
                      Opportunity Value
                    </OpportunitySortableHeader>
                    <div className="flex items-center justify-between gap-2">
                      <OpportunityFilterHeader
                        filterLabel="Status"
                        filterParam="opportunityStatus"
                        options={opportunityStatusOptions}
                        selectedValue={opportunityStatus}
                        sortKey="opportunityStatus"
                      >
                        Status
                      </OpportunityFilterHeader>
                      {hasColumnFilters ? <OpportunityClearFiltersButton /> : null}
                    </div>
                    <OpportunitySortableHeader sortKey="fico">
                      FICO
                    </OpportunitySortableHeader>
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
                No opportunities yet.
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
                    href={pageHref(currentPage - 1)}
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
                    href={pageHref(currentPage + 1)}
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
