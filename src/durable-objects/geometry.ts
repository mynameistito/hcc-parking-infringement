import type { LocationMapPoint } from "@/durable-objects/types.ts";

const isCoordinateRing = (value: unknown): value is [number, number][][] =>
  Array.isArray(value) &&
  value.every(
    (line) =>
      Array.isArray(line) &&
      line.length >= 3 &&
      line.every(
        (point) =>
          Array.isArray(point) &&
          point.length === 2 &&
          typeof point[0] === "number" &&
          typeof point[1] === "number"
      )
  );

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

export const filterRoadGeometry = (
  geometry: [number, number][][]
): [number, number][][] => geometry.filter((line) => line.length >= 3);

/** Normalize raw geometry from storage or external geocoder into road line rings. */
export const normalizeLocationGeometry = (
  geometry: number[][][]
): [number, number][][] => {
  if (!isCoordinateRing(geometry)) {
    return [];
  }
  return filterRoadGeometry(geometry);
};

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
