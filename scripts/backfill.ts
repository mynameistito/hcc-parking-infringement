/**
 * Trigger a backfill against your deployed (or local) worker.
 *
 * @example
 * bun run backfill
 * bun run backfill -- --granularity=day --from=1990-01-01
 * bun run backfill -- --delivery=queue
 * bun run backfill -- --port=8787 --force --no-track
 */

import {
  assertWorkerReachable,
  loadDevVars,
  resolveWorkerUrl,
} from "@scripts/dev-env.ts";
import { queueBackfillWaves } from "@scripts/lib/backfill/queue.ts";
import {
  trackBackfill,
  warnIfWorkerLooksOutdated,
} from "@scripts/lib/backfill/track.ts";
import { readArg, readFlag, scriptArgv } from "@scripts/lib/cli/args.ts";
import { createWorkerContext } from "@scripts/lib/worker/client.ts";

import { todayInAuckland } from "@/lib/auckland-time.ts";
import { BACKFILL_EARLIEST } from "@/lib/backfill-constants.ts";

loadDevVars();

const args = scriptArgv();
const force = readFlag(args, "force");
const track = !readFlag(args, "no-track");
const delivery = readArg(args, "delivery") ?? "queue";

let workerUrl: string;

try {
  workerUrl = resolveWorkerUrl(args);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

const ctx = createWorkerContext(workerUrl);

const granularity = readArg(args, "granularity") ?? "week";
const chunkDays = readArg(args, "chunkDays");
const from = readArg(args, "from") ?? BACKFILL_EARLIEST;
const to = readArg(args, "to") ?? todayInAuckland();

console.log(
  `[backfill] ${from} → ${to} (${granularity}, ${delivery}) @ ${workerUrl}`
);

try {
  await assertWorkerReachable(workerUrl);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

const { bodies, totalEnqueued } = await queueBackfillWaves(ctx, {
  chunkDays,
  delivery,
  force,
  from,
  granularity,
  to,
});

const body = bodies.at(-1) ?? null;

if (bodies.length > 1) {
  console.log(
    `[backfill] ${totalEnqueued.toLocaleString("en-NZ")} windows queued in ${bodies.length} waves`
  );
}

if (body !== null) {
  warnIfWorkerLooksOutdated(body, granularity, from, to);
}

if (track && body !== null) {
  try {
    await trackBackfill(
      ctx,
      body.start ?? from,
      body.end ?? to,
      granularity,
      chunkDays,
      totalEnqueued
    );
  } catch (error) {
    console.error(
      "\nProgress tracker stopped:",
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}
