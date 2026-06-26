import {
  infringementListResponseSchema,
  publicLiveStatsSchema,
  locationBrowseResponseSchema,
  locationRankItemArraySchema,
  mapResponseSchema,
  readStoredEnvelopeData,
  topStatsResponseSchema,
  vehicleBrowseResponseSchema,
  vehicleRankItemArraySchema,
} from "@/contracts/public-api";
import type {
  BrowseParams,
  BrowseResponse,
  BrowseSort,
  ExploreInfringementsParams,
  FullDashboardMessage,
  InfringementListResponse,
  PublicLiveStats,
  LocationRankItem,
  MapResponse,
  MapRouteItem,
  PublicInfringement,
  TopItem,
  TopStatsResponse,
  VehicleRankItem,
} from "@/contracts/public-api";
import { RECENT_INFRINGEMENTS_LIMIT } from "@/lib/dashboard-constants";

export type {
  BrowseParams,
  BrowseResponse,
  BrowseSort,
  InfringementListResponse,
  PublicLiveStats as PublicLiveStatsResponse,
  LocationRankItem,
  MapResponse,
  MapRouteItem,
  PublicInfringement,
  TopItem,
  TopStatsResponse,
  VehicleRankItem,
};

export type { FullDashboardMessage };

const getErrorMessage = (body: unknown, status: number): string => {
  if (
    typeof body === "object" &&
    body !== null &&
    "error" in body &&
    typeof body.error === "string" &&
    body.error.length > 0
  ) {
    return body.error;
  }
  if (status === 404) {
    return "Data feed unavailable. Start the API server to load live dashboard data.";
  }
  return `Data feed unavailable. Request returned ${status}.`;
};

const fetchEnvelopeData = async (url: string): Promise<unknown> => {
  const response = await fetch(url);
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    throw new Error(getErrorMessage(body, response.status));
  }
  const json: unknown = await response.json();
  return readStoredEnvelopeData(json);
};

const fetchJson = async (url: string): Promise<unknown> => {
  const response = await fetch(url);
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    throw new Error(getErrorMessage(body, response.status));
  }
  return await response.json();
};

const hasNonEmptyString = (value: string | undefined): value is string =>
  value !== undefined && value.length > 0;

export const fetchLiveStats = async (): Promise<PublicLiveStats> =>
  publicLiveStatsSchema.parse(await fetchEnvelopeData("/api/v1/stats/live"));

export const fetchTopStats = async (
  groupBy: "street" | "offence",
  limit = 5
): Promise<TopStatsResponse> => {
  const params = new URLSearchParams({ groupBy, limit: String(limit) });
  return topStatsResponseSchema.parse(
    await fetchEnvelopeData(`/api/v1/stats/top?${params}`)
  );
};

export const fetchTopStreets = async (
  limit = 10
): Promise<LocationRankItem[]> =>
  locationRankItemArraySchema.parse(
    await fetchEnvelopeData(`/api/v1/locations/streets?limit=${limit}`)
  );

export const fetchTopSuburbs = async (
  limit = 10
): Promise<LocationRankItem[]> =>
  locationRankItemArraySchema.parse(
    await fetchEnvelopeData(`/api/v1/locations/suburbs?limit=${limit}`)
  );

export const fetchMapPoints = async (limit = 50): Promise<MapResponse> =>
  mapResponseSchema.parse(
    await fetchEnvelopeData(`/api/v1/locations/map?limit=${limit}`)
  );

export const fetchTopVehicles = async (
  limit = 10
): Promise<VehicleRankItem[]> =>
  vehicleRankItemArraySchema.parse(
    await fetchEnvelopeData(`/api/v1/vehicles/top?limit=${limit}`)
  );

export const fetchRecentInfringements = async (
  limit = RECENT_INFRINGEMENTS_LIMIT
): Promise<InfringementListResponse> =>
  infringementListResponseSchema.parse(
    await fetchJson(`/api/v1/infringements/recent?limit=${limit}`)
  );

const buildBrowseParams = (params: BrowseParams): URLSearchParams => {
  const search = new URLSearchParams();
  if (hasNonEmptyString(params.q)) {
    search.set("q", params.q);
  }
  if (hasNonEmptyString(params.suburb)) {
    search.set("suburb", params.suburb);
  }
  search.set("page", String(params.page ?? 1));
  search.set("limit", String(params.limit ?? 25));
  search.set("sort", params.sort ?? "count");
  return search;
};

export const fetchBrowseSuburbs = async (
  params: BrowseParams = {}
): Promise<BrowseResponse<LocationRankItem>> =>
  locationBrowseResponseSchema.parse(
    await fetchJson(`/api/v1/browse/suburbs?${buildBrowseParams(params)}`)
  );

export const fetchBrowseStreets = async (
  params: BrowseParams = {}
): Promise<BrowseResponse<LocationRankItem>> =>
  locationBrowseResponseSchema.parse(
    await fetchJson(`/api/v1/browse/streets?${buildBrowseParams(params)}`)
  );

export const fetchBrowseVehicles = async (
  params: BrowseParams = {}
): Promise<BrowseResponse<VehicleRankItem>> =>
  vehicleBrowseResponseSchema.parse(
    await fetchJson(`/api/v1/browse/vehicles?${buildBrowseParams(params)}`)
  );

export const fetchStreetsInSuburb = async (
  suburb: string,
  params: Omit<BrowseParams, "suburb"> = {}
): Promise<BrowseResponse<LocationRankItem>> => {
  const encoded = encodeURIComponent(suburb);
  return locationBrowseResponseSchema.parse(
    await fetchJson(
      `/api/v1/explore/suburbs/${encoded}/streets?${buildBrowseParams(params)}`
    )
  );
};

export const fetchExploreInfringements = async (
  params: ExploreInfringementsParams
): Promise<InfringementListResponse> => {
  const search = new URLSearchParams();
  if (hasNonEmptyString(params.street)) {
    search.set("street", params.street);
  }
  if (hasNonEmptyString(params.suburb)) {
    search.set("suburb", params.suburb);
  }
  if (hasNonEmptyString(params.vehicleMake)) {
    search.set("vehicleMake", params.vehicleMake);
  }
  if (params.vehicleModel !== undefined) {
    search.set("vehicleModel", params.vehicleModel);
  }
  search.set("page", String(params.page ?? 1));
  search.set("limit", String(params.limit ?? 15));
  return infringementListResponseSchema.parse(
    await fetchJson(`/api/v1/explore/infringements?${search}`)
  );
};
