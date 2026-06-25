import type {
  BrowseQuery,
  BrowseResult,
  InfringementListResult,
  InfringementQuery,
  LocationRankItem,
  VehicleRankItem,
} from "../durable-objects/parking-store.ts";
import type { Env } from "../env.ts";
import { getParkingStore } from "./store.ts";

export type {
  BrowseQuery,
  BrowseResult,
  InfringementListResult,
  LocationRankItem,
  VehicleRankItem,
};

export const browseSuburbs = async (
  env: Env,
  query: BrowseQuery
): Promise<BrowseResult<LocationRankItem>> =>
  await getParkingStore(env).browseSuburbs(query);

export const browseStreets = async (
  env: Env,
  query: BrowseQuery
): Promise<BrowseResult<LocationRankItem>> =>
  await getParkingStore(env).browseStreets(query);

export const browseVehicles = async (
  env: Env,
  query: BrowseQuery
): Promise<BrowseResult<VehicleRankItem>> =>
  await getParkingStore(env).browseVehicles(query);

export const getStreetsInSuburb = async (
  env: Env,
  suburb: string,
  limit = 20
): Promise<LocationRankItem[]> =>
  await getParkingStore(env).getStreetsInSuburb(suburb, limit);

export const getTopVehicles = async (
  env: Env,
  limit = 10
): Promise<VehicleRankItem[]> =>
  await getParkingStore(env).getTopVehicles(limit);

export const exploreInfringements = async (
  env: Env,
  query: InfringementQuery
): Promise<InfringementListResult> =>
  await getParkingStore(env).listInfringements(query);
