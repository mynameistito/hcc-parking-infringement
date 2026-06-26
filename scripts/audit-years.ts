/**
 * Compare yearly HCC totals vs ParkingStore (2020 through current year).
 *
 * @example
 * bun run scripts/audit-years.ts
 */

import { getHccClientEnv, loadDevVars } from "@scripts/dev-env.ts";
import {
  createWorkerContext,
  fetchStoredInfringementCount,
} from "@scripts/lib/worker-client.ts";
import { z } from "zod";

import { currentYearInAuckland, todayInAuckland } from "@/lib/auckland-time.ts";
import { fetchAllInWindow } from "@/server/hcc-client.ts";

loadDevVars();

const ctx = createWorkerContext();
const today = todayInAuckland();
const env = getHccClientEnv();
const firstAuditYear = 2020;
const years = Array.from(
  { length: currentYearInAuckland() - firstAuditYear + 1 },
  (_, index) => firstAuditYear + index
);

console.log("Year     HCC      Stored   Delta   Truncated");
console.log("----     ---      ------   -----   ---------");

const yearResults = await Promise.all(
  years.map(async (year) => {
    const start = `${year}-01-01`;
    const end = year === currentYearInAuckland() ? today : `${year}-12-31`;

    const [hcc, stored] = await Promise.all([
      fetchAllInWindow(env, start, end),
      fetchStoredInfringementCount(ctx, start, end),
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

const health = await fetch(`${ctx.workerUrl}/api/v1/health`);
const healthBody = healthResponseSchema.safeParse(await health.json());
console.log(
  `\nAll-time stored (health): ${healthBody.success ? (healthBody.data.totalRecords ?? "?") : "?"}`
);
