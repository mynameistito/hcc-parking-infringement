import { differenceInCalendarDays, parseISO } from "date-fns";

import type { DailyStatPoint } from "@/contracts/public-api";
import { formatAucklandDateKey, todayInAuckland } from "@/lib/auckland-time";
import { PACE_DAILY_TREND_DAYS } from "@/lib/pace-constants";
import {
  dailyTrendCoversDays,
  fillDailySeries,
  toTrendResult,
} from "@/lib/trend";
import type { TrendResult } from "@/lib/trend";

/**
 * Builds a filled series for the requested number of days ending today.
 * @param dailyTrend - Available daily totals.
 * @param days - The number of days to include.
 * @returns Daily totals in date order, with missing dates filled with zeroes.
 */
const sliceDays = (
  dailyTrend: DailyStatPoint[],
  days: number
): DailyStatPoint[] => fillDailySeries(dailyTrend, days).slice(-days);

/**
 * Measures the calendar span from the earliest point to an end date.
 * @param dailyTrend - Available daily totals.
 * @param endDate - The final date, defaulting to today in Auckland.
 * @returns The inclusive span, or the default pace span when there are no points.
 */
export const dailyTrendSpanDays = (
  dailyTrend: DailyStatPoint[],
  endDate = todayInAuckland()
): number => {
  let earliest: string | null = null;

  for (const point of dailyTrend) {
    if (earliest === null || point.date < earliest) {
      earliest = point.date;
    }
  }

  if (earliest === null) {
    return PACE_DAILY_TREND_DAYS;
  }

  return Math.max(
    1,
    differenceInCalendarDays(parseISO(endDate), parseISO(earliest)) + 1
  );
};

/**
 * Sums infringement counts for a filled window ending today.
 * @param dailyTrend - Available daily totals.
 * @param days - The number of days to include.
 * @returns The sum of counts in the window.
 */
const sumWindow = (dailyTrend: DailyStatPoint[], days: number): number =>
  sliceDays(dailyTrend, days).reduce((sum, point) => sum + point.count, 0);

const hasComparablePriorWindow = (
  dailyTrend: DailyStatPoint[],
  days: number
): boolean => dailyTrendCoversDays(dailyTrend, days * 2);

/**
 * Compares adjacent count windows ending today.
 * @param dailyTrend - Available daily totals.
 * @param days - The length of each window in days.
 * @returns The comparison, with a null percentage when prior data is insufficient.
 */
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

const formatPointLabel = (dateKey: string, seriesLength: number): string => {
  if (seriesLength > 60) {
    return formatAucklandDateKey(dateKey, "d MMM").toUpperCase();
  }

  if (seriesLength > 14) {
    return formatAucklandDateKey(dateKey, "d MMM").toUpperCase();
  }

  return formatAucklandDateKey(dateKey, "EEE d").toUpperCase();
};

/**
 * Formats a date key for a trend axis according to series length.
 * @param dateKey - The Auckland calendar date key.
 * @param seriesLength - The number of points in the series.
 * @returns An uppercase axis label.
 */
export const formatTrendAxisDate = (
  dateKey: string,
  seriesLength: number
): string => formatPointLabel(dateKey, seriesLength);

/**
 * Formats a date key for a trend tooltip.
 * @param dateKey - The Auckland calendar date key.
 * @returns An uppercase date label including the year.
 */
export const formatTrendTooltipDate = (dateKey: string): string =>
  formatAucklandDateKey(dateKey, "EEE d MMM yyyy").toUpperCase();

/**
 * Formats one axis label for each point in a series.
 * @param series - The daily points to label.
 * @returns Labels in series order.
 */
const labelsForSeries = (series: DailyStatPoint[]): string[] =>
  series.map((point) => formatPointLabel(point.date, series.length));

const datesForSeries = (series: DailyStatPoint[]): string[] =>
  series.map((point) => point.date);

/**
 * Calculates the Recharts axis interval used to limit visible tick labels.
 * @param pointCount - The number of chart points.
 * @param maxTicks - The requested maximum number of tick labels.
 * @returns The number of labels to skip between displayed ticks.
 */
export const xAxisTickInterval = (
  pointCount: number,
  maxTicks: number
): number => {
  if (pointCount <= maxTicks || maxTicks <= 1) {
    return 0;
  }

  return Math.ceil(pointCount / maxTicks) - 1;
};

/** Dates, labels, and values for a pace or trend window chart. */
export interface PaceWindowChart {
  dates: string[];
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
  aggregate?: (series: DailyStatPoint[]) => DailyStatPoint[]
): PaceWindowChart => {
  const daily = sliceDays(dailyTrend, windowDays);
  const series = aggregate?.(daily) ?? daily;

  return {
    dates: datesForSeries(series),
    labels: labelsForSeries(series),
    values: series.map((point) => point.count),
  };
};

/** Live count totals used alongside daily trend data in the pace panel. */
export interface PaceLiveValues {
  last7d: number;
  last30d: number;
  last365d?: number;
}

const pickValue = (liveValue: number, dailySum: number): number =>
  Math.max(liveValue, dailySum);

/**
 * Builds pace values, comparisons, and chart windows from daily and live data.
 * @param dailyTrend - Available daily totals.
 * @param live - Live counts for each pace window.
 * @param serverTrends - Optional server-provided comparisons to use instead of local ones.
 * @returns Display values, trend comparisons, and chart windows.
 */
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
      last30d: buildPaceWindow(dailyTrend, 30),
      last365d: buildPaceWindow(dailyTrend, 365, bucketWeekly),
      last7d: buildPaceWindow(dailyTrend, 7),
    } satisfies Record<string, PaceWindowChart>,
  };
};

/** Trend comparisons for the supported pace windows. */
export interface PaceTrends {
  last365d: TrendResult;
  last30d: TrendResult;
  last7d: TrendResult;
}

/** Metrics that can be plotted or summed in a trend window. */
export type TrendMetric = "count" | "totalCents";

/** Optional aggregation setting for a trend window chart. */
export interface BuildTrendWindowOptions {
  aggregateWeekly?: boolean;
}

const isLegacyAggregationOption = (
  options: BuildTrendWindowOptions | boolean
): options is boolean => typeof options === "boolean";

/**
 * Builds a filled trend window, optionally aggregating points into weeks.
 * @param dailyTrend - Available daily totals.
 * @param windowDays - The number of days to include.
 * @param metric - The count or amount metric to plot.
 * @param options - Weekly aggregation settings, or the legacy boolean form.
 * @returns Dates, labels, and values; amount values are expressed in dollars.
 */
export const buildTrendWindowChart = (
  dailyTrend: DailyStatPoint[],
  windowDays: number,
  metric: TrendMetric,
  options: BuildTrendWindowOptions | boolean = {}
): PaceWindowChart => {
  const normalized = isLegacyAggregationOption(options)
    ? { aggregateWeekly: options }
    : options;

  const aggregateWeekly = normalized.aggregateWeekly ?? windowDays > 90;
  const aggregate = aggregateWeekly ? bucketWeekly : undefined;
  const daily = sliceDays(dailyTrend, windowDays);
  const series = aggregate?.(daily) ?? daily;

  return {
    dates: datesForSeries(series),
    labels: labelsForSeries(series),
    values: series.map((point) =>
      metric === "count" ? point.count : point.totalCents / 100
    ),
  };
};

/**
 * Sums a filled trend window for the selected metric.
 * @param dailyTrend - Available daily totals.
 * @param windowDays - The number of days to include.
 * @param metric - The count or amount metric to sum.
 * @returns The count or amount in dollars.
 */
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
