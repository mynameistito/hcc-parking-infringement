import type { AppScope } from "@/server/app-scope.ts";

export { hourlySync, splitDateRange } from "@/server/sync-window.ts";

export { BACKFILL_EARLIEST, startBackfill } from "@/server/sync-backfill.ts";

/**
 * Read the most recent synchronization run when storage supports it.
 * @param scope - Request services and storage mode.
 * @returns The rendered interface for the supplied data.
 */
export const getLatestSyncRun = async (scope: AppScope) => {
  if (scope.isSeedMode) {
    return null;
  }

  return await scope.parking.getLatestSyncRun();
};
