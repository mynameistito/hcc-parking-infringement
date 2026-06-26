/** Live backfill progress tracking and worker version warnings. */

import { setTimeout as sleep } from "node:timers/promises";

import {
  fetchBackfillHealth,
  fetchBackfillProgress,
} from "@scripts/lib/backfill-api.ts";
import {
  formatNumber,
  renderFallbackLine,
  renderProgressLine,
} from "@scripts/lib/backfill-progress.ts";
import type { BackfillResponse } from "@scripts/lib/backfill-schemas.ts";
import { chunkDaysFor } from "@scripts/lib/backfill-schemas.ts";
import type { WorkerScriptContext } from "@scripts/lib/worker-client.ts";

import { BACKFILL_EARLIEST } from "@/lib/backfill-constants.ts";
import { splitDateRange } from "@/server/sync.ts";

const POLL_MS = 2000;
const IDLE_POLL_LIMIT = 30;

/** Warn when the worker response shape suggests an outdated deployment. */
export const warnIfWorkerLooksOutdated = (
  body: BackfillResponse,
  granularity: string,
  from: string,
  today: string
): void => {
  const expectedChunkDays = granularity === "day" ? 1 : 7;
  const expectedTotal = splitDateRange(
    from,
    body.end ?? today,
    expectedChunkDays
  ).length;

  if (body.chunkDays === undefined) {
    console.warn(
      "\nWarning: worker response has no chunkDays — it may be running old code.",
      "Restart with `bun run dev` (or redeploy) so daily backfill + progress tracking work."
    );
  } else if (body.chunkDays !== expectedChunkDays) {
    console.warn(
      `\nWarning: worker used chunkDays=${body.chunkDays}, expected ${expectedChunkDays}.`
    );
  }

  if (
    granularity === "day" &&
    body.total !== undefined &&
    body.total < expectedTotal / 2
  ) {
    console.warn(
      `\nWarning: only ${body.total} windows queued but ~${expectedTotal} daily windows expected.`,
      "The worker on this port may not support ?granularity=day yet."
    );
  }

  if (
    body.enqueued === 0 &&
    body.skipped === body.total &&
    body.total === 339
  ) {
    console.warn(
      "\nAll 339 weekly windows were skipped (already ingested).",
      "Daily gaps from 1990+ need the updated worker:",
      "bun run dev",
      `bun run backfill -- --port=5173 --granularity=day --from=${BACKFILL_EARLIEST}`
    );
  }
};

/**
 * Poll progress until complete or idle timeout.
 * Uses `/sync/backfill/progress` when available, otherwise `/api/v1/status`.
 */
export const trackBackfill = async (
  ctx: WorkerScriptContext,
  start: string,
  end: string,
  granularity: string,
  chunkDays: string | undefined,
  enqueued: number
): Promise<void> => {
  const expectedTotal = splitDateRange(
    start,
    end,
    chunkDaysFor(granularity, chunkDays)
  ).length;

  const initialProgress = await fetchBackfillProgress(
    ctx,
    start,
    end,
    granularity,
    chunkDays
  );

  if (enqueued === 0) {
    if (initialProgress.kind === "progress") {
      console.log(
        `\n[backfill] nothing queued — ${initialProgress.progress.completed}/${initialProgress.progress.total} windows already ingested.`
      );
      return;
    }

    console.log(
      `\n[backfill] nothing queued — existing windows skipped (progress API unavailable on this port).`,
      `Expected ~${formatNumber(expectedTotal)} ${granularity} windows for ${start} → ${end}.`
    );
    return;
  }

  if (initialProgress.kind === "progress") {
    console.log("\n[backfill] progress (Ctrl+C to stop):\n");

    let lastCompleted = -1;
    let idlePolls = 0;

    while (true) {
      const result = await fetchBackfillProgress(
        ctx,
        start,
        end,
        granularity,
        chunkDays
      );
      if (result.kind !== "progress") {
        return;
      }

      const { progress } = result;
      process.stdout.write(`\r\u001B[K${renderProgressLine(progress)}`);

      if (progress.completed >= progress.total) {
        process.stdout.write("\n\n[backfill] complete.\n");
        return;
      }

      idlePolls = progress.completed === lastCompleted ? idlePolls + 1 : 0;
      lastCompleted = progress.completed;

      if (idlePolls >= IDLE_POLL_LIMIT) {
        process.stdout.write(
          "\n\n[backfill] tracker paused — no progress in 60s (queue may still be running).\n"
        );
        return;
      }

      await sleep(POLL_MS);
    }
  }

  console.log("\n[backfill] progress (basic — polling /api/v1/status):\n");

  const baseline = await fetchBackfillHealth(ctx);
  const baselineRecords = baseline.cache?.totalRecords ?? 0;
  const baselineWindows = baseline.cache?.ingestWindows ?? 0;
  let lastRecords = baselineRecords;
  let idlePolls = 0;

  while (true) {
    const health = await fetchBackfillHealth(ctx);
    const records = health.cache?.totalRecords ?? 0;

    process.stdout.write(
      `\r\u001B[K${renderFallbackLine({
        baselineRecords,
        baselineWindows,
        expectedTotal,
        health,
      })}`
    );

    idlePolls = records === lastRecords ? idlePolls + 1 : 0;
    lastRecords = records;

    if (idlePolls >= IDLE_POLL_LIMIT) {
      process.stdout.write(
        "\n\n[backfill] tracker paused — no new records in 60s (queue may still be running).\n"
      );
      return;
    }

    await sleep(POLL_MS);
  }
};
