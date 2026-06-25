import { subDays } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

import type {
  DailyStatRow,
  PublicLiveStats,
  PublicTopItem,
} from "../durable-objects/parking-store.ts";
import { PACE_DAILY_TREND_DAYS } from "../lib/pace-constants.ts";
import { getParkingStore } from "./store.ts";

export type { PublicLiveStats, PublicTopItem };

const AUCKLAND_TZ = "Pacific/Auckland";

const formatDateInAuckland = (date: Date): string =>
  formatInTimeZone(date, AUCKLAND_TZ, "yyyy-MM-dd");

export const getPublicLiveStats = async (env: Env): Promise<PublicLiveStats> =>
  await getParkingStore(env).getPublicLiveStats();

export const getPublicDailyTrend = async (
  env: Env,
  days = PACE_DAILY_TREND_DAYS
): Promise<DailyStatRow[]> => {
  const now = new Date();
  const from = formatDateInAuckland(subDays(now, days - 1));
  const to = formatDateInAuckland(now);
  return await getParkingStore(env).getDailyStats(from, to);
};

export const getPublicTopStreets = async (
  env: Env,
  limit = 5
): Promise<PublicTopItem[]> =>
  await getParkingStore(env).getPublicTop("street", limit);

export const getPublicTopOffences = async (
  env: Env,
  limit = 5
): Promise<PublicTopItem[]> =>
  await getParkingStore(env).getPublicTop("offence", limit);
