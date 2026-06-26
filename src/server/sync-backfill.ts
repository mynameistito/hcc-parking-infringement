import type {
  BackfillDelivery,
  BackfillMessage,
  BackfillWindow,
  BackfillWindowJob,
} from "@/backfill.ts";
import { packBackfillQueueMessages } from "@/backfill.ts";
import type { DateWindow } from "@/durable-objects/types.ts";
import { formatDateInAuckland } from "@/lib/auckland-time.ts";
import {
  BACKFILL_CHUNK_DAYS_DEFAULT,
  BACKFILL_EARLIEST,
  BACKFILL_QUEUE_CONCURRENCY,
  BACKFILL_QUEUE_WINDOWS_PER_MESSAGE,
  MAX_BACKFILL_DIRECT_PER_WAVE,
  MAX_BACKFILL_ENQUEUE_PER_WAVE,
  PAGE_SIZE_LIMIT,
} from "@/lib/backfill-constants.ts";
import { addDays } from "@/lib/date-range.ts";
import { mapWithConcurrency } from "@/lib/map-with-concurrency.ts";
import type { AppScope } from "@/server/app-scope.ts";
import { flushBackfillDerivedStateSafely } from "@/server/backfill-flush.ts";
import { fetchAllInWindow, formatHccFetchError } from "@/server/hcc-client.ts";
import { assertParkingStoreWritable } from "@/server/parking-writes.ts";
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
  delivery?: BackfillDelivery;
  end?: string;
  force?: boolean;
  start?: string;
}

const toBackfillWindows = (chunks: readonly DateWindow[]): BackfillWindow[] =>
  chunks.map((chunk) => ({
    endDate: chunk.end,
    startDate: chunk.start,
  }));

const sendBackfillMessages = async (
  scope: AppScope,
  messages: BackfillMessage[]
): Promise<void> => {
  const batches: BackfillMessage[][] = [];
  for (let index = 0; index < messages.length; index += QUEUE_SEND_BATCH_SIZE) {
    batches.push(messages.slice(index, index + QUEUE_SEND_BATCH_SIZE));
  }

  await Promise.all(
    batches.map(
      async (batch) =>
        await scope.env.BACKFILL_QUEUE.sendBatch(
          batch.map((body) => ({ body }))
        )
    )
  );
};

const maxWindowsPerWave = (delivery: BackfillDelivery): number =>
  delivery === "direct"
    ? MAX_BACKFILL_DIRECT_PER_WAVE
    : MAX_BACKFILL_ENQUEUE_PER_WAVE;

const listDailyWindows = (
  startDate: string,
  endDate: string
): BackfillWindow[] => {
  const windows: BackfillWindow[] = [];
  let cursor = startDate;

  while (cursor <= endDate) {
    windows.push({
      endDate: cursor,
      startDate: cursor,
    });
    cursor = addDays(cursor, 1);
  }

  return windows;
};

const enqueueDailyWindows = async (
  scope: AppScope,
  startDate: string,
  endDate: string,
  force?: boolean
): Promise<void> => {
  const messages = packBackfillQueueMessages(
    listDailyWindows(startDate, endDate),
    {
      delivery: "queue",
      force,
      windowsPerMessage: BACKFILL_QUEUE_WINDOWS_PER_MESSAGE,
    }
  );
  await sendBackfillMessages(scope, messages);
};

const processDailyWindowsDirect = async (
  scope: AppScope,
  startDate: string,
  endDate: string,
  runWindow: (
    window: BackfillWindow,
    windowDelivery: BackfillDelivery
  ) => Promise<Awaited<ReturnType<typeof processBackfillMessage>>>
): Promise<void> => {
  await mapWithConcurrency(
    listDailyWindows(startDate, endDate),
    BACKFILL_QUEUE_CONCURRENCY,
    async (window) => {
      await runWindow(window, "direct");
    }
  );
};

