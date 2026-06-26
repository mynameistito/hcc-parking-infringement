import type { BackfillMessage } from "@/backfill.ts";
import type { DateWindow } from "@/durable-objects/types.ts";
import { formatDateInAuckland } from "@/lib/auckland-time.ts";
import { BACKFILL_CHUNK_DAYS_DEFAULT } from "@/lib/backfill-constants.ts";
import { cleanInfringements } from "@/server/clean.ts";
import { fetchAllInWindow } from "@/server/hcc-client.ts";
import type { FetchAllResult } from "@/server/hcc-client.ts";
import { getParkingStore } from "@/server/store.ts";

const BACKFILL_EARLIEST = "1990-01-01";
const DEFAULT_BACKFILL_CHUNK_DAYS = BACKFILL_CHUNK_DAYS_DEFAULT;
/** Only re-fetch recent days from HCC; historical data lives in ParkingStore. */
const HOURLY_OVERLAP_DAYS = 7;
const PAGE_SIZE_LIMIT = 10_000;
/** Miniflare caps local queue delivery timers at 10k; enqueue in waves below that. */
const MAX_BACKFILL_ENQUEUE_PER_WAVE = 3000;
const QUEUE_SEND_BATCH_SIZE = 100;

export type SyncRunType = "hourly" | "manual" | "backfill";

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

const addDays = (dateStr: string, days: number): string => {
  const date = new Date(`${dateStr}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

const splitDateRange = (
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

export interface StartBackfillOptions {
  chunkDays?: number;
  end?: string;
  force?: boolean;
  start?: string;
}

const sendBackfillMessages = async (
  env: Env,
  messages: BackfillMessage[]
): Promise<void> => {
  const batches: BackfillMessage[][] = [];
  for (let index = 0; index < messages.length; index += QUEUE_SEND_BATCH_SIZE) {
    batches.push(messages.slice(index, index + QUEUE_SEND_BATCH_SIZE));
  }

  await Promise.all(
    batches.map(
      async (batch) =>
        await env.BACKFILL_QUEUE.sendBatch(batch.map((body) => ({ body })))
    )
  );
};

export const startBackfill = async (
  env: Env,
  options?: StartBackfillOptions
): Promise<{
  chunkDays: number;
  continueFrom: string | null;
  enqueued: number;
  end: string;
  remaining: number;
  skipped: number;
  start: string;
  total: number;
}> => {
  const today = formatDateInAuckland(new Date());
  const start = options?.start ?? BACKFILL_EARLIEST;
  const end = options?.end ?? today;
  const chunkDays = options?.chunkDays ?? DEFAULT_BACKFILL_CHUNK_DAYS;
  const chunks = splitDateRange(start, end, chunkDays);
  const store = getParkingStore(env);

  const pending =
    options?.force === true ? chunks : await store.filterPendingChunks(chunks);
  const wave = pending.slice(0, MAX_BACKFILL_ENQUEUE_PER_WAVE);
  const lastEnqueued = wave.at(-1);

  await sendBackfillMessages(
    env,
    wave.map((chunk) => ({
      endDate: chunk.end,
      force: options?.force,
      startDate: chunk.start,
    }))
  );

  return {
    chunkDays,
    continueFrom:
      lastEnqueued !== undefined && pending.length > wave.length
        ? addDays(lastEnqueued.end, 1)
        : null,
    end,
    enqueued: wave.length,
    remaining: pending.length - wave.length,
    skipped: chunks.length - pending.length,
    start,
    total: chunks.length,
  };
};

const enqueueDailyWindows = async (
  env: Env,
  startDate: string,
  endDate: string,
  force?: boolean
): Promise<void> => {
  const messages: BackfillMessage[] = [];
  let cursor = startDate;

  while (cursor <= endDate) {
    messages.push({
      endDate: cursor,
      force,
      startDate: cursor,
    });
    cursor = addDays(cursor, 1);
  }

  await sendBackfillMessages(env, messages);
};

export const processBackfillMessage = async (
  env: Env,
  message: BackfillMessage
): Promise<{
  error?: string;
  failed?: boolean;
  split?: boolean;
  skipped?: boolean;
  result?: SyncWindowResult;
}> => {
  const store = getParkingStore(env);

  const recordFailure = async (error: string): Promise<void> => {
    await store.recordBackfillFailure(
      message.startDate,
      message.endDate,
      error
    );
  };

  try {
    if (message.force !== true) {
      const alreadyIngested = await store.isWindowIngested(
        message.startDate,
        message.endDate
      );
      if (alreadyIngested) {
        return { skipped: true, split: false };
      }
    }

    const fetched = await fetchAllInWindow(
      env,
      message.startDate,
      message.endDate
    );

    const isTruncated =
      fetched.possiblyTruncated ||
      (fetched.pageCount === 1 && fetched.records.length >= PAGE_SIZE_LIMIT);

    if (isTruncated) {
      const isSingleDay = message.startDate === message.endDate;

      if (!isSingleDay) {
        await enqueueDailyWindows(
          env,
          message.startDate,
          message.endDate,
          message.force
        );
        return { split: true };
      }

      const error =
        `HCC day ${message.startDate} exceeds page limit ` +
        `(${fetched.records.length} records) — skipping`;
      await recordFailure(error);
      return { error, failed: true, split: false };
    }

    const result = await syncWindow(
      env,
      {
        end: message.endDate,
        force: message.force,
        runType: "backfill",
        start: message.startDate,
      },
      fetched
    );

    return { result, split: false };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await recordFailure(errorMessage);
    return { error: errorMessage, failed: true, split: false };
  }
};

export const getLatestSyncRun = async (env: Env) =>
  await getParkingStore(env).getLatestSyncRun();

export {
  BACKFILL_EARLIEST,
  DEFAULT_BACKFILL_CHUNK_DAYS,
  PAGE_SIZE_LIMIT,
  splitDateRange,
};
