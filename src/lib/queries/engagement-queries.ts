import { prisma } from "@/lib/prisma";
import { getCurrentProfile } from "@/lib/rbac";
import { timed } from "@/lib/timing";
import {
  BorrowerType,
  ContactStatus,
  LoanPurpose,
  OpportunityStatus,
  Prisma,
  RoleType,
} from "@prisma/client";
import { unstable_cache } from "next/cache";

export async function getContactsNeedingOpportunityValue({
  borrowerType,
  loanPurpose,
  page = 1,
  pageSize = 20,
  search = "",
  sort = "updatedAt",
  sortDirection = "desc",
  opportunityStatus,
}: {
  borrowerType?: BorrowerType;
  loanPurpose?: LoanPurpose;
  opportunityStatus?: OpportunityStatus | "INCOMPLETE" | "NOT_STARTED";
  page?: number;
  pageSize?: number;
  search?: string;
  sort?: OpportunitySortKey;
  sortDirection?: Prisma.SortOrder;
} = {}) {
  const profile = await getCurrentProfile();

  if (!profile) {
    return {
      contacts: [],
      totalCount: 0,
      viewerRole: null,
    };
  }

  const safePage = Math.max(1, page);
  const safePageSize = Math.min(Math.max(1, pageSize), 20);
  const safeSearch = search.trim();
  const searchDigits = safeSearch.replace(/\D/g, "");
  const safeSortDirection: Prisma.SortOrder =
    sortDirection === "asc" ? "asc" : "desc";
  const viewerRole = profile.role;

  const canViewAllContacts =
    viewerRole === RoleType.OWNER ||
    viewerRole === RoleType.COMPLIANCE_OFFICER ||
    viewerRole === RoleType.LICENSED_LO ||
    viewerRole === RoleType.LOAN_PROCESSOR;
  const filters: Prisma.ContactWhereInput[] = [
    {
      OR: [
        {
          opportunityValue: null,
        },
        {
          opportunityValue: {
            is: {
              status: {
                not: OpportunityStatus.READY_FOR_REVIEW,
              },
            },
          },
        },
      ],
    },
  ];

  if (safeSearch) {
    const matchingBorrowerTypes = enumValuesMatchingLabel(
      BorrowerType,
      borrowerTypeSearchLabels,
      safeSearch,
    );
    const matchingLoanPurposes = enumValuesMatchingLabel(
      LoanPurpose,
      loanPurposeSearchLabels,
      safeSearch,
    );
    const matchingOpportunityStatuses = enumValuesMatchingLabel(
      OpportunityStatus,
      opportunityStatusSearchLabels,
      safeSearch,
    );
    const parsedCurrency = parseCurrencySearch(safeSearch);
    const parsedFico = Number.parseInt(safeSearch, 10);
    const parsedDateRange = parseDateSearch(safeSearch);
    const searchFilter: Prisma.ContactWhereInput = {
      OR: [
        {
          prospectName: {
            contains: safeSearch,
            mode: "insensitive",
          },
        },
        {
          prospectEmail: {
            contains: safeSearch,
            mode: "insensitive",
          },
        },
        {
          bdr: {
            email: {
              contains: safeSearch,
              mode: "insensitive",
            },
          },
        },
        ...(matchingBorrowerTypes.length
          ? [
              {
                borrowerType: {
                  in: matchingBorrowerTypes,
                },
              },
            ]
          : []),
        ...(matchingLoanPurposes.length
          ? [
              {
                loanPurpose: {
                  in: matchingLoanPurposes,
                },
              },
            ]
          : []),
        ...(matchingOpportunityStatuses.length
          ? [
              {
                opportunityValue: {
                  is: {
                    status: {
                      in: matchingOpportunityStatuses,
                    },
                  },
                },
              },
            ]
          : []),
        ...(matchesLabel("No opportunity value yet", safeSearch) ||
        matchesLabel("Not started", safeSearch)
          ? [
              {
                opportunityValue: null,
              },
            ]
          : []),
        ...(Number.isFinite(parsedFico)
          ? [
              {
                ficoInfo: {
                  is: {
                    score: parsedFico,
                  },
                },
              },
            ]
          : []),
        ...(parsedCurrency !== null
          ? [
              {
                opportunityValue: {
                  is: {
                    calculatedOpportunityValue: parsedCurrency,
                  },
                },
              },
            ]
          : []),
        ...(parsedDateRange
          ? [
              {
                createdAt: {
                  gte: parsedDateRange.start,
                  lt: parsedDateRange.end,
                },
              },
            ]
          : []),
      ],
    };

    if (matchesLabel("Incomplete", safeSearch)) {
      searchFilter.OR?.push({
        OR: [
          {
            ficoInfo: null,
          },
          {
            propertyDetails: null,
          },
        ],
      });
    }

    if (searchDigits) {
      searchFilter.OR?.push(
        {
          prospectPhone: {
            contains: searchDigits,
          },
        },
        {
          prospectPhone: {
            contains: searchDigits.slice(-10),
          },
        },
      );
    }

    filters.push(searchFilter);
  }

  if (borrowerType) {
    filters.push({ borrowerType });
  }

  if (loanPurpose) {
    filters.push({ loanPurpose });
  }

  if (opportunityStatus) {
    filters.push(
      opportunityStatus === "INCOMPLETE"
        ? {
            OR: [
              {
                ficoInfo: null,
              },
              {
                propertyDetails: null,
              },
            ],
          }
        : opportunityStatus === "NOT_STARTED"
        ? { opportunityValue: null }
        : {
            opportunityValue: {
              is: {
                status: opportunityStatus,
              },
            },
          },
    );
  }

  const where: Prisma.ContactWhereInput = {
    status: ContactStatus.ACTIVE,
    ...(canViewAllContacts ? {} : { bdrId: profile.id }),
    AND: filters,
  };
  const orderBy = getOpportunityOrderBy(sort, safeSortDirection);

  return timed("getContactsNeedingOpportunityValue (cached)", () =>
   unstable_cache(
    async () => {
      const [contacts, totalCount] = await prisma.$transaction([
        prisma.contact.findMany({
          where,
          orderBy,
          skip: (safePage - 1) * safePageSize,
          take: safePageSize,
          select: {
            id: true,
            prospectName: true,
            prospectPhone: true,
            prospectEmail: true,
            borrowerType: true,
            loanPurpose: true,
            vesting: true,
            createdAt: true,
            bdr: {
              select: {
                fullName: true,
                email: true,
              },
            },
            ficoInfo: {
              select: {
                source: true,
                score: true,
              },
            },
            propertyDetails: {
              select: {
                id: true,
              },
            },
            opportunityValue: {
              select: {
                calculatedOpportunityValue: true,
                notMovingForwardReason: true,
                status: true,
              },
            },
          },
        }),
        prisma.contact.count({
          where,
        }),
      ]);

      return {
        contacts,
        totalCount,
        viewerRole,
      };
    },
    [
      `engagement-queue-${viewerRole}-${profile.id}-${safePage}-${safePageSize}-${safeSearch}-${sort}-${safeSortDirection}-${borrowerType ?? "all"}-${loanPurpose ?? "all"}-${opportunityStatus ?? "all"}`,
    ],
    {
      revalidate: 60,
      tags: ["engagement-queue", `engagement-queue-${profile.id}`],
    },
   )(),
  );
}

