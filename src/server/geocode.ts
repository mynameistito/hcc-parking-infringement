import { setTimeout as delay } from "node:timers/promises";

import { z } from "zod";

import { getParkingStore } from "./store.ts";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const USER_AGENT = "hcc-parking-infringement/1.0 (hamilton parking ticker)";

/** Hamilton City bounding box (south, west, north, east). */
const HAMILTON_BBOX = {
  east: 175.35,
  north: -37.68,
  south: -37.9,
  west: 175.2,
} as const;

const HAMILTON_CENTER = { lat: -37.787, lon: 175.279 } as const;

/** Streets per Overpass request — balances speed vs query size. */
const OVERPASS_BATCH_SIZE = 15;

/** Brief pause between Overpass batches to stay polite to the public API. */
const OVERPASS_BATCH_DELAY_MS = 400;

const STREET_SUFFIX_PATTERN =
  /\s+(?<suffix>street|road|avenue|drive|place|lane|court|crescent|terrace|parade)$/u;

const overpassElementSchema = z.object({
  geometry: z
    .array(
      z.object({
        lat: z.number(),
        lon: z.number(),
      })
    )
    .optional(),
  tags: z
    .object({
      name: z.string().optional(),
    })
    .optional(),
});

const overpassResponseSchema = z.object({
  elements: z.array(overpassElementSchema),
});

export type RoadGeometry = [number, number][][];

export interface GeocodeResult {
  lat: number;
  lon: number;
  displayName: string;
  geometry: RoadGeometry;
}

const sleep = async (ms: number): Promise<void> => {
  await delay(ms);
};

const normalizeStreetName = (value: string): string =>
  value.toLowerCase().replaceAll(".", "").replaceAll(/\s+/gu, " ").trim();

const expandStreetAbbreviations = (value: string): string =>
  normalizeStreetName(value)
    .replaceAll(/\bst\b/gu, "street")
    .replaceAll(/\brd\b/gu, "road")
    .replaceAll(/\bave\b/gu, "avenue")
    .replaceAll(/\bdr\b/gu, "drive")
    .replaceAll(/\bpl\b/gu, "place")
    .replaceAll(/\bln\b/gu, "lane")
    .replaceAll(/\bct\b/gu, "court")
    .replaceAll(/\bcre\b/gu, "crescent")
    .replaceAll(/\bterr?\b/gu, "terrace")
    .replaceAll(/\bpde\b/gu, "parade");

const streetNameMatches = (osmName: string, street: string): boolean => {
  const osm = expandStreetAbbreviations(osmName);
  const target = expandStreetAbbreviations(street);
  if (osm === target) {
    return true;
  }
  if (osm.includes(target) || target.includes(osm)) {
    return true;
  }
  const osmCore = osm.replace(STREET_SUFFIX_PATTERN, "");
  const targetCore = target.replace(STREET_SUFFIX_PATTERN, "");
  return osmCore === targetCore;
};

const overpassNamePattern = (street: string): string => {
  const expanded = expandStreetAbbreviations(street);
  const escaped = expanded.replaceAll(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  return `^${escaped}$`;
};

const isRealRoadGeometry = (geometry: RoadGeometry): boolean =>
  geometry.some((line) => line.length >= 3);

const centroidFromGeometry = (
  geometry: RoadGeometry
): {
  lat: number;
  lon: number;
} => {
  let sumLat = 0;
  let sumLon = 0;
  let count = 0;

  for (const line of geometry) {
    for (const [lat, lon] of line) {
      sumLat += lat;
      sumLon += lon;
      count += 1;
    }
  }

  if (count === 0) {
    return HAMILTON_CENTER;
  }

  return { lat: sumLat / count, lon: sumLon / count };
};

const overpassBatchRoadGeometry = async (
  streets: string[]
): Promise<Map<string, RoadGeometry>> => {
  if (streets.length === 0) {
    return new Map();
  }

  const bbox = `${HAMILTON_BBOX.south},${HAMILTON_BBOX.west},${HAMILTON_BBOX.north},${HAMILTON_BBOX.east}`;
  const wayQueries = streets
    .map(
      (street) =>
        `  way["highway"]["name"~"${overpassNamePattern(street)}",i](${bbox});`
    )
    .join("\n");

  const query = `
[out:json][timeout:60];
(
${wayQueries}
);
out geom;
`.trim();

  const response = await fetch(OVERPASS_URL, {
    body: `data=${encodeURIComponent(query)}`,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": USER_AGENT,
    },
    method: "POST",
  });

  if (!response.ok) {
    return new Map();
  }

  const parsed = overpassResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    return new Map();
  }

  const results = new Map<string, RoadGeometry>();

  for (const element of parsed.data.elements) {
    const name = element.tags?.name;
    if (
      element.geometry === undefined ||
      element.geometry.length < 3 ||
      name === undefined ||
      name === ""
    ) {
      continue;
    }

    const line = element.geometry.map(
      (point) => [point.lat, point.lon] as [number, number]
    );

    for (const street of streets) {
      if (!streetNameMatches(name, street)) {
        continue;
      }

      const existing = results.get(street) ?? [];
      existing.push(line);
      results.set(street, existing);
      break;
    }
  }

  return results;
};

const processGeocodeBatch = async (
  env: Env,
  batch: { street: string; suburb: string | null; town: string }[]
): Promise<{ geocoded: number; failed: number }> => {
  const store = getParkingStore(env);
  const geometries = await overpassBatchRoadGeometry(
    batch.map((location) => location.street)
  );

  const outcomes = await Promise.all(
    batch.map(async (location) => {
      const geometry = geometries.get(location.street);

      if (geometry !== undefined && isRealRoadGeometry(geometry)) {
        const centroid = centroidFromGeometry(geometry);
        const suburbLabel =
          location.suburb !== null && location.suburb !== ""
            ? `, ${location.suburb}`
            : "";

        await store.saveLocationCache({
          displayName: `${location.street}${suburbLabel}, Hamilton`,
          geometry,
          lat: centroid.lat,
          lon: centroid.lon,
          street: location.street,
          suburb: location.suburb,
          town: location.town,
        });
        return "geocoded" as const;
      }

      await store.markGeocodeFailed(
        location.street,
        location.suburb,
        location.town
      );
      return "failed" as const;
    })
  );

  return {
    failed: outcomes.filter((outcome) => outcome === "failed").length,
    geocoded: outcomes.filter((outcome) => outcome === "geocoded").length,
  };
};

export const geocodeMissingLocations = async (
  env: Env,
  limit = 50
): Promise<{ geocoded: number; failed: number; pending: number }> => {
  const store = getParkingStore(env);
  const missing = await store.getLocationsNeedingGeocode(limit);
  let geocoded = 0;
  let failed = 0;

  const batchStarts: number[] = [];
  for (let index = 0; index < missing.length; index += OVERPASS_BATCH_SIZE) {
    batchStarts.push(index);
  }

  const processBatchAt = async (batchIndex: number): Promise<void> => {
    if (batchIndex >= batchStarts.length) {
      return;
    }

    const index = batchStarts[batchIndex];
    if (index === undefined) {
      return;
    }

    const batch = missing.slice(index, index + OVERPASS_BATCH_SIZE);
    const result = await processGeocodeBatch(env, batch);
    geocoded += result.geocoded;
    failed += result.failed;

    if (batchIndex < batchStarts.length - 1) {
      await sleep(OVERPASS_BATCH_DELAY_MS);
    }

    await processBatchAt(batchIndex + 1);
  };

  await processBatchAt(0);

  const pending = await store.countLocationsNeedingGeocode();

  return { failed, geocoded, pending };
};
