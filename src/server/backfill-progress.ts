import type { BackfillProgress } from "@/durable-objects/parking-store.ts";
import { BACKFILL_CHUNK_DAYS_DEFAULT } from "@/lib/backfill-constants.ts";
import { getParkingStore } from "@/server/store.ts";
import { splitDateRange } from "@/server/sync.ts";

export type { BackfillProgress };

export const getBackfillProgress = async (
  env: Env,
  options: { chunkDays?: number; end: string; start: string }
): Promise<BackfillProgress> => {
  const chunkDays = options.chunkDays ?? BACKFILL_CHUNK_DAYS_DEFAULT;
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
