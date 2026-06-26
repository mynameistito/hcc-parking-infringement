/**
 * Compare stored ParkingStore counts against HCC Open Data API.
 *
 * @example
 * bun run scripts/check-data.ts
 * bun run scripts/check-data.ts -- --days=30
 */

import {
  describeConnectionFailure,
  getHccClientEnv,
  getWorkerUrl,
  loadDevVars,
} from "@scripts/dev-env.ts";
import { readArg, scriptArgv } from "@scripts/lib/cli/args.ts";
import {
  createWorkerContext,
  fetchStoredInfringementCount,
} from "@scripts/lib/worker/client.ts";

import { todayInAuckland } from "@/lib/auckland-time.ts";
import { addDays } from "@/lib/date-range.ts";
import { fetchAllInWindowOrThrow } from "@/server/hcc-client.ts";
import { parsePositiveInt } from "@/server/http/query.ts";

loadDevVars();

const args = scriptArgv();
const sampleDays = parsePositiveInt(readArg(args, "days"), 14);
const today = todayInAuckland();
const rangeStart = addDays(today, -(sampleDays - 1));

console.log("=== ParkingStore cache ===\n");

const healthPaths = ["/api/v1/health", "/api/v1/cache"] as const;
const workerUrl = getWorkerUrl();

const fetchHealthPath = async (
  path: string
): Promise<{ body: unknown; path: string }> => {
  const url = `${workerUrl}${path}`;
  try {
    const response = await fetch(url);
    const body: unknown = await response.json();
    return { body, path };
  } catch (error) {
    console.error(describeConnectionFailure(error, "GET", url));
    process.exit(1);
    throw error;
  }
};

const healthResults = await Promise.all(
  healthPaths.map(async (path) => await fetchHealthPath(path))
);

for (const { body, path } of healthResults) {
  console.log(`${path}:`, JSON.stringify(body, null, 2));
}

if (process.env.API_KEY !== undefined && process.env.API_KEY !== "") {
  const ctx = createWorkerContext(workerUrl);
  const storedTotal = await fetchStoredInfringementCount(
    ctx,
    rangeStart,
    today
  );
  console.log(
    `\nStored infringements (${rangeStart} → ${today}): ${storedTotal}`
  );

  console.log("\n=== HCC API (direct fetch) ===\n");

  const env = getHccClientEnv();
  const hcc = await fetchAllInWindowOrThrow(env, rangeStart, today);
  console.log(`HCC ${rangeStart} → ${today}:`, {
    lastPageRecords: hcc.lastPageRecords,
    pageCount: hcc.pageCount,
    pageSize: hcc.pageSize,
    pagesFetched: hcc.pagesFetched,
    possiblyTruncated: hcc.possiblyTruncated,
    records: hcc.records.length,
  });

  const diff = hcc.records.length - storedTotal;
  console.log(`\nDelta (HCC − stored) for sample window: ${diff}`);
  if (diff === 0) {
    console.log("✓ Sample window counts match.");
  } else {
    console.log(
      "⚠ Counts differ — backfill may be incomplete or hourly overlap may not have caught up."
    );
  }
} else {
  console.log("\nSet API_KEY to compare daily counts against HCC.");
}
