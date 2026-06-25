/**
 * Geocode Hamilton streets for the map (batched Overpass, no Nominatim).
 *
 * Usage:
 *   API_KEY=xxx WORKER_URL=http://localhost:8787 bun run geocode
 *   API_KEY=xxx bun run geocode -- --limit=50
 *   API_KEY=xxx bun run geocode -- --once
 */

import { z } from "zod";

const args = process.argv.slice(2);
const limitArg = args.find((arg) => arg.startsWith("--limit="));
const limit =
  limitArg === undefined
    ? 50
    : Number.parseInt(limitArg.split("=")[1] ?? "50", 10);
const runOnce = args.includes("--once");

const workerUrl = (process.env.WORKER_URL ?? "http://localhost:8787").replace(
  /\/$/u,
  ""
);
const apiKey = process.env.API_KEY;

if (apiKey === undefined || apiKey === "") {
  console.error("Missing API_KEY.");
  process.exit(1);
}

const geocodeRunResultSchema = z.object({
  failed: z.number().optional(),
  geocoded: z.number().optional(),
  ok: z.boolean().optional(),
  pending: z.number().optional(),
});

const mapResponseSchema = z.object({
  data: z
    .object({
      pendingGeocode: z.number().optional(),
      routes: z.array(z.unknown()).optional(),
    })
    .optional(),
});

const runGeocodeBatch = async (): Promise<
  z.infer<typeof geocodeRunResultSchema>
> => {
  const url = new URL("/api/v1/geocode/run", workerUrl);
  url.searchParams.set("limit", String(limit));

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    method: "POST",
  });

  const rawBody: unknown = await response.json().catch(() => null);
  const parsedBody = geocodeRunResultSchema.safeParse(rawBody);
  const body = parsedBody.success ? parsedBody.data : null;

  if (!response.ok) {
    console.error(`Geocode failed (${response.status}):`, body);
    process.exit(1);
  }

  return body ?? {};
};

const fetchPendingCount = async (): Promise<number> => {
  const mapResponse = await fetch(`${workerUrl}/api/public/locations/map`);
  const rawBody: unknown = await mapResponse.json();
  const parsedBody = mapResponseSchema.safeParse(rawBody);

  return parsedBody.success ? (parsedBody.data.data?.pendingGeocode ?? 0) : 0;
};

const runGeocodeLoop = async (
  batch: number,
  totalGeocoded: number,
  totalFailed: number
): Promise<{ batch: number; totalFailed: number; totalGeocoded: number }> => {
  const nextBatch = batch + 1;
  const result = await runGeocodeBatch();
  const geocoded = result.geocoded ?? 0;
  const failed = result.failed ?? 0;
  const nextTotalGeocoded = totalGeocoded + geocoded;
  const nextTotalFailed = totalFailed + failed;
  const pending = result.pending ?? (await fetchPendingCount());

  console.log(
    `Batch ${nextBatch}: +${geocoded} geocoded, ${failed} failed · ${pending} pending`
  );

  if (runOnce) {
    return {
      batch: nextBatch,
      totalFailed: nextTotalFailed,
      totalGeocoded: nextTotalGeocoded,
    };
  }

  if (geocoded === 0 && failed === 0) {
    console.log("No progress this batch — stopping.");
    return {
      batch: nextBatch,
      totalFailed: nextTotalFailed,
      totalGeocoded: nextTotalGeocoded,
    };
  }

  if (pending <= 0) {
    return {
      batch: nextBatch,
      totalFailed: nextTotalFailed,
      totalGeocoded: nextTotalGeocoded,
    };
  }

  return await runGeocodeLoop(nextBatch, nextTotalGeocoded, nextTotalFailed);
};

console.log(
  runOnce
    ? `Geocoding up to ${limit} Hamilton streets (single batch)…`
    : `Geocoding Hamilton streets in batches of ${limit} until done…`
);

const { totalGeocoded, totalFailed } = await runGeocodeLoop(0, 0, 0);

const mapResponse = await fetch(`${workerUrl}/api/public/locations/map`);
const rawMapBody: unknown = await mapResponse.json();
const parsedMapBody = mapResponseSchema.safeParse(rawMapBody);
const mapData = parsedMapBody.success ? parsedMapBody.data.data : undefined;

console.log(
  `Done: ${totalGeocoded} geocoded, ${totalFailed} failed · map routes: ${mapData?.routes?.length ?? 0} · pending: ${mapData?.pendingGeocode ?? "?"}`
);
