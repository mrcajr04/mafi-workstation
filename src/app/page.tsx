import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PerformanceStatusChart } from "@/app/performance-status-chart";
import { formatCurrencyDisplay } from "@/lib/currency";
import { formatNumber } from "@/lib/number";
import {
  getPerformanceDashboardData,
  type PerformanceDashboardData,
} from "@/lib/queries/performance-dashboard";

export default async function Home() {
  const result = await getPerformanceDashboardData();

  if (!result.success) {
    return (
      <main className="mx-auto max-w-6xl">
        <p className="text-sm text-destructive">{result.error}</p>
      </main>
    );
  }

  const { data } = result;
  const scopeLabel =
    data.scope.type === "COMPANY_WIDE" ? "Company-wide" : "Your pipeline";

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6">
      <section className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-mafi-blue-primary">
            Performance Dashboard
          </p>
          <h1 className="mt-2 text-3xl font-bold text-mafi-text-dark">
            Welcome back{data.scope.profileName ? `, ${data.scope.profileName}` : ""}
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-mafi-text-mid">
            Track contact volume, opportunity value, wins, losses, and current
            pipeline movement.
          </p>
        </div>
        <span className="w-fit rounded-full border border-mafi-border bg-mafi-bg-light px-3 py-1 text-xs font-semibold text-mafi-blue-primary">
          {scopeLabel}
        </span>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <DashboardMetricCard
          eyebrow="This Week"
          primaryLabel="Contacts"
          primaryValue={formatNumber(data.contactsCreated.thisWeek.count)}
          secondaryLabel="Opportunities"
          secondaryValue={formatOpportunityMetric(
            data.opportunitiesCreated.thisWeek,
          )}
        />
        <DashboardMetricCard
          eyebrow="This Month"
          primaryLabel="Contacts"
          primaryValue={formatNumber(data.contactsCreated.thisMonth.count)}
          secondaryLabel="Opportunities"
          secondaryValue={formatOpportunityMetric(
            data.opportunitiesCreated.thisMonth,
          )}
        />
        <DashboardMetricCard
          eyebrow="All-Time"
          primaryLabel="Contacts"
          primaryValue={formatNumber(data.allTime.contacts.count)}
          secondaryLabel="Opportunities"
          secondaryValue={formatOpportunityMetric(data.allTime.opportunities)}
        />
        <DashboardMetricCard
          eyebrow="Wins"
          primaryLabel="Funded / Closed"
          primaryValue={formatNumber(data.winTotal.count)}
          secondaryLabel="Value"
          secondaryValue={formatCurrencyDisplay(data.winTotal.totalValue, "$0")}
          tone="success"
        />
        <DashboardMetricCard
          eyebrow="Lost"
          primaryLabel="Re-engagement"
          primaryValue={formatNumber(data.lostTotal.count)}
          secondaryLabel="Value"
          secondaryValue={formatCurrencyDisplay(data.lostTotal.totalValue, "$0")}
          tone="warning"
        />
      </section>

      <Card className="border-mafi-border bg-mafi-bg-white">
        <CardHeader className="border-b border-mafi-border bg-mafi-bg-light">
          <CardTitle className="text-mafi-blue-primary">
            Opportunities Breakdown
          </CardTitle>
          <p className="text-sm text-mafi-text-mid">
            Current pipeline grouped by status.
          </p>
        </CardHeader>
        <CardContent className="pt-5">
          <PerformanceStatusChart data={data.statusBreakdown} />
        </CardContent>
      </Card>
    </main>
  );
}

function DashboardMetricCard({
  eyebrow,
  primaryLabel,
  primaryValue,
  secondaryLabel,
  secondaryValue,
  tone = "neutral",
}: {
  eyebrow: string;
  primaryLabel: string;
  primaryValue: string;
  secondaryLabel: string;
  secondaryValue: string;
  tone?: "neutral" | "success" | "warning";
}) {
  const toneClass =
    tone === "success"
      ? "text-green-700"
      : tone === "warning"
        ? "text-amber-700"
        : "text-mafi-blue-primary";

  return (
    <Card className="border-mafi-border bg-mafi-bg-white shadow-sm">
      <CardContent className="space-y-4 p-4">
        <p
          className={`text-xs font-bold uppercase tracking-[0.16em] ${toneClass}`}
        >
          {eyebrow}
        </p>
        <div>
          <p className="text-xs font-semibold text-mafi-text-light">
            {primaryLabel}
          </p>
          <p className="mt-1 text-2xl font-bold text-mafi-text-dark">
            {primaryValue}
          </p>
        </div>
        <div className="rounded-md bg-mafi-bg-light px-3 py-2">
          <p className="text-xs font-semibold text-mafi-text-light">
            {secondaryLabel}
          </p>
          <p className="mt-1 text-sm font-bold text-mafi-text-dark">
            {secondaryValue}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function formatOpportunityMetric(
  metric: PerformanceDashboardData["allTime"]["opportunities"],
) {
  return `${formatNumber(metric.count)} / ${formatCurrencyDisplay(
    metric.totalValue,
    "$0",
  )}`;
}
