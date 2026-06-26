/**
 * Push locally backfilled ParkingStore data to a remote worker.
 * Uses export/import APIs — no Cloudflare Queue writes.
 *
 * @example
 * bun run push:local
 * bun run push:local -- --from-port=8787 --to=https://hcc-parking-infringement.mynameistito.workers.dev
 */

import { assertWorkerReachable, loadDevVars } from "@scripts/dev-env.ts";
import { readArg, readFlag, scriptArgv } from "@scripts/lib/args.ts";
import { formatNumber } from "@scripts/lib/backfill-progress.ts";
import {
  fetchExportInfringements,
  fetchExportWatermarks,
  postFinalizeStoredImport,
  postImportStored,
  postImportWatermarks,
} from "@scripts/lib/replication-api.ts";
import { requireApiKey } from "@scripts/lib/worker-client.ts";

loadDevVars();

const args = scriptArgv();
const skipWatermarks = readFlag(args, "skip-watermarks");
const batchSize = Math.min(
  Number.parseInt(readArg(args, "batch-size") ?? "2000", 10),
  5000
);

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

try {
  await assertWorkerReachable(fromUrl);
  await assertWorkerReachable(toUrl);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

let cursor = 0;
let pushed = 0;
let total = 0;

while (true) {
  const exported = await fetchExportInfringements(source, cursor, batchSize);
  ({ total } = exported);

  if (exported.records.length === 0) {
    break;
  }

  const result = await postImportStored(destination, exported.records, false);
  pushed += result.recordsUpserted;
  cursor = exported.nextCursor ?? cursor;

  console.log(
    `[push] infringements ${formatNumber(pushed)}/${formatNumber(total)}`
  );

  if (exported.nextCursor === null) {
    break;
  }

  cursor = exported.nextCursor;
}

if (!skipWatermarks) {
  let offset = 0;
  let importedWatermarks = 0;
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

    console.log(
      `[push] watermarks ${formatNumber(importedWatermarks)}/${formatNumber(watermarkTotal)}`
    );

    if (exported.nextOffset === null) {
      break;
    }

    offset = exported.nextOffset;
  }
}

await postFinalizeStoredImport(destination);

console.log(
  `[push] complete — ${formatNumber(pushed)} infringements uploaded to ${toUrl}`
);
