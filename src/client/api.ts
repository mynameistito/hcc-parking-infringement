import { PACE_DAILY_TREND_DAYS } from "@/lib/pace-constants";

export interface LiveStatsResponse {
  allTimeTotal: number;
  allTimeAmountCents: number;
  today: number;
  last24h: number;
  last7d: number;
  last30d: number;
  last365d: number;
  thisMonth: number;
  towedToday: number;
  lastSyncedAt: string | null;
  lastRecordAt: string | null;
}

export interface DailyStatPoint {
  date: string;
  count: number;
  totalCents: number;
}

export interface TopItem {
  label: string;
  count: number;
}

export interface TopStatsResponse {
  groupBy: "street" | "offence";
  items: TopItem[];
}

export interface LocationRankItem {
  label: string;
  count: number;
  street?: string;
  suburb?: string;
}

export interface VehicleRankItem {
  make: string;
  model: string;
  label: string;
  count: number;
}

export interface PublicInfringement {
  infringementNumber: number;
  occurredAt: string;
  amountCents: number;
  street: string;
  suburb: string | null;
  town: string | null;
  offenceDescription: string;
  vehicleMake: string | null;
  vehicleModel: string | null;
  vehicleColour: string | null;
  vehicleType: string | null;
  isTowed: boolean;
}

export interface InfringementListResponse {
  data: PublicInfringement[];
  page: number;
  limit: number;
  total: number;
}

export type BrowseSort = "count" | "name";

export interface BrowseParams {
  q?: string;
  page?: number;
  limit?: number;
  sort?: BrowseSort;
  suburb?: string;
}

export interface BrowseResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}

export interface MapRouteItem {
  id: string;
  street: string;
  suburb: string | null;
  town: string;
  count: number;
  geometry: [number, number][][];
}

export interface MapResponse {
  routes: MapRouteItem[];
  pendingGeocode: number;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const getErrorMessage = (body: unknown, status: number): string => {
  if (
    isRecord(body) &&
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

const readResponseData = async (response: Response): Promise<unknown> => {
  const json: unknown = await response.json();
  if (isRecord(json) && "data" in json) {
    return json.data;
  }
  throw new Error("Invalid response payload");
};

const isTopItem = (value: unknown): value is TopItem =>
  isRecord(value) &&
  typeof value.label === "string" &&
  typeof value.count === "number";

const isLocationRankItem = (value: unknown): value is LocationRankItem =>
  isRecord(value) &&
  typeof value.label === "string" &&
  typeof value.count === "number";

const isVehicleRankItem = (value: unknown): value is VehicleRankItem =>
  isRecord(value) &&
  typeof value.make === "string" &&
  typeof value.model === "string" &&
  typeof value.label === "string" &&
  typeof value.count === "number";

const isLiveStatsResponse = (value: unknown): value is LiveStatsResponse =>
  isRecord(value) &&
  typeof value.allTimeTotal === "number" &&
  typeof value.allTimeAmountCents === "number" &&
  typeof value.today === "number" &&
  typeof value.last24h === "number" &&
  typeof value.last7d === "number" &&
  typeof value.last30d === "number" &&
  (value.last365d === undefined || typeof value.last365d === "number") &&
  typeof value.thisMonth === "number" &&
  typeof value.towedToday === "number" &&
  (value.lastSyncedAt === null || typeof value.lastSyncedAt === "string") &&
  (value.lastRecordAt === null || typeof value.lastRecordAt === "string");

const isTopStatsResponse = (value: unknown): value is TopStatsResponse =>
  isRecord(value) &&
  (value.groupBy === "street" || value.groupBy === "offence") &&
  Array.isArray(value.items) &&
  value.items.every(isTopItem);

const isLocationRankItemArray = (value: unknown): value is LocationRankItem[] =>
  Array.isArray(value) && value.every(isLocationRankItem);

const isVehicleRankItemArray = (value: unknown): value is VehicleRankItem[] =>
  Array.isArray(value) && value.every(isVehicleRankItem);

const isMapRouteItem = (value: unknown): value is MapRouteItem =>
  isRecord(value) &&
  typeof value.id === "string" &&
  typeof value.street === "string" &&
  (value.suburb === null || typeof value.suburb === "string") &&
  typeof value.town === "string" &&
  typeof value.count === "number" &&
  Array.isArray(value.geometry);

const isMapResponse = (value: unknown): value is MapResponse =>
  isRecord(value) &&
  Array.isArray(value.routes) &&
  value.routes.every(isMapRouteItem) &&
  typeof value.pendingGeocode === "number";

const isBrowseResponse = <T>(
  value: unknown,
  isItem: (item: unknown) => item is T
): value is BrowseResponse<T> =>
  isRecord(value) &&
  Array.isArray(value.items) &&
  value.items.every(isItem) &&
  typeof value.page === "number" &&
  typeof value.limit === "number" &&
  typeof value.total === "number";

const isPublicInfringement = (value: unknown): value is PublicInfringement =>
  isRecord(value) &&
  typeof value.infringementNumber === "number" &&
  typeof value.occurredAt === "string" &&
  typeof value.amountCents === "number" &&
  typeof value.street === "string" &&
  (value.suburb === null || typeof value.suburb === "string") &&
  (value.town === null || typeof value.town === "string") &&
  typeof value.offenceDescription === "string" &&
  (value.vehicleMake === null || typeof value.vehicleMake === "string") &&
  (value.vehicleModel === null || typeof value.vehicleModel === "string") &&
  (value.vehicleColour === null || typeof value.vehicleColour === "string") &&
  (value.vehicleType === null || typeof value.vehicleType === "string") &&
  typeof value.isTowed === "boolean";

const isInfringementListResponse = (
  value: unknown
): value is InfringementListResponse =>
  isRecord(value) &&
  Array.isArray(value.data) &&
  value.data.every(isPublicInfringement) &&
  typeof value.page === "number" &&
  typeof value.limit === "number" &&
  typeof value.total === "number";

const parseEnvelope = async <T>(
  url: string,
  guard: (value: unknown) => value is T
): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    throw new Error(getErrorMessage(body, response.status));
  }
  const data = await readResponseData(response);
  if (!guard(data)) {
    throw new Error("Invalid response payload");
  }
  return data;
};

const parseJson = async <T>(
  url: string,
  guard: (value: unknown) => value is T
): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    throw new Error(getErrorMessage(body, response.status));
  }
  const json: unknown = await response.json();
  if (!guard(json)) {
    throw new Error("Invalid response payload");
  }
  return json;
};

