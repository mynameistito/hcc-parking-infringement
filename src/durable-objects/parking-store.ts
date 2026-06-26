import { DurableObject } from "cloudflare:workers";

import {
  browseStreets as queryBrowseStreets,
  browseSuburbs as queryBrowseSuburbs,
  browseVehicles as queryBrowseVehicles,
} from "@/durable-objects/parking-store/browse-queries.ts";
import { isoNow } from "@/durable-objects/parking-store/constants.ts";
import {
  assembleFullDashboardSnapshot,
  buildColdDashboardSnapshotPayload,
  buildFullDashboardSnapshotPayload,
  getDashboardSnapshotPayloadWeight,
  readStoredDashboardSnapshotPayload,
  snapshotIsComplete,
  writeDashboardSnapshotCache,
} from "@/durable-objects/parking-store/dashboard-snapshot.ts";
import {
  countInfringements as countStoredInfringements,
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
import { readPaceTrends } from "@/durable-objects/parking-store/pace-trends.ts";
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
  clearSyncMeta,
  finishSyncRun,
  getLatestSyncRun as readLatestSyncRun,
  getSyncMeta,
  hasWatermark,
  recordWatermark,
  setSyncMeta,
  startSyncRun,
  upsertInfringements,
} from "@/durable-objects/parking-store/sync.ts";
import {
  countIngestWatermarksInRange as countWatermarksInRange,
  getLatestIngestWatermarkInRange as readLatestWatermarkInRange,
  readTotalRecordsForProgress,
} from "@/durable-objects/parking-store/watermarks.ts";
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
  private dashboardSnapshotPayload: string | null = null;

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
      this.pushToSocket(server);
    });

    return new Response(null, { status: 101, webSocket: client });
  }

  webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): void {
    void this.ctx;
    const text =
      typeof message === "string" ? message : new TextDecoder().decode(message);
    if (text === "ping") {
      ws.send(JSON.stringify({ at: isoNow(), type: "pong" }));
    }
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
        this.recomputeStats();
      },
      refreshDashboardSnapshotCache: () => {
        this.refreshDashboardSnapshotCache();
      },
    });
  }

  applySyncWindow(payload: SyncWindowPayload): SyncWindowResult {
    const runId = startSyncRun(
      this.sql,
      payload.runType,
      payload.start,
      payload.end
    );

    try {
      const recordsUpserted = upsertInfringements(this.sql, payload.records);

      if (payload.runType === "backfill") {
        this.markBackfillStatsDirty();
      } else {
        this.recomputeStats();
        this.broadcastLiveUpdate();
      }

      finishSyncRun(this.sql, runId, "success", {
        fetched: payload.recordsFetched,
        upserted: recordsUpserted,
      });

      recordWatermark(
        this.sql,
        payload.start,
        payload.end,
        payload.recordsFetched
      );
      setSyncMeta(this.sql, "last_hcc_fetch_at", isoNow());

      return {
        recordsFetched: payload.recordsFetched,
        recordsUpserted,
        runId,
        skipped: payload.skipped,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      finishSyncRun(this.sql, runId, "error", {
        error: message,
        fetched: 0,
        upserted: 0,
      });
      throw error;
    }
  }

  recordBackfillFailure(start: string, end: string, error: string): void {
    const runId = startSyncRun(this.sql, "backfill", start, end);
    finishSyncRun(this.sql, runId, "error", {
      error,
      fetched: 0,
      upserted: 0,
    });
  }

  importInfringementBatch(payload: ImportBatchPayload): ImportBatchResult {
    const recordsUpserted = upsertInfringements(this.sql, payload.records);

    if (payload.final) {
      this.recomputeStats();
      setSyncMeta(this.sql, "last_csv_import_at", isoNow());
      this.broadcastLiveUpdate();
    }

    return {
      recomputed: payload.final,
      recordsReceived: payload.recordsReceived,
      recordsUpserted,
      skipped: payload.skipped,
      totalRecords: countStoredInfringements(this.sql),
    };
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
    const completed = countWatermarksInRange(this.sql, start, end, chunkDays);
    const latest = readLatestWatermarkInRange(this.sql, start, end, chunkDays);

    return {
      completed,
      latestIngestedAt: latest?.ingestedAt ?? null,
      latestWindow: latest ? { end: latest.end, start: latest.start } : null,
      totalRecords: readTotalRecordsForProgress(this.sql),
    };
  }

  flushBackfillDerivedState(): { flushed: boolean } {
    if (!this.isBackfillStatsDirty()) {
      return { flushed: false };
    }

    this.recomputeStats();
    this.broadcastLiveUpdate();
    this.clearBackfillStatsDirty();
    return { flushed: true };
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

  private refreshDashboardSnapshotCache(): void {
    this.dashboardSnapshotPayload = buildFullDashboardSnapshotPayload(
      assembleFullDashboardSnapshot(this.sql)
    );
    writeDashboardSnapshotCache(this.sql, this.dashboardSnapshotPayload);
  }

  private getDashboardSnapshotPayload(): string {
    const payload =
      this.dashboardSnapshotPayload ??
      readStoredDashboardSnapshotPayload(this.sql);

    if (
      payload !== null &&
      getDashboardSnapshotPayloadWeight(payload) > 0 &&
      snapshotIsComplete(payload)
    ) {
      this.dashboardSnapshotPayload = payload;
      return payload;
    }

    this.refreshDashboardSnapshotCache();
    return (
      this.dashboardSnapshotPayload ??
      buildColdDashboardSnapshotPayload(
        readPublicLiveStats(this.sql),
        readPaceTrends(this.sql),
        isoNow()
      )
    );
  }

  private broadcastLiveUpdate(): void {
    this.refreshDashboardSnapshotCache();
    const sockets = this.ctx.getWebSockets();
    if (sockets.length === 0) {
      return;
    }

    const payload = this.dashboardSnapshotPayload;
    if (payload === null) {
      return;
    }

    for (const ws of sockets) {
      try {
        ws.send(payload);
      } catch {
        // socket already closed
      }
    }
  }

  private pushToSocket(ws: WebSocket): void {
    try {
      ws.send(this.getDashboardSnapshotPayload());
    } catch {
      // socket already closed
    }
  }

  private recomputeStats(): void {
    recomputeStatsLive(this.sql);
  }

  private markBackfillStatsDirty(): void {
    setSyncMeta(this.sql, "backfill_stats_dirty", "1");
  }

  private isBackfillStatsDirty(): boolean {
    return getSyncMeta(this.sql, "backfill_stats_dirty") === "1";
  }

  private clearBackfillStatsDirty(): void {
    clearSyncMeta(this.sql, "backfill_stats_dirty");
  }
}
