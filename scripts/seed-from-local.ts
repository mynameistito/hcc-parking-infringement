/**
 * Pull ParkingStore from local DO, upload NDJSON seed to R2, optionally apply on remote.
 *
 * @example
 * bun run seed:from-local -- --from-port=8787
 * bun run seed:from-local -- --from-port=8787 --apply --to=https://your-worker.workers.dev
 * bun run seed:from-local -- --upload-only --apply
 */

import { readFile } from "node:fs/promises";
import path from "node:path";

import { assertWorkerReachable, loadDevVars } from "@scripts/dev-env.ts";
import { readArg, readFlag, scriptArgv } from "@scripts/lib/cli/args.ts";
import {
  resolveImportJsonTargetUrl,
  resolveReplicationSourceUrl,
} from "@scripts/lib/replication/target.ts";
import { applySeedOnRemote } from "@scripts/lib/seed/apply-remote.ts";
import { exportSeedChunksFromWorker } from "@scripts/lib/seed/export.ts";
import { uploadSeedDirectory } from "@scripts/lib/seed/upload.ts";
import { requireApiKey } from "@scripts/lib/worker/client.ts";

import { parsePositiveInt } from "@/server/http/query.ts";
import { parseSeedManifest } from "@/server/seed-manifest.ts";

const listSeedFilesToUpload = async (seedDir: string): Promise<string[]> => {
  const manifestPath = path.join(seedDir, "manifest.json");
  const manifestRaw = await readFile(manifestPath, "utf-8");
  const manifest = parseSeedManifest(JSON.parse(manifestRaw));

  return [
    "manifest.json",
    ...manifest.infringementChunks,
    ...(manifest.watermarksKey === undefined ? [] : [manifest.watermarksKey]),
    ...(manifest.dashboardSnapshotKey === undefined
      ? []
      : [manifest.dashboardSnapshotKey]),
  ];
};

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

const filesOnDisk = await listSeedFilesToUpload(outDir);

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
      `Ensure wrangler has PARKING_STORE_SEED_PREFIX=${JSON.stringify(prefix)} and R2 S3 credentials (R2_ACCESS_KEY_ID + R2_SECRET_ACCESS_KEY), then deploy.`,
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
