import type {
  InfringementListResult,
  InfringementQuery,
  LiveStats,
  TopGroupBy,
  TopWindow,
} from "@/durable-objects/types.ts";
import { readsParkingStoreFromSeed } from "@/server/parking-read-source.ts";
import {
  getSeedDailyStats,
  getSeedLiveStats,
  getSeedTopStats,
  listSeedInfringements,
} from "@/server/seed-read.ts";
import { getParkingStore } from "@/server/store.ts";

export type { DailyStatRow, TopStatRow } from "@/durable-objects/types.ts";
export type { LiveStats, TopGroupBy, TopWindow };

export const getLiveStats = async (env: Env): Promise<LiveStats> => {
  if (readsParkingStoreFromSeed(env)) {
    return await getSeedLiveStats(env);
  }

  return await getParkingStore(env).getLiveStats();
};

export const getDailyStats = async (env: Env, from: string, to: string) => {
  if (readsParkingStoreFromSeed(env)) {
    return await getSeedDailyStats(env, from, to);
  }

  return await getParkingStore(env).getDailyStats(from, to);
};

export const getTopStats = async (
  env: Env,
  groupBy: TopGroupBy,
  window: TopWindow,
  limit: number
) => {
  if (readsParkingStoreFromSeed(env)) {
    return await getSeedTopStats(env, groupBy, window, limit);
  }

  return await getParkingStore(env).getTopStats(groupBy, window, limit);
};

export const listInfringements = async (
  env: Env,
  query: InfringementQuery
): Promise<InfringementListResult> => {
  if (readsParkingStoreFromSeed(env)) {
    return await listSeedInfringements(env, query);
  }

  return await getParkingStore(env).listInfringements(query);
};
