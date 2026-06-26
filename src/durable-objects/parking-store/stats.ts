import type { CacheStatus, LiveStats } from "@/durable-objects/types.ts";
import {
  monthBoundsInAuckland,
  todayBounds,
  yearBoundsInAuckland,
} from "@/lib/auckland-time.ts";

import { STATS_LIVE_ID } from "./constants.ts";
import { getCachedInfringementCount } from "./infringement-count.ts";
import { aggregatePeriod } from "./stats-aggregates.ts";
import { getSyncMeta } from "./sync.ts";

export { aggregatePeriod, aggregateWindow } from "./stats-aggregates.ts";
export type { WindowAggregate } from "./stats-aggregates.ts";
export {
  mapPublicLiveStatsRow,
  readPublicLiveStats,
  recomputeStatsLive,
} from "./stats-live.ts";

export const getLiveStats = (sql: SqlStorage): LiveStats => {
  const cached = sql
    .exec<{ last_synced_at: string | null }>(
      "SELECT last_synced_at FROM stats_live WHERE id = ? LIMIT 1",
      STATS_LIVE_ID
    )
    .one();

  const now = new Date();
  const today = aggregatePeriod(
    sql,
    todayBounds(now).start,
    todayBounds(now).end
  );
  const thisMonth = aggregatePeriod(
    sql,
    monthBoundsInAuckland(now).start,
    monthBoundsInAuckland(now).end
  );
  const thisYear = aggregatePeriod(
    sql,
    yearBoundsInAuckland(now).start,
    yearBoundsInAuckland(now).end
  );
  const allTime = sql
    .exec<{ count: number; total_cents: number }>(
      "SELECT count(*) as count, coalesce(sum(amount_cents), 0) as total_cents FROM infringements"
    )
    .one();

  return {
    allTime: {
      count: allTime?.count ?? 0,
      totalCents: allTime?.total_cents ?? 0,
    },
    thisMonth,
    thisYear,
    today,
    updatedAt: cached?.last_synced_at ?? null,
  };
};

export const getCacheStatus = (sql: SqlStorage): CacheStatus => {
  const statsRow = sql
    .exec<{ all_time_total: number }>(
      "SELECT all_time_total FROM stats_live WHERE id = ? LIMIT 1",
      STATS_LIVE_ID
    )
    .one();

  const watermarkRow = sql
    .exec<{ count: number }>("SELECT count(*) as count FROM ingest_watermarks")
    .one();

  const statsSyncedRow = sql
    .exec<{ last_synced_at: string | null }>(
      "SELECT last_synced_at FROM stats_live WHERE id = ? LIMIT 1",
      STATS_LIVE_ID
    )
    .one();

  const cachedTotal = getCachedInfringementCount(sql);
  const totalRecords =
    statsRow !== undefined && statsRow.all_time_total > 0
      ? statsRow.all_time_total
      : (cachedTotal ?? 0);

  return {
    ingestWindows: watermarkRow?.count ?? 0,
    lastHccFetchAt: getSyncMeta(sql, "last_hcc_fetch_at"),
    lastSyncedAt: statsSyncedRow?.last_synced_at ?? null,
    source: "parking-store",
    totalRecords,
  };
};
