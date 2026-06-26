import type { DateWindow, SyncRunType } from "@/durable-objects/types.ts";
import { formatDateInAuckland } from "@/lib/auckland-time.ts";
import { BACKFILL_CHUNK_DAYS_DEFAULT } from "@/lib/backfill-constants.ts";
import { addDays } from "@/lib/date-range.ts";
import { cleanInfringements } from "@/server/clean.ts";
import { fetchAllInWindow } from "@/server/hcc-client.ts";
import type { FetchAllResult } from "@/server/hcc-client.ts";
import { getParkingStore } from "@/server/store.ts";

export type { SyncRunType };

const HOURLY_OVERLAP_DAYS = 7;

export interface SyncWindowOptions {
  start: string;
  end: string;
  runType: SyncRunType;
  force?: boolean;
}

export interface SyncWindowResult {
  runId: number;
  recordsFetched: number;
  recordsUpserted: number;
  skipped: number;
  possiblyTruncated: boolean;
  hccSkipped?: boolean;
}

export const syncWindow = async (
  env: Env,
  options: SyncWindowOptions,
  prefetched?: FetchAllResult
): Promise<SyncWindowResult> => {
  const store = getParkingStore(env);

  if (options.force !== true && prefetched === undefined) {
    const alreadyIngested = await store.isWindowIngested(
      options.start,
      options.end
    );
    if (alreadyIngested) {
      return {
        hccSkipped: true,
        possiblyTruncated: false,
        recordsFetched: 0,
        recordsUpserted: 0,
        runId: 0,
        skipped: 0,
      };
    }
  }

  const { records, possiblyTruncated } =
    prefetched ?? (await fetchAllInWindow(env, options.start, options.end));
  const { cleaned, skipped } = cleanInfringements(records);

  const result = await store.applySyncWindow({
    end: options.end,
    records: cleaned,
    recordsFetched: records.length,
    runType: options.runType,
    skipped,
    start: options.start,
  });

  return {
    ...result,
    hccSkipped: false,
    possiblyTruncated,
  };
};

export const hourlySync = async (
  env: Env,
  runType: SyncRunType = "hourly"
): Promise<SyncWindowResult> => {
  const today = formatDateInAuckland(new Date());
  const start = addDays(today, -HOURLY_OVERLAP_DAYS);
  return await syncWindow(env, { end: today, force: true, runType, start });
};

export const DEFAULT_BACKFILL_CHUNK_DAYS = BACKFILL_CHUNK_DAYS_DEFAULT;

export const splitDateRange = (
  startDate: string,
  endDate: string,
  chunkDays = DEFAULT_BACKFILL_CHUNK_DAYS
): DateWindow[] => {
  const span = Math.max(1, Math.floor(chunkDays));
  const chunks: DateWindow[] = [];
  let cursor = startDate;

  while (cursor <= endDate) {
    const chunkEnd = addDays(cursor, span - 1);
    chunks.push({
      end: chunkEnd > endDate ? endDate : chunkEnd,
      start: cursor,
    });
    cursor = addDays(chunkEnd > endDate ? endDate : chunkEnd, 1);
  }

  return chunks;
};
