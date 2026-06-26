import { subDays } from "date-fns";

import type { PublicLiveStats } from "@/durable-objects/types.ts";
import {
  dateBounds,
  formatDateInAuckland,
  monthBoundsInAuckland,
  yearBoundsInAuckland,
} from "@/lib/auckland-time.ts";

import { isoNow, STATS_LIVE_ID } from "./constants.ts";
import { aggregateWindow } from "./stats-aggregates.ts";

interface StatsLiveRow extends Record<string, SqlStorageValue> {
  all_time_total: number;
  all_time_amount_cents: number;
  today: number;
  last_24h: number;
  last_7d: number;
  last_30d: number;
  last_365d: number;
  this_month: number;
  towed_today: number;
  last_synced_at: string | null;
  last_record_at: string | null;
}

export const mapPublicLiveStatsRow = (
  row: StatsLiveRow | undefined
): PublicLiveStats => {
  if (row === undefined) {
    return {
      allTimeAmountCents: 0,
      allTimeTotal: 0,
      last24h: 0,
      last30d: 0,
      last365d: 0,
      last7d: 0,
      lastRecordAt: null,
      lastSyncedAt: null,
      thisMonth: 0,
      today: 0,
      towedToday: 0,
    };
  }

  return {
    allTimeAmountCents: row.all_time_amount_cents,
    allTimeTotal: row.all_time_total,
    last24h: row.last_24h,
    last30d: row.last_30d,
    last365d: row.last_365d ?? 0,
    last7d: row.last_7d,
    lastRecordAt: row.last_record_at,
    lastSyncedAt: row.last_synced_at,
    thisMonth: row.this_month,
    today: row.today,
    towedToday: row.towed_today,
  };
};

export const recomputeStatsLive = (sql: SqlStorage): void => {
  const now = new Date();
  const today = formatDateInAuckland(now);
  const todayWindow = dateBounds(today);
  const monthBounds = monthBoundsInAuckland(now);
  const yearBounds = yearBoundsInAuckland(now);
  const last24hStart = subDays(now, 1).toISOString();
  const last7dStart = formatDateInAuckland(subDays(now, 7));
  const last30dStart = formatDateInAuckland(subDays(now, 30));
  const last365dStart = formatDateInAuckland(subDays(now, 365));

  const allTime = aggregateWindow(
    sql,
    "1970-01-01T00:00:00+12:00",
    "2099-12-31T23:59:59.999+12:00"
  );
  const todayStats = aggregateWindow(sql, todayWindow.start, todayWindow.end);
  const monthStats = aggregateWindow(sql, monthBounds.start, monthBounds.end);
  const yearStats = aggregateWindow(sql, yearBounds.start, yearBounds.end);
  const last24h = aggregateWindow(sql, last24hStart, isoNow());
  const last7d = aggregateWindow(
    sql,
    `${last7dStart}T00:00:00+12:00`,
    todayWindow.end
  );
  const last30d = aggregateWindow(
    sql,
    `${last30dStart}T00:00:00+12:00`,
    todayWindow.end
  );
  const last365d = aggregateWindow(
    sql,
    `${last365dStart}T00:00:00+12:00`,
    todayWindow.end
  );

  const lastRecord = sql
    .exec<{ latest: string | null }>(
      "SELECT max(occurred_at) as latest FROM infringements"
    )
    .one();

  const syncedAt = isoNow();

  sql.exec(
    `INSERT INTO stats_live (
      id, all_time_total, all_time_amount_cents, today, last_24h, last_7d,
      last_30d, last_365d, this_month, this_year, towed_all_time, towed_today,
      last_synced_at, last_record_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      all_time_total = excluded.all_time_total,
      all_time_amount_cents = excluded.all_time_amount_cents,
      today = excluded.today,
      last_24h = excluded.last_24h,
      last_7d = excluded.last_7d,
      last_30d = excluded.last_30d,
      last_365d = excluded.last_365d,
      this_month = excluded.this_month,
      this_year = excluded.this_year,
      towed_all_time = excluded.towed_all_time,
      towed_today = excluded.towed_today,
      last_synced_at = excluded.last_synced_at,
      last_record_at = excluded.last_record_at`,
    STATS_LIVE_ID,
    allTime.count,
    allTime.amountCents,
    todayStats.count,
    last24h.count,
    last7d.count,
    last30d.count,
    last365d.count,
    monthStats.count,
    yearStats.count,
    allTime.towedCount,
    todayStats.towedCount,
    syncedAt,
    lastRecord?.latest ?? null
  );

  const dailyRows = sql
    .exec<{
      date: string;
      count: number;
      amount_cents: number;
      towed_count: number;
    }>(
      `SELECT substr(occurred_at, 1, 10) as date,
              count(*) as count,
              coalesce(sum(amount_cents), 0) as amount_cents,
              coalesce(sum(case when is_towed = 1 then 1 else 0 end), 0) as towed_count
       FROM infringements
       GROUP BY substr(occurred_at, 1, 10)`
    )
    .toArray();

  for (const row of dailyRows) {
    sql.exec(
      `INSERT INTO daily_counts (date, count, amount_cents, towed_count)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(date) DO UPDATE SET
         count = excluded.count,
         amount_cents = excluded.amount_cents,
         towed_count = excluded.towed_count`,
      row.date,
      row.count,
      row.amount_cents,
      row.towed_count
    );
  }
};

export const readPublicLiveStats = (sql: SqlStorage): PublicLiveStats => {
  const rows = sql
    .exec<StatsLiveRow>(
      "SELECT * FROM stats_live WHERE id = ? LIMIT 1",
      STATS_LIVE_ID
    )
    .toArray();

  return mapPublicLiveStatsRow(rows[0]);
};
