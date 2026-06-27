/**
 * Precompute chartBreakdowns into dashboard-snapshot.json from local seed chunks.
 * Run before uploading seed to R2 so Workers never scan 657k rows at request time.
 *
 * @example
 * bun run enrich:seed-dashboard
 * bun run enrich:seed-dashboard -- --dir=data/seed
 */

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { readArg, scriptArgv } from "@scripts/lib/cli/args.ts";

import { parseRawFullDashboardMessageJson } from "@/contracts/dashboard-snapshot.ts";
import {
  buildChartBreakdownFromInfringements,
  resolveChartBreakdowns,
  resolveChartStreetItems,
} from "@/lib/chart-breakdowns.ts";
import type { InfringementChartRecord } from "@/lib/chart-breakdowns.ts";
import {
  DASHBOARD_SNAPSHOT_FILE,
  MANIFEST_FILE,
  parseSeedInfringementLine,
  parseSeedManifest,
} from "@/server/seed-manifest.ts";

const args = scriptArgv();
const seedDir = path.resolve(readArg(args, "dir") ?? "data/seed");

const manifestPath = path.join(seedDir, MANIFEST_FILE);
const snapshotPath = path.join(seedDir, DASHBOARD_SNAPSHOT_FILE);

const manifestRaw = await readFile(manifestPath, "utf-8");
const manifest = parseSeedManifest(JSON.parse(manifestRaw));
const snapshotRaw = await readFile(snapshotPath, "utf-8");
const message = parseRawFullDashboardMessageJson(snapshotRaw);

if (message === null) {
  console.error("dashboard-snapshot.json is invalid");
  process.exit(1);
}

const records: InfringementChartRecord[] = [];

for (const chunk of manifest.infringementChunks) {
  const chunkPath = path.join(seedDir, chunk);
  const raw = await readFile(chunkPath, "utf-8");
  const lines = raw.split(/\r?\n/u).filter((line) => line.trim().length > 0);

  for (const line of lines) {
    const record = parseSeedInfringementLine(line);
    records.push({
      isTowed: record.isTowed,
      offenceCategory: record.offenceCategory,
      offenceCode: record.offenceCode,
      offenceDescription: record.offenceDescription,
      street: record.street,
      suburb: record.suburb,
      vehicleMake: record.vehicleMake,
      vehicleType: record.vehicleType,
    });
  }

  console.log(
    `[enrich] scanned ${chunk} (${records.length.toLocaleString()} records)`
  );
}

const historical = buildChartBreakdownFromInfringements(records);
const derived = resolveChartBreakdowns(message);
const chartBreakdowns = {
  offenceCategories: historical.breakdowns.offenceCategories,
  offences:
    derived.offences.length > 0
      ? derived.offences
      : historical.breakdowns.offences,
  suburbs:
    derived.suburbs.length > 0
      ? derived.suburbs
      : historical.breakdowns.suburbs,
  towed: historical.breakdowns.towed,
  vehicleMakes:
    derived.vehicleMakes.length > 0
      ? derived.vehicleMakes
      : historical.breakdowns.vehicleMakes,
  vehicleTypes: historical.breakdowns.vehicleTypes,
};
const topStreets = resolveChartStreetItems(message);

const enriched = {
  ...message,
  chartBreakdowns,
  topOffences: chartBreakdowns.offences,
  topStreets:
    topStreets.length > 0 ? topStreets : historical.streets.slice(0, 10),
};

await writeFile(snapshotPath, `${JSON.stringify(enriched)}\n`, "utf-8");

const updatedManifest = {
  ...manifest,
  exportedAt: new Date().toISOString(),
};
await writeFile(
  path.join(seedDir, MANIFEST_FILE),
  `${JSON.stringify(updatedManifest, null, 2)}\n`,
  "utf-8"
);

console.log(
  `[enrich] wrote ${snapshotPath} with full chartBreakdowns (${records.length.toLocaleString()} records)`
);
