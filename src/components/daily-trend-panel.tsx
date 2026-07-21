import { Banknote, TrendingUp } from "lucide-react";
import { lazy, Suspense, useMemo, useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { DailyStatPoint } from "@/contracts/public-api";
import { moneyFmt, numberFmt } from "@/lib/format";
import { PACE_DAILY_TREND_DAYS } from "@/lib/pace-constants";
import {
  buildTrendWindowChart,
  dailyTrendSpanDays,
  sumTrendWindow,
} from "@/lib/trend-window";
import type { TrendMetric } from "@/lib/trend-window";
import { cn } from "@/lib/utils";

const TrendChart = lazy(async () => {
  const module = await import("@/components/trend-chart");
  return { default: module.TrendChart };
});

type TrendWindow = "7" | "30" | "90" | "365" | "all";

const WINDOW_DAYS: Record<TrendWindow, number> = {
  "30": 30,
  "365": 365,
  "7": 7,
  "90": 90,
  all: PACE_DAILY_TREND_DAYS,
};

const WINDOW_LABELS: Record<TrendWindow, string> = {
  "30": "30 days",
  "365": "12 months",
  "7": "7 days",
  "90": "90 days",
  all: "Full history",
};

const isTrendWindow = (value: string): value is TrendWindow =>
  value === "7" ||
  value === "30" ||
  value === "90" ||
  value === "365" ||
  value === "all";

const isTrendMetric = (value: string): value is TrendMetric =>
  value === "count" || value === "totalCents";

const maxLabelsForWindow = (window: TrendWindow): number => {
  if (window === "all") {
    return 8;
  }
  if (window === "365") {
    return 7;
  }
  if (window === "90") {
    return 6;
  }
  if (window === "7") {
    return 7;
  }
  return 7;
};

const formatTrendTotal = (metric: TrendMetric, total: number): string => {
  if (metric === "totalCents") {
    return moneyFmt.format(total);
  }
  return numberFmt.format(total);
};

const formatTrendAverage = (metric: TrendMetric, average: number): string => {
  if (metric === "totalCents") {
    return moneyFmt.format(average);
  }
  return numberFmt.format(Math.round(average));
};

interface DailyTrendPanelProps {
  dailyTrend: DailyStatPoint[];
  isLoading?: boolean;
}

const CHART_MIN_HEIGHT = "min-h-[280px]";

const ChartSkeleton = () => (
  <Skeleton
    className={cn("w-full flex-1 rounded-[4px]", CHART_MIN_HEIGHT)}
    aria-hidden="true"
  />
);

export const DailyTrendPanel = ({
  dailyTrend,
  isLoading,
}: DailyTrendPanelProps) => {
  const loading = isLoading === true;
  const [window, setWindow] = useState<TrendWindow>("365");
  const [metric, setMetric] = useState<TrendMetric>("count");

  const windowDays =
    window === "all" ? dailyTrendSpanDays(dailyTrend) : WINDOW_DAYS[window];
  const maxLabels = maxLabelsForWindow(window);

  const chart = useMemo(
    () =>
      buildTrendWindowChart(dailyTrend, windowDays, metric, {
        aggregateWeekly: false,
      }),
    [dailyTrend, metric, windowDays]
  );

  const total = useMemo(
    () => sumTrendWindow(dailyTrend, windowDays, metric),
    [dailyTrend, metric, windowDays]
  );

  const average = useMemo(() => {
    const pointCount = chart.values.length;
    if (pointCount === 0) {
      return 0;
    }
    return total / pointCount;
  }, [chart.values.length, total]);

  const pointLabel = window === "all" ? "Per day in range" : "Daily average";

  return (
    <Card
      className="overflow-hidden py-0"
      aria-label="Daily infringement trend"
    >
      <CardHeader className="gap-3 border-b border-border p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp
                className="size-4 text-[var(--ring)]"
                aria-hidden="true"
              />
              Activity over time
            </CardTitle>
            <CardDescription>
              Compare daily ticket volume or fine value across the selected
              period — {numberFmt.format(chart.values.length)} data points.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Tabs
              value={metric}
              onValueChange={(value: string) => {
                if (isTrendMetric(value)) {
                  setMetric(value);
                }
              }}
            >
              <TabsList className="h-8">
                <TabsTrigger value="count" className="px-2.5 text-xs">
                  Tickets
                </TabsTrigger>
                <TabsTrigger
                  value="totalCents"
                  className="gap-1 px-2.5 text-xs"
                >
                  <Banknote className="size-3" aria-hidden="true" />
                  Fines
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Tabs
              value={window}
              onValueChange={(value: string) => {
                if (isTrendWindow(value)) {
                  setWindow(value);
                }
              }}
            >
              <TabsList className="h-8">
                <TabsTrigger value="7" className="px-2.5 text-xs">
                  7D
                </TabsTrigger>
                <TabsTrigger value="30" className="px-2.5 text-xs">
                  30D
                </TabsTrigger>
                <TabsTrigger value="90" className="px-2.5 text-xs">
                  90D
                </TabsTrigger>
                <TabsTrigger value="365" className="px-2.5 text-xs">
                  1Y
                </TabsTrigger>
                <TabsTrigger value="all" className="px-2.5 text-xs">
                  All
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardHeader>

      <CardContent className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_10.5rem] lg:items-stretch">
        <div className={cn("flex min-w-0 flex-col", CHART_MIN_HEIGHT)}>
          {loading ? (
            <ChartSkeleton />
          ) : (
            <Suspense fallback={<ChartSkeleton />}>
              <TrendChart
                className="h-full min-h-0 w-full flex-1"
                dates={chart.dates}
                maxXLabels={maxLabels}
                revealDelay={120}
                valueStyle={metric === "totalCents" ? "currency" : "number"}
                values={chart.values}
                xLabels={chart.labels}
              />
            </Suspense>
          )}
        </div>

        <dl className="grid grid-cols-2 gap-2 self-end lg:grid-cols-1 lg:self-stretch">
          <div className="rounded-[6px] border border-border bg-muted/40 px-3 py-2">
            <dt className="text-[11px] text-muted-foreground">
              {WINDOW_LABELS[window]} total
            </dt>
            <dd className="mt-0.5 font-mono text-lg font-semibold tabular-nums tracking-[-0.03em]">
              {loading ? (
                <Skeleton className="h-6 w-20" />
              ) : (
                formatTrendTotal(metric, total)
              )}
            </dd>
          </div>
          <div className="rounded-[6px] border border-border bg-muted/40 px-3 py-2">
            <dt className="text-[11px] text-muted-foreground">{pointLabel}</dt>
            <dd
              className={cn(
                "mt-0.5 font-mono text-lg font-semibold tabular-nums tracking-[-0.03em]"
              )}
            >
              {loading ? (
                <Skeleton className="h-6 w-16" />
              ) : (
                formatTrendAverage(metric, average)
              )}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
};
