import { getParkingStore } from "@/server/store.ts";

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

export const getLatestSyncRun = async (env: Env) =>
  await getParkingStore(env).getLatestSyncRun();
