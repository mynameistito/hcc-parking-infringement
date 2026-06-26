/**
 * Apply an uploaded R2 seed to the deployed worker (one chunk per request).
 *
 * @example
 * bun run seed:apply -- --to=https://hcc-parking-infringement.mynameistito.workers.dev
 */

import { assertWorkerReachable, loadDevVars } from "@scripts/dev-env.ts";
import { readArg, scriptArgv } from "@scripts/lib/cli/args.ts";
import { resolveImportJsonTargetUrl } from "@scripts/lib/replication/target.ts";
import { applySeedOnRemote } from "@scripts/lib/seed/apply-remote.ts";
import { requireApiKey } from "@scripts/lib/worker/client.ts";

loadDevVars();

const args = scriptArgv();
const prefix = readArg(args, "prefix");
const pauseMs = Number.parseInt(readArg(args, "pause-ms") ?? "1000", 10);
const startAfterChunk = readArg(args, "start-after-chunk");

const toUrl = resolveImportJsonTargetUrl(args);
const apiKey = requireApiKey();

console.log(`[seed:apply] ${toUrl}`);

try {
  await assertWorkerReachable(toUrl);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

try {
  await applySeedOnRemote({
    apiKey,
    pauseMs,
    prefix,
    startAfterChunk,
    toUrl,
  });
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

console.log("[seed:apply] complete");
