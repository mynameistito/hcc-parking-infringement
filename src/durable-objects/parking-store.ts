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
import { DashboardLiveState } from "@/durable-objects/parking-store/dashboard-live.ts";
import {
  getDailyStats as queryDailyStats,
  listInfringements as queryInfringements,
} from "@/durable-objects/parking-store/infringements.ts";
import {
  countLocationsNeedingGeocode as countPendingGeocodeLocations,
  fetchGeocodeCandidates,
  markGeocodeFailed as persistGeocodeFailure,
  readMapPoints,
  saveLocationCache as persistLocationCache,
} from "@/durable-objects/parking-store/locations.ts";
import {
  getTopStats as queryTopStats,
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
import {
  getLatestSyncRun as readLatestSyncRun,
  hasWatermark,
} from "@/durable-objects/parking-store/sync.ts";
import {
  countIngestWatermarksInRange as countWatermarksInRange,
  getBackfillProgressSnapshot as readBackfillProgressSnapshot,
  getLatestIngestWatermarkInRange as readLatestWatermarkInRange,
} from "@/durable-objects/parking-store/watermarks.ts";
import {
  broadcastToWebSockets,
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

export type {
  BackfillProgress,
  BrowseQuery,
  BrowseResult,
  BrowseSort,
  CacheStatus,
  DailyStatRow,
  DateWindow,
  ImportBatchPayload,
  ImportBatchResult,
  InfringementListResult,
  InfringementQuery,
  InfringementRow,
  LiveStats,
  LocationCacheInput,
  LocationMapPoint,
  LocationRankItem,
  PublicDashboardSnapshot,
  PublicLiveStats,
  PublicPaceTrends,
  PublicTopItem,
  SyncRunRow,
  SyncRunType,
  SyncWindowPayload,
  SyncWindowResult,
  TopGroupBy,
  TopStatRow,
  TopWindow,
  VehicleRankItem,
} from "@/durable-objects/types.ts";
export {
  normalizeLocationGeometry,
  parseGeometryJson,
  toMapRouteRow,
} from "@/durable-objects/geometry.ts";

export class ParkingStore extends DurableObject<Env> {
  private readonly dashboardLive = new DashboardLiveState();

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
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
      pushToWebSocket(server, this.dashboardLive.resolve(this.sql));
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
        this.dashboardLive.refresh(this.sql);
      },
    });
  }

  applySyncWindow(payload: SyncWindowPayload): SyncWindowResult {
    return ingestSyncWindow(this.sql, payload, {
      markBackfillStatsDirty: () => {
        markBackfillStatsDirty(this.sql);
      },
      onIncrementalSuccess: () => {
        recomputeStatsLive(this.sql);
        this.broadcastLiveUpdate();
      },
    });
  }

  recordBackfillFailure(start: string, end: string, error: string): void {
    ingestBackfillFailure(this.sql, start, end, error);
  }

  importInfringementBatch(payload: ImportBatchPayload): ImportBatchResult {
    return ingestImportBatch(this.sql, payload, () => {
      recomputeStatsLive(this.sql);
      this.broadcastLiveUpdate();
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
    return queryTopStats(this.sql, groupBy, "all", limit).map((row) => ({
      count: row.count,
      label: row.key.trim(),
    }));
  }

  getTopStreets(limit: number): LocationRankItem[] {
    return queryTopStats(this.sql, "street", "all", limit).map((row) => ({
      count: row.count,
      label: row.key,
      street: row.key,
    }));
  }

  getTopSuburbs(limit: number): LocationRankItem[] {
    return queryTopSuburbs(this.sql, limit);
  }

  getStreetsInSuburb(suburb: string, limit: number): LocationRankItem[] {
    return queryBrowseStreets(this.sql, {
      limit,
      page: 1,
      sort: "count",
      suburb,
    }).items;
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
    this.broadcastLiveUpdate();
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
    return hasWatermark(this.sql, start, end);
  }

  filterPendingChunks(windows: DateWindow[]): DateWindow[] {
    return windows.filter(
      (window) => !hasWatermark(this.sql, window.start, window.end)
    );
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
      recomputeStatsLive(this.sql);
      this.broadcastLiveUpdate();
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

  private broadcastLiveUpdate(): void {
    const payload = this.dashboardLive.refresh(this.sql);
    broadcastToWebSockets(this.ctx.getWebSockets(), payload);
  }
}
