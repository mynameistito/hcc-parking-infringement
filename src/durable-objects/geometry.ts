import type { LocationMapPoint } from "@/durable-objects/types.ts";

const isCoordinate = (value: unknown): value is [number, number] =>
  Array.isArray(value) &&
  value.length === 2 &&
  typeof value[0] === "number" &&
  typeof value[1] === "number";

const isCoordinateRing = <T>(value: T): value is T & [number, number][][] =>
  Array.isArray(value) &&
  value.every(
    (line) =>
      Array.isArray(line) && line.length >= 3 && line.every(isCoordinate)
  );

/**
 * Parses stored geometry JSON into coordinate lines, returning no lines for invalid input.
 * @param raw - The stored JSON value, if present.
 * @returns Coordinate lines with at least three pairs each.
 */
export const parseGeometryJson = (
  raw: string | null | undefined
): [number, number][][] => {
  if (raw === null || raw === undefined || raw === "") {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    if (!isCoordinateRing(parsed)) {
      return [];
    }

    return parsed;
  } catch {
    return [];
  }
};

/**
 * Keeps coordinate lines long enough to represent a road.
 * @param geometry - Coordinate lines to filter.
 * @returns Lines containing at least three pairs.
 */
export const filterRoadGeometry = (
  geometry: [number, number][][]
): [number, number][][] => geometry.filter((line) => line.length >= 3);

/**
 * Normalizes storage or geocoder geometry into road coordinate lines.
 * @param geometry - The geometry to validate.
 * @returns Valid coordinate lines, or an empty array when invalid.
 */
export const normalizeLocationGeometry = (
  geometry: number[][][]
): [number, number][][] => {
  if (!isCoordinateRing(geometry)) {
    return [];
  }

  return filterRoadGeometry(geometry);
};

/**
 * Projects a stored location row into a map point when its geometry is usable.
 * @param row - A location and its stored geometry JSON.
 * @returns A map point, or null when no valid geometry is available.
 */
export const toMapRouteRow = (row: {
  street: string;
  suburb: string | null;
  town: string;
  count: number;
  geometry_json: string | null;
}): LocationMapPoint | null => {
  const geometry = filterRoadGeometry(parseGeometryJson(row.geometry_json));

  if (geometry.length === 0) {
    return null;
  }

  const suburbKey = row.suburb ?? "";

  return {
    count: row.count,
    geometry,
    id: `${row.street}|${suburbKey}`,
    street: row.street,
    suburb: row.suburb,
    town: row.town,
  };
};