const isLocationBrowseResponse = (
  value: unknown
): value is BrowseResponse<LocationRankItem> =>
  isBrowseResponse(value, isLocationRankItem);

const isVehicleBrowseResponse = (
  value: unknown
): value is BrowseResponse<VehicleRankItem> =>
  isBrowseResponse(value, isVehicleRankItem);

const hasNonEmptyString = (value: string | undefined): value is string =>
  value !== undefined && value.length > 0;

const isDailyStatPoint = (value: unknown): value is DailyStatPoint =>
  isRecord(value) &&
  typeof value.date === "string" &&
  typeof value.count === "number" &&
  typeof value.totalCents === "number";

const isDailyStatPointArray = (value: unknown): value is DailyStatPoint[] =>
  Array.isArray(value) && value.every(isDailyStatPoint);

export const fetchLiveStats = async (): Promise<LiveStatsResponse> =>
  await parseEnvelope("/api/v1/stats/live", isLiveStatsResponse);

export const fetchDailyTrend = async (
  days = PACE_DAILY_TREND_DAYS
): Promise<DailyStatPoint[]> =>
  await parseEnvelope(
    `/api/v1/stats/daily?days=${days}`,
    isDailyStatPointArray
  );

export const fetchTopStats = async (
  groupBy: "street" | "offence",
  limit = 5
): Promise<TopStatsResponse> => {
  const params = new URLSearchParams({ groupBy, limit: String(limit) });
  return await parseEnvelope(`/api/v1/stats/top?${params}`, isTopStatsResponse);
};

export const fetchTopStreets = async (
  limit = 10
): Promise<LocationRankItem[]> =>
  await parseEnvelope(
    `/api/v1/locations/streets?limit=${limit}`,
    isLocationRankItemArray
  );

export const fetchTopSuburbs = async (
  limit = 10
): Promise<LocationRankItem[]> =>
  await parseEnvelope(
    `/api/v1/locations/suburbs?limit=${limit}`,
    isLocationRankItemArray
  );

export const fetchMapPoints = async (limit = 50): Promise<MapResponse> =>
  await parseEnvelope(`/api/v1/locations/map?limit=${limit}`, isMapResponse);

export const fetchTopVehicles = async (
  limit = 10
): Promise<VehicleRankItem[]> =>
  await parseEnvelope(
    `/api/v1/vehicles/top?limit=${limit}`,
    isVehicleRankItemArray
  );

export const fetchRecentInfringements = async (
  limit = 15
): Promise<InfringementListResponse> =>
  await parseJson(
    `/api/v1/infringements/recent?limit=${limit}`,
    isInfringementListResponse
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
  await parseJson(
    `/api/v1/browse/suburbs?${buildBrowseParams(params)}`,
    isLocationBrowseResponse
  );

export const fetchBrowseStreets = async (
  params: BrowseParams = {}
): Promise<BrowseResponse<LocationRankItem>> =>
  await parseJson(
    `/api/v1/browse/streets?${buildBrowseParams(params)}`,
    isLocationBrowseResponse
  );

export const fetchBrowseVehicles = async (
  params: BrowseParams = {}
): Promise<BrowseResponse<VehicleRankItem>> =>
  await parseJson(
    `/api/v1/browse/vehicles?${buildBrowseParams(params)}`,
    isVehicleBrowseResponse
  );

export const fetchStreetsInSuburb = async (
  suburb: string,
  params: Omit<BrowseParams, "suburb"> = {}
): Promise<BrowseResponse<LocationRankItem>> => {
  const encoded = encodeURIComponent(suburb);
  return await parseJson(
    `/api/v1/explore/suburbs/${encoded}/streets?${buildBrowseParams(params)}`,
    isLocationBrowseResponse
  );
};

export interface ExploreInfringementsParams {
  street?: string;
  suburb?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  page?: number;
  limit?: number;
}

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
  return await parseJson(
    `/api/v1/explore/infringements?${search}`,
    isInfringementListResponse
  );
};
