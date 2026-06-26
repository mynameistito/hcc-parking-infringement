import type {
  BrowseQuery,
  BrowseResult,
  CacheStatus,
  DailyStatRow,
  DateWindow,
  ImportBatchPayload,
  ImportBatchResult,
  InfringementListResult,
  InfringementQuery,
  LiveStats,
  LocationCacheInput,
  LocationMapPoint,
  LocationRankItem,
  PublicLiveStats,
  PublicTopItem,
  SyncRunRow,
  SyncWindowPayload,
  SyncWindowResult,
  TopGroupBy,
  TopStatRow,
  TopWindow,
  VehicleRankItem,
} from "@/durable-objects/types.ts";
import type { CleanInfringement } from "@/server/clean-schema.ts";

import {
  flushBackfillDerivedState,
  markBackfillStatsDirty,
} from "./backfill-state.ts";
import {
  browseStreets,
  browseSuburbs,
  browseVehicles,
} from "./browse-queries.ts";
import {
  getCachedInfringementCount,
  recomputeCachedInfringementCount,
} from "./infringement-count.ts";
import {
  getDailyStats,
  listInfringements as queryInfringements,
} from "./infringements.ts";
import type { LiveCoordinator } from "./live-coordinator.ts";
import {
  countLocationsNeedingGeocode,
  fetchGeocodeCandidates,
  markGeocodeFailed,
  readMapPoints,
  saveLocationCache,
} from "./locations.ts";
import {
  getPublicTop,
  getStreetsInSuburb,
  getTopStats,
  getTopStreets,
  getTopSuburbs,
  getTopVehicles,
} from "./rankings.ts";
import type {
  ExportInfringementsResult,
  ExportTotalMode,
  ExportWatermarksResult,
  IngestWatermarkExport,
} from "./replication.ts";
import {
  exportInfringements,
  exportWatermarks,
  finalizeStoredImport as runFinalizeStoredImport,
  importStoredInfringements as runImportStoredInfringements,
  importWatermarks as runImportWatermarks,
} from "./replication.ts";
import { getCacheStatus, getLiveStats, readPublicLiveStats } from "./stats.ts";
import {
  applySyncWindow as runSyncWindow,
  importInfringementBatch as runImportBatch,
  recordBackfillFailure as runBackfillFailure,
} from "./sync-ingest.ts";
import { getLatestSyncRun } from "./sync.ts";
import {
  countIngestWatermarksInRange,
  filterPendingChunks,
  getBackfillProgressSnapshot,
  getLatestIngestWatermarkInRange,
  isWindowIngested,
} from "./watermarks.ts";

export interface ParkingStoreApi {
  applySyncWindow: (payload: SyncWindowPayload) => SyncWindowResult;
  recordBackfillFailure: (start: string, end: string, error: string) => void;
  importInfringementBatch: (payload: ImportBatchPayload) => ImportBatchResult;
  getPublicLiveStats: () => PublicLiveStats;
  getLiveStats: () => LiveStats;
  getDailyStats: (from: string, to: string) => DailyStatRow[];
  getTopStats: (
    groupBy: TopGroupBy,
    window: TopWindow,
    limit: number
  ) => TopStatRow[];
  getPublicTop: (
    groupBy: "street" | "offence",
    limit: number
  ) => PublicTopItem[];
  getTopStreets: (limit: number) => LocationRankItem[];
  getTopSuburbs: (limit: number) => LocationRankItem[];
  getStreetsInSuburb: (suburb: string, limit: number) => LocationRankItem[];
  browseSuburbs: (query: BrowseQuery) => BrowseResult<LocationRankItem>;
  browseStreets: (query: BrowseQuery) => BrowseResult<LocationRankItem>;
  browseVehicles: (query: BrowseQuery) => BrowseResult<VehicleRankItem>;
  getTopVehicles: (limit: number) => VehicleRankItem[];
  getLocationsNeedingGeocode: (
    limit: number
  ) => { street: string; suburb: string | null; town: string; count: number }[];
  countLocationsNeedingGeocode: () => number;
  markGeocodeFailed: (
    street: string,
    suburb: string | null,
    town: string
  ) => void;
  saveLocationCache: (input: LocationCacheInput) => void;
  getMapPoints: (limit: number) => {
    pendingGeocode: number;
    routes: LocationMapPoint[];
  };
  listInfringements: (query: InfringementQuery) => InfringementListResult;
  getLatestSyncRun: () => SyncRunRow | null;
  isWindowIngested: (start: string, end: string) => boolean;
  filterPendingChunks: (windows: DateWindow[]) => DateWindow[];
  getCacheStatus: () => CacheStatus;
  getBackfillProgressSnapshot: (
    start: string,
    end: string,
    chunkDays: number
  ) => {
    completed: number;
    latestIngestedAt: string | null;
    latestWindow: { end: string; start: string } | null;
    totalRecords: number;
  };
  flushBackfillDerivedState: () => { flushed: boolean };
  countIngestWatermarksInRange: (
    start: string,
    end: string,
    chunkDays: number
  ) => number;
  getLatestIngestWatermarkInRange: (
    start: string,
    end: string,
    chunkDays: number
  ) => { end: string; ingestedAt: string; start: string } | null;
  exportInfringements: (
    after: number,
    limit: number,
    totalMode?: ExportTotalMode
  ) => ExportInfringementsResult;
  importStoredInfringements: (records: CleanInfringement[]) => number;
  exportWatermarks: (offset: number, limit: number) => ExportWatermarksResult;
  importWatermarks: (watermarks: IngestWatermarkExport[]) => number;
  finalizeStoredImport: () => void;
  countInfringements: () => number;
}

