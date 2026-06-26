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
  const [completed, cache, latest] = await Promise.all([
    store.countIngestWatermarksInRange(options.start, options.end, chunkDays),
    store.getCacheStatus(),
    store.getLatestIngestWatermarkInRange(
      options.start,
      options.end,
      chunkDays
    ),
  ]);

  return {
    chunkDays,
    completed,
    end: options.end,
    latestIngestedAt: latest?.ingestedAt ?? null,
    latestWindow: latest ? { end: latest.end, start: latest.start } : null,
    percent: total > 0 ? Math.min(100, (completed / total) * 100) : 100,
    start: options.start,
    total,
    totalRecords: cache.totalRecords,
  };
};
