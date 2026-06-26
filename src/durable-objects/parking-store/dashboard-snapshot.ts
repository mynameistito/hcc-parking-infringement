import { subDays } from "date-fns";

import { toPublicInfringementList } from "@/contracts/projections.ts";
import type {
  PublicDashboardSnapshot,
  PublicLiveStats,
  PublicPaceTrends,
} from "@/durable-objects/types.ts";
import { formatDateInAuckland } from "@/lib/auckland-time.ts";
import { RECENT_INFRINGEMENTS_LIMIT } from "@/lib/dashboard-constants.ts";
import { PACE_DAILY_TREND_DAYS } from "@/lib/pace-constants.ts";

import { DASHBOARD_SNAPSHOT_CACHE_ID, isoNow } from "./constants.ts";
import { getDailyStats, listInfringements } from "./infringements.ts";
import { readMapPoints } from "./locations.ts";
import { readPaceTrends } from "./pace-trends.ts";
import {
  readTopGrouped,
  readTopStreetsRanked,
  readTopSuburbsRanked,
  readTopVehicles,
} from "./rankings.ts";
import { readPublicLiveStats } from "./stats.ts";

export const getDashboardSnapshotPayloadWeight = (payload: string): number => {
  try {
    const parsed: unknown = JSON.parse(payload);
    if (typeof parsed !== "object" || parsed === null) {
      return 0;
    }

    const snapshot = parsed as {
      map?: { routes?: unknown[] };
      recentInfringements?: unknown[];
      streets?: unknown[];
      suburbs?: unknown[];
      topOffences?: unknown[];
      topStreets?: unknown[];
      vehicles?: unknown[];
    };

    return (
      (snapshot.recentInfringements?.length ?? 0) +
      (snapshot.topStreets?.length ?? 0) +
      (snapshot.topOffences?.length ?? 0) +
      (snapshot.streets?.length ?? 0) +
      (snapshot.suburbs?.length ?? 0) +
      (snapshot.vehicles?.length ?? 0) +
      (snapshot.map?.routes?.length ?? 0)
    );
  } catch {
    return 0;
  }
};

export const snapshotIsComplete = (payload: string): boolean => {
  try {
    const parsed: unknown = JSON.parse(payload);
    if (typeof parsed !== "object" || parsed === null) {
      return false;
    }
    const dailyTrend: unknown = Reflect.get(parsed, "dailyTrend");
    const paceTrends: unknown = Reflect.get(parsed, "paceTrends");
    return (
      Array.isArray(dailyTrend) &&
      dailyTrend.length > 0 &&
      typeof paceTrends === "object" &&
      paceTrends !== null &&
      Reflect.get(paceTrends, "last7d") !== undefined &&
      Reflect.get(paceTrends, "last30d") !== undefined &&
      Reflect.get(paceTrends, "last365d") !== undefined
    );
  } catch {
    return false;
  }
};

export const buildColdDashboardSnapshotPayload = (
  live: PublicLiveStats,
  paceTrends: PublicPaceTrends,
  at: string
): string =>
  JSON.stringify({
    at,
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
    streets: readTopStreetsRanked(sql, 10),
    suburbs: readTopSuburbsRanked(sql, 10),
    topOffences: readTopGrouped(sql, "offence", 5),
    topStreets: readTopGrouped(sql, "street", 5),
    vehicles: readTopVehicles(sql, 10),
  };
};
