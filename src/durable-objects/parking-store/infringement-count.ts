import { parseCachedInfringementCount } from "./infringement-count-value.ts";
import { getSyncMeta, setSyncMeta } from "./sync.ts";

const INFRINGEMENT_COUNT_KEY = "infringement_count";

/**
 * Reads the cached infringement count from sync metadata.
 * @param sql - The Durable Object SQL storage.
 * @returns The cached nonnegative count, or null when absent or invalid.
 */
export const getCachedInfringementCount = (sql: SqlStorage): number | null =>
  parseCachedInfringementCount(getSyncMeta(sql, INFRINGEMENT_COUNT_KEY));

/**
 * Stores an infringement count in sync metadata.
 * @param sql - The Durable Object SQL storage.
 * @param count - The count to store.
 */
export const setCachedInfringementCount = (
  sql: SqlStorage,
  count: number
): void => {
  setSyncMeta(sql, INFRINGEMENT_COUNT_KEY, String(count));
};

/**
 * Increases the cached count by a positive delta.
 * @param sql - The Durable Object SQL storage.
 * @param delta - The increment; nonpositive values are ignored.
 */
export const bumpCachedInfringementCount = (
  sql: SqlStorage,
  delta: number
): void => {
  if (delta <= 0) {
    return;
  }

  const current = getCachedInfringementCount(sql) ?? 0;
  setCachedInfringementCount(sql, current + delta);
};

/**
 * Recomputes and caches the count using a full-table scan for finalize or admin refresh when quota allows.
 * @param sql - The Durable Object SQL storage.
 * @returns The count obtained from the scan.
 */
export const recomputeCachedInfringementCount = (sql: SqlStorage): number => {
  const totalRow = sql
    .exec<{ total: number }>("SELECT count(*) as total FROM infringements")
    .one();

  const count = totalRow?.total ?? 0;
  setCachedInfringementCount(sql, count);

  return count;
};

/**
 * Resolves the cached count, optionally scanning when it is absent.
 * @param sql - The Durable Object SQL storage.
 * @param mode - Whether a missing cached count may be scanned.
 * @returns The cached or scanned count, or zero when scanning is disabled.
 */
export const resolveInfringementCount = (
  sql: SqlStorage,
  mode: "cached" | "scan"
): number => {
  const cached = getCachedInfringementCount(sql);

  if (cached !== null) {
    return cached;
  }

  if (mode === "scan") {
    return recomputeCachedInfringementCount(sql);
  }

  return 0;
};
