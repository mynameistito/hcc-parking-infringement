/**
 * Geocode Hamilton streets for the map (batched Overpass, no Nominatim).
 *
 * @example
 * bun run geocode
 * bun run geocode -- --limit=25 --once
 */

import { loadDevVars } from "@scripts/dev-env.ts";
import { readArg, readFlag, scriptArgv } from "@scripts/lib/cli/args.ts";
import { fetchMapSnapshot, runGeocodeBatch } from "@scripts/lib/geocode-api.ts";
import { createWorkerContext } from "@scripts/lib/worker/client.ts";

import { parsePositiveInt } from "@/server/http/query.ts";

loadDevVars();

const args = scriptArgv();
const limit = Math.min(parsePositiveInt(readArg(args, "limit"), 50), 100);
const runOnce = readFlag(args, "once");
const { apiKey, workerUrl } = createWorkerContext();

const runAllGeocodeBatches = async (): Promise<{
  totalFailed: number;
  totalGeocoded: number;
}> => {
  let totalGeocoded = 0;
  let totalFailed = 0;
  let batch = 0;

  while (true) {
    batch += 1;

    let result;
    try {
      result = await runGeocodeBatch(workerUrl, apiKey, limit);
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }

    const geocoded = result.geocoded ?? 0;
    const failed = result.failed ?? 0;
    totalGeocoded += geocoded;
    totalFailed += failed;
    const mapSnapshot = await fetchMapSnapshot(workerUrl);
    const pending = result.pending ?? mapSnapshot?.pendingGeocode ?? 0;

    console.log(
      `Batch ${batch}: +${geocoded} geocoded, ${failed} failed · ${pending} pending`
    );

    if (runOnce) {
      break;
    }

    if (geocoded === 0 && failed === 0) {
      console.log("No progress this batch — stopping.");
      break;
    }

    if (pending <= 0) {
      break;
    }
  }

  return { totalFailed, totalGeocoded };
};

console.log(
  runOnce
    ? `Geocoding up to ${limit} Hamilton streets (single batch)…`
    : `Geocoding Hamilton streets in batches of ${limit} until done…`
);

const { totalGeocoded, totalFailed } = await runAllGeocodeBatches();
const mapData = await fetchMapSnapshot(workerUrl);

console.log(
  `Done: ${totalGeocoded} geocoded, ${totalFailed} failed · map routes: ${mapData?.routes?.length ?? 0} · pending: ${mapData?.pendingGeocode ?? "?"}`
);
