/**
 * Import a ParkingStore JSON snapshot into a worker (usually production).
 *
 * @example
 * bun run import:json -- --to=https://hcc-parking-infringement.mynameistito.workers.dev
 * bun run import:json -- --file=data/parking-store-export.json --pause-ms=500
 * bun run import:json -- --start-after=101576
 */

import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

import { assertWorkerReachable, loadDevVars } from "@scripts/dev-env.ts";
import { formatNumber } from "@scripts/lib/backfill/progress.ts";
import { readArg, readFlag, scriptArgv } from "@scripts/lib/cli/args.ts";
import {
  postFinalizeStoredImport,
  postImportSnapshot,
  postImportWatermarks,
} from "@scripts/lib/replication/api.ts";
import { readParkingStoreSnapshot } from "@scripts/lib/replication/snapshot.ts";
import { resolveImportJsonTargetUrl } from "@scripts/lib/replication/target.ts";
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
const filePath = path.resolve(
  readArg(args, "file") ?? "data/parking-store-export.json"
);

const toUrl = resolveImportJsonTargetUrl(args);
const apiKey = requireApiKey();
const destination = { apiKey, workerUrl: toUrl };

console.log(`[import:json] ${filePath} → ${toUrl}`);
if (pauseMs > 0) {
  console.log(`[import:json] pausing ${pauseMs}ms between batches`);
}

try {
  await assertWorkerReachable(toUrl);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

console.log(`[import:json] loading snapshot…`);
const snapshot = await readParkingStoreSnapshot(filePath);
const records =
  startAfter > 0
    ? snapshot.infringements.filter(
        (record) => record.infringementNumber > startAfter
      )
    : snapshot.infringements;

if (startAfter > 0) {
  console.log(
    `[import:json] resuming after infringement #${formatNumber(startAfter)} (${formatNumber(records.length)} remaining)`
  );
}

console.log(
  `[import:json] snapshot v${snapshot.version} from ${snapshot.source} (${formatNumber(snapshot.totalInfringements)} records)`
);

let pushed = snapshot.infringements.length - records.length;

for (let index = 0; index < records.length; index += batchSize) {
  const batch = records.slice(index, index + batchSize);
  const result = await postImportSnapshot(destination, batch);
  pushed += result.recordsUpserted;

  const last = batch.at(-1);
  const resumeCursor = last?.infringementNumber ?? startAfter;

  console.log(
    `[import:json] infringements ${formatNumber(pushed)}/${formatNumber(snapshot.totalInfringements)} (resume: --start-after=${resumeCursor})`
  );

  if (pauseMs > 0 && index + batchSize < records.length) {
    await delay(pauseMs);
  }
}

if (!skipWatermarks && snapshot.watermarks.length > 0) {
  for (
    let offset = 0;
    offset < snapshot.watermarks.length;
    offset += batchSize
  ) {
    const batch = snapshot.watermarks.slice(offset, offset + batchSize);
    await postImportWatermarks(destination, batch);

    console.log(
      `[import:json] watermarks ${formatNumber(Math.min(offset + batch.length, snapshot.watermarks.length))}/${formatNumber(snapshot.watermarks.length)}`
    );

    if (pauseMs > 0 && offset + batchSize < snapshot.watermarks.length) {
      await delay(pauseMs);
    }
  }
}

await postFinalizeStoredImport(destination);

console.log(
  `[import:json] complete — ${formatNumber(pushed)} infringements uploaded to ${toUrl}`
);
