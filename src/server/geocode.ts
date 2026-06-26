import { setTimeout as delay } from "node:timers/promises";

import {
  centroidFromGeometry,
  isRealRoadGeometry,
  overpassBatchRoadGeometry,
} from "@/server/geocode-overpass.ts";
import { readsParkingStoreFromSeed } from "@/server/parking-read-source.ts";
import { getParkingStore } from "@/server/store.ts";

const OVERPASS_BATCH_SIZE = 15;
const OVERPASS_BATCH_DELAY_MS = 400;

const sleep = async (ms: number): Promise<void> => {
  await delay(ms);
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
  if (readsParkingStoreFromSeed(env)) {
    return { failed: 0, geocoded: 0, pending: 0 };
  }

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

export type { GeocodeResult, RoadGeometry } from "@/server/geocode-overpass.ts";
