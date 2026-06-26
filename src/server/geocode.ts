import { setTimeout as delay } from "node:timers/promises";

import type { AppScope } from "@/server/app-scope.ts";
import {
  centroidFromGeometry,
  isRealRoadGeometry,
  overpassBatchRoadGeometry,
} from "@/server/geocode-overpass.ts";
import { getParkingStore } from "@/server/store.ts";

const OVERPASS_BATCH_SIZE = 15;
const OVERPASS_BATCH_DELAY_MS = 400;

const sleep = async (ms: number): Promise<void> => {
  await delay(ms);
};

const processGeocodeBatch = async (
  scope: AppScope,
  batch: { street: string; suburb: string | null; town: string }[]
): Promise<{ geocoded: number; failed: number }> => {
  const store = getParkingStore(scope.env);
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
  scope: AppScope,
  limit = 50
): Promise<{ geocoded: number; failed: number; pending: number }> => {
  if (scope.isSeedMode) {
    return { failed: 0, geocoded: 0, pending: 0 };
  }

  const store = getParkingStore(scope.env);
  const missing = await store.getLocationsNeedingGeocode(limit);
  let geocoded = 0;
  let failed = 0;

  for (let index = 0; index < missing.length; index += OVERPASS_BATCH_SIZE) {
    const batch = missing.slice(index, index + OVERPASS_BATCH_SIZE);
    // Sequential batches respect Overpass rate limits.
    // eslint-disable-next-line eslint/no-await-in-loop -- intentional pacing between geocode batches
    const outcome = await processGeocodeBatch(scope, batch);
    geocoded += outcome.geocoded;
    failed += outcome.failed;

    if (index + OVERPASS_BATCH_SIZE < missing.length) {
      // eslint-disable-next-line eslint/no-await-in-loop -- intentional pacing between geocode batches
      await sleep(OVERPASS_BATCH_DELAY_MS);
    }
  }

  const pending = await store.countLocationsNeedingGeocode();

  return { failed, geocoded, pending };
};
