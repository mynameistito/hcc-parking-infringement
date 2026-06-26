import { subDays } from "date-fns";

import type {
  DailyStatRow,
  PublicLiveStats,
  PublicTopItem,
} from "@/durable-objects/types.ts";
import { formatDateInAuckland } from "@/lib/auckland-time.ts";
import { PACE_DAILY_TREND_DAYS } from "@/lib/pace-constants.ts";
import { readsParkingStoreFromSeed } from "@/server/parking-read-source.ts";
import {
  getSeedDailyStats,
  getSeedPublicLiveStats,
  getSeedPublicTop,
} from "@/server/seed-read.ts";
import { getParkingStore } from "@/server/store.ts";

export type { PublicLiveStats, PublicTopItem };

export const getPublicLiveStats = async (
  env: Env
): Promise<PublicLiveStats> => {
  if (readsParkingStoreFromSeed(env)) {
    return await getSeedPublicLiveStats(env);
  }

  return await getParkingStore(env).getPublicLiveStats();
};

export const getPublicDailyTrend = async (
  env: Env,
  days = PACE_DAILY_TREND_DAYS
): Promise<DailyStatRow[]> => {
  const now = new Date();
  const from = formatDateInAuckland(subDays(now, days - 1));
  const to = formatDateInAuckland(now);

  if (readsParkingStoreFromSeed(env)) {
    return await getSeedDailyStats(env, from, to);
  }

  return await getParkingStore(env).getDailyStats(from, to);
};

export const getPublicTopStreets = async (
  env: Env,
  limit = 5
): Promise<PublicTopItem[]> => {
  if (readsParkingStoreFromSeed(env)) {
    return await getSeedPublicTop(env, "street", limit);
  }

  return await getParkingStore(env).getPublicTop("street", limit);
};

export const getPublicTopOffences = async (
  env: Env,
  limit = 5
): Promise<PublicTopItem[]> => {
  if (readsParkingStoreFromSeed(env)) {
    return await getSeedPublicTop(env, "offence", limit);
  }

  return await getParkingStore(env).getPublicTop("offence", limit);
};