export const createParkingStoreApi = (
  getSql: () => SqlStorage,
  live: LiveCoordinator
): ParkingStoreApi => {
  const sql = (): SqlStorage => getSql();

  return {
    applySyncWindow(payload) {
      return runSyncWindow(sql(), payload, {
        markBackfillStatsDirty: () => {
          markBackfillStatsDirty(sql());
        },
        onIncrementalSuccess: () => {
          live.recomputeAndBroadcast();
        },
      });
    },

    browseStreets: (query) => browseStreets(sql(), query),

    browseSuburbs: (query) => browseSuburbs(sql(), query),

    browseVehicles: (query) => browseVehicles(sql(), query),

    countInfringements: () => getCachedInfringementCount(sql()) ?? 0,

    countIngestWatermarksInRange: (start, end, chunkDays) =>
      countIngestWatermarksInRange(sql(), start, end, chunkDays),

    countLocationsNeedingGeocode: () => countLocationsNeedingGeocode(sql()),

    exportInfringements: (after, limit, totalMode = "cached") =>
      exportInfringements(sql(), after, limit, totalMode),

    exportWatermarks: (offset, limit) => exportWatermarks(sql(), offset, limit),

    filterPendingChunks: (windows) => filterPendingChunks(sql(), windows),

    finalizeStoredImport: () => {
      runFinalizeStoredImport(() => {
        try {
          recomputeCachedInfringementCount(sql());
        } catch (error) {
          console.error(
            "[parking-store] infringement count refresh skipped",
            error
          );
        }
        live.recomputeAndBroadcast();
      });
    },

    flushBackfillDerivedState: () =>
      flushBackfillDerivedState(sql(), () => {
        live.recomputeAndBroadcast();
      }),

    getBackfillProgressSnapshot: (start, end, chunkDays) =>
      getBackfillProgressSnapshot(sql(), start, end, chunkDays),

    getCacheStatus: () => getCacheStatus(sql()),

    getDailyStats: (from, to) => getDailyStats(sql(), from, to),

    getLatestIngestWatermarkInRange: (start, end, chunkDays) =>
      getLatestIngestWatermarkInRange(sql(), start, end, chunkDays),

    getLatestSyncRun: () => getLatestSyncRun(sql()),

    getLiveStats: () => getLiveStats(sql()),

    getLocationsNeedingGeocode: (limit) => fetchGeocodeCandidates(sql(), limit),

    getMapPoints: (limit) => readMapPoints(sql(), limit),

    getPublicLiveStats: () => readPublicLiveStats(sql()),

    getPublicTop: (groupBy, limit) => getPublicTop(sql(), groupBy, limit),

    getStreetsInSuburb: (suburb, limit) =>
      getStreetsInSuburb(sql(), suburb, limit),

    getTopStats: (groupBy, window, limit) =>
      getTopStats(sql(), groupBy, window, limit),

    getTopStreets: (limit) => getTopStreets(sql(), limit),

    getTopSuburbs: (limit) => getTopSuburbs(sql(), limit),

    getTopVehicles: (limit) => getTopVehicles(sql(), limit),

    importInfringementBatch(payload) {
      return runImportBatch(sql(), payload, () => {
        live.recomputeAndBroadcast();
      });
    },

    importStoredInfringements: (records) =>
      runImportStoredInfringements(sql(), records),

    importWatermarks: (watermarks) => runImportWatermarks(sql(), watermarks),

    isWindowIngested: (start, end) => isWindowIngested(sql(), start, end),

    listInfringements: (query) => queryInfringements(sql(), query),

    markGeocodeFailed: (street, suburb, town) => {
      markGeocodeFailed(sql(), street, suburb, town);
    },

    recordBackfillFailure(start, end, error) {
      runBackfillFailure(sql(), start, end, error);
    },

    saveLocationCache(input) {
      saveLocationCache(sql(), input);
      live.broadcastLiveUpdate();
    },
  };
};
