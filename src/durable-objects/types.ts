import type { TrendResult } from "@/lib/trend.ts";
import type { CleanInfringement } from "@/server/clean.ts";

export type SyncRunType = "hourly" | "manual" | "backfill";

export interface SyncWindowPayload {
  runType: SyncRunType;
  start: string;
  end: string;
  records: CleanInfringement[];
  recordsFetched: number;
  skipped: number;
}

export interface SyncWindowResult {
  runId: number;
  recordsFetched: number;
  recordsUpserted: number;
  skipped: number;
}

export interface ImportBatchPayload {
  records: CleanInfringement[];
  recordsReceived: number;
  skipped: number;
  final: boolean;
}

export interface ImportBatchResult {
  recordsReceived: number;
  recordsUpserted: number;
  skipped: number;
  recomputed: boolean;
  totalRecords: number;
}

export interface PublicTopItem {
  label: string;
  count: number;
}

export interface LocationRankItem {
  street?: string;
  suburb?: string;
  label: string;
  count: number;
}

export interface VehicleRankItem {
  make: string;
  model: string;
  label: string;
  count: number;
}

export type BrowseSort = "count" | "name";

export interface BrowseQuery {
  q?: string;
  page: number;
  limit: number;
  sort: BrowseSort;
  suburb?: string;
}

export interface BrowseResult<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}

export interface LocationMapPoint {
  id: string;
  street: string;
  suburb: string | null;
  town: string;
  count: number;
  geometry: [number, number][][];
}

export interface LocationCacheInput {
  street: string;
  suburb: string | null;
  town: string;
  lat: number;
  lon: number;
  displayName: string;
  geometry: [number, number][][];
}

export interface PublicPaceTrends {
  last7d: TrendResult;
  last30d: TrendResult;
  last365d: TrendResult;
}

export interface PublicDashboardSnapshot {
  at: string;
  live: PublicLiveStats;
  dailyTrend: DailyStatRow[];
  paceTrends: PublicPaceTrends;
  recentInfringements: InfringementRow[];
  topStreets: PublicTopItem[];
  topOffences: PublicTopItem[];
  streets: LocationRankItem[];
  suburbs: LocationRankItem[];
  vehicles: VehicleRankItem[];
  map: {
    routes: LocationMapPoint[];
    pendingGeocode: number;
  };
}

export interface PublicLiveStats {
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

export interface LiveStats {
  today: { count: number; totalCents: number };
  thisMonth: { count: number; totalCents: number };
  thisYear: { count: number; totalCents: number };
  allTime: { count: number; totalCents: number };
  updatedAt: string | null;
}

export interface DailyStatRow {
  date: string;
  count: number;
  totalCents: number;
}

export type TopGroupBy = "street" | "offence";
export type TopWindow = "all" | "7d" | "30d";

export interface TopStatRow {
  key: string;
  count: number;
  totalCents: number;
}

export interface InfringementRow {
  infringementNumber: number;
  occurredAt: string;
  amountCents: number;
  street: string;
  suburb: string | null;
  town: string | null;
  postCode: string | null;
  offenceCode: string | null;
  offenceDescription: string;
  offenceCategory: string | null;
  vehicleMake: string | null;
  vehicleModel: string | null;
  vehicleColour: string | null;
  vehicleType: string | null;
  isTowed: boolean;
  firstSeenAt: string;
  updatedAt: string;
}

export interface InfringementQuery {
  page: number;
  limit: number;
  from?: string;
  to?: string;
  street?: string;
  suburb?: string;
  vehicleMake?: string;
  vehicleModel?: string;
}

export interface InfringementListResult {
  data: InfringementRow[];
  page: number;
  limit: number;
  total: number;
}

export interface SyncRunRow {
  id: number;
  runType: string;
  windowStart: string;
  windowEnd: string;
  fetched: number;
  inserted: number;
  updated: number;
  status: string;
  error: string | null;
  startedAt: string;
  finishedAt: string | null;
}

export interface DateWindow {
  start: string;
  end: string;
}

export interface BackfillProgress {
  chunkDays: number;
  completed: number;
  end: string;
  latestIngestedAt: string | null;
  latestWindow: { end: string; start: string } | null;
  percent: number;
  start: string;
  total: number;
  totalRecords: number;
}

export interface CacheStatus {
  source: "parking-store";
  totalRecords: number;
  lastHccFetchAt: string | null;
  lastSyncedAt: string | null;
  ingestWindows: number;
}
