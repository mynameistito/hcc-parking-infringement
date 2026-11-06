import { normalizeLocationGeometry } from "@/durable-objects/geometry.ts";
import type {
  LocationMapPoint,
  LocationRankItem,
} from "@/durable-objects/types.ts";
import type { AppScope } from "@/server/app-scope.ts";

export type {
  LocationMapPoint,
  LocationRankItem,
} from "@/durable-objects/types.ts";

/**
 * Reads streets ranked by infringement count.
 * @param scope - The application scope containing the parking reader.
 * @param limit - Maximum number of streets to return.
 * @returns Ranked street records.
 */
export const getTopStreets = async (
  scope: AppScope,
  limit = 10
): Promise<LocationRankItem[]> => await scope.parking.getTopStreets(limit);

/**
 * Reads suburbs ranked by infringement count.
 * @param scope - The application scope containing the parking reader.
 * @param limit - Maximum number of suburbs to return.
 * @returns Ranked suburb records.
 */
export const getTopSuburbs = async (
  scope: AppScope,
  limit = 10
): Promise<LocationRankItem[]> => await scope.parking.getTopSuburbs(limit);

/**
 * Reads map routes and normalizes their stored geometry.
 * @param scope - The application scope containing the parking reader.
 * @param limit - Maximum number of routes to return.
 * @returns Routes and the count of locations awaiting geocoding.
 */
export const getMapPoints = async (
  scope: AppScope,
  limit = 50
): Promise<{
  routes: LocationMapPoint[];
  pendingGeocode: number;
}> => {
  const result = await scope.parking.getMapPoints(limit);

  return {
    pendingGeocode: result.pendingGeocode,
    routes: result.routes.map((route) => ({
      ...route,
      geometry: normalizeLocationGeometry(route.geometry),
    })),
  };
};
