import { subDays } from "date-fns";

import {
  dashboardSnapshotIsCompleteJson,
  getDashboardSnapshotPayloadWeightJson,
} from "@/contracts/dashboard-snapshot.ts";
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
import { PACE_DAILY_TREND_DAYS } from "@/lib/pace-constants.ts";

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

export const getDashboardSnapshotPayloadWeight =
  getDashboardSnapshotPayloadWeightJson;

export const snapshotIsComplete = dashboardSnapshotIsCompleteJson;

const EMPTY_CHART_BREAKDOWNS = {
  offenceCategories: [],
  offences: [],
  suburbs: [],
  towed: [],
  vehicleMakes: [],
  vehicleTypes: [],
};

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

export const buildFullDashboardSnapshotPayload = (
  snapshot: PublicDashboardSnapshot
): string => JSON.stringify({ type: "full", ...snapshot });

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

export const assembleFullDashboardSnapshot = (
  sql: SqlStorage
): PublicDashboardSnapshot => {
  const now = new Date();
  const from = formatDateInAuckland(subDays(now, PACE_DAILY_TREND_DAYS - 1));
  const to = formatDateInAuckland(now);

  return {
    at: isoNow(),
    chartBreakdowns: readChartBreakdown(sql),
    dailyTrend: getDailyStats(sql, from, to),
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
