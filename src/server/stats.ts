import type {
  InfringementListResult,
  InfringementQuery,
  LiveStats,
  TopGroupBy,
  TopWindow,
} from "../durable-objects/parking-store.ts";
import { getParkingStore } from "./store.ts";

export type {
  DailyStatRow,
  TopStatRow,
} from "../durable-objects/parking-store.ts";
export type { LiveStats, TopGroupBy, TopWindow };

export const getLiveStats = async (env: Env): Promise<LiveStats> =>
  await getParkingStore(env).getLiveStats();

export const getDailyStats = async (env: Env, from: string, to: string) =>
  await getParkingStore(env).getDailyStats(from, to);

export const getTopStats = async (
  env: Env,
  groupBy: TopGroupBy,
  window: TopWindow,
  limit: number
) => await getParkingStore(env).getTopStats(groupBy, window, limit);

export const listInfringements = async (
  env: Env,
  query: InfringementQuery
): Promise<InfringementListResult> =>
  await getParkingStore(env).listInfringements(query);
