import {
  filterRoadGeometry,
  parseGeometryJson,
} from "@/durable-objects/geometry.ts";
import {
  instantInAucklandIso,
  parseAucklandInstant,
} from "@/lib/auckland-time.ts";

import { GEOCODE_FAILURE_RETRY_MS } from "./constants.ts";

/**
 * Checks whether a geocoding failure is still within its retry delay.
 * @param failedAt - Recorded failure instant, if available.
 * @returns Whether the failure should defer another attempt.
 */
const isRecentGeocodeFailure = (
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

/**
 * Checks whether a location lacks usable road geometry and can be retried.
 * @param geometryJson - Stored geometry JSON, if available.
 * @param geocodeFailedAt - Last recorded failure instant, if available.
 * @returns Whether the location is eligible for geocoding.
 */
const locationNeedsGeocode = (
  geometryJson: string | null | undefined,
  geocodeFailedAt: string | null | undefined
): boolean => {
  if (isRecentGeocodeFailure(geocodeFailedAt)) {
    return false;
  }

  const geometry = filterRoadGeometry(parseGeometryJson(geometryJson));

  return geometry.length === 0;
};

/** SQL row containing a location and its current geocoding state. */
export interface GeocodeCandidateRow extends Record<string, SqlStorageValue> {
  street: string;
  suburb: string | null;
  town: string;
  count: number;
  geometry_json: string | null;
  geocode_failed_at: string | null;
}

/** Location and infringement count selected for geocoding. */
export interface GeocodeCandidate {
  street: string;
  suburb: string | null;
  town: string;
  count: number;
}

/**
 * Selects eligible locations in input order up to the requested limit.
 * @param rows - Candidate locations and their stored geometry state.
 * @param limit - Maximum number of candidates to return.
 * @returns Locations eligible for a geocoding attempt.
 */
export const filterGeocodeCandidates = (
  rows: GeocodeCandidateRow[],
  limit: number
): GeocodeCandidate[] => {
  const results: GeocodeCandidate[] = [];

  for (const row of rows) {
    if (locationNeedsGeocode(row.geometry_json, row.geocode_failed_at)) {
      results.push({
        count: row.count,
        street: row.street,
        suburb: row.suburb,
        town: row.town,
      });
    }

    if (results.length >= limit) {
      break;
    }
  }

  return results;
};

/**
 * Calculates the Auckland timestamp before which failures may be retried.
 * @returns The current retry cutoff as an ISO timestamp.
 */
export const geocodeRetryCutoffIso = (): string =>
  instantInAucklandIso(new Date(Date.now() - GEOCODE_FAILURE_RETRY_MS));
