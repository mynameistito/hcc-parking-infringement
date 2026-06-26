import type {
  ExportInfringementsResult,
  ExportTotalMode,
  ExportWatermarksResult,
} from "@/durable-objects/parking-store/replication.ts";
import type {
  BackfillProgress,
  BrowseQuery,
  BrowseResult,
  CacheStatus,
  DailyStatRow,
  InfringementListResult,
  InfringementQuery,
  LiveStats,
  LocationMapPoint,
  LocationRankItem,
  PublicLiveStats,
  PublicTopItem,
  SyncRunRow,
  TopGroupBy,
  TopStatRow,
  TopWindow,
  VehicleRankItem,
} from "@/durable-objects/types.ts";
import type { ParkingStoreReadSource } from "@/server/parking-read-source.ts";

export interface ParkingStoreReader {
  readonly source: ParkingStoreReadSource;
  readonly isSeedMode: boolean;
  /** Browse/explore SQL is unavailable in seed deploy mode. */
  readonly supportsBrowse: boolean;

  getLiveStats: () => Promise<LiveStats>;
  getPublicLiveStats: () => Promise<PublicLiveStats>;
  getDailyStats: (from: string, to: string) => Promise<DailyStatRow[]>;
  getTopStats: (
    groupBy: TopGroupBy,
    window: TopWindow,
    limit: number
  ) => Promise<TopStatRow[]>;
  getPublicTop: (
    groupBy: "street" | "offence",
    limit: number
  ) => Promise<PublicTopItem[]>;
  listInfringements: (
    query: InfringementQuery
  ) => Promise<InfringementListResult>;
  getTopStreets: (limit: number) => Promise<LocationRankItem[]>;
  getTopSuburbs: (limit: number) => Promise<LocationRankItem[]>;
  getTopVehicles: (limit: number) => Promise<VehicleRankItem[]>;
  getMapPoints: (limit: number) => Promise<{
    pendingGeocode: number;
    routes: LocationMapPoint[];
  }>;
  getCacheStatus: () => Promise<CacheStatus>;
  browseSuburbs: (
    query: BrowseQuery
  ) => Promise<BrowseResult<LocationRankItem>>;
  browseStreets: (
    query: BrowseQuery
  ) => Promise<BrowseResult<LocationRankItem>>;
  browseVehicles: (
    query: BrowseQuery
  ) => Promise<BrowseResult<VehicleRankItem>>;
  getStreetsInSuburb: (
    suburb: string,
    limit?: number
  ) => Promise<LocationRankItem[]>;
  getLatestSyncRun: () => Promise<SyncRunRow | null>;
  getBackfillProgressSnapshot: (
    start: string,
    end: string,
    chunkDays: number
  ) => Promise<BackfillProgress>;
  readDashboardSnapshotPayload: () => Promise<string>;
  exportInfringements: (
    after: number,
    limit: number,
    totalMode?: ExportTotalMode
  ) => Promise<ExportInfringementsResult>;
  exportWatermarks: (
    offset: number,
    limit: number
  ) => Promise<ExportWatermarksResult>;
}

export const emptyBrowseResult = <T>(query: BrowseQuery): BrowseResult<T> => ({
  items: [],
  limit: query.limit,
  page: query.page,
  total: 0,
});
