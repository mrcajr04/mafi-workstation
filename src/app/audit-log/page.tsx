import Link from "next/link";
import { Prisma, RoleType } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { AuditLogList } from "@/app/audit-log/audit-log-list";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatTimestampForDisplay,
  recentRelativeTime,
} from "@/lib/dates";
import { auditActionLabels, labelFromMap } from "@/lib/labels";
import { formatUSPhone, isValidUSPhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

const PAGE_SIZE = 50;

type AuditLogSearchParams = {
  action?: string;
  page?: string;
  userId?: string;
};

function formatPhoneValuesInDetails(value: unknown, key = ""): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => formatPhoneValuesInDetails(item));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entryValue]) => [
        entryKey,
        formatPhoneValuesInDetails(entryValue, entryKey),
      ]),
    );
  }

  if (
    typeof value === "string" &&
    /phone|whatsapp/i.test(key) &&
    isValidUSPhone(value)
  ) {
    return formatUSPhone(value);
  }

  return value;
}

function detailsJson(value: unknown) {
  if (!value) {
    return "No details.";
  }

  return JSON.stringify(formatPhoneValuesInDetails(value), null, 2);
}

function pageHref(
  page: number,
  filters: {
    action?: string;
    userId?: string;
  },
) {
  const params = new URLSearchParams();
  params.set("page", String(page));

  if (filters.action) {
    params.set("action", filters.action);
  }

  if (filters.userId) {
    params.set("userId", filters.userId);
  }

  return `/audit-log?${params.toString()}`;
}

function getCachedAuditLogData({
  currentPage,
  where,
}: {
  currentPage: number;
  where: Prisma.AuditLogWhereInput;
}) {
  return unstable_cache(
    () =>
      Promise.all([
        prisma.auditLog.findMany({
          where,
          include: {
            user: {
              select: {
                fullName: true,
              },
            },
          },
          orderBy: {
            timestamp: "desc",
          },
          skip: (currentPage - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
        }),
        prisma.auditLog.count({
          where,
        }),
        prisma.auditLog.groupBy({
          by: ["action"],
          orderBy: {
            action: "asc",
          },
        }),
        prisma.auditLog.findMany({
          distinct: ["userId"],
          include: {
            user: {
              select: {
                fullName: true,
              },
            },
          },
          orderBy: {
            user: {
              fullName: "asc",
            },
          },
        }),
      ]),
    [`audit-log-${currentPage}-${JSON.stringify(where)}`],
    {
      revalidate: 15,
    },
  )();
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<AuditLogSearchParams>;
}) {
  const access = await requireRole([
    RoleType.COMPLIANCE_OFFICER,
    RoleType.OWNER,
  ]);

  if (!access.success) {
    return (
      <main className="mx-auto max-w-6xl">
        <p className="text-sm text-destructive">
          Not authorized. Audit Log is available only to Compliance Officers and
          Owners.
        </p>
      </main>
    );
  }

  const { action, page: pageParam, userId } = await searchParams;
  const currentPage = Math.max(1, Number(pageParam ?? 1) || 1);
  const selectedAction = action && action !== "ALL" ? action : undefined;
  const selectedUserId = userId && userId !== "ALL" ? userId : undefined;
  const where: Prisma.AuditLogWhereInput = {
    ...(selectedAction ? { action: selectedAction } : {}),
    ...(selectedUserId ? { userId: selectedUserId } : {}),
  };

  const [logs, totalCount, actionOptions, userOptions] =
    await getCachedAuditLogData({
      currentPage,
      where,
    });

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const firstRecordNumber =
    totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const lastRecordNumber = Math.min(currentPage * PAGE_SIZE, totalCount);
  const logItems = logs.map((log) => ({
    actionLabel: labelFromMap(log.action, auditActionLabels),
    detailsText: detailsJson(log.fieldDiffs),
    entityId: log.entityId,
    entityType: log.entityType,
    id: log.id,
    timestampLabel: formatTimestampForDisplay(log.timestamp),
    timestampRelativeLabel: recentRelativeTime(log.timestamp),
    userFullName: log.user.fullName,
  }));
  const listPageKey = `${currentPage}:${selectedAction ?? "ALL"}:${selectedUserId ?? "ALL"}`;
  const actionFilterOptions = actionOptions.map((option) => ({
    label: labelFromMap(option.action, auditActionLabels),
    value: option.action,
  }));
  const userFilterOptions = userOptions.map((option) => ({
    label: option.user.fullName,
    value: option.userId,
  }));

  return (
    <main className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-mafi-blue-primary">
          Compliance
        </p>
        <h1 className="mt-2 text-3xl font-bold text-mafi-text-dark">
          Audit Log
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-mafi-text-mid">
          Review read-only activity across protected workstation workflows.
        </p>
      </div>

      <Card className="border-mafi-border bg-mafi-bg-white">
        <CardContent className="p-0">
          {logs.length ? (
            <AuditLogList
              actionOptions={actionFilterOptions}
              key={listPageKey}
              logs={logItems}
              selectedAction={selectedAction}
              selectedUserId={selectedUserId}
              userOptions={userFilterOptions}
            />
          ) : (
            <>
              <AuditLogList
                actionOptions={actionFilterOptions}
                key={listPageKey}
                logs={logItems}
                selectedAction={selectedAction}
                selectedUserId={selectedUserId}
                userOptions={userFilterOptions}
              />
              <div className="px-6 py-10 text-center text-sm text-mafi-text-mid">
                No audit log entries found.
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
                {currentPage > 1 ? (
                  <Link
                    aria-label="Previous page"
                    className="inline-flex size-8 items-center justify-center rounded-md text-mafi-text-mid hover:bg-mafi-bg-light hover:text-mafi-blue-primary"
                    href={pageHref(currentPage - 1, {
                      action: selectedAction,
                      userId: selectedUserId,
                    })}
                  >
                    {"<"}
                  </Link>
                ) : (
                  <span className="inline-flex size-8 items-center justify-center rounded-md text-mafi-text-light">
                    {"<"}
                  </span>
                )}
                {currentPage < totalPages ? (
                  <Link
                    aria-label="Next page"
                    className="inline-flex size-8 items-center justify-center rounded-md text-mafi-text-mid hover:bg-mafi-bg-light hover:text-mafi-blue-primary"
                    href={pageHref(currentPage + 1, {
                      action: selectedAction,
                      userId: selectedUserId,
                    })}
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
    </main>
  );
}
