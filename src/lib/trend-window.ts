import type { DailyStatPoint } from "@/contracts/public-api";
import { formatAucklandDateKey } from "@/lib/auckland-time";
import { PACE_DAILY_TREND_DAYS } from "@/lib/pace-constants";
import {
  dailyTrendCoversDays,
  fillDailySeries,
  toTrendResult,
} from "@/lib/trend";
import type { TrendResult } from "@/lib/trend";

export { PACE_DAILY_TREND_DAYS };

export const sliceDays = (
  dailyTrend: DailyStatPoint[],
  days: number
): DailyStatPoint[] => fillDailySeries(dailyTrend, days).slice(-days);

export const sumWindow = (dailyTrend: DailyStatPoint[], days: number): number =>
  sliceDays(dailyTrend, days).reduce((sum, point) => sum + point.count, 0);

const hasComparablePriorWindow = (
  dailyTrend: DailyStatPoint[],
  days: number
): boolean => dailyTrendCoversDays(dailyTrend, days * 2);

export const comparePeriods = (
  dailyTrend: DailyStatPoint[],
  days: number
): TrendResult => {
  const span = sliceDays(dailyTrend, days * 2);
  const counts = span.map((point) => point.count);
  const current = counts.slice(-days).reduce((sum, value) => sum + value, 0);

  if (!hasComparablePriorWindow(dailyTrend, days)) {
    return { current, direction: "flat", percent: null, previous: 0 };
  }

  const previous = counts
    .slice(-days * 2, -days)
    .reduce((sum, value) => sum + value, 0);
  return toTrendResult(current, previous);
};

const labelsForSeries = (
  series: DailyStatPoint[],
  maxTicks: number
): string[] => {
  if (series.length === 0) {
    return [];
  }

  const tickCount = Math.min(series.length, maxTicks);
  const indices =
    series.length <= tickCount
      ? series.map((_, index) => index)
      : Array.from({ length: tickCount }, (_, index) =>
          Math.round((index / (tickCount - 1)) * (series.length - 1))
        );

  return indices.map((index) => {
    const point = series[index];
    if (point === undefined) {
      return "";
    }
    if (series.length > 60) {
      return formatAucklandDateKey(point.date, "MMM").toUpperCase();
    }
    if (series.length > 14) {
      return formatAucklandDateKey(point.date, "d MMM").toUpperCase();
    }
    return formatAucklandDateKey(point.date, "EEE").toUpperCase();
  });
};

export interface PaceWindowChart {
  values: number[];
  labels: string[];
}

const bucketWeekly = (series: DailyStatPoint[]): DailyStatPoint[] => {
  const weeks: DailyStatPoint[] = [];
  for (let index = 0; index < series.length; index += 7) {
    const chunk = series.slice(index, index + 7);
    const [first] = chunk;
    if (first === undefined) {
      continue;
    }
    weeks.push({
      count: chunk.reduce((sum, point) => sum + point.count, 0),
      date: first.date,
      totalCents: chunk.reduce((sum, point) => sum + point.totalCents, 0),
    });
  }
  return weeks;
};

const buildPaceWindow = (
  dailyTrend: DailyStatPoint[],
  windowDays: number,
  maxLabels: number,
  aggregate?: (series: DailyStatPoint[]) => DailyStatPoint[]
): PaceWindowChart => {
  const daily = sliceDays(dailyTrend, windowDays);
  const series = aggregate?.(daily) ?? daily;
  return {
    labels: labelsForSeries(series, maxLabels),
    values: series.map((point) => point.count),
  };
};

export interface PaceLiveValues {
  last7d: number;
  last30d: number;
  last365d?: number;
}

const pickValue = (liveValue: number, dailySum: number): number =>
  Math.max(liveValue, dailySum);

export const buildPacePanelData = (
  dailyTrend: DailyStatPoint[],
  live: PaceLiveValues,
  serverTrends?: PaceTrends | null
) => {
  const sum7 = sumWindow(dailyTrend, 7);
  const sum30 = sumWindow(dailyTrend, 30);
  const sum365 = sumWindow(dailyTrend, 365);

  const clientTrends: PaceTrends = {
    last30d: comparePeriods(dailyTrend, 30),
    last365d: comparePeriods(dailyTrend, 365),
    last7d: comparePeriods(dailyTrend, 7),
  };

  return {
    trends: serverTrends ?? clientTrends,
    values: {
      last30d: pickValue(live.last30d, sum30),
      last365d: pickValue(live.last365d ?? 0, sum365),
      last7d: pickValue(live.last7d, sum7),
    },
    windows: {
      last30d: buildPaceWindow(dailyTrend, 30, 5),
      last365d: buildPaceWindow(dailyTrend, 365, 6, bucketWeekly),
      last7d: buildPaceWindow(dailyTrend, 7, 7),
    } satisfies Record<string, PaceWindowChart>,
  };
};

export interface PaceTrends {
  last365d: TrendResult;
  last30d: TrendResult;
  last7d: TrendResult;
}

export type TrendMetric = "count" | "totalCents";

export interface BuildTrendWindowOptions {
  aggregateWeekly?: boolean;
  maxLabels: number;
}

export const buildTrendWindowChart = (
  dailyTrend: DailyStatPoint[],
  windowDays: number,
  metric: TrendMetric,
  options: BuildTrendWindowOptions | number
): PaceWindowChart => {
  const { aggregateWeekly, maxLabels } =
    typeof options === "number"
      ? { aggregateWeekly: windowDays > 90, maxLabels: options }
      : options;
  const aggregate = aggregateWeekly === true ? bucketWeekly : undefined;
  const daily = sliceDays(dailyTrend, windowDays);
  const series = aggregate?.(daily) ?? daily;
  return {
    labels: labelsForSeries(series, maxLabels),
    values: series.map((point) =>
      metric === "count" ? point.count : point.totalCents / 100
    ),
  };
};

export const sumTrendWindow = (
  dailyTrend: DailyStatPoint[],
  windowDays: number,
  metric: TrendMetric
): number => {
  const daily = sliceDays(dailyTrend, windowDays);
  if (metric === "count") {
    return daily.reduce((sum, point) => sum + point.count, 0);
  }
  return daily.reduce((sum, point) => sum + point.totalCents, 0) / 100;
};
