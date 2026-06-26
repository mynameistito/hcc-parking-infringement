import type { BackfillProgress } from "@/durable-objects/types.ts";
import { BACKFILL_CHUNK_DAYS_DEFAULT } from "@/lib/backfill-constants.ts";
import { readsParkingStoreFromSeed } from "@/server/parking-read-source.ts";
import { getSeedCacheStatus } from "@/server/seed-read.ts";
import { getParkingStore } from "@/server/store.ts";
import { splitDateRange } from "@/server/sync.ts";

export type { BackfillProgress };

export const getBackfillProgress = async (
  env: Env,
  options: { chunkDays?: number; end: string; start: string }
): Promise<BackfillProgress> => {
  const chunkDays = options.chunkDays ?? BACKFILL_CHUNK_DAYS_DEFAULT;

  if (readsParkingStoreFromSeed(env)) {
    const cache = await getSeedCacheStatus(env);
    return {
      chunkDays,
      completed: 0,
      end: options.end,
      latestIngestedAt: cache.lastSyncedAt,
      latestWindow: null,
      percent: 0,
      start: options.start,
      total: 0,
      totalRecords: cache.totalRecords,
    };
  }

  const store = getParkingStore(env);
  const total = splitDateRange(options.start, options.end, chunkDays).length;
  const snapshot = await store.getBackfillProgressSnapshot(
    options.start,
    options.end,
    chunkDays
  );

  return {
    chunkDays,
    completed: snapshot.completed,
    end: options.end,
    latestIngestedAt: snapshot.latestIngestedAt,
    latestWindow: snapshot.latestWindow,
    percent:
      total > 0 ? Math.min(100, (snapshot.completed / total) * 100) : 100,
    start: options.start,
    total,
    totalRecords: snapshot.totalRecords,
  };
};
