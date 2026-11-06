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
} from "@/durable-objects/types.ts";

/**
 * Browses suburbs using the supplied search and pagination options.
 * @param scope - The application scope containing the parking reader.
 * @param query - The browse query.
 * @returns The matching page of suburbs.
 */
export const browseSuburbs = async (
  scope: AppScope,
  query: BrowseQuery
): Promise<BrowseResult<LocationRankItem>> =>
  await scope.parking.browseSuburbs(query);

/**
 * Browses streets using the supplied search and pagination options.
 * @param scope - The application scope containing the parking reader.
 * @param query - The browse query.
 * @returns The matching page of streets.
 */
export const browseStreets = async (
  scope: AppScope,
  query: BrowseQuery
): Promise<BrowseResult<LocationRankItem>> =>
  await scope.parking.browseStreets(query);

/**
 * Browses vehicles using the supplied search and pagination options.
 * @param scope - The application scope containing the parking reader.
 * @param query - The browse query.
 * @returns The matching page of vehicles.
 */
export const browseVehicles = async (
  scope: AppScope,
  query: BrowseQuery
): Promise<BrowseResult<VehicleRankItem>> =>
  await scope.parking.browseVehicles(query);

/**
 * Reads ranked streets within a suburb.
 * @param scope - The application scope containing the parking reader.
 * @param suburb - The suburb to query.
 * @param limit - Maximum number of streets to return.
 * @returns Ranked street records.
 */
export const getStreetsInSuburb = async (
  scope: AppScope,
  suburb: string,
  limit = 20
): Promise<LocationRankItem[]> =>
  await scope.parking.getStreetsInSuburb(suburb, limit);

/**
 * Reads vehicles ranked by infringement count.
 * @param scope - The application scope containing the parking reader.
 * @param limit - Maximum number of vehicles to return.
 * @returns Ranked vehicle records.
 */
export const getTopVehicles = async (
  scope: AppScope,
  limit = 10
): Promise<VehicleRankItem[]> => await scope.parking.getTopVehicles(limit);

/**
 * Reads a page of infringements for the explore view.
 * @param scope - The application scope containing the parking reader.
 * @param query - The filters and page selection.
 * @returns The matching page and its total count.
 */
export const exploreInfringements = async (
  scope: AppScope,
  query: InfringementQuery
): Promise<InfringementListResult> => await listInfringements(scope, query);
