import type {
  InfringementListResult,
  InfringementQuery,
  LiveStats,
  TopGroupBy,
  TopWindow,
} from "@/durable-objects/types.ts";
import type { AppScope } from "@/server/app-scope.ts";

export type { DailyStatRow, TopStatRow } from "@/durable-objects/types.ts";

export type {
  LiveStats,
  TopGroupBy,
  TopWindow,
} from "@/durable-objects/types.ts";

/**
 * Reads the current aggregate statistics.
 * @param scope - The application scope containing the parking reader.
 * @returns The current live statistics.
 */
export const getLiveStats = async (scope: AppScope): Promise<LiveStats> =>
  await scope.parking.getLiveStats();

/**
 * Reads daily statistics for a date range.
 * @param scope - The application scope containing the parking reader.
 * @param from - The start date.
 * @param to - The end date.
 * @returns Daily statistic rows for the range.
 */
export const getDailyStats = async (
  scope: AppScope,
  from: string,
  to: string
) => await scope.parking.getDailyStats(from, to);

/**
 * Reads ranked statistics for a grouping and time window.
 * @param scope - The application scope containing the parking reader.
 * @param groupBy - The grouping used for the ranking.
 * @param window - The time window to query.
 * @param limit - Maximum number of rows to return.
 * @returns Ranked statistic rows.
 */
export const getTopStats = async (
  scope: AppScope,
  groupBy: TopGroupBy,
  window: TopWindow,
  limit: number
) => await scope.parking.getTopStats(groupBy, window, limit);

/**
 * Reads a page of infringements matching a query.
 * @param scope - The application scope containing the parking reader.
 * @param query - The filters and page selection.
 * @returns The matching page and its total count.
 */
export const listInfringements = async (
  scope: AppScope,
  query: InfringementQuery
): Promise<InfringementListResult> =>
  await scope.parking.listInfringements(query);
