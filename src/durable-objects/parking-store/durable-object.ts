import { DurableObject } from "cloudflare:workers";

import { LiveCoordinator } from "@/durable-objects/parking-store/live-coordinator.ts";
import type {
  ExportInfringementsResult,
  ExportTotalMode,
  ExportWatermarksResult,
  IngestWatermarkExport,
} from "@/durable-objects/parking-store/replication.ts";
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
import type { CleanInfringement } from "@/server/clean-schema.ts";

/** Durable Object owning parking data, derived statistics, and live subscribers. */
export class ParkingStore extends DurableObject<Env> {
  private readonly live: LiveCoordinator;
  private readonly api: ParkingStoreApi;

  /**
   * Initializes the store and blocks incoming work until its migrations finish.
   * @param ctx - The Durable Object state and storage.
   * @param env - The Worker environment.
   */
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.live = new LiveCoordinator(this.sql, () => this.ctx.getWebSockets());
    this.api = createParkingStoreApi(() => this.sql, this.live);
    void ctx.blockConcurrencyWhile(async () => {
      await this.migrate();
    });
  }

  /**
   * Accepts a WebSocket upgrade for live dashboard updates.
   * @param request - The incoming upgrade request.
   * @returns The upgrade response or a response rejecting a non-upgrade request.
   */
  fetch(request: Request): Response {
    return handleWebSocketUpgrade(
      request,
      (ws) => {
        this.ctx.acceptWebSocket(ws);
      },
      () => this.live.resolveSnapshotPayload()
    );
  }

  /**
   * Reads the serialized dashboard snapshot sent to live subscribers.
   * @returns The serialized snapshot payload.
   */
  exportDashboardSnapshotPayload(): string {
    return this.live.resolveSnapshotPayload();
  }

  /**
   * Handles a message received from an accepted live socket.
   * @param ws - The socket that sent the message.
   * @param message - The received text or binary message.
   */
  override webSocketMessage(
    ws: WebSocket,
    message: string | ArrayBuffer
  ): void {
    if (this.ctx.getWebSockets().includes(ws)) {
      onWebSocketMessage(ws, message);
    }
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

  /**
   * Applies fetched records for a sync window.
   * @param payload - The records and window metadata to apply.
   * @returns The window application result.
   */
  applySyncWindow(payload: SyncWindowPayload): SyncWindowResult {
    return this.api.applySyncWindow(payload);
  }

  /**
   * Records a failed backfill window.
   * @param start - The window start date.
   * @param end - The window end date.
   * @param error - The failure description.
   */
  recordBackfillFailure(start: string, end: string, error: string): void {
    this.api.recordBackfillFailure(start, end, error);
  }

  /**
   * Applies an infringement import batch.
   * @param payload - The batch and its import metadata.
   * @returns The batch import result.
   */
  importInfringementBatch(payload: ImportBatchPayload): ImportBatchResult {
    return this.api.importInfringementBatch(payload);
  }

  /**
   * Reads the public projection of current live statistics.
   * @returns The public live statistics.
   */
  getPublicLiveStats(): PublicLiveStats {
    return this.api.getPublicLiveStats();
  }

  /**
   * Reads the store's current live statistics.
   * @returns The live statistics.
   */
  getLiveStats(): LiveStats {
    return this.api.getLiveStats();
  }

  /**
   * Reads daily statistics for a date range.
   * @param from - The start date.
   * @param to - The end date.
   * @returns Daily statistic rows for the range.
   */
  getDailyStats(from: string, to: string): DailyStatRow[] {
    return this.api.getDailyStats(from, to);
  }

  /**
   * Reads ranked statistics for a grouping and window.
   * @param groupBy - The dimension to rank.
   * @param window - The time window to query.
   * @param limit - Maximum number of rows to return.
   * @returns Ranked statistic rows.
   */
  getTopStats(
    groupBy: TopGroupBy,
    window: TopWindow,
    limit: number
  ): TopStatRow[] {
    return this.api.getTopStats(groupBy, window, limit);
  }

  /**
   * Reads the public ranking for streets or offences.
   * @param groupBy - The dimension to rank.
   * @param limit - Maximum number of rows to return.
   * @returns Public ranking rows.
   */
  getPublicTop(groupBy: "street" | "offence", limit: number): PublicTopItem[] {
    return this.api.getPublicTop(groupBy, limit);
  }

  /**
   * Reads streets ranked by infringement count.
   * @param limit - Maximum number of streets to return.
   * @returns Ranked street records.
   */
  getTopStreets(limit: number): LocationRankItem[] {
    return this.api.getTopStreets(limit);
  }

  /**
   * Reads suburbs ranked by infringement count.
   * @param limit - Maximum number of suburbs to return.
   * @returns Ranked suburb records.
   */
  getTopSuburbs(limit: number): LocationRankItem[] {
    return this.api.getTopSuburbs(limit);
  }

  /**
   * Reads ranked streets within a suburb.
   * @param suburb - The suburb to query.
   * @param limit - Maximum number of streets to return.
   * @returns Ranked street records.
   */
  getStreetsInSuburb(suburb: string, limit: number): LocationRankItem[] {
    return this.api.getStreetsInSuburb(suburb, limit);
  }

  /**
   * Browses suburbs using search, sort, and pagination options.
   * @param query - The browse query.
   * @returns The matching page of suburbs.
   */
  browseSuburbs(query: BrowseQuery): BrowseResult<LocationRankItem> {
    return this.api.browseSuburbs(query);
  }

  /**
   * Browses streets using search, sort, and pagination options.
   * @param query - The browse query.
   * @returns The matching page of streets.
   */
  browseStreets(query: BrowseQuery): BrowseResult<LocationRankItem> {
    return this.api.browseStreets(query);
  }

  /**
   * Browses vehicles using search, sort, and pagination options.
   * @param query - The browse query.
   * @returns The matching page of vehicles.
   */
  browseVehicles(query: BrowseQuery): BrowseResult<VehicleRankItem> {
    return this.api.browseVehicles(query);
  }

  /**
   * Reads vehicles ranked by infringement count.
   * @param limit - Maximum number of vehicles to return.
   * @returns Ranked vehicle records.
   */
  getTopVehicles(limit: number): VehicleRankItem[] {
    return this.api.getTopVehicles(limit);
  }

  /**
   * Reads locations awaiting geocoding.
   * @param limit - Maximum number of locations to return.
   * @returns Candidate locations and their counts.
   */
  getLocationsNeedingGeocode(
    limit: number
  ): { street: string; suburb: string | null; town: string; count: number }[] {
    return this.api.getLocationsNeedingGeocode(limit);
  }

  /**
   * Counts locations awaiting geocoding.
   * @returns The number of pending locations.
   */
  countLocationsNeedingGeocode(): number {
    return this.api.countLocationsNeedingGeocode();
  }

  /**
   * Records a failed geocode attempt for a location.
   * @param street - The street name.
   * @param suburb - The suburb name, if present.
   * @param town - The town name.
   */
  markGeocodeFailed(street: string, suburb: string | null, town: string): void {
    this.api.markGeocodeFailed(street, suburb, town);
  }

  /**
   * Stores a geocoded location in the cache.
   * @param input - The location and geocoding data to store.
   */
  saveLocationCache(input: LocationCacheInput): void {
    this.api.saveLocationCache(input);
  }

  /**
   * Reads map routes and the pending geocode count.
   * @param limit - Maximum number of routes to return.
   * @returns Map routes and the count of locations awaiting geocoding.
   */
  getMapPoints(limit: number): {
    pendingGeocode: number;
    routes: LocationMapPoint[];
  } {
    return this.api.getMapPoints(limit);
  }

  /**
   * Reads a page of infringements matching a query.
   * @param query - The filters and page selection.
   * @returns The matching page and total count.
   */
  listInfringements(query: InfringementQuery): InfringementListResult {
    return this.api.listInfringements(query);
  }

  /**
   * Reads the most recent sync run.
   * @returns The latest run, or null when no run exists.
   */
  getLatestSyncRun(): SyncRunRow | null {
    return this.api.getLatestSyncRun();
  }

  /**
   * Checks whether a date window has an ingest watermark.
   * @param start - The window start date.
   * @param end - The window end date.
   * @returns Whether the window has been ingested.
   */
  isWindowIngested(start: string, end: string): boolean {
    return this.api.isWindowIngested(start, end);
  }

  /**
   * Filters out windows already recorded as ingested.
   * @param windows - The candidate date windows.
   * @returns Windows still pending ingestion.
   */
  filterPendingChunks(windows: DateWindow[]): DateWindow[] {
    return this.api.filterPendingChunks(windows);
  }

  /**
   * Reads the current cache status.
   * @returns The store's cache status.
   */
  getCacheStatus(): CacheStatus {
    return this.api.getCacheStatus();
  }

  /**
   * Reads backfill progress for a date range and chunk size.
   * @param start - The range start date.
   * @param end - The range end date.
   * @param chunkDays - One selects daily windows; other values select multi-day windows.
   * @returns Completed-window information and the store-wide record total.
   */
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

  /**
   * Flushes derived state accumulated during backfill.
   * @returns Whether a flush was performed.
   */
  flushBackfillDerivedState(): { flushed: boolean } {
    return this.api.flushBackfillDerivedState();
  }

  /**
   * Counts daily or multi-day ingest watermarks within a range.
   * @param start - The range start date.
   * @param end - The range end date.
   * @param chunkDays - One selects daily windows; other values select multi-day windows.
   * @returns The count of matching watermarks.
   */
  countIngestWatermarksInRange(
    start: string,
    end: string,
    chunkDays: number
  ): number {
    return this.api.countIngestWatermarksInRange(start, end, chunkDays);
  }

  /**
   * Reads the latest daily or multi-day ingest watermark within a range.
   * @param start - The range start date.
   * @param end - The range end date.
   * @param chunkDays - One selects daily windows; other values select multi-day windows.
   * @returns The latest matching watermark, or null when none exists.
   */
  getLatestIngestWatermarkInRange(
    start: string,
    end: string,
    chunkDays: number
  ): { end: string; ingestedAt: string; start: string } | null {
    return this.api.getLatestIngestWatermarkInRange(start, end, chunkDays);
  }

  /**
   * Exports a page of stored infringements after a cursor.
   * @param after - The last infringement number already exported.
   * @param limit - Maximum number of records to return.
   * @param totalMode - Whether the total uses a cached value or a scan.
   * @returns The export page and pagination metadata.
   */
  exportInfringements(
    after: number,
    limit: number,
    totalMode: ExportTotalMode = "cached"
  ): ExportInfringementsResult {
    return this.api.exportInfringements(after, limit, totalMode);
  }

  /**
   * Imports cleaned infringement records into storage.
   * @param records - The records to import.
   * @returns The number of imported records.
   */
  importStoredInfringements(records: CleanInfringement[]): number {
    return this.api.importStoredInfringements(records);
  }

  /**
   * Exports a page of ingest watermarks.
   * @param offset - The number of watermarks to skip.
   * @param limit - Maximum number of watermarks to return.
   * @returns The export page and pagination metadata.
   */
  exportWatermarks(offset: number, limit: number): ExportWatermarksResult {
    return this.api.exportWatermarks(offset, limit);
  }

  /**
   * Imports ingest watermarks into storage.
   * @param watermarks - The watermarks to import.
   * @returns The number of imported watermarks.
   */
  importWatermarks(watermarks: IngestWatermarkExport[]): number {
    return this.api.importWatermarks(watermarks);
  }

  /** Finalizes a stored import and refreshes its derived state. */
  finalizeStoredImport(): void {
    this.api.finalizeStoredImport();
  }

  /**
   * Counts stored infringements.
   * @returns The number of stored infringements.
   */
  countInfringements(): number {
    return this.api.countInfringements();
  }
}
