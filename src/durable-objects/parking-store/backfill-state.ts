import { clearSyncMeta, getSyncMeta, setSyncMeta } from "./sync.ts";

const BACKFILL_STATS_DIRTY_KEY = "backfill_stats_dirty";

export const markBackfillStatsDirty = (sql: SqlStorage): void => {
  setSyncMeta(sql, BACKFILL_STATS_DIRTY_KEY, "1");
};

export const isBackfillStatsDirty = (sql: SqlStorage): boolean =>
  getSyncMeta(sql, BACKFILL_STATS_DIRTY_KEY) === "1";

export const clearBackfillStatsDirty = (sql: SqlStorage): void => {
  clearSyncMeta(sql, BACKFILL_STATS_DIRTY_KEY);
};

export const flushBackfillDerivedState = (
  sql: SqlStorage,
  onFlush: () => void
): { flushed: boolean } => {
  if (!isBackfillStatsDirty(sql)) {
    return { flushed: false };
  }

  onFlush();
  clearBackfillStatsDirty(sql);
  return { flushed: true };
};
