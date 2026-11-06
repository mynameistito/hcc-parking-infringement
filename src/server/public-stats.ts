import { subDays } from "date-fns";

import type { DailyStatRow, PublicTopItem } from "@/durable-objects/types.ts";
import { formatDateInAuckland } from "@/lib/auckland-time.ts";
import { PACE_DAILY_TREND_DAYS } from "@/lib/pace-constants.ts";
import type { AppScope } from "@/server/app-scope.ts";

export type { PublicTopItem } from "@/durable-objects/types.ts";

/**
 * Reads the current public live statistics.
 * @param scope - Application scope and parking reader.
 * @returns The current public live statistics.
 */
export const getPublicLiveStats = async (scope: AppScope) =>
  await scope.parking.getPublicLiveStats();

/**
 * Reads daily statistics for a trailing Auckland calendar window.
 * @param scope - Application scope and parking reader.
 * @param days - Number of days to include.
 * @returns Daily statistics for the requested window.
 */
export const getPublicDailyTrend = async (
  scope: AppScope,
  days = PACE_DAILY_TREND_DAYS
): Promise<DailyStatRow[]> => {
  const now = new Date();
  const from = formatDateInAuckland(subDays(now, days - 1));
  const to = formatDateInAuckland(now);

  return await scope.parking.getDailyStats(from, to);
};

/**
 * Reads the highest-ranked streets by infringement count.
 * @param scope - Application scope and parking reader.
 * @param limit - Maximum number of streets to return.
 * @returns Ranked street counts.
 */
export const getPublicTopStreets = async (
  scope: AppScope,
  limit = 5
): Promise<PublicTopItem[]> =>
  await scope.parking.getPublicTop("street", limit);

/**
 * Reads the highest-ranked offences by infringement count.
 * @param scope - Application scope and parking reader.
 * @param limit - Maximum number of offences to return.
 * @returns Ranked offence counts.
 */
export const getPublicTopOffences = async (
  scope: AppScope,
  limit = 5
): Promise<PublicTopItem[]> =>
  await scope.parking.getPublicTop("offence", limit);