export const processBackfillMessage = async (
  scope: AppScope,
  message: BackfillWindowJob
): Promise<{
  error?: string;
  failed?: boolean;
  split?: boolean;
  skipped?: boolean;
  result?: SyncWindowResult;
}> => {
  if (scope.isSeedMode) {
    return { skipped: true, split: false };
  }

  const store = getParkingStore(scope.env);
  const delivery = message.delivery ?? "queue";

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

    const fetchedResult = await fetchAllInWindow(
      scope.env,
      message.startDate,
      message.endDate
    );
    if (!fetchedResult.ok) {
      const errorMessage = formatHccFetchError(fetchedResult.error);
      await recordFailure(errorMessage);
      return { error: errorMessage, failed: true, split: false };
    }

    const fetched = fetchedResult.value;

    const isTruncated =
      fetched.possiblyTruncated ||
      (fetched.pageCount === 1 && fetched.records.length >= PAGE_SIZE_LIMIT);

    if (isTruncated) {
      const isSingleDay = message.startDate === message.endDate;

      if (!isSingleDay) {
        await (delivery === "direct"
          ? processDailyWindowsDirect(
              scope,
              message.startDate,
              message.endDate,
              async (window, windowDelivery) =>
                await processBackfillMessage(scope, {
                  delivery: windowDelivery,
                  endDate: window.endDate,
                  force: message.force,
                  startDate: window.startDate,
                })
            )
          : enqueueDailyWindows(
              scope,
              message.startDate,
              message.endDate,
              message.force
            ));
        return { split: true };
      }

      const error =
        `HCC day ${message.startDate} exceeds page limit ` +
        `(${fetched.records.length} records) — skipping`;
      await recordFailure(error);
      return { error, failed: true, split: false };
    }

    const result = await syncWindow(
      scope,
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

export const runBackfillWaveDirect = async (
  scope: AppScope,
  windows: readonly BackfillWindow[],
  force?: boolean
): Promise<void> => {
  if (windows.length === 0) {
    return;
  }

  await mapWithConcurrency(
    windows,
    BACKFILL_QUEUE_CONCURRENCY,
    async (window) => {
      await processBackfillMessage(scope, {
        delivery: "direct",
        endDate: window.endDate,
        force,
        startDate: window.startDate,
      });
    }
  );
  await flushBackfillDerivedStateSafely(scope.env);
};

export const startBackfill = async (
  scope: AppScope,
  options?: StartBackfillOptions
): Promise<{
  chunkDays: number;
  continueFrom: string | null;
  delivery: BackfillDelivery;
  enqueued: number;
  end: string;
  queueMessages: number;
  remaining: number;
  skipped: number;
  start: string;
  total: number;
}> => {
  assertParkingStoreWritable(scope);
  const delivery = options?.delivery ?? "queue";
  const today = formatDateInAuckland(new Date());
  const start = options?.start ?? BACKFILL_EARLIEST;
  const end = options?.end ?? today;
  const chunkDays = options?.chunkDays ?? BACKFILL_CHUNK_DAYS_DEFAULT;
  const chunks = splitDateRange(start, end, chunkDays);
  const store = getParkingStore(scope.env);

  const pending =
    options?.force === true ? chunks : await store.filterPendingChunks(chunks);
  const wave = pending.slice(0, maxWindowsPerWave(delivery));
  const lastProcessed = wave.at(-1);
  const backfillWindows = toBackfillWindows(wave);
  let queueMessages = 0;

  if (delivery === "direct") {
    await runBackfillWaveDirect(scope, backfillWindows, options?.force);
  } else {
    const packedMessages = packBackfillQueueMessages(backfillWindows, {
      delivery: "queue",
      force: options?.force,
      windowsPerMessage: BACKFILL_QUEUE_WINDOWS_PER_MESSAGE,
    });
    queueMessages = packedMessages.length;
    await sendBackfillMessages(scope, packedMessages);
  }

  return {
    chunkDays,
    continueFrom:
      lastProcessed !== undefined && pending.length > wave.length
        ? addDays(lastProcessed.end, 1)
        : null,
    delivery,
    end,
    enqueued: wave.length,
    queueMessages,
    remaining: pending.length - wave.length,
    skipped: chunks.length - pending.length,
    start,
    total: chunks.length,
  };
};

export { DEFAULT_BACKFILL_CHUNK_DAYS };
