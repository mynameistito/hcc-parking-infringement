/**
 * Compare HCC vs ParkingStore totals by decade (1990s through current).
 *
 * @example
 * bun run scripts/audit-decades.ts
 */

import { getHccClientEnv, loadDevVars } from "@scripts/dev-env.ts";
import {
  createWorkerContext,
  fetchStoredInfringementCount,
} from "@scripts/lib/worker/client.ts";

import { todayInAuckland } from "@/lib/auckland-time.ts";
import { BACKFILL_EARLIEST } from "@/lib/backfill-constants.ts";
import { fetchAllInWindowOrThrow } from "@/server/hcc-client.ts";

loadDevVars();

const ctx = createWorkerContext();
const env = getHccClientEnv();
const today = todayInAuckland();

const decades = [
  [BACKFILL_EARLIEST, "1999-12-31"],
  ["2000-01-01", "2009-12-31"],
  ["2010-01-01", "2019-12-31"],
  ["2020-01-01", today],
] as const;

const results = await Promise.all(
  decades.map(async ([from, to]) => {
    const [hcc, stored] = await Promise.all([
      fetchAllInWindowOrThrow(env, from, to),
      fetchStoredInfringementCount(ctx, from, to),
    ]);
    return { from, hcc, stored, to };
  })
);

for (const { from, hcc, stored, to } of results) {
  console.log(
    `${from} → ${to}: HCC=${hcc.records.length} stored=${stored} delta=${hcc.records.length - stored}`
  );
}
