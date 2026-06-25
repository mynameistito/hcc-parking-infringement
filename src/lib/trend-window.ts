import { format, parseISO } from "date-fns";

import type { DailyStatPoint } from "@/client/api";

import { compareTrailingWindows, fillDailySeries, toTrendResult } from "./trend";
import type { TrendResult } from "./trend";

export const sliceDays = (
  dailyTrend: DailyStatPoint[],
  days: number
): DailyStatPoint[] => fillDailySeries(dailyTrend, 60).slice(-days);

const labelsForSeries = (series: DailyStatPoint[], maxTicks: number): string[] => {
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

export const buildPaceTrends = (dailyTrend: DailyStatPoint[]) => {
  const filled = fillDailySeries(dailyTrend, 60);
  const counts = filled.map((point) => point.count);

  const last24hSeries = sliceDays(dailyTrend, 7);
  const last7dSeries = sliceDays(dailyTrend, 7);
  const last30dSeries = sliceDays(dailyTrend, 30);

  return {
    trends: {
      last24h: toTrendResult(counts.at(-1) ?? 0, counts.at(-2) ?? 0),
      last7d: compareTrailingWindows(counts, 7),
      last30d: compareTrailingWindows(counts, 30),
    },
    windows: {
      last24h: {
        labels: labelsForSeries(last24hSeries, 5),
        values: last24hSeries.map((point) => point.count),
      },
      last7d: {
        labels: labelsForSeries(last7dSeries, 7),
        values: last7dSeries.map((point) => point.count),
      },
      last30d: {
        labels: labelsForSeries(last30dSeries, 5),
        values: last30dSeries.map((point) => point.count),
      },
    } satisfies Record<string, PaceWindowChart>,
  };
};

export type PaceTrends = {
  last24h: TrendResult;
  last7d: TrendResult;
  last30d: TrendResult;
};
