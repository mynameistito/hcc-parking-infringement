/**
 * Pull the full local ParkingStore and POST JSON snapshot batches to a remote worker.
 *
 * @example
 * bun run push:json -- --from-port=8787 --to=https://hcc-parking-infringement.mynameistito.workers.dev
 * bun run push:json -- --pause-ms=500 --save-out=data/parking-store-export.json
 */

import path from "node:path";

import { assertWorkerReachable, loadDevVars } from "@scripts/dev-env.ts";
import { formatNumber } from "@scripts/lib/backfill/progress.ts";
import { readArg, readFlag, scriptArgv } from "@scripts/lib/cli/args.ts";
import { createSnapshotWriter } from "@scripts/lib/replication/snapshot.ts";
import { syncSnapshotBetweenWorkers } from "@scripts/lib/replication/sync.ts";
import {
  resolveReplicationSourceUrl,
  resolveReplicationTargetUrl,
} from "@scripts/lib/replication/target.ts";
import { requireApiKey } from "@scripts/lib/worker/client.ts";

import { parseNonNegativeInt, parsePositiveInt } from "@/server/http/query.ts";

loadDevVars();

const args = scriptArgv();
const skipWatermarks = readFlag(args, "skip-watermarks");
const batchSize = Math.min(
  parsePositiveInt(readArg(args, "batch-size"), 1000),
  5000
);
const pauseMs = parseNonNegativeInt(readArg(args, "pause-ms"), 500);
const startAfter = parseNonNegativeInt(readArg(args, "start-after"), 0);
const saveOut = readArg(args, "save-out");

const fromUrl = resolveReplicationSourceUrl(args);
const toUrl = resolveReplicationTargetUrl(args);

if (fromUrl === toUrl) {
  console.error("Source and destination URLs must differ.");
  process.exit(1);
}

const apiKey = requireApiKey();
const source = { apiKey, workerUrl: fromUrl };
const destination = { apiKey, workerUrl: toUrl };

console.log(`[push:json] pull ${fromUrl} → POST snapshot JSON → ${toUrl}`);
if (pauseMs > 0) {
  console.log(`[push:json] pausing ${pauseMs}ms between batches`);
}
if (saveOut !== undefined) {
  console.log(`[push:json] also saving snapshot to ${saveOut}`);
}
if (startAfter > 0) {
  console.log(
    `[push:json] resuming after infringement #${formatNumber(startAfter)}`
  );
}

try {
  await assertWorkerReachable(fromUrl);
  await assertWorkerReachable(toUrl);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

const writer =
  saveOut === undefined
    ? undefined
    : await createSnapshotWriter(path.resolve(saveOut), {
        exportedAt: new Date().toISOString(),
        source: fromUrl,
      });

const result = await syncSnapshotBetweenWorkers(source, destination, {
  batchSize,
  label: "push:json",
  pauseMs,
  skipWatermarks,
  startAfter,
  writer,
});

console.log(
  `[push:json] complete — ${formatNumber(result.uploadedInfringements)} infringements uploaded to ${toUrl}`
);
