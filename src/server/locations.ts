import { normalizeLocationGeometry } from "@/durable-objects/geometry.ts";
import type {
  LocationMapPoint,
  LocationRankItem,
} from "@/durable-objects/types.ts";
import { readsParkingStoreFromSeed } from "@/server/parking-read-source.ts";
import {
  getSeedMapPoints,
  getSeedTopStreets,
  getSeedTopSuburbs,
} from "@/server/seed-read.ts";
import { getParkingStore } from "@/server/store.ts";

export type { LocationMapPoint, LocationRankItem };

export const getTopStreets = async (
  env: Env,
  limit = 10
): Promise<LocationRankItem[]> => {
  if (readsParkingStoreFromSeed(env)) {
    return await getSeedTopStreets(env, limit);
  }

  return await getParkingStore(env).getTopStreets(limit);
};

export const getTopSuburbs = async (
  env: Env,
  limit = 10
): Promise<LocationRankItem[]> => {
  if (readsParkingStoreFromSeed(env)) {
    return await getSeedTopSuburbs(env, limit);
  }

  return await getParkingStore(env).getTopSuburbs(limit);
};

export const getMapPoints = async (
  env: Env,
  limit = 50
): Promise<{
  routes: LocationMapPoint[];
  pendingGeocode: number;
}> => {
  if (readsParkingStoreFromSeed(env)) {
    const result = await getSeedMapPoints(env, limit);
    return {
      pendingGeocode: result.pendingGeocode,
      routes: result.routes.map((route) => ({
        ...route,
        geometry: normalizeLocationGeometry(route.geometry),
      })),
    };
  }

  const result = await getParkingStore(env).getMapPoints(limit);
  return {
    pendingGeocode: result.pendingGeocode,
    routes: result.routes.map((route) => ({
      ...route,
      geometry: normalizeLocationGeometry(route.geometry),
    })),
  };
};
