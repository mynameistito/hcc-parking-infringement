import { z } from "zod";

import type {
  BrowseSort,
  DailyStatPoint,
  LocationRankItem,
  TopItem,
  VehicleRankItem,
} from "@/contracts/store-shapes.ts";

/** Public live dashboard aggregate stats (flat counts for the dashboard). */
export const publicLiveStatsSchema = z.object({
  allTimeAmountCents: z.number(),
  allTimeTotal: z.number(),
  last24h: z.number(),
  last30d: z.number(),
  last365d: z.number().default(0),
  last7d: z.number(),
  lastRecordAt: z.string().nullable(),
  lastSyncedAt: z.string().nullable(),
  thisMonth: z.number(),
  today: z.number(),
  towedToday: z.number(),
});

/** Validated aggregate statistics returned to public clients. */
export type PublicLiveStats = z.infer<typeof publicLiveStatsSchema>;

/** @deprecated Use `publicLiveStatsSchema`. */
export const liveStatsSchema = publicLiveStatsSchema;

/** @deprecated Use `PublicLiveStats`. */
export type LiveStats = PublicLiveStats;

/** Daily time-series point for charts and pace panels. */
export const dailyStatPointSchema = z.object({
  count: z.number(),
  date: z.string(),
  totalCents: z.number(),
});

export type { DailyStatPoint } from "@/contracts/store-shapes.ts";

const dailyStatPointArraySchema = z.array(dailyStatPointSchema);

/** Ranked label + count (streets, offences). */
const topItemSchema = z.object({
  count: z.number(),
  label: z.string(),
});

export type { TopItem } from "@/contracts/store-shapes.ts";

const topStatsResponseSchema = z.object({
  groupBy: z.enum(["street", "offence"]),
  items: z.array(topItemSchema),
});

/** Ranked street or offence counts grouped by the requested dimension. */
export type TopStatsResponse = z.infer<typeof topStatsResponseSchema>;

/** Ranked location (street or suburb). */
const locationRankItemSchema = z.object({
  count: z.number(),
  label: z.string(),
  street: z.string().optional(),
  suburb: z.string().optional(),
});

export type { LocationRankItem } from "@/contracts/store-shapes.ts";

const locationRankItemArraySchema = z.array(locationRankItemSchema);

/** Ranked vehicle make/model. */
const vehicleRankItemSchema = z.object({
  count: z.number(),
  label: z.string(),
  make: z.string(),
  model: z.string(),
});

export type { VehicleRankItem } from "@/contracts/store-shapes.ts";

const vehicleRankItemArraySchema = z.array(vehicleRankItemSchema);

/** Public infringement row (no internal sync metadata). */
export const publicInfringementSchema = z.object({
  amountCents: z.number(),
  infringementNumber: z.number(),
  isTowed: z.boolean(),
  occurredAt: z.string(),
  offenceDescription: z.string(),
  street: z.string(),
  suburb: z.string().nullable(),
  town: z.string().nullable(),
  vehicleColour: z.string().nullable(),
  vehicleMake: z.string().nullable(),
  vehicleModel: z.string().nullable(),
  vehicleType: z.string().nullable(),
});

/** Infringement fields exposed by the public API. */
export type PublicInfringement = z.infer<typeof publicInfringementSchema>;

export const infringementListResponseSchema = z.object({
  data: z.array(publicInfringementSchema),
  limit: z.number(),
  page: z.number(),
  total: z.number(),
});

/** Paginated public infringement rows and their total count. */
export type InfringementListResponse = z.infer<
  typeof infringementListResponseSchema
>;

export const browseSortSchema = z.enum(["count", "name"]);

export type { BrowseSort } from "@/contracts/store-shapes.ts";

/** Filters, sorting, and pagination for a location or vehicle browse request. */
export interface BrowseParams {
  q?: string;
  page?: number;
  limit?: number;
  sort?: BrowseSort;
  suburb?: string;
}

/** Filters and pagination for an infringement exploration request. */
export interface ExploreInfringementsParams {
  street?: string;
  suburb?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  page?: number;
  limit?: number;
}

const browseResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    limit: z.number(),
    page: z.number(),
    total: z.number(),
  });

export type { BrowseResponse } from "@/contracts/store-shapes.ts";

export const locationBrowseResponseSchema = browseResponseSchema(
  locationRankItemSchema
);

export const vehicleBrowseResponseSchema = browseResponseSchema(
  vehicleRankItemSchema
);

/** Map route geometry for dashboard pins. */
export interface MapRouteItem {
  readonly count: number;
  readonly geometry: number[][][];
  readonly id: string;
  readonly street: string;
  readonly suburb: string | null;
  readonly town: string;
}

const mapRouteItemSchema = z.object({
  count: z.number(),
  geometry: z.array(z.array(z.array(z.number()))),
  id: z.string(),
  street: z.string(),
  suburb: z.string().nullable(),
  town: z.string(),
});

export const mapResponseSchema = z.object({
  pendingGeocode: z.number(),
  routes: z.array(mapRouteItemSchema),
});

/** Map routes and the number of locations awaiting geocoding. */
export interface MapResponse {
  readonly pendingGeocode: number;
  readonly routes: MapRouteItem[];
}

const trendResultSchema = z.object({
  current: z.number(),
  direction: z.enum(["up", "down", "flat"]),
  percent: z.number().nullable(),
  previous: z.number(),
});

const paceTrendsSchema = z.object({
  last30d: trendResultSchema,
  last365d: trendResultSchema,
  last7d: trendResultSchema,
});

/** Comparison of recent infringement counts with preceding periods. */
export type PaceTrends = z.infer<typeof paceTrendsSchema>;

const chartBreakdownsSchema = z.object({
  offenceCategories: z.array(topItemSchema),
  offences: z.array(topItemSchema),
  suburbs: z.array(topItemSchema),
  towed: z.array(topItemSchema),
  vehicleMakes: z.array(topItemSchema),
  vehicleTypes: z.array(topItemSchema),
});

/** Ranked category counts used by dashboard charts. */
export type ChartBreakdowns = z.infer<typeof chartBreakdownsSchema>;

export const EMPTY_CHART_BREAKDOWNS: ChartBreakdowns = {
  offenceCategories: [],
  offences: [],
  suburbs: [],
  towed: [],
  vehicleMakes: [],
  vehicleTypes: [],
};

/** WebSocket full-dashboard push payload. */
export const fullDashboardMessageSchema = z.object({
  at: z.string(),
  chartBreakdowns: chartBreakdownsSchema.optional(),
  dailyTrend: dailyStatPointArraySchema.optional(),
  live: publicLiveStatsSchema,
  map: mapResponseSchema,
  paceTrends: paceTrendsSchema.optional(),
  recentInfringements: z.array(publicInfringementSchema),
  streets: locationRankItemArraySchema,
  suburbs: locationRankItemArraySchema,
  topOffences: z.array(topItemSchema),
  topStreets: z.array(topItemSchema),
  type: z.literal("full"),
  vehicles: vehicleRankItemArraySchema,
});

/** Full dashboard state delivered in a WebSocket message. */
export interface FullDashboardMessage {
  readonly at: string;
  readonly chartBreakdowns?: ChartBreakdowns;
  readonly dailyTrend?: DailyStatPoint[];
  readonly live: PublicLiveStats;
  readonly map: MapResponse;
  readonly paceTrends?: PaceTrends;
  readonly recentInfringements: PublicInfringement[];
  readonly streets: LocationRankItem[];
  readonly suburbs: LocationRankItem[];
  readonly topOffences: TopItem[];
  readonly topStreets: TopItem[];
  readonly type: "full";
  readonly vehicles: VehicleRankItem[];
}

/**
 * Reads the data field from an untrusted stored API JSON envelope.
 * @param json - Parsed JSON whose envelope shape has not yet been checked.
 * @returns The unvalidated data value for the caller to parse.
 * Throws an error when the value is not an object with a data field.
 */
export const readStoredEnvelopeData = (json: unknown): unknown => {
  if (typeof json !== "object" || json === null || !("data" in json)) {
    throw new Error("Invalid response payload");
  }

  return Reflect.get(json, "data");
};
