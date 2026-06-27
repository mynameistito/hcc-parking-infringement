/**
 * Migrate R2 parking-store seed into ParkingStore DO on prod, one chunk per day
 * by default so DO SQLite writes stay inside the Workers Free plan.
 *
 * Safe to run while prod still serves reads from R2 (`PARKING_STORE_READ_SOURCE=seed`).
 * Seed import writes directly to the DO and does not flip dashboard reads.
 *
 * @example
 * bun run migrate:seed-to-do
 * bun run migrate:seed-to-do -- --chunks-per-run=1 --pause-ms=5000
 * bun run migrate:seed-to-do -- --finalize
 * bun run migrate:seed-to-do -- --fresh
 */

import { assertWorkerReachable, loadDevVars } from "@scripts/dev-env.ts";
import { readArg, readFlag, scriptArgv } from "@scripts/lib/cli/args.ts";
import { resolveImportJsonTargetUrl } from "@scripts/lib/replication/target.ts";
import {
  applySeedOnRemote,
  finalizeSeedOnRemote,
  SeedApplyQuotaError,
} from "@scripts/lib/seed/apply-remote.ts";
import {
  clearSeedToDoMigrationCheckpoint,
  loadSeedToDoMigrationCheckpoint,
  saveSeedToDoMigrationCheckpoint,
} from "@scripts/lib/seed/migration-checkpoint.ts";
import { requireApiKey } from "@scripts/lib/worker/client.ts";

import { FREE_TIER_SEED_CHUNKS_PER_DAY } from "@/lib/free-tier-limits.ts";
import { parsePositiveInt } from "@/server/http/query.ts";

const printFlipInstructions = (): void => {
  console.log(
    [
      "Next steps:",
      "1. bun run deploy:do   # flip dashboard reads to ParkingStore DO",
      "2. bun run backfill -- --delivery=queue   # fill any HCC gaps (queue throttled by FREE_TIER_MODE)",
      "",
      "If DO misbehaves, instant R2 fallback: bun run deploy:seed",
    ].join("\n")
  );
};

loadDevVars();

const args = scriptArgv();
const fresh = readFlag(args, "fresh");
const finalizeOnly = readFlag(args, "finalize");
const prefix = readArg(args, "prefix");
const pauseMs = parsePositiveInt(readArg(args, "pause-ms"), 5000);
const chunksPerRun = parsePositiveInt(
  readArg(args, "chunks-per-run"),
  FREE_TIER_SEED_CHUNKS_PER_DAY
);

const toUrl = resolveImportJsonTargetUrl(args);
const apiKey = requireApiKey();

console.log(
  finalizeOnly
    ? `[migrate:seed-to-do] finalize on ${toUrl}`
    : `[migrate:seed-to-do] target ${toUrl} · up to ${chunksPerRun} chunk(s) this run`
);

try {
  await assertWorkerReachable(toUrl);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

if (fresh) {
  await clearSeedToDoMigrationCheckpoint();
  console.log("[migrate:seed-to-do] cleared saved checkpoint (--fresh)");
}

if (finalizeOnly) {
  try {
    await finalizeSeedOnRemote({ apiKey, prefix, toUrl });
    await clearSeedToDoMigrationCheckpoint();
    console.log("[migrate:seed-to-do] finalize complete");
    console.log("Next: bun run deploy:do");
  } catch (error) {
    if (error instanceof SeedApplyQuotaError) {
      console.error(error.message);
      process.exit(1);
    }
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
  process.exit(0);
}

const checkpoint = fresh ? null : await loadSeedToDoMigrationCheckpoint(toUrl);
const startAfterChunk = checkpoint?.lastChunk ?? undefined;
const completedChunks = [...(checkpoint?.completedChunks ?? [])];

if (checkpoint !== null) {
  console.log(
    `[migrate:seed-to-do] resuming after ${checkpoint.lastChunk ?? "start"} (${checkpoint.completedChunks.length} chunks done)`
  );
}

try {
  const result = await applySeedOnRemote({
    apiKey,
    maxChunks: chunksPerRun,
    onChunkApplied: async (chunk) => {
      completedChunks.push(chunk);
      await saveSeedToDoMigrationCheckpoint({
        completedChunks,
        lastChunk: chunk,
        targetUrl: toUrl,
        updatedAt: new Date().toISOString(),
      });
    },
    pauseMs,
    prefix,
    skipFinalize: true,
    startAfterChunk,
    toUrl,
  });

  if (result.completed) {
    await clearSeedToDoMigrationCheckpoint();
    console.log("[migrate:seed-to-do] migration complete");
    printFlipInstructions();
    process.exit(0);
  }

  const lastApplied = result.appliedChunks.at(-1);
  console.log(
    `[migrate:seed-to-do] applied ${result.appliedChunks.length} chunk(s) this run${
      lastApplied === undefined ? "" : ` (last: ${lastApplied})`
    }`
  );

  if (result.allChunksImported) {
    console.log(
      [
        "All infringement chunks imported.",
        "Run finalize (separate step — heavy DO read recompute):",
        "  bun run migrate:seed-to-do -- --finalize",
      ].join("\n")
    );
    process.exit(0);
  }

  console.log(
    [
      `${result.remainingChunks.length} chunk(s) remaining.`,
      "Re-run tomorrow (UTC quota resets at midnight) or after quota headroom returns:",
      "  bun run migrate:seed-to-do",
      "",
      "Dashboard still on R2 until: bun run deploy:do",
      "Instant R2 fallback later: bun run deploy:seed",
    ].join("\n")
  );
} catch (error) {
  if (error instanceof SeedApplyQuotaError) {
    console.error(error.message);
    console.error(
      "\nStopped at the DO SQLite free-tier write cap. Re-run after UTC midnight:\n  bun run migrate:seed-to-do"
    );
    process.exit(1);
  }

  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
