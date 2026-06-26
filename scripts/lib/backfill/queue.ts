/** Enqueue backfill waves and wait for each wave to drain before the next. */

import { setTimeout as sleep } from "node:timers/promises";

import {
  fetchBackfillProgress,
  postBackfillWave,
} from "@scripts/lib/backfill/api.ts";
import { formatNumber } from "@scripts/lib/backfill/progress.ts";
import type { BackfillResponse } from "@scripts/lib/backfill/schemas.ts";
import type { WorkerScriptContext } from "@scripts/lib/worker/client.ts";

const WAVE_DRAIN_POLL_MS = 5000;
const WAVE_DRAIN_TIMEOUT_MS = 10 * 60 * 1000;

const pollWaveDrain = async (
  ctx: WorkerScriptContext,
  start: string,
  end: string,
  granularity: string,
  chunkDays: string | undefined,
  baselineCompleted: number,
  targetDelta: number,
  deadline: number
): Promise<void> => {
  if (Date.now() >= deadline) {
    console.warn(
      "\nWave pause timed out — continuing to enqueue next wave anyway."
    );
    return;
  }

  const result = await fetchBackfillProgress(
    ctx,
    start,
    end,
    granularity,
    chunkDays
  );
  if (
    result.kind === "progress" &&
    result.progress.completed - baselineCompleted >= targetDelta
  ) {
    return;
  }

  await sleep(WAVE_DRAIN_POLL_MS);
  await pollWaveDrain(
    ctx,
    start,
    end,
    granularity,
    chunkDays,
    baselineCompleted,
    targetDelta,
    deadline
  );
};

const waitForWaveDrain = async (
  ctx: WorkerScriptContext,
  start: string,
  end: string,
  granularity: string,
  chunkDays: string | undefined,
  baselineCompleted: number,
  targetDelta: number
): Promise<void> => {
  await pollWaveDrain(
    ctx,
    start,
    end,
    granularity,
    chunkDays,
    baselineCompleted,
    targetDelta,
    Date.now() + WAVE_DRAIN_TIMEOUT_MS
  );
};

const logWaveResult = (
  body: BackfillResponse | null,
  fallbackDelivery: string
): void => {
  const enqueued = body?.enqueued ?? 0;
  const skipped = body?.skipped ?? 0;
  const remaining = body?.remaining ?? 0;
  const queueMessages = body?.queueMessages ?? 0;
  const delivery = body?.delivery ?? fallbackDelivery;
  const actionVerb = delivery === "direct" ? "processed" : "queued";
  const queueSuffix =
    delivery === "queue" && queueMessages > 0
      ? ` (${formatNumber(queueMessages)} queue msgs)`
      : "";
  const skippedSuffix =
    skipped > 0 ? ` · ${formatNumber(skipped)} skipped` : "";
  const remainingSuffix =
    remaining > 0 ? ` · ${formatNumber(remaining)} remaining` : "";

  console.log(
    `[backfill] ${actionVerb} ${formatNumber(enqueued)} windows${queueSuffix}${skippedSuffix}${remainingSuffix}`
  );
};

/**
 * POST backfill waves until `continueFrom` is null or no windows remain.
 * Waits for each wave to finish ingesting before enqueueing the next.
 */
export const queueBackfillWaves = async (
  ctx: WorkerScriptContext,
  options: {
    chunkDays: string | undefined;
    delivery: string;
    force: boolean;
    from: string;
    granularity: string;
    to: string;
  }
): Promise<{
  bodies: BackfillResponse[];
  totalEnqueued: number;
}> => {
  const bodies: BackfillResponse[] = [];
  let totalEnqueued = 0;
  let currentFrom: string | null = options.from;

  while (currentFrom !== null) {
    const body = await postBackfillWave(ctx, {
      ...options,
      currentFrom,
    });
    bodies.push(body ?? {});
    const enqueued = body?.enqueued ?? 0;
    totalEnqueued += enqueued;
    const remaining = body?.remaining ?? 0;
    logWaveResult(body, options.delivery);

    const continueFrom = body?.continueFrom;

    if (continueFrom === undefined || continueFrom === null || remaining <= 0) {
      break;
    }

    if (options.delivery === "direct") {
      currentFrom = continueFrom;
      continue;
    }

    console.log(
      `[backfill] waiting for wave to finish before queuing ${formatNumber(remaining)} more…`
    );

    const progressBefore = await fetchBackfillProgress(
      ctx,
      options.from,
      options.to,
      options.granularity,
      options.chunkDays
    );
    const baselineCompleted =
      progressBefore.kind === "progress"
        ? progressBefore.progress.completed
        : 0;

    await waitForWaveDrain(
      ctx,
      options.from,
      options.to,
      options.granularity,
      options.chunkDays,
      baselineCompleted,
      enqueued
    );

    currentFrom = continueFrom;
  }

  return { bodies, totalEnqueued };
};
