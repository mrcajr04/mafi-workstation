"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { formatNumber } from "@/lib/number";
import type { PerformanceDashboardData } from "@/lib/queries/performance-dashboard";

type StatusBreakdown = PerformanceDashboardData["statusBreakdown"];

const statusColors: Record<StatusBreakdown[number]["key"], string> = {
  IN_PROCESSING: "#2F75C8",
  IN_REVIEW: "#5E86B3",
  IN_SCENARIO_REVIEW: "#2D5F9A",
  LOST: "#C94A4A",
  NOT_STARTED: "#A7B4C4",
  RE_ENGAGEMENT: "#D99A2B",
  WON: "#2E9D63",
};

export function PerformanceStatusChart({
  data,
}: {
  data: StatusBreakdown;
}) {
  const chartData = data.filter((item) => item.count > 0);
  const hasData = chartData.length > 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="h-72 min-h-72">
        {hasData ? (
          <ResponsiveContainer height="100%" width="100%">
            <PieChart>
              <Pie
                cx="50%"
                cy="50%"
                data={chartData}
                dataKey="count"
                innerRadius={58}
                nameKey="label"
                outerRadius={98}
                paddingAngle={2}
              >
                {chartData.map((entry) => (
                  <Cell
                    fill={statusColors[entry.key]}
                    key={`slice-${entry.key}`}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [formatNumber(Number(value)), "Count"]}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-mafi-border text-sm text-mafi-text-mid">
            No pipeline activity yet.
          </div>
        )}
      </div>

      <div className="space-y-2">
        {data.map((item) => (
          <div
            className="flex items-center justify-between gap-3 rounded-md bg-mafi-bg-light px-3 py-2 text-sm"
            key={item.key}
          >
            <span className="flex min-w-0 items-center gap-2 text-mafi-text-mid">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: statusColors[item.key] }}
              />
              <span className="truncate">{item.label}</span>
            </span>
            <span className="font-semibold text-mafi-text-dark">
              {formatNumber(item.count)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
