import { parseISO, subDays } from "date-fns";

import type { PublicPaceTrends } from "@/durable-objects/types.ts";
import { dateBounds, formatDateInAuckland } from "@/lib/auckland-time.ts";
import { toTrendResult } from "@/lib/trend.ts";
import type { TrendResult } from "@/lib/trend.ts";

import { aggregateWindow } from "./stats.ts";

export const computePaceTrend = (
  sql: SqlStorage,
  days: number
): TrendResult => {
  const now = new Date();
  const today = formatDateInAuckland(now);
  const todayWindow = dateBounds(today);
  const currentStart = formatDateInAuckland(subDays(now, days));
  const current = aggregateWindow(
    sql,
    dateBounds(currentStart).start,
    todayWindow.end
  ).count;

  const currentStartDate = parseISO(`${currentStart}T12:00:00`);
  const priorEndDay = formatDateInAuckland(subDays(currentStartDate, 1));
  const priorStartDay = formatDateInAuckland(subDays(currentStartDate, days));
  const previous = aggregateWindow(
    sql,
    dateBounds(priorStartDay).start,
    dateBounds(priorEndDay).end
  ).count;

  const earliestRow = sql
    .exec<{ earliest: string | null }>(
      "SELECT min(substr(occurred_at, 1, 10)) as earliest FROM infringements"
    )
    .one();

  if (
    earliestRow?.earliest !== null &&
    earliestRow?.earliest !== undefined &&
    earliestRow.earliest > priorStartDay
  ) {
    return { current, direction: "flat", percent: null, previous };
  }

  return toTrendResult(current, previous);
};

export const readPaceTrends = (sql: SqlStorage): PublicPaceTrends => ({
  last30d: computePaceTrend(sql, 30),
  last365d: computePaceTrend(sql, 365),
  last7d: computePaceTrend(sql, 7),
});
