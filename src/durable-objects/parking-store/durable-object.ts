import { DurableObject } from "cloudflare:workers";

import {
  flushBackfillDerivedState,
  markBackfillStatsDirty,
} from "@/durable-objects/parking-store/backfill-state.ts";
import {
  browseStreets as queryBrowseStreets,
  browseSuburbs as queryBrowseSuburbs,
  browseVehicles as queryBrowseVehicles,
} from "@/durable-objects/parking-store/browse-queries.ts";
import {
  getDailyStats as queryDailyStats,
  listInfringements as queryInfringements,
} from "@/durable-objects/parking-store/infringements.ts";
import { LiveCoordinator } from "@/durable-objects/parking-store/live-coordinator.ts";
import {
  countLocationsNeedingGeocode as countPendingGeocodeLocations,
  fetchGeocodeCandidates,
  markGeocodeFailed as persistGeocodeFailure,
  readMapPoints,
  saveLocationCache as persistLocationCache,
} from "@/durable-objects/parking-store/locations.ts";
import {
  getPublicTop as queryPublicTop,
  getStreetsInSuburb as queryStreetsInSuburb,
  getTopStats as queryTopStats,
  getTopStreets as queryTopStreets,
  getTopSuburbs as queryTopSuburbs,
  getTopVehicles as queryTopVehicles,
} from "@/durable-objects/parking-store/rankings.ts";
import { runParkingStoreMigrations } from "@/durable-objects/parking-store/schema.ts";
import {
  getCacheStatus as readCacheStatus,
  getLiveStats as readLiveStats,
  readPublicLiveStats,
  recomputeStatsLive,
} from "@/durable-objects/parking-store/stats.ts";
import {
  applySyncWindow as ingestSyncWindow,
  importInfringementBatch as ingestImportBatch,
  recordBackfillFailure as ingestBackfillFailure,
} from "@/durable-objects/parking-store/sync-ingest.ts";
import { getLatestSyncRun as readLatestSyncRun } from "@/durable-objects/parking-store/sync.ts";
import {
  countIngestWatermarksInRange as countWatermarksInRange,
  filterPendingChunks as queryPendingChunks,
  getBackfillProgressSnapshot as readBackfillProgressSnapshot,
  getLatestIngestWatermarkInRange as readLatestWatermarkInRange,
  isWindowIngested as queryWindowIngested,
} from "@/durable-objects/parking-store/watermarks.ts";
import {
  handleWebSocketMessage as onWebSocketMessage,
  pushToWebSocket,
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

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.live = new LiveCoordinator(this.sql, () => this.ctx.getWebSockets());
    void ctx.blockConcurrencyWhile(async () => {
      await this.migrate();
    });
  }

  fetch(request: Request): Response {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected WebSocket", { status: 426 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server);
    queueMicrotask(() => {
      pushToWebSocket(server, this.live.resolveSnapshotPayload());
    });

    return new Response(null, { status: 101, webSocket: client });
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
    return ingestSyncWindow(this.sql, payload, {
      markBackfillStatsDirty: () => {
        markBackfillStatsDirty(this.sql);
      },
      onIncrementalSuccess: () => {
        this.live.recomputeAndBroadcast();
      },
    });
  }

  recordBackfillFailure(start: string, end: string, error: string): void {
    ingestBackfillFailure(this.sql, start, end, error);
  }

  importInfringementBatch(payload: ImportBatchPayload): ImportBatchResult {
    return ingestImportBatch(this.sql, payload, () => {
      this.live.recomputeAndBroadcast();
    });
  }

  getPublicLiveStats(): PublicLiveStats {
    return readPublicLiveStats(this.sql);
  }

  getLiveStats(): LiveStats {
    return readLiveStats(this.sql);
  }

  getDailyStats(from: string, to: string): DailyStatRow[] {
    return queryDailyStats(this.sql, from, to);
  }

  getTopStats(
    groupBy: TopGroupBy,
    window: TopWindow,
    limit: number
  ): TopStatRow[] {
    return queryTopStats(this.sql, groupBy, window, limit);
  }

  getPublicTop(groupBy: "street" | "offence", limit: number): PublicTopItem[] {
    return queryPublicTop(this.sql, groupBy, limit);
  }

  getTopStreets(limit: number): LocationRankItem[] {
    return queryTopStreets(this.sql, limit);
  }

  getTopSuburbs(limit: number): LocationRankItem[] {
    return queryTopSuburbs(this.sql, limit);
  }

  getStreetsInSuburb(suburb: string, limit: number): LocationRankItem[] {
    return queryStreetsInSuburb(this.sql, suburb, limit);
  }

  browseSuburbs(query: BrowseQuery): BrowseResult<LocationRankItem> {
    return queryBrowseSuburbs(this.sql, query);
  }

  browseStreets(query: BrowseQuery): BrowseResult<LocationRankItem> {
    return queryBrowseStreets(this.sql, query);
  }

  browseVehicles(query: BrowseQuery): BrowseResult<VehicleRankItem> {
    return queryBrowseVehicles(this.sql, query);
  }

  getTopVehicles(limit: number): VehicleRankItem[] {
    return queryTopVehicles(this.sql, limit);
  }

  getLocationsNeedingGeocode(
    limit: number
  ): { street: string; suburb: string | null; town: string; count: number }[] {
    return fetchGeocodeCandidates(this.sql, limit);
  }

  countLocationsNeedingGeocode(): number {
    return countPendingGeocodeLocations(this.sql);
  }

  markGeocodeFailed(street: string, suburb: string | null, town: string): void {
    persistGeocodeFailure(this.sql, street, suburb, town);
  }

  saveLocationCache(input: LocationCacheInput): void {
    persistLocationCache(this.sql, input);
    this.live.broadcastLiveUpdate();
  }

  getMapPoints(limit: number): {
    pendingGeocode: number;
    routes: LocationMapPoint[];
  } {
    return readMapPoints(this.sql, limit);
  }

  listInfringements(query: InfringementQuery): InfringementListResult {
    return queryInfringements(this.sql, query);
  }

  getLatestSyncRun(): SyncRunRow | null {
    return readLatestSyncRun(this.sql);
  }

  isWindowIngested(start: string, end: string): boolean {
    return queryWindowIngested(this.sql, start, end);
  }

  filterPendingChunks(windows: DateWindow[]): DateWindow[] {
    return queryPendingChunks(this.sql, windows);
  }

  getCacheStatus(): CacheStatus {
    return readCacheStatus(this.sql);
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
    return readBackfillProgressSnapshot(this.sql, start, end, chunkDays);
  }

  flushBackfillDerivedState(): { flushed: boolean } {
    return flushBackfillDerivedState(this.sql, () => {
      this.live.recomputeAndBroadcast();
    });
  }

  countIngestWatermarksInRange(
    start: string,
    end: string,
    chunkDays: number
  ): number {
    return countWatermarksInRange(this.sql, start, end, chunkDays);
  }

  getLatestIngestWatermarkInRange(
    start: string,
    end: string,
    chunkDays: number
  ): { end: string; ingestedAt: string; start: string } | null {
    return readLatestWatermarkInRange(this.sql, start, end, chunkDays);
  }
}
