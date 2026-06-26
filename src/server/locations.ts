import { normalizeLocationGeometry } from "@/durable-objects/geometry.ts";
import type {
  LocationMapPoint,
  LocationRankItem,
} from "@/durable-objects/types.ts";
import type { AppScope } from "@/server/app-scope.ts";

export type { LocationMapPoint, LocationRankItem };

export const getTopStreets = async (
  scope: AppScope,
  limit = 10
): Promise<LocationRankItem[]> => await scope.parking.getTopStreets(limit);

export const getTopSuburbs = async (
  scope: AppScope,
  limit = 10
): Promise<LocationRankItem[]> => await scope.parking.getTopSuburbs(limit);

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
