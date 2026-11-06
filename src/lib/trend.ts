import { addDaysInAuckland, todayInAuckland } from "@/lib/auckland-time";

/** A comparison of current and previous totals with an optional percentage. */
export interface TrendResult {
  current: number;
  previous: number;
  percent: number | null;
  direction: "up" | "down" | "flat";
}

/**
 * Calculates percentage change relative to a previous value.
 * @param current - The current value.
 * @param previous - The comparison value.
 * @returns Zero when both values are zero, null when only the previous value is zero, or the percentage change.
 */
export const percentChange = (
  current: number,
  previous: number
): number | null => {
  if (previous === 0) {
    return current === 0 ? 0 : null;
  }

  return ((current - previous) / previous) * 100;
};

/**
 * Builds a trend comparison and direction from two values.
 * @param current - The current value.
 * @param previous - The comparison value.
 * @returns The values, percentage change, and direction.
 */
export const toTrendResult = (
  current: number,
  previous: number
): TrendResult => {
  const percent = percentChange(current, previous);
  let direction: TrendResult["direction"] = "flat";

  if (percent !== null && percent !== 0) {
    direction = percent > 0 ? "up" : "down";
  }

  return { current, direction, percent, previous };
};

/**
 * Builds a daily series ending on a date, filling missing dates with zeroes.
 * @param points - The available daily totals.
 * @param days - The number of days to include.
 * @param endDate - The final Auckland calendar date, defaulting to today.
 * @returns Daily totals in date order.
 */
export const fillDailySeries = (
  points: { date: string; count: number; totalCents: number }[],
  days: number,
  endDate = todayInAuckland()
): { date: string; count: number; totalCents: number }[] => {
  const byDate = new Map(points.map((point) => [point.date, point]));
  const result: { date: string; count: number; totalCents: number }[] = [];

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const key = addDaysInAuckland(endDate, -offset);
    const existing = byDate.get(key);
    result.push(
      existing ?? {
        count: 0,
        date: key,
        totalCents: 0,
      }
    );
  }

  return result;
};

/**
 * Checks whether the earliest available date reaches the requested span.
 * @param points - Daily points to inspect.
 * @param days - The number of days ending today in Auckland.
 * @returns Whether the earliest point reaches the start of that span.
 */
export const dailyTrendCoversDays = (
  points: { date: string }[],
  days: number
): boolean => {
  if (points.length === 0) {
    return false;
  }

  const sorted = [...points].toSorted((a, b) => a.date.localeCompare(b.date));
  const earliest = sorted[0]?.date;

  if (earliest === undefined) {
    return false;
  }

  const end = todayInAuckland();
  const requiredStart = addDaysInAuckland(end, -(days - 1));

  return earliest <= requiredStart;
};
