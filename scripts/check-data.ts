/**
 * Compare stored ParkingStore counts against HCC Open Data API.
 *
 * Usage:
 *   bun run scripts/check-data.ts
 *   bun run scripts/check-data.ts -- --days=30
 */

import {
  describeConnectionFailure,
  getHccClientEnv,
  getWorkerUrl,
  loadDevVars,
} from "@scripts/dev-env.ts";
import { formatInTimeZone } from "date-fns-tz";
import { z } from "zod";

import { fetchAllInWindow } from "@/server/hcc-client.ts";

loadDevVars();

const AUCKLAND_TZ = "Pacific/Auckland";
const args = process.argv.slice(2);
const daysArg = args.find((a) => a.startsWith("--days="));
const sampleDays = daysArg === undefined ? 14 : Number(daysArg.split("=")[1]);

const workerUrl = getWorkerUrl();
const apiKey = process.env.API_KEY;

const formatDateInAuckland = (date: Date): string =>
  formatInTimeZone(date, AUCKLAND_TZ, "yyyy-MM-dd");

const addDays = (dateStr: string, days: number): string => {
  const date = new Date(`${dateStr}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

const today = formatDateInAuckland(new Date());
const rangeStart = addDays(today, -(sampleDays - 1));

console.log("=== ParkingStore cache ===\n");

const healthPaths = ["/api/v1/health", "/api/v1/cache"] as const;

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

if (apiKey !== undefined && apiKey !== "") {
  const listUrl = new URL(`${workerUrl}/api/v1/infringements`);
  listUrl.searchParams.set("from", rangeStart);
  listUrl.searchParams.set("to", today);
  listUrl.searchParams.set("limit", "1");
  listUrl.searchParams.set("page", "1");

  const listResponse = await fetch(listUrl, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  const listBodySchema = z.object({
    total: z.number().optional(),
  });
  const listBody = listBodySchema.safeParse(await listResponse.json());
  const storedTotal = listBody.success ? (listBody.data.total ?? 0) : 0;
  console.log(
    `\nStored infringements (${rangeStart} → ${today}): ${storedTotal}`
  );

  console.log("\n=== HCC API (direct fetch) ===\n");

  const env = getHccClientEnv();
  const hcc = await fetchAllInWindow(env, rangeStart, today);
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
