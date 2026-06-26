import type {
  InfringementListResult,
  InfringementQuery,
  LiveStats,
  TopGroupBy,
  TopWindow,
} from "@/durable-objects/types.ts";
import type { AppScope } from "@/server/app-scope.ts";

export type { DailyStatRow, TopStatRow } from "@/durable-objects/types.ts";
export type { LiveStats, TopGroupBy, TopWindow };

export const getLiveStats = async (scope: AppScope): Promise<LiveStats> =>
  await scope.parking.getLiveStats();

export const getDailyStats = async (
  scope: AppScope,
  from: string,
  to: string
) => await scope.parking.getDailyStats(from, to);

export const getTopStats = async (
  scope: AppScope,
  groupBy: TopGroupBy,
  window: TopWindow,
  limit: number
) => await scope.parking.getTopStats(groupBy, window, limit);

export const listInfringements = async (
  scope: AppScope,
  query: InfringementQuery
): Promise<InfringementListResult> =>
  await scope.parking.listInfringements(query);
