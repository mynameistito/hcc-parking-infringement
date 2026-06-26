import {
  filterRoadGeometry,
  parseGeometryJson,
} from "@/durable-objects/geometry.ts";
import {
  instantInAucklandIso,
  parseAucklandInstant,
} from "@/lib/auckland-time.ts";

import { GEOCODE_FAILURE_RETRY_MS } from "./constants.ts";

export const isRecentGeocodeFailure = (
  failedAt: string | null | undefined
): boolean => {
  if (failedAt === null || failedAt === undefined || failedAt === "") {
    return false;
  }

  try {
    const failedAtMs = parseAucklandInstant(failedAt).getTime();
    return Date.now() - failedAtMs < GEOCODE_FAILURE_RETRY_MS;
  } catch {
    return false;
  }
};

export const locationNeedsGeocode = (
  geometryJson: string | null | undefined,
  geocodeFailedAt: string | null | undefined
): boolean => {
  if (isRecentGeocodeFailure(geocodeFailedAt)) {
    return false;
  }

  const geometry = filterRoadGeometry(parseGeometryJson(geometryJson));
  return geometry.length === 0;
};

export interface GeocodeCandidateRow extends Record<string, SqlStorageValue> {
  street: string;
  suburb: string | null;
  town: string;
  count: number;
  geometry_json: string | null;
  geocode_failed_at: string | null;
}

export interface GeocodeCandidate {
  street: string;
  suburb: string | null;
  town: string;
  count: number;
}

export const filterGeocodeCandidates = (
  rows: GeocodeCandidateRow[],
  limit: number
): GeocodeCandidate[] => {
  const results: GeocodeCandidate[] = [];

  for (const row of rows) {
    if (!locationNeedsGeocode(row.geometry_json, row.geocode_failed_at)) {
      continue;
    }

    results.push({
      count: row.count,
      street: row.street,
      suburb: row.suburb,
      town: row.town,
    });

    if (results.length >= limit) {
      break;
    }
  }

  return results;
};

export const geocodeRetryCutoffIso = (): string =>
  instantInAucklandIso(new Date(Date.now() - GEOCODE_FAILURE_RETRY_MS));
