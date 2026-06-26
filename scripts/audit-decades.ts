import {
  getHccClientEnv,
  getWorkerUrl,
  loadDevVars,
} from "@scripts/dev-env.ts";
import { z } from "zod";

import { fetchAllInWindow } from "@/server/hcc-client.ts";

loadDevVars();

const workerUrl = getWorkerUrl();
const apiKey = process.env.API_KEY;

if (apiKey === undefined || apiKey === "") {
  console.error("Missing API_KEY");
  process.exit(1);
}

const env = getHccClientEnv();

const storedTotalSchema = z.object({
  total: z.number().optional(),
});

const fetchStored = async (from: string, to: string): Promise<number> => {
  const url = new URL(`${workerUrl}/api/v1/infringements`);
  url.searchParams.set("from", from);
  url.searchParams.set("to", to);
  url.searchParams.set("limit", "1");
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const parsed = storedTotalSchema.safeParse(await response.json());
  return parsed.success ? (parsed.data.total ?? 0) : 0;
};

const decades = [
  ["1990-01-01", "1999-12-31"],
  ["2000-01-01", "2009-12-31"],
  ["2010-01-01", "2019-12-31"],
  ["2020-01-01", "2026-06-26"],
] as const;

const results = await Promise.all(
  decades.map(async ([from, to]) => {
    const [hcc, stored] = await Promise.all([
      fetchAllInWindow(env, from, to),
      fetchStored(from, to),
    ]);
    return { from, hcc, stored, to };
  })
);

for (const { from, hcc, stored, to } of results) {
  console.log(
    `${from} → ${to}: HCC=${hcc.records.length} stored=${stored} delta=${hcc.records.length - stored}`
  );
}
