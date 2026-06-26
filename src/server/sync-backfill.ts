import type { BackfillMessage } from "@/backfill.ts";
import { formatDateInAuckland } from "@/lib/auckland-time.ts";
import {
  BACKFILL_CHUNK_DAYS_DEFAULT,
  BACKFILL_EARLIEST,
  MAX_BACKFILL_ENQUEUE_PER_WAVE,
  PAGE_SIZE_LIMIT,
} from "@/lib/backfill-constants.ts";
import { addDays } from "@/lib/date-range.ts";
import { fetchAllInWindow } from "@/server/hcc-client.ts";
import { getParkingStore } from "@/server/store.ts";
import {
  DEFAULT_BACKFILL_CHUNK_DAYS,
  splitDateRange,
  syncWindow,
} from "@/server/sync-window.ts";
import type { SyncWindowResult } from "@/server/sync-window.ts";

export { BACKFILL_EARLIEST, PAGE_SIZE_LIMIT };

const QUEUE_SEND_BATCH_SIZE = 100;

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
  const chunkDays = options?.chunkDays ?? BACKFILL_CHUNK_DAYS_DEFAULT;
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

export { DEFAULT_BACKFILL_CHUNK_DAYS };
