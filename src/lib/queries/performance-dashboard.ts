import { ContactStatus, Prisma, RoleType } from "@prisma/client";
import { MLG_TIME_ZONE } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

type DashboardScope =
  | "OWN_BDR_PIPELINE"
  | "OWN_PROCESSOR_PIPELINE"
  | "COMPANY_WIDE";

type CountMetric = {
  count: number;
};

type ValueMetric = {
  count: number;
  totalValue: number;
};

export type PerformanceDashboardData = {
  allTime: {
    contacts: CountMetric;
    opportunities: ValueMetric;
  };
  contactsCreated: {
    thisMonth: CountMetric;
    thisWeek: CountMetric;
  };
  generatedAt: string;
  lostTotal: ValueMetric;
  opportunitiesCreated: {
    thisMonth: ValueMetric;
    thisWeek: ValueMetric;
  };
  scope: {
    profileName: string;
    profileId: string;
    role: RoleType;
    type: DashboardScope;
  };
  statusBreakdown: Array<{
    count: number;
    key:
      | "NOT_STARTED"
      | "IN_REVIEW"
      | "IN_SCENARIO_REVIEW"
      | "IN_PROCESSING"
      | "WON"
      | "LOST"
      | "RE_ENGAGEMENT";
    label: string;
  }>;
  winTotal: ValueMetric;
};

type PerformanceDashboardResult =
  | { success: true; data: PerformanceDashboardData }
  | { success: false; error: string };

const dashboardRoles = [
  RoleType.BDR,
  RoleType.COMPLIANCE_OFFICER,
  RoleType.LICENSED_LO,
  RoleType.LOAN_PROCESSOR,
  RoleType.OWNER,
];

function decimalToNumber(
  value: Prisma.Decimal | number | string | null | undefined,
) {
  return value == null ? 0 : Number(value);
}

function valueMetric(
  count: number,
  aggregate: {
    _sum: {
      calculatedOpportunityValue: Prisma.Decimal | null;
    };
  },
): ValueMetric {
  return {
    count,
    totalValue: decimalToNumber(aggregate._sum.calculatedOpportunityValue),
  };
}

function startOfWeek(date: Date) {
  const localParts = getLocalDateParts(date);
  const dayIndex = localParts.weekday;
  const mondayOffset = dayIndex === 0 ? -6 : 1 - dayIndex;
  const localDate = new Date(
    Date.UTC(localParts.year, localParts.month - 1, localParts.day),
  );
  localDate.setUTCDate(localDate.getUTCDate() + mondayOffset);

  return zonedTimeToUtcStartOfDay(
    localDate.getUTCFullYear(),
    localDate.getUTCMonth() + 1,
    localDate.getUTCDate(),
  );
}

function startOfMonth(date: Date) {
  const localParts = getLocalDateParts(date);

  return zonedTimeToUtcStartOfDay(localParts.year, localParts.month, 1);
}

function getLocalDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "numeric",
    timeZone: MLG_TIME_ZONE,
    weekday: "short",
    year: "numeric",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    day: Number(value("day")),
    month: Number(value("month")),
    weekday: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
      value("weekday"),
    ),
    year: Number(value("year")),
  };
}

function zonedTimeToUtcStartOfDay(year: number, month: number, day: number) {
  const utcGuess = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  const offset = getTimeZoneOffsetMs(utcGuess);

  return new Date(utcGuess.getTime() - offset);
}

function getTimeZoneOffsetMs(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "2-digit",
    second: "2-digit",
    timeZone: MLG_TIME_ZONE,
    year: "numeric",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "0";
  const asUtc = Date.UTC(
    Number(value("year")),
    Number(value("month")) - 1,
    Number(value("day")),
    Number(value("hour")),
    Number(value("minute")),
    Number(value("second")),
  );

  return asUtc - date.getTime();
}

function contactScopeForRole(
  profileId: string,
  role: RoleType,
): {
  scope: DashboardScope;
  where: Prisma.ContactWhereInput;
} {
  if (role === RoleType.BDR) {
    return {
      scope: "OWN_BDR_PIPELINE" satisfies DashboardScope,
      where: {
        bdrId: profileId,
      } satisfies Prisma.ContactWhereInput,
    };
  }

  if (role === RoleType.LOAN_PROCESSOR) {
    return {
      scope: "OWN_PROCESSOR_PIPELINE" satisfies DashboardScope,
      where: {
        OR: [{ bdrId: profileId }, { assignedLOId: profileId }],
      } satisfies Prisma.ContactWhereInput,
    };
  }

  return {
    scope: "COMPANY_WIDE" satisfies DashboardScope,
    where: {} satisfies Prisma.ContactWhereInput,
  };
}

function opportunityWhere(
  contactWhere: Prisma.ContactWhereInput,
  createdAt?: Prisma.DateTimeFilter,
): Prisma.OpportunityValueWhereInput {
  return {
    ...(createdAt ? { createdAt } : {}),
    contact: {
      is: contactWhere,
    },
  };
}

function contactStatusWhere(
  contactWhere: Prisma.ContactWhereInput,
  status: ContactStatus,
) {
  return {
    ...contactWhere,
    status,
  } satisfies Prisma.ContactWhereInput;
}

