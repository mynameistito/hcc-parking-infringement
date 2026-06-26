import type {
  BrowseQuery,
  BrowseResult,
  InfringementListResult,
  InfringementQuery,
  LocationRankItem,
  VehicleRankItem,
} from "@/durable-objects/types.ts";
import { readsParkingStoreFromSeed } from "@/server/parking-read-source.ts";
import { getSeedTopVehicles } from "@/server/seed-read.ts";
import { listInfringements } from "@/server/stats.ts";
import { getParkingStore } from "@/server/store.ts";

export type {
  BrowseQuery,
  BrowseResult,
  InfringementListResult,
  LocationRankItem,
  VehicleRankItem,
};

const emptyBrowseResult = <T>(query: BrowseQuery): BrowseResult<T> => ({
  items: [],
  limit: query.limit,
  page: query.page,
  total: 0,
});

export const browseSuburbs = async (
  env: Env,
  query: BrowseQuery
): Promise<BrowseResult<LocationRankItem>> => {
  if (readsParkingStoreFromSeed(env)) {
    return emptyBrowseResult(query);
  }

  return await getParkingStore(env).browseSuburbs(query);
};

export const browseStreets = async (
  env: Env,
  query: BrowseQuery
): Promise<BrowseResult<LocationRankItem>> => {
  if (readsParkingStoreFromSeed(env)) {
    return emptyBrowseResult(query);
  }

  return await getParkingStore(env).browseStreets(query);
};

export const browseVehicles = async (
  env: Env,
  query: BrowseQuery
): Promise<BrowseResult<VehicleRankItem>> => {
  if (readsParkingStoreFromSeed(env)) {
    return emptyBrowseResult(query);
  }

  return await getParkingStore(env).browseVehicles(query);
};

export const getStreetsInSuburb = async (
  env: Env,
  suburb: string,
  limit = 20
): Promise<LocationRankItem[]> => {
  if (readsParkingStoreFromSeed(env)) {
    return [];
  }

  return await getParkingStore(env).getStreetsInSuburb(suburb, limit);
};

export const getTopVehicles = async (
  env: Env,
  limit = 10
): Promise<VehicleRankItem[]> => {
  if (readsParkingStoreFromSeed(env)) {
    return await getSeedTopVehicles(env, limit);
  }

  return await getParkingStore(env).getTopVehicles(limit);
};

export const exploreInfringements = async (
  env: Env,
  query: InfringementQuery
): Promise<InfringementListResult> => await listInfringements(env, query);
