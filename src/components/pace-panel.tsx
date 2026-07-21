import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { lazy, Suspense, useMemo } from "react";

import { StatPillLoading } from "@/components/data-skeletons";
import type { DailyStatPoint } from "@/contracts/public-api";
import { useAnimatedNumber } from "@/hooks/use-animated-number";
import { numberFmt } from "@/lib/format";
import type { TrendResult } from "@/lib/trend";
import { buildPacePanelData } from "@/lib/trend-window";
import type { PaceTrends } from "@/lib/trend-window";
import { cn } from "@/lib/utils";

const TrendChart = lazy(async () => {
  const module = await import("@/components/trend-chart");
  return { default: module.TrendChart };
});

const formatTrendPercent = (percent: number | null): string => {
  if (percent === null) {
    return "—";
  }
  let sign = "";
  if (percent > 0) {
    sign = "+";
  } else if (percent < 0) {
    sign = "−";
  }
  return `${sign}${Math.abs(percent).toFixed(1)}%`;
};

const TrendBadge = ({ trend }: { trend: TrendResult }) => {
  const isDown = trend.direction === "down";
  const isUp = trend.direction === "up";
  let Icon = Minus;
  if (isUp) {
    Icon = ArrowUpRight;
  } else if (isDown) {
    Icon = ArrowDownRight;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-medium tabular-nums",
        !isUp && !isDown && "text-muted-foreground",
        isDown && "text-[var(--chart-2)]",
        isUp && "text-destructive"
      )}
    >
      <Icon className="size-3" aria-hidden="true" />
      {formatTrendPercent(trend.percent)}
    </span>
  );
};

interface PaceStatBoxProps {
  label: string;
  value: number;
  trend: TrendResult;
  chartValues: number[];
  chartLabels: string[];
  chartRevealDelay?: number;
}

const PaceStatBox = ({
  label,
  value,
  trend,
  chartValues,
  chartLabels,
  chartRevealDelay = 0,
}: PaceStatBoxProps) => {
  const animated = useAnimatedNumber(value, {
    duration: 500,
    initialDuration: 1000,
  });

  return (
    <div className="min-w-0 rounded-[6px] border border-border bg-background px-3 py-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] text-muted-foreground">{label}</span>
        <TrendBadge trend={trend} />
      </div>
      <span className="mt-0.5 block min-h-[30px] font-mono text-3xl font-semibold leading-none tabular-nums tracking-[-0.04em]">
        {numberFmt.format(animated)}
      </span>
      <Suspense
        fallback={
          <div className="mt-1.5 h-12 animate-pulse rounded bg-muted/40" />
        }
      >
        <TrendChart
          values={chartValues}
          xLabels={chartLabels}
          className="mt-1.5"
          compact
          revealDelay={chartRevealDelay}
        />
      </Suspense>
    </div>
  );
};

interface PacePanelProps {
  dailyTrend: DailyStatPoint[];
  last7d: number;
  last30d: number;
  last365d: number;
  paceTrends?: PaceTrends;
  isLoading?: boolean;
}

export const PacePanel = ({
  dailyTrend,
  last7d,
  last30d,
  last365d,
  paceTrends,
  isLoading,
}: PacePanelProps) => {
  const loading = isLoading === true;
  const panel = useMemo(
    () =>
      buildPacePanelData(
        dailyTrend,
        {
          last30d,
          last365d,
          last7d,
        },
        paceTrends
      ),
    [dailyTrend, last365d, last30d, last7d, paceTrends]
  );

  return (
    <aside className="border-t border-border p-3 sm:p-4 lg:border-t-0 lg:border-l">
      <div className="mb-2 flex min-h-5 items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-primary">Recent activity</h2>
        <span className="text-[11px] text-muted-foreground">Live snapshot</span>
      </div>
      <div className="grid grid-cols-1 gap-1.5 md:grid-cols-3 lg:grid-cols-1">
        {loading ? (
          <>
            <StatPillLoading label="Last 7D" />
            <StatPillLoading label="Last 30D" />
            <StatPillLoading label="Last 365D" />
          </>
        ) : (
          <>
            <PaceStatBox
              label="Last 7D"
              value={panel.values.last7d}
              trend={panel.trends.last7d}
              chartValues={panel.windows.last7d.values}
              chartLabels={panel.windows.last7d.labels}
              chartRevealDelay={280}
            />
            <PaceStatBox
              label="Last 30D"
              value={panel.values.last30d}
              trend={panel.trends.last30d}
              chartValues={panel.windows.last30d.values}
              chartLabels={panel.windows.last30d.labels}
              chartRevealDelay={460}
            />
            <PaceStatBox
              label="Last 365D"
              value={panel.values.last365d}
              trend={panel.trends.last365d}
              chartValues={panel.windows.last365d.values}
              chartLabels={panel.windows.last365d.labels}
              chartRevealDelay={640}
            />
          </>
        )}
      </div>
    </aside>
  );
};
