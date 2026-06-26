import type {
  BrowseQuery,
  BrowseResult,
  InfringementListResult,
  InfringementQuery,
  LocationRankItem,
  VehicleRankItem,
} from "@/durable-objects/types.ts";
import type { AppScope } from "@/server/app-scope.ts";
import { listInfringements } from "@/server/stats.ts";

export type {
  BrowseQuery,
  BrowseResult,
  InfringementListResult,
  LocationRankItem,
  VehicleRankItem,
};

export const browseSuburbs = async (
  scope: AppScope,
  query: BrowseQuery
): Promise<BrowseResult<LocationRankItem>> =>
  await scope.parking.browseSuburbs(query);

export const browseStreets = async (
  scope: AppScope,
  query: BrowseQuery
): Promise<BrowseResult<LocationRankItem>> =>
  await scope.parking.browseStreets(query);

export const browseVehicles = async (
  scope: AppScope,
  query: BrowseQuery
): Promise<BrowseResult<VehicleRankItem>> =>
  await scope.parking.browseVehicles(query);

export const getStreetsInSuburb = async (
  scope: AppScope,
  suburb: string,
  limit = 20
): Promise<LocationRankItem[]> =>
  await scope.parking.getStreetsInSuburb(suburb, limit);

export const getTopVehicles = async (
  scope: AppScope,
  limit = 10
): Promise<VehicleRankItem[]> => await scope.parking.getTopVehicles(limit);

export const exploreInfringements = async (
  scope: AppScope,
  query: InfringementQuery
): Promise<InfringementListResult> => await listInfringements(scope, query);
