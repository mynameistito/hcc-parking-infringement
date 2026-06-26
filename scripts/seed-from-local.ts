/**
 * Pull ParkingStore from local DO, upload NDJSON seed to R2, optionally apply on remote.
 *
 * @example
 * bun run seed:from-local -- --from-port=8787
 * bun run seed:from-local -- --from-port=8787 --apply --to=https://your-worker.workers.dev
 * bun run seed:from-local -- --upload-only --apply
 */

import { readdir } from "node:fs/promises";
import path from "node:path";

import { assertWorkerReachable, loadDevVars } from "@scripts/dev-env.ts";
import { readArg, readFlag, scriptArgv } from "@scripts/lib/args.ts";
import {
  resolveImportJsonTargetUrl,
  resolveReplicationSourceUrl,
} from "@scripts/lib/replication-target.ts";
import { applySeedOnRemote } from "@scripts/lib/seed-apply-remote.ts";
import { exportSeedChunksFromWorker } from "@scripts/lib/seed-export.ts";
import { uploadSeedDirectory } from "@scripts/lib/seed-upload.ts";
import { requireApiKey } from "@scripts/lib/worker-client.ts";

import { parsePositiveInt } from "@/server/http/query.ts";

loadDevVars();

const args = scriptArgv();
const skipWatermarks = readFlag(args, "skip-watermarks");
const uploadOnly = readFlag(args, "upload-only");
const apply = readFlag(args, "apply");
const chunkRecords = Math.min(
  parsePositiveInt(readArg(args, "chunk-records"), 50_000),
  50_000
);
const outDir = path.resolve(readArg(args, "out-dir") ?? "data/seed");
const bucket = readArg(args, "bucket") ?? "hcc-parking-infringement-seed";
const prefix = readArg(args, "prefix") ?? "parking-store/v1/";
const pauseMs = Number.parseInt(readArg(args, "pause-ms") ?? "1000", 10);

const sourceUrl = resolveReplicationSourceUrl(args);
const apiKey = requireApiKey();

if (!uploadOnly) {
  console.log(`[seed] pull local DO @ ${sourceUrl}`);

  try {
    await assertWorkerReachable(sourceUrl);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }

  const exported = await exportSeedChunksFromWorker({
    chunkRecords,
    label: "seed",
    onProgress: (message) => {
      console.log(message);
    },
    outDir,
    skipWatermarks,
    source: { apiKey, workerUrl: sourceUrl },
  });

  console.log(
    `[seed] wrote ${exported.files.length} files (${exported.manifest.totalInfringements} infringements) → ${outDir}`
  );
}

const dirEntries = await readdir(outDir);
const filesOnDisk = dirEntries.filter(
  (name) => name.endsWith(".ndjson") || name === "manifest.json"
);

console.log(`[seed] uploading to r2://${bucket}/${prefix}`);
await uploadSeedDirectory({
  bucket,
  dir: outDir,
  files: filesOnDisk,
  prefix,
});

if (!apply) {
  console.log(
    [
      "[seed] upload complete.",
      `Ensure wrangler has PARKING_STORE_SEED_PREFIX=${JSON.stringify(prefix)} and PARKING_SEED R2 binding, then deploy.`,
      "Then: bun run seed:apply -- --to=https://your-worker.workers.dev",
    ].join("\n")
  );
  process.exit(0);
}

const toUrl = resolveImportJsonTargetUrl(args);

try {
  await assertWorkerReachable(toUrl);
  await applySeedOnRemote({
    apiKey,
    pauseMs,
    prefix,
    toUrl,
  });
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

console.log(`[seed] apply complete on ${toUrl}`);
