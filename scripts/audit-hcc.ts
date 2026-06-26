/**
 * Audit stored data vs HCC API by day (or week) windows.
 *
 * Usage:
 *   bun run scripts/audit-hcc.ts
 *   bun run scripts/audit-hcc.ts -- --from=2020-01-01 --granularity=day
 *   bun run scripts/audit-hcc.ts -- --from=2024-01-01 --granularity=week
 */

import {
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

const granularitySchema = z.enum(["day", "week"]);

const getArg = (name: string, fallback: string): string => {
  const match = args.find((arg) => arg.startsWith(`--${name}=`));
  if (match === undefined) {
    return fallback;
  }
  return match.split("=")[1] ?? fallback;
};

const granularity = granularitySchema.parse(getArg("granularity", "week"));
const fromDate = getArg("from", "2020-01-01");
const workerUrl = getWorkerUrl();
const apiKey = process.env.API_KEY;

if (apiKey === undefined || apiKey === "") {
  console.error("Missing API_KEY");
  process.exit(1);
}

const formatDateInAuckland = (date: Date): string =>
  formatInTimeZone(date, AUCKLAND_TZ, "yyyy-MM-dd");

const addDays = (dateStr: string, days: number): string => {
  const date = new Date(`${dateStr}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

const today = formatDateInAuckland(new Date());
const env = getHccClientEnv();

interface Window {
  start: string;
  end: string;
}

const buildWindows = (): Window[] => {
  const windows: Window[] = [];
  let cursor = fromDate;
  const step = granularity === "day" ? 0 : 6;

  while (cursor <= today) {
    const end = addDays(cursor, step);
    windows.push({
      end: end > today ? today : end,
      start: cursor,
    });
    cursor = addDays(end > today ? today : end, 1);
  }

  return windows;
};

const storedTotalSchema = z.object({
  total: z.number().optional(),
});

const fetchStoredCount = async (
  start: string,
  end: string
): Promise<number> => {
  const url = new URL(`${workerUrl}/api/v1/infringements`);
  url.searchParams.set("from", start);
  url.searchParams.set("to", end);
  url.searchParams.set("limit", "1");
  url.searchParams.set("page", "1");

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const parsed = storedTotalSchema.safeParse(await response.json());
  return parsed.success ? (parsed.data.total ?? 0) : 0;
};

const windows = buildWindows();

console.log(
  `Auditing ${windows.length} ${granularity} windows from ${fromDate} → ${today}\n`
);

const windowResults = await Promise.all(
  windows.map(async (window) => {
    const [hcc, stored] = await Promise.all([
      fetchAllInWindow(env, window.start, window.end),
      fetchStoredCount(window.start, window.end),
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
