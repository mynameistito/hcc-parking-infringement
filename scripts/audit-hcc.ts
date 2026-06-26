/**
 * Audit stored data vs HCC API by day (or week) windows.
 *
 * @example
 * bun run scripts/audit-hcc.ts
 * bun run scripts/audit-hcc.ts -- --granularity=day --from=2024-01-01
 */

import { getHccClientEnv, loadDevVars } from "@scripts/dev-env.ts";
import { readArgWithDefault, scriptArgv } from "@scripts/lib/cli/args.ts";
import {
  createWorkerContext,
  fetchStoredInfringementCount,
} from "@scripts/lib/worker/client.ts";
import { z } from "zod";

import { todayInAuckland } from "@/lib/auckland-time.ts";
import { fetchAllInWindowOrThrow } from "@/server/hcc-client.ts";
import { splitDateRange } from "@/server/sync.ts";

loadDevVars();

const args = scriptArgv();
const granularitySchema = z.enum(["day", "week"]);
const granularity = granularitySchema.parse(
  readArgWithDefault(args, "granularity", "week")
);
const fromDate = readArgWithDefault(args, "from", "2020-01-01");
const today = todayInAuckland();
const ctx = createWorkerContext();
const chunkDays = granularity === "day" ? 1 : 7;
const windows = splitDateRange(fromDate, today, chunkDays);
const env = getHccClientEnv();

console.log(
  `Auditing ${windows.length} ${granularity} windows from ${fromDate} → ${today}\n`
);

const windowResults = await Promise.all(
  windows.map(async (window) => {
    const [hcc, stored] = await Promise.all([
      fetchAllInWindowOrThrow(env, window.start, window.end),
      fetchStoredInfringementCount(ctx, window.start, window.end),
    ]);
    return { hcc, stored, window };
  })
);

let mismatches = 0;
let hccTotal = 0;
let storedTotal = 0;
let truncated = 0;

for (const { hcc, stored, window } of windowResults) {
  hccTotal += hcc.records.length;
  storedTotal += stored;

  if (hcc.possiblyTruncated) {
    truncated += 1;
  }

  const delta = hcc.records.length - stored;
  if (delta !== 0 || hcc.possiblyTruncated) {
    mismatches += 1;
    console.log(
      `${window.start} → ${window.end}: HCC=${hcc.records.length} stored=${stored} delta=${delta}${hcc.possiblyTruncated ? " TRUNCATED" : ""}`
    );
  }
}

console.log("\n=== Summary ===");
console.log({
  granularity,
  hccTotal,
  mismatchedWindows: mismatches,
  storedTotal,
  totalWindows: windows.length,
  truncatedWindows: truncated,
});
