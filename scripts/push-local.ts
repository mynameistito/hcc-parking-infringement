/**
 * Push locally backfilled ParkingStore data to a remote worker.
 * Uses export/import APIs — no Cloudflare Queue writes.
 *
 * @example
 * bun run push:local
 * bun run push:local -- --from-port=8787 --to=https://hcc-parking-infringement.mynameistito.workers.dev
 * bun run push:local -- --start-after=12345678
 * bun run push:local -- --fresh
 */

import { setTimeout as delay } from "node:timers/promises";

import { assertWorkerReachable, loadDevVars } from "@scripts/dev-env.ts";
import { readArg, readFlag, scriptArgv } from "@scripts/lib/args.ts";
import { formatNumber } from "@scripts/lib/backfill-progress.ts";
import {
  clearPushCheckpoint,
  loadPushCheckpoint,
  savePushCheckpoint,
} from "@scripts/lib/push-checkpoint.ts";
import {
  fetchExportInfringements,
  fetchExportWatermarks,
  postFinalizeStoredImport,
  postImportStored,
  postImportWatermarks,
} from "@scripts/lib/replication-api.ts";
import { requireApiKey } from "@scripts/lib/worker-client.ts";

import { parseNonNegativeInt, parsePositiveInt } from "@/server/http/query.ts";

loadDevVars();

const args = scriptArgv();
const skipWatermarks = readFlag(args, "skip-watermarks");
const fresh = readFlag(args, "fresh");
const batchSize = Math.min(
  parsePositiveInt(readArg(args, "batch-size"), 1000),
  5000
);
const pauseMs = parseNonNegativeInt(readArg(args, "pause-ms"), 500);
const explicitStartAfter = readArg(args, "start-after");

const resolveFromUrl = (): string => {
  const explicit = readArg(args, "from");
  if (explicit !== undefined) {
    return explicit.replace(/\/$/u, "");
  }

  const fromPort = readArg(args, "from-port") ?? "8787";
  return `http://127.0.0.1:${fromPort}`;
};

const resolveToUrl = (): string => {
  const explicit = readArg(args, "to");
  if (explicit !== undefined) {
    return explicit.replace(/\/$/u, "");
  }

  const workerUrl = process.env.WORKER_URL;
  if (workerUrl === undefined || workerUrl.includes("127.0.0.1")) {
    throw new Error(
      "Set --to=https://your-worker.workers.dev or WORKER_URL to the remote deployment."
    );
  }

  return workerUrl.replace(/\/$/u, "");
};

const apiKey = requireApiKey();
const fromUrl = resolveFromUrl();
const toUrl = resolveToUrl();

if (fromUrl === toUrl) {
  console.error("Source and destination URLs must differ.");
  process.exit(1);
}

const source = { apiKey, workerUrl: fromUrl };
const destination = { apiKey, workerUrl: toUrl };

console.log(`[push] ${fromUrl} → ${toUrl}`);
if (pauseMs > 0) {
  console.log(`[push] pausing ${pauseMs}ms between batches`);
}

try {
  await assertWorkerReachable(fromUrl);
  await assertWorkerReachable(toUrl);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

let infringementCursor = parseNonNegativeInt(explicitStartAfter, 0);
let infringementPushed = 0;
let watermarkOffset = 0;
let watermarkImported = 0;
let startPhase: "infringements" | "watermarks" = "infringements";

if (fresh) {
  await clearPushCheckpoint();
  console.log("[push] ignoring any saved checkpoint (--fresh)");
} else if (explicitStartAfter === undefined) {
  const checkpoint = await loadPushCheckpoint();
  if (
    checkpoint !== null &&
    checkpoint.fromUrl === fromUrl &&
    checkpoint.toUrl === toUrl
  ) {
    const {
      infringementCursor: checkpointCursor,
      infringementPushed: checkpointPushed,
      phase,
      updatedAt: checkpointUpdatedAt,
      watermarkImported: checkpointWatermarkImported,
      watermarkOffset: checkpointWatermarkOffset,
    } = checkpoint;
    infringementCursor = checkpointCursor;
    infringementPushed = checkpointPushed;
    startPhase = phase;
    watermarkImported = checkpointWatermarkImported;
    watermarkOffset = checkpointWatermarkOffset;
    console.log(
      `[push] resuming from checkpoint (${startPhase}, updated ${checkpointUpdatedAt})`
    );
  }
} else {
  console.log(
    `[push] resuming infringements after #${formatNumber(infringementCursor)}`
  );
}

const pauseBetweenBatches = async (): Promise<void> => {
  if (pauseMs > 0) {
    await delay(pauseMs);
  }
};

let total = 0;

if (startPhase === "infringements") {
  let cursor = infringementCursor;
  let pushed = infringementPushed;

  while (true) {
    const exported = await fetchExportInfringements(
      source,
      cursor,
      batchSize,
      total === 0 ? "scan" : "cached"
    );
    ({ total } = exported);

    if (exported.records.length === 0) {
      break;
    }

    const result = await postImportStored(destination, exported.records, false);
    pushed += result.recordsUpserted;
    cursor = exported.nextCursor ?? cursor;

    await savePushCheckpoint({
      fromUrl,
      infringementCursor: cursor,
      infringementPushed: pushed,
      phase: "infringements",
      toUrl,
      updatedAt: new Date().toISOString(),
      watermarkImported,
      watermarkOffset,
    });

    console.log(
      `[push] infringements ${formatNumber(pushed)}/${formatNumber(total)} (cursor=${formatNumber(cursor)})`
    );

    if (exported.nextCursor === null) {
      break;
    }

    cursor = exported.nextCursor;
    await pauseBetweenBatches();
  }

  infringementCursor = cursor;
  infringementPushed = pushed;
}

if (!skipWatermarks) {
  if (startPhase === "infringements") {
    await savePushCheckpoint({
      fromUrl,
      infringementCursor,
      infringementPushed,
      phase: "watermarks",
      toUrl,
      updatedAt: new Date().toISOString(),
      watermarkImported: 0,
      watermarkOffset: 0,
    });
  }

  let offset = watermarkOffset;
  let importedWatermarks = watermarkImported;
  let watermarkTotal = 0;

  while (true) {
    const exported = await fetchExportWatermarks(source, offset, batchSize);
    watermarkTotal = exported.total;

    if (exported.watermarks.length === 0) {
      break;
    }

    await postImportWatermarks(destination, exported.watermarks);
    importedWatermarks += exported.watermarks.length;
    offset = exported.nextOffset ?? offset;

    await savePushCheckpoint({
      fromUrl,
      infringementCursor,
      infringementPushed,
      phase: "watermarks",
      toUrl,
      updatedAt: new Date().toISOString(),
      watermarkImported: importedWatermarks,
      watermarkOffset: offset,
    });

    console.log(
      `[push] watermarks ${formatNumber(importedWatermarks)}/${formatNumber(watermarkTotal)}`
    );

    if (exported.nextOffset === null) {
      break;
    }

    offset = exported.nextOffset;
    await pauseBetweenBatches();
  }
}

await postFinalizeStoredImport(destination);
await clearPushCheckpoint();

console.log(
  `[push] complete — ${formatNumber(infringementPushed)} infringements uploaded to ${toUrl}`
);
