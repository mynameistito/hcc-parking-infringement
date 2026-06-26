import type { AppScope } from "@/server/app-scope.ts";

export type {
  SyncRunType,
  SyncWindowOptions,
  SyncWindowResult,
} from "@/server/sync-window.ts";
export {
  DEFAULT_BACKFILL_CHUNK_DAYS,
  hourlySync,
  splitDateRange,
  syncWindow,
} from "@/server/sync-window.ts";
export type { StartBackfillOptions } from "@/server/sync-backfill.ts";
export {
  BACKFILL_EARLIEST,
  PAGE_SIZE_LIMIT,
  processBackfillMessage,
  startBackfill,
} from "@/server/sync-backfill.ts";

export const getLatestSyncRun = async (scope: AppScope) => {
  if (scope.isSeedMode) {
    return null;
  }

  return await scope.parking.getLatestSyncRun();
};