export type OpportunitySortKey =
  | "borrowerType"
  | "createdAt"
  | "createdBy"
  | "fico"
  | "loanPurpose"
  | "opportunityStatus"
  | "opportunityValue"
  | "phone"
  | "prospectName"
  | "updatedAt";

function getOpportunityOrderBy(
  sort: OpportunitySortKey,
  direction: Prisma.SortOrder,
): Prisma.ContactOrderByWithRelationInput[] {
  const fallback: Prisma.ContactOrderByWithRelationInput = {
    updatedAt: "desc",
  };

  switch (sort) {
    case "borrowerType":
      return [{ borrowerType: direction }, fallback];
    case "createdAt":
      return [{ createdAt: direction }, fallback];
    case "createdBy":
      return [{ bdr: { email: direction } }, fallback];
    case "fico":
      return [{ ficoInfo: { score: direction } }, fallback];
    case "loanPurpose":
      return [{ loanPurpose: direction }, fallback];
    case "opportunityStatus":
      return [{ opportunityValue: { status: direction } }, fallback];
    case "opportunityValue":
      return [
        { opportunityValue: { calculatedOpportunityValue: direction } },
        fallback,
      ];
    case "phone":
      return [{ prospectPhone: direction }, fallback];
    case "prospectName":
      return [{ prospectName: direction }, fallback];
    case "updatedAt":
    default:
      return [fallback];
  }
}

