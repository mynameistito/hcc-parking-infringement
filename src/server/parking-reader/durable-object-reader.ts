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

export class DurableObjectParkingStoreReader implements ParkingStoreReader {
  readonly source = "durable_object" as const;
  readonly isSeedMode = false;
  readonly supportsBrowse = true;

  private readonly env: Env;

  constructor(env: Env) {
    this.env = env;
  }

  private store() {
    return getParkingStore(this.env);
  }

  async getLiveStats(): Promise<LiveStats> {
    return await this.store().getLiveStats();
  }

  async getPublicLiveStats(): Promise<PublicLiveStats> {
    return await this.store().getPublicLiveStats();
  }

  async getDailyStats(from: string, to: string): Promise<DailyStatRow[]> {
    return await this.store().getDailyStats(from, to);
  }

  async getTopStats(
    groupBy: TopGroupBy,
    window: TopWindow,
    limit: number
  ): Promise<TopStatRow[]> {
    return await this.store().getTopStats(groupBy, window, limit);
  }

  async getPublicTop(
    groupBy: "street" | "offence",
    limit: number
  ): Promise<PublicTopItem[]> {
    return await this.store().getPublicTop(groupBy, limit);
  }

  async listInfringements(
    query: InfringementQuery
  ): Promise<InfringementListResult> {
    return await this.store().listInfringements(query);
  }

  async getTopStreets(limit: number): Promise<LocationRankItem[]> {
    return await this.store().getTopStreets(limit);
  }

  async getTopSuburbs(limit: number): Promise<LocationRankItem[]> {
    return await this.store().getTopSuburbs(limit);
  }

  async getTopVehicles(limit: number): Promise<VehicleRankItem[]> {
    return await this.store().getTopVehicles(limit);
  }

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

  async getCacheStatus(): Promise<CacheStatus> {
    return await this.store().getCacheStatus();
  }

  async browseSuburbs(
    query: BrowseQuery
  ): Promise<BrowseResult<LocationRankItem>> {
    return await this.store().browseSuburbs(query);
  }

  async browseStreets(
    query: BrowseQuery
  ): Promise<BrowseResult<LocationRankItem>> {
    return await this.store().browseStreets(query);
  }

  async browseVehicles(
    query: BrowseQuery
  ): Promise<BrowseResult<VehicleRankItem>> {
    return await this.store().browseVehicles(query);
  }

  async getStreetsInSuburb(
    suburb: string,
    limit = 20
  ): Promise<LocationRankItem[]> {
    return await this.store().getStreetsInSuburb(suburb, limit);
  }

  async getLatestSyncRun(): Promise<SyncRunRow | null> {
    return await this.store().getLatestSyncRun();
  }

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

  async readDashboardSnapshotPayload(): Promise<string> {
    return await this.store().exportDashboardSnapshotPayload();
  }

  async exportInfringements(
    after: number,
    limit: number,
    totalMode: ExportTotalMode = "cached"
  ): Promise<ExportInfringementsResult> {
    return await this.store().exportInfringements(after, limit, totalMode);
  }

  async exportWatermarks(
    offset: number,
    limit: number
  ): Promise<ExportWatermarksResult> {
    return await this.store().exportWatermarks(offset, limit);
  }
}
