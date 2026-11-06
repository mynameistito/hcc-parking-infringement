import { toMapRouteRow } from "@/durable-objects/geometry.ts";
import type {
  LocationCacheInput,
  LocationMapPoint,
} from "@/durable-objects/types.ts";

import {
  GEOCODE_CANDIDATE_POOL,
  HAMILTON_CENTER_LAT,
  HAMILTON_CENTER_LON,
  isoNow,
} from "./constants.ts";
import {
  filterGeocodeCandidates,
  geocodeRetryCutoffIso,
} from "./geocode-candidates.ts";
import type {
  GeocodeCandidate,
  GeocodeCandidateRow,
} from "./geocode-candidates.ts";

/**
 * Reads frequently infringed locations eligible for geocoding.
 * @param sql - The Durable Object SQL storage.
 * @param limit - Maximum eligible locations to return.
 * @returns Candidate locations in descending infringement count order.
 */
export const fetchGeocodeCandidates = (
  sql: SqlStorage,
  limit: number
): GeocodeCandidate[] => {
  const rows = sql
    .exec<GeocodeCandidateRow>(
      `SELECT i.street,
              nullif(i.suburb, '') as suburb,
              coalesce(i.town, 'Hamilton') as town,
              count(*) as count,
              lc.geometry_json,
              lc.geocode_failed_at
       FROM infringements i
       LEFT JOIN location_cache lc
         ON i.street = lc.street
         AND coalesce(i.suburb, '') = lc.suburb
       WHERE i.street != ''
         AND i.street != 'Unknown'
       GROUP BY i.street, i.suburb, i.town, lc.geometry_json, lc.geocode_failed_at
       ORDER BY count DESC
       LIMIT ?`,
      GEOCODE_CANDIDATE_POOL
    )
    .toArray();

  return filterGeocodeCandidates(rows, limit);
};

/**
 * Counts locations without cached geometry that are eligible for retry.
 * @param sql - The Durable Object SQL storage.
 * @returns The number of locations awaiting geocoding.
 */
export const countLocationsNeedingGeocode = (sql: SqlStorage): number => {
  const row = sql
    .exec<{ total: number }>(
      `SELECT count(*) as total
       FROM (
         SELECT i.street,
                coalesce(i.suburb, '') as suburb,
                coalesce(i.town, 'Hamilton') as town,
                lc.geometry_json,
                lc.geocode_failed_at
         FROM infringements i
         LEFT JOIN location_cache lc
           ON i.street = lc.street
           AND coalesce(i.suburb, '') = lc.suburb
         WHERE i.street != ''
           AND i.street != 'Unknown'
         GROUP BY i.street, coalesce(i.suburb, ''), coalesce(i.town, 'Hamilton')
       )
       WHERE (geometry_json IS NULL OR geometry_json = '' OR geometry_json = '[]')
         AND (
           geocode_failed_at IS NULL
           OR geocode_failed_at = ''
           OR geocode_failed_at < ?
         )`,
      geocodeRetryCutoffIso()
    )
    .one();

  return row?.total ?? 0;
};

/**
 * Records a failed geocoding attempt for a location.
 * @param sql - The Durable Object SQL storage.
 * @param street - Street name.
 * @param suburb - Suburb name, when available.
 * @param town - Town name.
 */
export const markGeocodeFailed = (
  sql: SqlStorage,
  street: string,
  suburb: string | null,
  town: string
): void => {
  const now = isoNow();

  sql.exec(
    `INSERT INTO location_cache (street, suburb, town, lat, lon, display_name, geocoded_at, geometry_json, geocode_failed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?)
     ON CONFLICT(street, suburb) DO UPDATE SET
       town = excluded.town,
       geocode_failed_at = excluded.geocode_failed_at`,
    street,
    suburb ?? "",
    town,
    HAMILTON_CENTER_LAT,
    HAMILTON_CENTER_LON,
    "",
    now,
    now
  );
};

/**
 * Stores geocoded location data and clears any prior failure marker.
 * @param sql - The Durable Object SQL storage.
 * @param input - Location coordinates, display name, and road geometry.
 */
export const saveLocationCache = (
  sql: SqlStorage,
  input: LocationCacheInput
): void => {
  sql.exec(
    `INSERT INTO location_cache (street, suburb, town, lat, lon, display_name, geocoded_at, geometry_json, geocode_failed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)
     ON CONFLICT(street, suburb) DO UPDATE SET
       town = excluded.town,
       lat = excluded.lat,
       lon = excluded.lon,
       display_name = excluded.display_name,
       geocoded_at = excluded.geocoded_at,
       geometry_json = excluded.geometry_json,
       geocode_failed_at = NULL`,
    input.street,
    input.suburb ?? "",
    input.town,
    input.lat,
    input.lon,
    input.displayName,
    isoNow(),
    JSON.stringify(input.geometry)
  );
};

interface MapPointResult {
  pendingGeocode: number;
  routes: LocationMapPoint[];
}

/**
 * Reads ranked cached routes and the pending geocoding count.
 * @param sql - The Durable Object SQL storage.
 * @param limit - Maximum cached routes to consider.
 * @returns Valid map routes and the number of pending locations.
 */
export const readMapPoints = (
  sql: SqlStorage,
  limit: number
): MapPointResult => {
  const rows = sql
    .exec<{
      street: string;
      suburb: string | null;
      town: string;
      count: number;
      geometry_json: string | null;
    }>(
      `SELECT i.street,
              nullif(i.suburb, '') as suburb,
              coalesce(i.town, 'Hamilton') as town,
              count(*) as count,
              lc.geometry_json
       FROM infringements i
       INNER JOIN location_cache lc
         ON i.street = lc.street
         AND coalesce(i.suburb, '') = lc.suburb
       WHERE i.street != ''
         AND lc.geometry_json IS NOT NULL
         AND lc.geometry_json != ''
         AND lc.geometry_json != '[]'
       GROUP BY i.street, i.suburb, i.town, lc.geometry_json
       ORDER BY count DESC
       LIMIT ?`,
      limit
    )
    .toArray();

  return {
    pendingGeocode: countLocationsNeedingGeocode(sql),
    routes: rows
      .map((row) => toMapRouteRow(row))
      .filter((row): row is LocationMapPoint => row !== null),
  };
};
