import { format, parseISO } from "date-fns";

import type { DailyStatPoint } from "@/client/api";

import { PACE_DAILY_TREND_DAYS } from "./pace-constants";
import { dailyTrendCoversDays, fillDailySeries, toTrendResult } from "./trend";
import type { TrendResult } from "./trend";

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
      return format(parseISO(point.date), "MMM").toUpperCase();
    }
    if (series.length > 14) {
      return format(parseISO(point.date), "d MMM").toUpperCase();
    }
    return format(parseISO(point.date), "EEE").toUpperCase();
  });
};

export interface PaceWindowChart {
  values: number[];
  labels: string[];
}

export interface PaceLiveValues {
  last7d: number;
  last30d: number;
  last365d?: number;
}

export const buildPacePanelData = (
  dailyTrend: DailyStatPoint[],
  live: PaceLiveValues,
  serverTrends?: PaceTrends | null
) => {
  const sum7 = sumWindow(dailyTrend, 7);
  const sum30 = sumWindow(dailyTrend, 30);
  const sum365 = sumWindow(dailyTrend, 365);

  const last7dSeries = sliceDays(dailyTrend, 7);
  const last30dSeries = sliceDays(dailyTrend, 30);
  const last365dSeries = sliceDays(dailyTrend, 365);

  const pickValue = (liveValue: number, dailySum: number): number =>
    Math.max(liveValue, dailySum);

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
      last30d: {
        labels: labelsForSeries(last30dSeries, 5),
        values: last30dSeries.map((point) => point.count),
      },
      last365d: {
        labels: labelsForSeries(last365dSeries, 6),
        values: last365dSeries.map((point) => point.count),
      },
      last7d: {
        labels: labelsForSeries(last7dSeries, 7),
        values: last7dSeries.map((point) => point.count),
      },
    } satisfies Record<string, PaceWindowChart>,
  };
};

export interface PaceTrends {
  last365d: TrendResult;
  last30d: TrendResult;
  last7d: TrendResult;
}
