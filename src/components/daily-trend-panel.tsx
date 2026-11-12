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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
  Object.hasOwn(WINDOW_LABELS, value);

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

const CHART_MIN_HEIGHT = "min-h-[320px]";

const ChartSkeleton = () => (
  <Skeleton
    className={cn("w-full flex-1", CHART_MIN_HEIGHT)}
    aria-hidden="true"
  />
);

/**
 * Display daily volume and selectable reporting periods.
 * @returns The rendered interface for the supplied data.
 */
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

  const hasRecordsInWindow = dailyTrend.some(
    (point) => point.date >= (chart.dates[0] ?? "") && point.count > 0
  );

  const renderChart = () => {
    if (loading) {
      return <ChartSkeleton />;
    }

    if (!hasRecordsInWindow) {
      return (
        <div className="text-muted-foreground flex min-h-[320px] flex-col items-center justify-center gap-2 text-center text-sm">
          <p className="text-foreground font-medium">
            No records in this date range
          </p>
          <p>Choose a longer range to see the available history.</p>
        </div>
      );
    }

    return (
      <Suspense fallback={<ChartSkeleton />}>
        <TrendChart
          className="h-full min-h-0 w-full flex-1"
          dates={chart.dates}
          maxXLabels={maxLabels}
          valueStyle={metric === "totalCents" ? "currency" : "number"}
          values={chart.values}
          xLabels={chart.labels}
        />
      </Suspense>
    );
  };

  const pointLabel = window === "all" ? "Per day in range" : "Daily average";

  return (
    <Card
      variant="panel"
      className="overflow-hidden"
      aria-label="Daily infringement trend"
    >
      <CardHeader variant="responsive">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-1">
            <CardTitle icon>
              <TrendingUp className="text-ring size-4" aria-hidden="true" />
              <h2 className="text-lg">Daily infringements</h2>
            </CardTitle>
            <CardDescription>
              Every day in the selected window —{" "}
              {numberFmt.format(chart.values.length)} data points.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ToggleGroup
              aria-label="Trend metric"
              value={[metric]}
              onValueChange={(values: string[]) => {
                const [value] = values;

                if (value !== undefined && isTrendMetric(value)) {
                  setMetric(value);
                }
              }}
            >
              <ToggleGroupItem value="count">Tickets</ToggleGroupItem>
              <ToggleGroupItem value="totalCents">
                <Banknote data-icon="inline-start" aria-hidden="true" />
                Fines
              </ToggleGroupItem>
            </ToggleGroup>
            <ToggleGroup
              aria-label="Trend window"
              value={[window]}
              onValueChange={(values: string[]) => {
                const [value] = values;

                if (value !== undefined && isTrendWindow(value)) {
                  setWindow(value);
                }
              }}
            >
              <ToggleGroupItem value="7">7D</ToggleGroupItem>
              <ToggleGroupItem value="30">30D</ToggleGroupItem>
              <ToggleGroupItem value="90">90D</ToggleGroupItem>
              <ToggleGroupItem value="365">1Y</ToggleGroupItem>
              <ToggleGroupItem value="all">All</ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </CardHeader>

      <CardContent variant="responsive">
        <div className={cn("flex min-w-0 flex-col", CHART_MIN_HEIGHT)}>
          {renderChart()}
        </div>

        <dl className="border-border grid grid-cols-2 gap-4 border-t pt-4">
          <div className="px-1 py-2">
            <dt className="text-muted-foreground text-xs">
              {WINDOW_LABELS[window]} total
            </dt>
            <dd className="mt-0.5 font-mono text-lg font-semibold tracking-tight tabular-nums">
              {loading ? (
                <Skeleton className="h-6 w-20" />
              ) : (
                formatTrendTotal(metric, total)
              )}
            </dd>
          </div>
          <div className="px-1 py-2">
            <dt className="text-muted-foreground text-xs">{pointLabel}</dt>
            <dd
              className={cn(
                "mt-0.5 font-mono text-lg font-semibold tracking-tight tabular-nums"
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
