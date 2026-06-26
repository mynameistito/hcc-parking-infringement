/**
 * Compare yearly HCC totals vs ParkingStore.
 *
 * Usage: bun run scripts/audit-years.ts
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
const workerUrl = getWorkerUrl();
const apiKey = process.env.API_KEY;

if (apiKey === undefined || apiKey === "") {
  console.error("Missing API_KEY");
  process.exit(1);
}

const formatDateInAuckland = (date: Date): string =>
  formatInTimeZone(date, AUCKLAND_TZ, "yyyy-MM-dd");

const today = formatDateInAuckland(new Date());
const env = getHccClientEnv();

const years = [2020, 2021, 2022, 2023, 2024, 2025, 2026];

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

console.log("Year     HCC      Stored   Delta   Truncated");
console.log("----     ---      ------   -----   ---------");

const yearResults = await Promise.all(
  years.map(async (year) => {
    const start = `${year}-01-01`;
    const end = year === 2026 ? today : `${year}-12-31`;

    const [hcc, stored] = await Promise.all([
      fetchAllInWindow(env, start, end),
      fetchStoredCount(start, end),
    ]);

    return { hcc, stored, year };
  })
);

let hccGrand = 0;
let storedGrand = 0;

for (const { hcc, stored, year } of yearResults) {
  const delta = hcc.records.length - stored;
  hccGrand += hcc.records.length;
  storedGrand += stored;

  const flag = hcc.possiblyTruncated ? "YES" : "";
  console.log(
    `${year}  ${String(hcc.records.length).padStart(8)}  ${String(stored).padStart(8)}  ${String(delta).padStart(6)}  ${flag}`
  );
}

console.log("----     ---      ------   -----");
console.log(
  `ALL   ${String(hccGrand).padStart(8)}  ${String(storedGrand).padStart(8)}  ${String(hccGrand - storedGrand).padStart(6)}`
);

const healthResponseSchema = z.object({
  totalRecords: z.number().optional(),
});

const health = await fetch(`${workerUrl}/api/v1/health`);
const healthBody = healthResponseSchema.safeParse(await health.json());
console.log(
  `\nAll-time stored (health): ${healthBody.success ? (healthBody.data.totalRecords ?? "?") : "?"}`
);
