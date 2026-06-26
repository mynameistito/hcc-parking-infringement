import type { BackfillProgress } from "@/durable-objects/types.ts";
import { BACKFILL_CHUNK_DAYS_DEFAULT } from "@/lib/backfill-constants.ts";
import type { AppScope } from "@/server/app-scope.ts";

export type { BackfillProgress };

export const getBackfillProgress = async (
  scope: AppScope,
  options: { chunkDays?: number; end: string; start: string }
): Promise<BackfillProgress> => {
  const chunkDays = options.chunkDays ?? BACKFILL_CHUNK_DAYS_DEFAULT;

  return await scope.parking.getBackfillProgressSnapshot(
    options.start,
    options.end,
    chunkDays
  );
};
