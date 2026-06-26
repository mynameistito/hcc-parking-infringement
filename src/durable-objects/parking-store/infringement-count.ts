import { getSyncMeta, setSyncMeta } from "./sync.ts";

const INFRINGEMENT_COUNT_KEY = "infringement_count";

export const getCachedInfringementCount = (sql: SqlStorage): number | null => {
  const value = getSyncMeta(sql, INFRINGEMENT_COUNT_KEY);
  if (value === null) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

export const setCachedInfringementCount = (
  sql: SqlStorage,
  count: number
): void => {
  setSyncMeta(sql, INFRINGEMENT_COUNT_KEY, String(count));
};

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

/** Full-table scan — only for finalize/admin refresh when quota allows. */
export const recomputeCachedInfringementCount = (sql: SqlStorage): number => {
  const totalRow = sql
    .exec<{ total: number }>("SELECT count(*) as total FROM infringements")
    .one();
  const count = totalRow?.total ?? 0;
  setCachedInfringementCount(sql, count);
  return count;
};

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
