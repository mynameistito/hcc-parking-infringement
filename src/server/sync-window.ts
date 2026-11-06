import type { DateWindow, SyncRunType } from "@/durable-objects/types.ts";
import { formatDateInAuckland } from "@/lib/auckland-time.ts";
import { BACKFILL_CHUNK_DAYS_DEFAULT } from "@/lib/backfill-constants.ts";
import { addDays } from "@/lib/date-range.ts";
import type { AppScope } from "@/server/app-scope.ts";
import type { RawInfringementRecord } from "@/server/clean-schema.ts";
import { cleanInfringements } from "@/server/clean.ts";
import { fetchAllInWindow, formatHccFetchError } from "@/server/hcc-client.ts";
import type { FetchAllResult } from "@/server/hcc-client.ts";
import { assertParkingStoreWritable } from "@/server/parking-writes.ts";
import { getParkingStore } from "@/server/store.ts";

export type { SyncRunType } from "@/durable-objects/types.ts";

const HOURLY_OVERLAP_DAYS = 7;

/** Date range and run settings for an ingestion window. */
export interface SyncWindowOptions {
  start: string;
  end: string;
  runType: SyncRunType;
  force?: boolean;
}

/** Run identifier, ingestion counts, and fetch status for a sync window. */
export interface SyncWindowResult {
  runId: number;
  recordsFetched: number;
  recordsUpserted: number;
  skipped: number;
  possiblyTruncated: boolean;
  hccSkipped?: boolean;
}

/**
 * Fetches or accepts a window of records and applies it to the parking store.
 * @param scope - Application scope and storage bindings.
 * @param options - Window bounds, run type, and optional force flag.
 * @param prefetched - Optional HCC records already fetched for this window.
 * @returns Sync counts and whether the HCC fetch was skipped or truncated.
 */
export const syncWindow = async (
  scope: AppScope,
  options: SyncWindowOptions,
  prefetched?: FetchAllResult
): Promise<SyncWindowResult> => {
  if (scope.isSeedMode) {
    return {
      hccSkipped: true,
      possiblyTruncated: false,
      recordsFetched: 0,
      recordsUpserted: 0,
      runId: 0,
      skipped: 0,
    };
  }

  assertParkingStoreWritable(scope);
  const store = getParkingStore(scope.env);

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

  let records: RawInfringementRecord[];
  let possiblyTruncated: boolean;

  if (prefetched === undefined) {
    const fetchResult = await fetchAllInWindow(
      scope.env,
      options.start,
      options.end
    );

    if (fetchResult.ok) {
      ({ records } = fetchResult.value);
      ({ possiblyTruncated } = fetchResult.value);
    } else {
      throw new Error(formatHccFetchError(fetchResult.error));
    }
  } else {
    ({ records } = prefetched);
    ({ possiblyTruncated } = prefetched);
  }

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

/**
 * Synchronizes the recent overlapping window ending today in Auckland.
 * @param scope - Application scope and storage bindings.
 * @param runType - Type recorded for the synchronization run.
 * @returns The window synchronization result.
 */
export const hourlySync = async (
  scope: AppScope,
  runType: SyncRunType = "hourly"
): Promise<SyncWindowResult> => {
  const today = formatDateInAuckland(new Date());
  const start = addDays(today, -HOURLY_OVERLAP_DAYS);

  return await syncWindow(scope, { end: today, force: true, runType, start });
};

const DEFAULT_BACKFILL_CHUNK_DAYS = BACKFILL_CHUNK_DAYS_DEFAULT;

/**
 * Splits an inclusive date range into consecutive bounded windows.
 * @param startDate - First date to include.
 * @param endDate - Last date to include.
 * @param chunkDays - Maximum days in each window.
 * @returns The consecutive date windows.
 */
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
