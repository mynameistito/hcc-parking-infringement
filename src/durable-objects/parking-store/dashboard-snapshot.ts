import { toPublicInfringementList } from "@/contracts/projections.ts";
import type {
  PublicDashboardSnapshot,
  PublicLiveStats,
  PublicPaceTrends,
} from "@/durable-objects/types.ts";
import { formatDateInAuckland } from "@/lib/auckland-time.ts";
import {
  DASHBOARD_CHART_STREET_LIMIT,
  DASHBOARD_EXPLORE_RANK_LIMIT,
} from "@/lib/dashboard-chart-constants.ts";
import { RECENT_INFRINGEMENTS_LIMIT } from "@/lib/dashboard-constants.ts";

import { DASHBOARD_SNAPSHOT_CACHE_ID, isoNow } from "./constants.ts";
import { getDailyStats, listInfringements } from "./infringements.ts";
import { readMapPoints } from "./locations.ts";
import { readPaceTrends } from "./pace-trends.ts";
import {
  readChartBreakdown,
  readTopGrouped,
  readTopStreetsRanked,
  readTopSuburbsRanked,
  readTopVehicles,
} from "./rankings.ts";
import { readPublicLiveStats } from "./stats.ts";

export {
  dashboardSnapshotIsCompleteJson as snapshotIsComplete,
  getDashboardSnapshotPayloadWeightJson as getDashboardSnapshotPayloadWeight,
} from "@/contracts/dashboard-snapshot.ts";

const EMPTY_CHART_BREAKDOWNS = {
  offenceCategories: [],
  offences: [],
  suburbs: [],
  towed: [],
  vehicleMakes: [],
  vehicleTypes: [],
};

const FULL_DAILY_TREND_START = "1970-01-01";

/**
 * Serializes an initial dashboard with live totals and empty detailed data.
 * @param live - Current public live statistics.
 * @param paceTrends - Current pace comparisons.
 * @param at - Snapshot timestamp.
 * @returns The serialized full-dashboard message.
 */
export const buildColdDashboardSnapshotPayload = (
  live: PublicLiveStats,
  paceTrends: PublicPaceTrends,
  at: string
): string =>
  JSON.stringify({
    at,
    chartBreakdowns: EMPTY_CHART_BREAKDOWNS,
    dailyTrend: [],
    live,
    map: {
      pendingGeocode: 0,
      routes: [],
    },
    paceTrends,
    recentInfringements: [],
    streets: [],
    suburbs: [],
    topOffences: [],
    topStreets: [],
    type: "full",
    vehicles: [],
  });

/**
 * Serializes a full dashboard snapshot as a WebSocket message.
 * @param snapshot - Dashboard data to serialize.
 * @returns The serialized full-dashboard message.
 */
export const buildFullDashboardSnapshotPayload = (
  snapshot: PublicDashboardSnapshot
): string => JSON.stringify({ type: "full", ...snapshot });

/**
 * Reads the cached serialized dashboard snapshot.
 * @param sql - The Durable Object SQL storage.
 * @returns The stored payload, or null when no cache exists.
 */
export const readStoredDashboardSnapshotPayload = (
  sql: SqlStorage
): string | null => {
  const rows = sql
    .exec<{ payload: string }>(
      "SELECT payload FROM dashboard_snapshot_cache WHERE id = ? LIMIT 1",
      DASHBOARD_SNAPSHOT_CACHE_ID
    )
    .toArray();

  return rows[0]?.payload ?? null;
};

/**
 * Stores or replaces the cached dashboard payload.
 * @param sql - The Durable Object SQL storage.
 * @param payload - Serialized dashboard message to cache.
 */
export const writeDashboardSnapshotCache = (
  sql: SqlStorage,
  payload: string
): void => {
  sql.exec(
    `INSERT INTO dashboard_snapshot_cache (id, payload, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       payload = excluded.payload,
       updated_at = excluded.updated_at`,
    DASHBOARD_SNAPSHOT_CACHE_ID,
    payload,
    isoNow()
  );
};

/**
 * Builds a full dashboard snapshot from stored aggregates and records.
 * @param sql - The Durable Object SQL storage.
 * @returns The assembled public dashboard snapshot.
 */
export const assembleFullDashboardSnapshot = (
  sql: SqlStorage
): PublicDashboardSnapshot => {
  const now = new Date();
  const to = formatDateInAuckland(now);

  return {
    at: isoNow(),
    chartBreakdowns: readChartBreakdown(sql),
    dailyTrend: getDailyStats(sql, FULL_DAILY_TREND_START, to),
    live: readPublicLiveStats(sql),
    map: readMapPoints(sql, 50),
    paceTrends: readPaceTrends(sql),
    recentInfringements: toPublicInfringementList(
      listInfringements(sql, {
        limit: RECENT_INFRINGEMENTS_LIMIT,
        page: 1,
      }).data
    ),
    streets: readTopStreetsRanked(sql, DASHBOARD_CHART_STREET_LIMIT),
    suburbs: readTopSuburbsRanked(sql, DASHBOARD_EXPLORE_RANK_LIMIT),
    topOffences: readTopGrouped(sql, "offence", DASHBOARD_CHART_STREET_LIMIT),
    topStreets: readTopGrouped(sql, "street", DASHBOARD_CHART_STREET_LIMIT),
    vehicles: readTopVehicles(sql, DASHBOARD_EXPLORE_RANK_LIMIT),
  };
};
