/**
 * Export the full local ParkingStore to a JSON file only (no upload).
 * To pull local data and POST JSON to production in one step, use `push:json`.
 *
 * @example
 * bun run export:json -- --from-port=8787
 */

import path from "node:path";

import { assertWorkerReachable, loadDevVars } from "@scripts/dev-env.ts";
import { readArg, readFlag, scriptArgv } from "@scripts/lib/args.ts";
import { formatNumber } from "@scripts/lib/backfill-progress.ts";
import { createSnapshotWriter } from "@scripts/lib/parking-store-snapshot.ts";
import type { IngestWatermarkExport } from "@scripts/lib/parking-store-snapshot.ts";
import {
  fetchExportInfringements,
  fetchExportWatermarks,
} from "@scripts/lib/replication-api.ts";
import { resolveReplicationSourceUrl } from "@scripts/lib/replication-target.ts";
import { requireApiKey } from "@scripts/lib/worker-client.ts";

import { parsePositiveInt } from "@/server/http/query.ts";

loadDevVars();

const args = scriptArgv();
const skipWatermarks = readFlag(args, "skip-watermarks");
const batchSize = Math.min(
  parsePositiveInt(readArg(args, "batch-size"), 2000),
  5000
);
const outPath = path.resolve(
  readArg(args, "out") ?? "data/parking-store-export.json"
);

const sourceUrl = resolveReplicationSourceUrl(args);
const apiKey = requireApiKey();
const source = { apiKey, workerUrl: sourceUrl };

console.log(`[export:json] ${sourceUrl} → ${outPath}`);

try {
  await assertWorkerReachable(sourceUrl);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

const writer = await createSnapshotWriter(outPath, {
  exportedAt: new Date().toISOString(),
  source: sourceUrl,
});

let cursor = 0;
let exported = 0;
let total = 0;

while (true) {
  const page = await fetchExportInfringements(
    source,
    cursor,
    batchSize,
    total === 0 ? "scan" : "cached"
  );
  ({ total } = page);

  if (page.records.length === 0) {
    break;
  }

  writer.appendInfringements(page.records);
  exported += page.records.length;
  cursor = page.nextCursor ?? cursor;

  console.log(
    `[export:json] infringements ${formatNumber(exported)}/${formatNumber(total)}`
  );

  if (page.nextCursor === null) {
    break;
  }

  cursor = page.nextCursor;
}

const watermarks: IngestWatermarkExport[] = [];

if (!skipWatermarks) {
  let offset = 0;

  while (true) {
    const page = await fetchExportWatermarks(source, offset, batchSize);

    if (page.watermarks.length === 0) {
      break;
    }

    watermarks.push(...page.watermarks);
    offset = page.nextOffset ?? offset;

    console.log(
      `[export:json] watermarks ${formatNumber(watermarks.length)}/${formatNumber(page.total)}`
    );

    if (page.nextOffset === null) {
      break;
    }

    offset = page.nextOffset;
  }
}

await writer.close({
  totalInfringements: exported,
  watermarks,
});

console.log(
  `[export:json] complete — ${formatNumber(exported)} infringements, ${formatNumber(watermarks.length)} watermarks → ${outPath}`
);
