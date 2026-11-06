import { clearSyncMeta, getSyncMeta, setSyncMeta } from "./sync.ts";

interface BackfillFlushResult {
  flushed: boolean;
}

const BACKFILL_STATS_DIRTY_KEY = "backfill_stats_dirty";

/**
 * Marks derived statistics for recomputation after backfill.
 * @param sql - The Durable Object SQL storage.
 */
export const markBackfillStatsDirty = (sql: SqlStorage): void => {
  setSyncMeta(sql, BACKFILL_STATS_DIRTY_KEY, "1");
};

/**
 * Checks whether backfill has marked derived statistics dirty.
 * @param sql - The Durable Object SQL storage.
 * @returns Whether recomputation is pending.
 */
const isBackfillStatsDirty = (sql: SqlStorage): boolean =>
  getSyncMeta(sql, BACKFILL_STATS_DIRTY_KEY) === "1";

/**
 * Clears the pending backfill statistics marker.
 * @param sql - The Durable Object SQL storage.
 */
const clearBackfillStatsDirty = (sql: SqlStorage): void => {
  clearSyncMeta(sql, BACKFILL_STATS_DIRTY_KEY);
};

/**
 * Runs the flush callback once when derived statistics are marked dirty.
 * @param sql - The Durable Object SQL storage.
 * @param onFlush - Callback that recomputes derived state.
 * @returns Whether a flush was performed.
 */
export const flushBackfillDerivedState = (
  sql: SqlStorage,
  onFlush: () => void
): BackfillFlushResult => {
  if (!isBackfillStatsDirty(sql)) {
    return { flushed: false };
  }

  onFlush();
  clearBackfillStatsDirty(sql);

  return { flushed: true };
};
