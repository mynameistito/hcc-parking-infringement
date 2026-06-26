import type { DateWindow } from "@/durable-objects/types.ts";

import { STATS_LIVE_ID } from "./constants.ts";
import { getCachedInfringementCount } from "./infringement-count.ts";
import { hasWatermark } from "./sync.ts";

export const countIngestWatermarksInRange = (
  sql: SqlStorage,
  start: string,
  end: string,
  chunkDays: number
): number => {
  const row =
    chunkDays === 1
      ? sql
          .exec<{ count: number }>(
            `SELECT count(*) as count FROM ingest_watermarks
             WHERE window_start = window_end
               AND window_start >= ?
               AND window_start <= ?`,
            start,
            end
          )
          .one()
      : sql
          .exec<{ count: number }>(
            `SELECT count(*) as count FROM ingest_watermarks
             WHERE window_start >= ?
               AND window_end <= ?
               AND window_start != window_end`,
            start,
            end
          )
          .one();

  return row?.count ?? 0;
};

export const getLatestIngestWatermarkInRange = (
  sql: SqlStorage,
  start: string,
  end: string,
  chunkDays: number
): { end: string; ingestedAt: string; start: string } | null => {
  const rows =
    chunkDays === 1
      ? sql
          .exec<{
            ingested_at: string;
            window_end: string;
            window_start: string;
          }>(
            `SELECT window_start, window_end, ingested_at FROM ingest_watermarks
             WHERE window_start = window_end
               AND window_start >= ?
               AND window_start <= ?
             ORDER BY ingested_at DESC
             LIMIT 1`,
            start,
            end
          )
          .toArray()
      : sql
          .exec<{
            ingested_at: string;
            window_end: string;
            window_start: string;
          }>(
            `SELECT window_start, window_end, ingested_at FROM ingest_watermarks
             WHERE window_start >= ?
               AND window_end <= ?
               AND window_start != window_end
             ORDER BY ingested_at DESC
             LIMIT 1`,
            start,
            end
          )
          .toArray();

  const [row] = rows;
  if (row === undefined) {
    return null;
  }

  return {
    end: row.window_end,
    ingestedAt: row.ingested_at,
    start: row.window_start,
  };
};

export const readTotalRecordsForProgress = (sql: SqlStorage): number => {
  const statsRow = sql
    .exec<{ all_time_total: number }>(
      "SELECT all_time_total FROM stats_live WHERE id = ? LIMIT 1",
      STATS_LIVE_ID
    )
    .one();

  if (statsRow !== undefined && statsRow.all_time_total > 0) {
    return statsRow.all_time_total;
  }

  return getCachedInfringementCount(sql) ?? 0;
};

export const isWindowIngested = (
  sql: SqlStorage,
  start: string,
  end: string
): boolean => hasWatermark(sql, start, end);

export const filterPendingChunks = (
  sql: SqlStorage,
  windows: DateWindow[]
): DateWindow[] =>
  windows.filter((window) => !hasWatermark(sql, window.start, window.end));

export const getBackfillProgressSnapshot = (
  sql: SqlStorage,
  start: string,
  end: string,
  chunkDays: number
): {
  completed: number;
  latestIngestedAt: string | null;
  latestWindow: { end: string; start: string } | null;
  totalRecords: number;
} => {
  const completed = countIngestWatermarksInRange(sql, start, end, chunkDays);
  const latest = getLatestIngestWatermarkInRange(sql, start, end, chunkDays);

  return {
    completed,
    latestIngestedAt: latest?.ingestedAt ?? null,
    latestWindow: latest ? { end: latest.end, start: latest.start } : null,
    totalRecords: readTotalRecordsForProgress(sql),
  };
};