export async function getPerformanceDashboardData(
  now = new Date(),
): Promise<PerformanceDashboardResult> {
  const access = await requireRole(dashboardRoles);

  if (!access.success) {
    return {
      success: false,
      error: access.error,
    };
  }

  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);
  const { scope, where: contactWhere } = contactScopeForRole(
    access.data.id,
    access.data.role,
  );
  const opportunityAllTimeWhere = opportunityWhere(contactWhere);
  const opportunityThisWeekWhere = opportunityWhere(contactWhere, {
    gte: weekStart,
  });
  const opportunityThisMonthWhere = opportunityWhere(contactWhere, {
    gte: monthStart,
  });
  const wonContactWhere = contactStatusWhere(contactWhere, ContactStatus.WON);
  const lostContactWhere = contactStatusWhere(
    contactWhere,
    ContactStatus.RE_ENGAGEMENT,
  );

  const [
    contactsThisWeek,
    contactsThisMonth,
    allTimeContacts,
    opportunitiesThisWeek,
    opportunitiesThisMonth,
    allTimeOpportunities,
    winContacts,
    winOpportunities,
    lostContacts,
    lostOpportunities,
    notStartedContacts,
    inReviewContacts,
    groupedStatuses,
  ] = await Promise.all([
    prisma.contact.count({
      where: {
        ...contactWhere,
        createdAt: {
          gte: weekStart,
        },
      },
    }),
    prisma.contact.count({
      where: {
        ...contactWhere,
        createdAt: {
          gte: monthStart,
        },
      },
    }),
    prisma.contact.count({
      where: contactWhere,
    }),
    prisma.opportunityValue.aggregate({
      _count: {
        _all: true,
      },
      _sum: {
        calculatedOpportunityValue: true,
      },
      where: opportunityThisWeekWhere,
    }),
    prisma.opportunityValue.aggregate({
      _count: {
        _all: true,
      },
      _sum: {
        calculatedOpportunityValue: true,
      },
      where: opportunityThisMonthWhere,
    }),
    prisma.opportunityValue.aggregate({
      _count: {
        _all: true,
      },
      _sum: {
        calculatedOpportunityValue: true,
      },
      where: opportunityAllTimeWhere,
    }),
    prisma.contact.count({
      where: wonContactWhere,
    }),
    prisma.opportunityValue.aggregate({
      _sum: {
        calculatedOpportunityValue: true,
      },
      where: opportunityWhere(wonContactWhere),
    }),
    prisma.contact.count({
      where: lostContactWhere,
    }),
    prisma.opportunityValue.aggregate({
      _sum: {
        calculatedOpportunityValue: true,
      },
      where: opportunityWhere(lostContactWhere),
    }),
    prisma.contact.count({
      where: {
        ...contactWhere,
        opportunityValue: null,
        status: ContactStatus.ACTIVE,
      },
    }),
    prisma.contact.count({
      where: {
        ...contactWhere,
        opportunityValue: {
          isNot: null,
        },
        status: ContactStatus.ACTIVE,
      },
    }),
    prisma.contact.groupBy({
      _count: {
        _all: true,
      },
      by: ["status"],
      where: {
        ...contactWhere,
        status: {
          not: ContactStatus.ACTIVE,
        },
      },
    }),
  ]);

  const statusCounts = new Map<ContactStatus, number>(
    groupedStatuses.map((group) => [group.status, group._count._all]),
  );

  return {
    success: true,
    data: {
      allTime: {
        contacts: {
          count: allTimeContacts,
        },
        opportunities: valueMetric(
          allTimeOpportunities._count._all,
          allTimeOpportunities,
        ),
      },
      contactsCreated: {
        thisMonth: {
          count: contactsThisMonth,
        },
        thisWeek: {
          count: contactsThisWeek,
        },
      },
      generatedAt: now.toISOString(),
      lostTotal: {
        count: lostContacts,
        totalValue: decimalToNumber(
          lostOpportunities._sum.calculatedOpportunityValue,
        ),
      },
      opportunitiesCreated: {
        thisMonth: valueMetric(
          opportunitiesThisMonth._count._all,
          opportunitiesThisMonth,
        ),
        thisWeek: valueMetric(
          opportunitiesThisWeek._count._all,
          opportunitiesThisWeek,
        ),
      },
      scope: {
        profileName: access.data.fullName,
        profileId: access.data.id,
        role: access.data.role,
        type: scope,
      },
      statusBreakdown: [
        {
          count: notStartedContacts,
          key: "NOT_STARTED",
          label: "Not started",
        },
        {
          count: inReviewContacts,
          key: "IN_REVIEW",
          label: "In review",
        },
        {
          count: statusCounts.get(ContactStatus.IN_SCENARIO_REVIEW) ?? 0,
          key: ContactStatus.IN_SCENARIO_REVIEW,
          label: "In scenario review",
        },
        {
          count: statusCounts.get(ContactStatus.IN_PROCESSING) ?? 0,
          key: ContactStatus.IN_PROCESSING,
          label: "In processing",
        },
        {
          count: statusCounts.get(ContactStatus.WON) ?? 0,
          key: ContactStatus.WON,
          label: "Won",
        },
        {
          count: statusCounts.get(ContactStatus.RE_ENGAGEMENT) ?? 0,
          key: ContactStatus.RE_ENGAGEMENT,
          label: "Re-engagement",
        },
        {
          count: statusCounts.get(ContactStatus.LOST) ?? 0,
          key: ContactStatus.LOST,
          label: "Lost",
        },
      ],
      winTotal: {
        count: winContacts,
        totalValue: decimalToNumber(
          winOpportunities._sum.calculatedOpportunityValue,
        ),
      },
    },
  };
}
