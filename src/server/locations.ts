import { normalizeLocationGeometry } from "@/durable-objects/parking-store.ts";
import type {
  LocationMapPoint,
  LocationRankItem,
} from "@/durable-objects/parking-store.ts";
import { getParkingStore } from "@/server/store.ts";

export type { LocationMapPoint, LocationRankItem };

export const getTopStreets = async (
  env: Env,
  limit = 10
): Promise<LocationRankItem[]> =>
  await getParkingStore(env).getTopStreets(limit);

export const getTopSuburbs = async (
  env: Env,
  limit = 10
): Promise<LocationRankItem[]> =>
  await getParkingStore(env).getTopSuburbs(limit);

export const getMapPoints = async (
  env: Env,
  limit = 50
): Promise<{
  routes: LocationMapPoint[];
  pendingGeocode: number;
}> => {
  const result = await getParkingStore(env).getMapPoints(limit);
  return {
    pendingGeocode: result.pendingGeocode,
    routes: result.routes.map((route) => ({
      ...route,
      geometry: normalizeLocationGeometry(route.geometry),
    })),
  };
};
