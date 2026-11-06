import { normalizeLocationGeometry } from "@/durable-objects/geometry.ts";
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
import { getParkingStore } from "@/server/store.ts";
import { splitDateRange } from "@/server/sync-window.ts";

import type { ParkingStoreReader } from "./types.ts";

/** Reads parking data through the ParkingStore Durable Object. */
export class DurableObjectParkingStoreReader implements ParkingStoreReader {
  readonly source = "durable_object" as const;
  readonly isSeedMode = false;
  readonly supportsBrowse = true;

  private readonly env: Env;

  /**
   * Creates a reader for the store bound in the Worker environment.
   * @param env - The Worker environment containing the store binding.
   */
  constructor(env: Env) {
    this.env = env;
  }

  private store() {
    return getParkingStore(this.env);
  }

  /**
   * Reads current internal live statistics from the store.
   * @returns The live statistics.
   */
  async getLiveStats(): Promise<LiveStats> {
    return await this.store().getLiveStats();
  }

  /**
   * Reads the public projection of current live statistics.
   * @returns Public live statistics.
   */
  async getPublicLiveStats(): Promise<PublicLiveStats> {
    return await this.store().getPublicLiveStats();
  }

  /**
   * Reads daily statistics for a date range.
   * @param from - The start date.
   * @param to - The end date.
   * @returns Daily statistic rows for the range.
   */
  async getDailyStats(from: string, to: string): Promise<DailyStatRow[]> {
    return await this.store().getDailyStats(from, to);
  }

  /**
   * Reads ranked statistics for a grouping and time window.
   * @param groupBy - The dimension to rank.
   * @param window - The time window to query.
   * @param limit - Maximum number of rows to return.
   * @returns Ranked statistic rows.
   */
  async getTopStats(
    groupBy: TopGroupBy,
    window: TopWindow,
    limit: number
  ): Promise<TopStatRow[]> {
    return await this.store().getTopStats(groupBy, window, limit);
  }

  /**
   * Reads the public ranking for streets or offences.
   * @param groupBy - The dimension to rank.
   * @param limit - Maximum number of rows to return.
   * @returns Public ranking rows.
   */
  async getPublicTop(
    groupBy: "street" | "offence",
    limit: number
  ): Promise<PublicTopItem[]> {
    return await this.store().getPublicTop(groupBy, limit);
  }

  /**
   * Reads a page of infringements matching a query.
   * @param query - The filters and page selection.
   * @returns The matching page and total count.
   */
  async listInfringements(
    query: InfringementQuery
  ): Promise<InfringementListResult> {
    return await this.store().listInfringements(query);
  }

  /**
   * Reads streets ranked by infringement count.
   * @param limit - Maximum number of streets to return.
   * @returns Ranked street records.
   */
  async getTopStreets(limit: number): Promise<LocationRankItem[]> {
    return await this.store().getTopStreets(limit);
  }

  /**
   * Reads suburbs ranked by infringement count.
   * @param limit - Maximum number of suburbs to return.
   * @returns Ranked suburb records.
   */
  async getTopSuburbs(limit: number): Promise<LocationRankItem[]> {
    return await this.store().getTopSuburbs(limit);
  }

  /**
   * Reads vehicles ranked by infringement count.
   * @param limit - Maximum number of vehicles to return.
   * @returns Ranked vehicle records.
   */
  async getTopVehicles(limit: number): Promise<VehicleRankItem[]> {
    return await this.store().getTopVehicles(limit);
  }

  /**
   * Reads map routes and normalizes their geometry.
   * @param limit - Maximum number of routes to return.
   * @returns Routes and the count of locations awaiting geocoding.
   */
  async getMapPoints(limit: number): Promise<{
    pendingGeocode: number;
    routes: LocationMapPoint[];
  }> {
    const result = await this.store().getMapPoints(limit);

    return {
      pendingGeocode: result.pendingGeocode,
      routes: result.routes.map((route) => ({
        ...route,
        geometry: normalizeLocationGeometry(route.geometry),
      })),
    };
  }

