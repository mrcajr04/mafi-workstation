import Link from "next/link";
import { Prisma, RoleType } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { AuditLogList } from "@/app/audit-log/audit-log-list";
import { Card, CardContent } from "@/components/ui/card";
import { auditActionLabels, labelFromMap } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

const PAGE_SIZE = 50;

type AuditLogSearchParams = {
  action?: string;
  page?: string;
  userId?: string;
};

function formatTimestamp(value: Date) {
  return value.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function detailsJson(value: unknown) {
  if (!value) {
    return "No details.";
  }

  return JSON.stringify(value, null, 2);
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
    timestampLabel: formatTimestamp(log.timestamp),
    userFullName: log.user.fullName,
  }));
  const listPageKey = `${currentPage}:${selectedAction ?? "ALL"}:${selectedUserId ?? "ALL"}`;

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

      <form className="grid gap-3 rounded-md border border-mafi-border bg-mafi-bg-off p-4 sm:grid-cols-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
        <div className="space-y-1">
          <label
            className="text-xs font-semibold uppercase text-mafi-text-mid"
            htmlFor="action"
          >
            Action
          </label>
          <select
            className="h-10 w-full rounded-md border border-mafi-border bg-white px-3 text-sm text-mafi-text-dark"
            defaultValue={selectedAction ?? "ALL"}
            id="action"
            name="action"
          >
            <option value="ALL">All actions</option>
            {actionOptions.map((option) => (
              <option key={option.action} value={option.action}>
                {labelFromMap(option.action, auditActionLabels)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label
            className="text-xs font-semibold uppercase text-mafi-text-mid"
            htmlFor="userId"
          >
            User
          </label>
          <select
            className="h-10 w-full rounded-md border border-mafi-border bg-white px-3 text-sm text-mafi-text-dark"
            defaultValue={selectedUserId ?? "ALL"}
            id="userId"
            name="userId"
          >
            <option value="ALL">All users</option>
            {userOptions.map((option) => (
              <option key={option.userId} value={option.userId}>
                {option.user.fullName}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button
            className="h-10 rounded-md bg-mafi-blue-primary px-4 text-sm font-semibold text-white hover:bg-mafi-blue-dark"
            type="submit"
          >
            Apply filters
          </button>
        </div>
      </form>

      <Card className="border-mafi-border bg-mafi-bg-white">
        <CardContent className="p-0">
          {logs.length ? (
            <AuditLogList key={listPageKey} logs={logItems} />
          ) : (
            <div className="px-6 py-10 text-center text-sm text-mafi-text-mid">
              No audit log entries found.
            </div>
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
