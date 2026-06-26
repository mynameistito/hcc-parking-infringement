/** Enqueue backfill waves and wait for each wave to drain before the next. */

import { setTimeout as sleep } from "node:timers/promises";

import {
  fetchBackfillProgress,
  postBackfillWave,
} from "@scripts/lib/backfill-api.ts";
import { formatNumber } from "@scripts/lib/backfill-progress.ts";
import type { BackfillResponse } from "@scripts/lib/backfill-schemas.ts";
import type { WorkerScriptContext } from "@scripts/lib/worker-client.ts";

const WAVE_DRAIN_POLL_MS = 5000;
const WAVE_DRAIN_TIMEOUT_MS = 10 * 60 * 1000;

const waitForWaveDrain = async (
  ctx: WorkerScriptContext,
  start: string,
  end: string,
  granularity: string,
  chunkDays: string | undefined,
  baselineCompleted: number,
  targetDelta: number
): Promise<void> => {
  const deadline = Date.now() + WAVE_DRAIN_TIMEOUT_MS;

  while (Date.now() < deadline) {
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
  }

  console.warn(
    "\nWave pause timed out — continuing to enqueue next wave anyway."
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
    const skipped = body?.skipped ?? 0;
    const remaining = body?.remaining ?? 0;

    console.log(
      `[backfill] queued ${formatNumber(enqueued)} windows${
        skipped > 0 ? ` · ${formatNumber(skipped)} skipped` : ""
      }${remaining > 0 ? ` · ${formatNumber(remaining)} remaining` : ""}`
    );

    const continueFrom = body?.continueFrom;

    if (continueFrom === undefined || continueFrom === null || remaining <= 0) {
      break;
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
