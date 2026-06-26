import { subDays } from "date-fns";

import type { DailyStatRow, PublicTopItem } from "@/durable-objects/types.ts";
import { formatDateInAuckland } from "@/lib/auckland-time.ts";
import { PACE_DAILY_TREND_DAYS } from "@/lib/pace-constants.ts";
import type { AppScope } from "@/server/app-scope.ts";

export type {
  PublicLiveStats,
  PublicTopItem,
} from "@/durable-objects/types.ts";

export const getPublicLiveStats = async (scope: AppScope) =>
  await scope.parking.getPublicLiveStats();

export const getPublicDailyTrend = async (
  scope: AppScope,
  days = PACE_DAILY_TREND_DAYS
): Promise<DailyStatRow[]> => {
  const now = new Date();
  const from = formatDateInAuckland(subDays(now, days - 1));
  const to = formatDateInAuckland(now);

  return await scope.parking.getDailyStats(from, to);
};

export const getPublicTopStreets = async (
  scope: AppScope,
  limit = 5
): Promise<PublicTopItem[]> =>
  await scope.parking.getPublicTop("street", limit);

export const getPublicTopOffences = async (
  scope: AppScope,
  limit = 5
): Promise<PublicTopItem[]> =>
  await scope.parking.getPublicTop("offence", limit);
