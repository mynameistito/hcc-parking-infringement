import { DurableObject } from "cloudflare:workers";

import { LiveCoordinator } from "@/durable-objects/parking-store/live-coordinator.ts";
import { runParkingStoreMigrations } from "@/durable-objects/parking-store/schema.ts";
import { recomputeStatsLive } from "@/durable-objects/parking-store/stats.ts";
import { createParkingStoreApi } from "@/durable-objects/parking-store/store-api.ts";
import type { ParkingStoreApi } from "@/durable-objects/parking-store/store-api.ts";
import {
  handleWebSocketMessage as onWebSocketMessage,
  handleWebSocketUpgrade,
} from "@/durable-objects/parking-store/websocket.ts";
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

export class ParkingStore extends DurableObject<Env> {
  private readonly live: LiveCoordinator;
  private readonly api: ParkingStoreApi;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.live = new LiveCoordinator(this.sql, () => this.ctx.getWebSockets());
    this.api = createParkingStoreApi(() => this.sql, this.live);
    void ctx.blockConcurrencyWhile(async () => {
      await this.migrate();
    });
  }

  fetch(request: Request): Response {
    return handleWebSocketUpgrade(
      request,
      (ws) => {
        this.ctx.acceptWebSocket(ws);
      },
      () => this.live.resolveSnapshotPayload()
    );
  }

  webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): void {
    void this.ctx;
    onWebSocketMessage(ws, message);
  }

  webSocketClose(
    _ws: WebSocket,
    _code: number,
    _reason: string,
    _wasClean: boolean
  ): void {
    void this.ctx;
  }

  private get sql(): SqlStorage {
    return this.ctx.storage.sql;
  }

  private async migrate(): Promise<void> {
    await Promise.resolve();

    runParkingStoreMigrations(this.sql, {
      recomputeStats: () => {
        recomputeStatsLive(this.sql);
      },
      refreshDashboardSnapshotCache: () => {
        this.live.refreshSnapshotCache();
      },
    });
  }

  applySyncWindow(payload: SyncWindowPayload): SyncWindowResult {
    return this.api.applySyncWindow(payload);
  }

  recordBackfillFailure(start: string, end: string, error: string): void {
    this.api.recordBackfillFailure(start, end, error);
  }

  importInfringementBatch(payload: ImportBatchPayload): ImportBatchResult {
    return this.api.importInfringementBatch(payload);
  }

  getPublicLiveStats(): PublicLiveStats {
    return this.api.getPublicLiveStats();
  }

  getLiveStats(): LiveStats {
    return this.api.getLiveStats();
  }

  getDailyStats(from: string, to: string): DailyStatRow[] {
    return this.api.getDailyStats(from, to);
  }

  getTopStats(
    groupBy: TopGroupBy,
    window: TopWindow,
    limit: number
  ): TopStatRow[] {
    return this.api.getTopStats(groupBy, window, limit);
  }

  getPublicTop(groupBy: "street" | "offence", limit: number): PublicTopItem[] {
    return this.api.getPublicTop(groupBy, limit);
  }

  getTopStreets(limit: number): LocationRankItem[] {
    return this.api.getTopStreets(limit);
  }

  getTopSuburbs(limit: number): LocationRankItem[] {
    return this.api.getTopSuburbs(limit);
  }

  getStreetsInSuburb(suburb: string, limit: number): LocationRankItem[] {
    return this.api.getStreetsInSuburb(suburb, limit);
  }

  browseSuburbs(query: BrowseQuery): BrowseResult<LocationRankItem> {
    return this.api.browseSuburbs(query);
  }

  browseStreets(query: BrowseQuery): BrowseResult<LocationRankItem> {
    return this.api.browseStreets(query);
  }

  browseVehicles(query: BrowseQuery): BrowseResult<VehicleRankItem> {
    return this.api.browseVehicles(query);
  }

  getTopVehicles(limit: number): VehicleRankItem[] {
    return this.api.getTopVehicles(limit);
  }

  getLocationsNeedingGeocode(
    limit: number
  ): { street: string; suburb: string | null; town: string; count: number }[] {
    return this.api.getLocationsNeedingGeocode(limit);
  }

  countLocationsNeedingGeocode(): number {
    return this.api.countLocationsNeedingGeocode();
  }

  markGeocodeFailed(street: string, suburb: string | null, town: string): void {
    this.api.markGeocodeFailed(street, suburb, town);
  }

  saveLocationCache(input: LocationCacheInput): void {
    this.api.saveLocationCache(input);
  }

  getMapPoints(limit: number): {
    pendingGeocode: number;
    routes: LocationMapPoint[];
  } {
    return this.api.getMapPoints(limit);
  }

  listInfringements(query: InfringementQuery): InfringementListResult {
    return this.api.listInfringements(query);
  }

  getLatestSyncRun(): SyncRunRow | null {
    return this.api.getLatestSyncRun();
  }

  isWindowIngested(start: string, end: string): boolean {
    return this.api.isWindowIngested(start, end);
  }

  filterPendingChunks(windows: DateWindow[]): DateWindow[] {
    return this.api.filterPendingChunks(windows);
  }

  getCacheStatus(): CacheStatus {
    return this.api.getCacheStatus();
  }

  getBackfillProgressSnapshot(
    start: string,
    end: string,
    chunkDays: number
  ): {
    completed: number;
    latestIngestedAt: string | null;
    latestWindow: { end: string; start: string } | null;
    totalRecords: number;
  } {
    return this.api.getBackfillProgressSnapshot(start, end, chunkDays);
  }

  flushBackfillDerivedState(): { flushed: boolean } {
    return this.api.flushBackfillDerivedState();
  }

  countIngestWatermarksInRange(
    start: string,
    end: string,
    chunkDays: number
  ): number {
    return this.api.countIngestWatermarksInRange(start, end, chunkDays);
  }

  getLatestIngestWatermarkInRange(
    start: string,
    end: string,
    chunkDays: number
  ): { end: string; ingestedAt: string; start: string } | null {
    return this.api.getLatestIngestWatermarkInRange(start, end, chunkDays);
  }
}
