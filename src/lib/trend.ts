import { addDaysInAuckland, todayInAuckland } from "@/lib/auckland-time";

export interface TrendResult {
  current: number;
  previous: number;
  percent: number | null;
  direction: "up" | "down" | "flat";
}

export const percentChange = (
  current: number,
  previous: number
): number | null => {
  if (previous === 0) {
    return current === 0 ? 0 : null;
  }
  return ((current - previous) / previous) * 100;
};

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

export const compareTrailingWindows = (
  values: number[],
  windowSize: number
): TrendResult => {
  if (values.length < windowSize * 2) {
    const last = values.at(-1) ?? 0;
    const prior = values.at(-2) ?? 0;
    return toTrendResult(last, prior);
  }

  const currentWindow = values.slice(-windowSize);
  const previousWindow = values.slice(-windowSize * 2, -windowSize);
  const current = currentWindow.reduce((sum, value) => sum + value, 0);
  const previous = previousWindow.reduce((sum, value) => sum + value, 0);
  return toTrendResult(current, previous);
};

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

export const hasDailyTrendData = (points: { count: number }[]): boolean =>
  points.some((point) => point.count > 0);