  /**
   * Reads the store's current cache status.
   * @returns The cache status.
   */
  async getCacheStatus(): Promise<CacheStatus> {
    return await this.store().getCacheStatus();
  }

  /**
   * Browses suburbs using search, sort, and pagination options.
   * @param query - The browse query.
   * @returns The matching page of suburbs.
   */
  async browseSuburbs(
    query: BrowseQuery
  ): Promise<BrowseResult<LocationRankItem>> {
    return await this.store().browseSuburbs(query);
  }

  /**
   * Browses streets using search, sort, and pagination options.
   * @param query - The browse query.
   * @returns The matching page of streets.
   */
  async browseStreets(
    query: BrowseQuery
  ): Promise<BrowseResult<LocationRankItem>> {
    return await this.store().browseStreets(query);
  }

  /**
   * Browses vehicles using search, sort, and pagination options.
   * @param query - The browse query.
   * @returns The matching page of vehicles.
   */
  async browseVehicles(
    query: BrowseQuery
  ): Promise<BrowseResult<VehicleRankItem>> {
    return await this.store().browseVehicles(query);
  }

  /**
   * Reads ranked streets within a suburb.
   * @param suburb - The suburb to query.
   * @param limit - Maximum number of streets to return.
   * @returns Ranked street records.
   */
  async getStreetsInSuburb(
    suburb: string,
    limit = 20
  ): Promise<LocationRankItem[]> {
    return await this.store().getStreetsInSuburb(suburb, limit);
  }

  /**
   * Reads the most recent sync run.
   * @returns The latest run, or null when no run exists.
   */
  async getLatestSyncRun(): Promise<SyncRunRow | null> {
    return await this.store().getLatestSyncRun();
  }

  /**
   * Reads backfill progress and calculates the percentage of requested chunks completed.
   * @param start - The range start date.
   * @param end - The range end date.
   * @param chunkDays - The number of days in each requested chunk.
   * @returns Completion information and the store-wide record total.
   */
  async getBackfillProgressSnapshot(
    start: string,
    end: string,
    chunkDays: number
  ): Promise<BackfillProgress> {
    const store = this.store();
    const total = splitDateRange(start, end, chunkDays).length;

    const snapshot = await store.getBackfillProgressSnapshot(
      start,
      end,
      chunkDays
    );

    return {
      chunkDays,
      completed: snapshot.completed,
      end,
      latestIngestedAt: snapshot.latestIngestedAt,
      latestWindow: snapshot.latestWindow,
      percent:
        total > 0 ? Math.min(100, (snapshot.completed / total) * 100) : 100,
      start,
      total,
      totalRecords: snapshot.totalRecords,
    };
  }

  /**
   * Reads the serialized dashboard snapshot payload from the store.
   * @returns The serialized snapshot.
   */
  async readDashboardSnapshotPayload(): Promise<string> {
    return await this.store().exportDashboardSnapshotPayload();
  }

  /**
   * Exports a page of stored infringements after a cursor.
   * @param after - The last infringement number already exported.
   * @param limit - Maximum number of records to return.
   * @param totalMode - Whether the total uses a cached value or a scan.
   * @returns The export page and pagination metadata.
   */
  async exportInfringements(
    after: number,
    limit: number,
    totalMode: ExportTotalMode = "cached"
  ): Promise<ExportInfringementsResult> {
    return await this.store().exportInfringements(after, limit, totalMode);
  }

  /**
   * Exports a page of ingest watermarks.
   * @param offset - The number of watermarks to skip.
   * @param limit - Maximum number of watermarks to return.
   * @returns The export page and pagination metadata.
   */
  async exportWatermarks(
    offset: number,
    limit: number
  ): Promise<ExportWatermarksResult> {
    return await this.store().exportWatermarks(offset, limit);
  }
}