const borrowerTypeSearchLabels: Record<BorrowerType, string> = {
  [BorrowerType.PRIMARY]: "Primary",
  [BorrowerType.SECOND_HOME]: "Second Home",
  [BorrowerType.INVESTMENT]: "Investment",
  [BorrowerType.OTHER]: "Business",
};

const loanPurposeSearchLabels: Record<LoanPurpose, string> = {
  [LoanPurpose.PURCHASE]: "Purchase",
  [LoanPurpose.RATE_TERM_REFI]: "Rate/Term Refi",
  [LoanPurpose.CASH_OUT_REFI]: "Cash-Out Refi",
  [LoanPurpose.LIMITED_CASH_OUT]: "Limited Cash-Out",
};

const opportunityStatusSearchLabels: Record<OpportunityStatus, string> = {
  [OpportunityStatus.NOT_DECIDED]: "Still working it",
  [OpportunityStatus.READY_FOR_REVIEW]: "Ready for Review",
  [OpportunityStatus.NOT_MOVING_FORWARD]: "Not moving forward",
};

function enumValuesMatchingLabel<T extends string>(
  enumObject: Record<string, T>,
  labels: Record<T, string>,
  search: string,
) {
  return Object.values(enumObject).filter((value) =>
    matchesLabel(labels[value], search),
  );
}

function matchesLabel(label: string, search: string) {
  return label.toLowerCase().includes(search.toLowerCase());
}

function parseCurrencySearch(search: string) {
  const normalized = search.replace(/[$,\s]/g, "");

  if (!normalized || !/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return null;
  }

  return normalized;
}

function parseDateSearch(search: string) {
  const date = new Date(search);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
}

export async function getContactForEngagement(contactId: string) {
  const profile = await getCurrentProfile();

  if (!profile) {
    return null;
  }

  return unstable_cache(
    () =>
      prisma.contact.findFirst({
        where: {
          id: contactId,
          ...(profile.role === RoleType.OWNER ? {} : { bdrId: profile.id }),
        },
        select: {
          id: true,
          prospectName: true,
          prospectPhone: true,
          prospectEmail: true,
          borrowerType: true,
          loanPurpose: true,
          vesting: true,
          createdAt: true,
          coBorrowers: {
            orderBy: {
              order: "asc",
            },
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
              order: true,
            },
          },
          assets: {
            select: {
              id: true,
              type: true,
              amount: true,
            },
          },
          ficoInfo: {
            select: {
              source: true,
              score: true,
            },
          },
          propertyDetails: {
            select: {
              address: true,
              propertyType: true,
              propertyTaxesLastYear: true,
              propertyTaxesPresentYear: true,
              insuranceType: true,
              hoaName: true,
              hoaManagementInfo: true,
              additionalHoaFees: true,
            },
          },
          opportunityValue: {
            select: {
              propertyValue: true,
              purchasePrice: true,
              loanAmount: true,
              hasRealtor: true,
              calculatedOpportunityValue: true,
              status: true,
              notMovingForwardReason: true,
            },
          },
        },
      }),
    [`engagement-contact-${contactId}-${profile.role}-${profile.id}`],
    {
      revalidate: 60,
      tags: ["engagement-contact", `engagement-contact-${contactId}`],
    },
  )();
}
