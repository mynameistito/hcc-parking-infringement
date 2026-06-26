import { parsePublicDashboardSnapshotJson } from "@/contracts/dashboard-snapshot.ts";
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
  InfringementRow,
  LiveStats,
  LocationMapPoint,
  LocationRankItem,
  PublicDashboardSnapshot,
  PublicLiveStats,
  PublicTopItem,
  SyncRunRow,
  TopGroupBy,
  TopStatRow,
  TopWindow,
  VehicleRankItem,
} from "@/durable-objects/types.ts";
import { nowInAucklandIso } from "@/lib/auckland-time.ts";
import { migrateOptionalSyncInstant } from "@/lib/migrate-instant-to-auckland.ts";
import type { CleanInfringement } from "@/server/clean-schema.ts";
import { readSeedManifest } from "@/server/seed-import.ts";
import type { SeedManifestContext } from "@/server/seed-import.ts";
import {
  DASHBOARD_SNAPSHOT_FILE,
  parseSeedInfringementLine,
  parseSeedWatermarkLine,
  seedObjectKey,
} from "@/server/seed-manifest.ts";
import { readSeedObjectText } from "@/server/seed-r2-client.ts";

import type { SeedReadCache } from "./seed-cache.ts";
import { emptyBrowseResult } from "./types.ts";
import type { ParkingStoreReader } from "./types.ts";

export { DASHBOARD_SNAPSHOT_FILE } from "@/server/seed-manifest.ts";

const toInfringementRow = (
  record: CleanInfringement,
  exportedAt: string
): InfringementRow => ({
  amountCents: record.amountCents,
  firstSeenAt: exportedAt,
  infringementNumber: record.infringementNumber,
  isTowed: record.isTowed,
  occurredAt: record.occurredAt,
  offenceCategory: record.offenceCategory,
  offenceCode: record.offenceCode,
  offenceDescription: record.offenceDescription,
  postCode: record.postCode,
  street: record.street,
  suburb: record.suburb,
  town: record.town,
  updatedAt: exportedAt,
  vehicleColour: record.vehicleColour,
  vehicleMake: record.vehicleMake,
  vehicleModel: record.vehicleModel,
  vehicleType: record.vehicleType,
});

const toInfringementRowFromPublic = (
  record: {
    amountCents: number;
    infringementNumber: number;
    isTowed: boolean;
    occurredAt: string;
    offenceDescription: string;
    street: string;
    suburb: string | null;
    town: string | null;
    vehicleColour: string | null;
    vehicleMake: string | null;
    vehicleModel: string | null;
    vehicleType: string | null;
  },
  exportedAt: string
): InfringementRow => ({
  amountCents: record.amountCents,
  firstSeenAt: exportedAt,
  infringementNumber: record.infringementNumber,
  isTowed: record.isTowed,
  occurredAt: record.occurredAt,
  offenceCategory: null,
  offenceCode: "",
  offenceDescription: record.offenceDescription,
  postCode: null,
  street: record.street,
  suburb: record.suburb,
  town: record.town,
  updatedAt: exportedAt,
  vehicleColour: record.vehicleColour,
  vehicleMake: record.vehicleMake,
  vehicleModel: record.vehicleModel,
  vehicleType: record.vehicleType,
});

const hasInfringementFilters = (query: InfringementQuery): boolean =>
  query.from !== undefined ||
  query.to !== undefined ||
  query.street !== undefined ||
  query.suburb !== undefined ||
  query.vehicleMake !== undefined ||
  query.vehicleModel !== undefined;

const matchesInfringementFilters = (
  record: CleanInfringement,
  query: InfringementQuery
): boolean => {
  if (query.street !== undefined && record.street !== query.street) {
    return false;
  }

  if (query.suburb !== undefined && record.suburb !== query.suburb) {
    return false;
  }

  if (
    query.vehicleMake !== undefined &&
    record.vehicleMake !== query.vehicleMake
  ) {
    return false;
  }

  if (
    query.vehicleModel !== undefined &&
    record.vehicleModel !== query.vehicleModel
  ) {
    return false;
  }

  const occurredDate = record.occurredAt.slice(0, 10);
  if (query.from !== undefined && occurredDate < query.from) {
    return false;
  }

  if (query.to !== undefined && occurredDate > query.to) {
    return false;
  }

  return true;
};

export class SeedParkingStoreReader implements ParkingStoreReader {
  readonly source = "seed" as const;
  readonly isSeedMode = true;
  readonly supportsBrowse = false;

  private readonly env: Env;
  private readonly cache: SeedReadCache;

  constructor(env: Env, cache: SeedReadCache) {
    this.env = env;
    this.cache = cache;
  }

  private async loadManifestContext(): Promise<SeedManifestContext> {
    if (this.cache.manifestContext !== null) {
      return this.cache.manifestContext;
    }

    this.cache.manifestContext = await readSeedManifest(this.env);
    return this.cache.manifestContext;
  }

  private async readDashboardSnapshot(): Promise<PublicDashboardSnapshot | null> {
    return parsePublicDashboardSnapshotJson(
      await this.readDashboardSnapshotPayload()
    );
  }

  async readDashboardSnapshotPayload(): Promise<string> {
    const { manifest, prefix } = await this.loadManifestContext();
    const snapshotKey =
      manifest.dashboardSnapshotKey ?? DASHBOARD_SNAPSHOT_FILE;
    const objectKey = seedObjectKey(prefix, snapshotKey);

    if (
      this.cache.snapshotKey === objectKey &&
      this.cache.snapshotPayload !== null
    ) {
      return this.cache.snapshotPayload;
    }

    const raw = await readSeedObjectText(this.env, objectKey);
    if (raw === null) {
      const { manifest: seedManifest } = await this.loadManifestContext();
      const syncedAt =
        migrateOptionalSyncInstant(seedManifest.exportedAt) ??
        nowInAucklandIso();
      return JSON.stringify({
        at: syncedAt,
        dailyTrend: [],
        live: {
          allTimeAmountCents: 0,
          allTimeTotal: seedManifest.totalInfringements,
          last24h: 0,
          last30d: 0,
          last365d: 0,
          last7d: 0,
          lastRecordAt: null,
          lastSyncedAt: syncedAt,
          thisMonth: 0,
          today: 0,
          towedToday: 0,
        },
        map: { pendingGeocode: 0, routes: [] },
        paceTrends: {
          last30d: { current: 0, direction: "flat", percent: 0, previous: 0 },
          last365d: { current: 0, direction: "flat", percent: 0, previous: 0 },
          last7d: { current: 0, direction: "flat", percent: 0, previous: 0 },
        },
        recentInfringements: [],
        streets: [],
        suburbs: [],
        topOffences: [],
        topStreets: [],
        type: "full",
        vehicles: [],
      });
    }

    this.cache.snapshotKey = objectKey;
    this.cache.snapshotPayload = raw;
    return raw;
  }

  async getCacheStatus(): Promise<CacheStatus> {
    const { manifest } = await this.loadManifestContext();

    return {
      ingestWindows: 0,
      lastHccFetchAt: null,
      lastSyncedAt:
        migrateOptionalSyncInstant(manifest.exportedAt) ?? nowInAucklandIso(),
      source: "parking-store-seed",
      totalRecords: manifest.totalInfringements,
    };
  }

  async exportInfringements(
    after: number,
    limit: number,
    _totalMode: ExportTotalMode = "cached"
  ): Promise<ExportInfringementsResult> {
    const { manifest, prefix } = await this.loadManifestContext();

    const collectFromChunks = async (
      chunkIndex: number,
      records: CleanInfringement[]
    ): Promise<CleanInfringement[]> => {
      if (
        records.length >= limit ||
        chunkIndex >= manifest.infringementChunks.length
      ) {
        return records;
      }

      const chunkName = manifest.infringementChunks[chunkIndex];
      if (chunkName === undefined) {
        return records;
      }

      const raw = await readSeedObjectText(
        this.env,
        seedObjectKey(prefix, chunkName)
      );
      if (raw !== null) {
        for (const line of raw.split(/\r?\n/u)) {
          if (line.trim().length === 0) {
            continue;
          }

          const record = parseSeedInfringementLine(line);
          if (record.infringementNumber <= after) {
            continue;
          }

          records.push(record);
          if (records.length >= limit) {
            return records;
          }
        }
      }

      return await collectFromChunks(chunkIndex + 1, records);
    };

    const records = await collectFromChunks(0, []);
    const last = records.at(-1);

    return {
      nextCursor:
        records.length < limit || last === undefined
          ? null
          : last.infringementNumber,
      records,
      total: manifest.totalInfringements,
    };
  }

  async exportWatermarks(
    offset: number,
    limit: number
  ): Promise<ExportWatermarksResult> {
    const { manifest, prefix } = await this.loadManifestContext();

    if (manifest.watermarksKey === undefined) {
      return { nextOffset: null, total: 0, watermarks: [] };
    }

    const raw = await readSeedObjectText(
      this.env,
      seedObjectKey(prefix, manifest.watermarksKey)
    );

    if (raw === null) {
      return { nextOffset: null, total: 0, watermarks: [] };
    }

    const watermarks = raw
      .split(/\r?\n/u)
      .filter((line) => line.trim().length > 0)
      .map((line) => parseSeedWatermarkLine(line));

    const page = watermarks.slice(offset, offset + limit);
    const nextOffset =
      offset + page.length < watermarks.length ? offset + page.length : null;

    return {
      nextOffset,
      total: watermarks.length,
      watermarks: page,
    };
  }

  async getPublicLiveStats(): Promise<PublicLiveStats> {
    const snapshot = await this.readDashboardSnapshot();
    if (snapshot !== null) {
      return snapshot.live;
    }

    const { manifest } = await this.loadManifestContext();
    const syncedAt =
      migrateOptionalSyncInstant(manifest.exportedAt) ?? nowInAucklandIso();
    return {
      allTimeAmountCents: 0,
      allTimeTotal: manifest.totalInfringements,
      last24h: 0,
      last30d: 0,
      last365d: 0,
      last7d: 0,
      lastRecordAt: null,
      lastSyncedAt: syncedAt,
      thisMonth: 0,
      today: 0,
      towedToday: 0,
    };
  }

  async getLiveStats(): Promise<LiveStats> {
    const live = await this.getPublicLiveStats();

    return {
      allTime: {
        count: live.allTimeTotal,
        totalCents: live.allTimeAmountCents,
      },
      thisMonth: { count: live.thisMonth, totalCents: 0 },
      thisYear: { count: live.last365d, totalCents: 0 },
      today: { count: live.today, totalCents: 0 },
      updatedAt: live.lastSyncedAt,
    };
  }

  async getDailyStats(from: string, to: string): Promise<DailyStatRow[]> {
    const snapshot = await this.readDashboardSnapshot();
    if (snapshot === null) {
      return [];
    }

    return snapshot.dailyTrend.filter(
      (row) => row.date >= from && row.date <= to
    );
  }

  async getTopStats(
    groupBy: TopGroupBy,
    _window: TopWindow,
    limit: number
  ): Promise<TopStatRow[]> {
    const items = await this.getPublicTop(groupBy, limit);
    return items.map((item) => ({
      count: item.count,
      key: item.label,
      totalCents: 0,
    }));
  }

  async getPublicTop(
    groupBy: "street" | "offence",
    limit: number
  ): Promise<PublicTopItem[]> {
    const snapshot = await this.readDashboardSnapshot();
    if (snapshot === null) {
      return [];
    }

    const items =
      groupBy === "street" ? snapshot.topStreets : snapshot.topOffences;

    return items.slice(0, limit);
  }

  async getTopStreets(limit: number): Promise<LocationRankItem[]> {
    const snapshot = await this.readDashboardSnapshot();
    return snapshot?.streets.slice(0, limit) ?? [];
  }

  async getTopSuburbs(limit: number): Promise<LocationRankItem[]> {
    const snapshot = await this.readDashboardSnapshot();
    return snapshot?.suburbs.slice(0, limit) ?? [];
  }

  async getTopVehicles(limit: number): Promise<VehicleRankItem[]> {
    const snapshot = await this.readDashboardSnapshot();
    return snapshot?.vehicles.slice(0, limit) ?? [];
  }

  async getMapPoints(limit: number): Promise<{
    pendingGeocode: number;
    routes: LocationMapPoint[];
  }> {
    const snapshot = await this.readDashboardSnapshot();
    if (snapshot === null) {
      return { pendingGeocode: 0, routes: [] };
    }

    return {
      pendingGeocode: snapshot.map.pendingGeocode,
      routes: snapshot.map.routes.slice(0, limit),
    };
  }

  async browseSuburbs(
    query: BrowseQuery
  ): Promise<BrowseResult<LocationRankItem>> {
    void this.isSeedMode;
    return await Promise.resolve(emptyBrowseResult(query));
  }

  async browseStreets(
    query: BrowseQuery
  ): Promise<BrowseResult<LocationRankItem>> {
    void this.isSeedMode;
    return await Promise.resolve(emptyBrowseResult(query));
  }

  async browseVehicles(
    query: BrowseQuery
  ): Promise<BrowseResult<VehicleRankItem>> {
    void this.isSeedMode;
    return await Promise.resolve(emptyBrowseResult(query));
  }

  async getStreetsInSuburb(): Promise<LocationRankItem[]> {
    void this.isSeedMode;
    return await Promise.resolve([]);
  }

  async getLatestSyncRun(): Promise<SyncRunRow | null> {
    void this.isSeedMode;
    return await Promise.resolve(null);
  }

  async getBackfillProgressSnapshot(
    start: string,
    end: string,
    chunkDays: number
  ): Promise<BackfillProgress> {
    const cache = await this.getCacheStatus();
    return {
      chunkDays,
      completed: 0,
      end,
      latestIngestedAt: cache.lastSyncedAt,
      latestWindow: null,
      percent: 0,
      start,
      total: 0,
      totalRecords: cache.totalRecords,
    };
  }

  async listInfringements(
    query: InfringementQuery
  ): Promise<InfringementListResult> {
    const { manifest } = await this.loadManifestContext();

    if (!hasInfringementFilters(query) && query.page === 1) {
      const snapshot = await this.readDashboardSnapshot();
      if (snapshot !== null && snapshot.recentInfringements.length > 0) {
        const rows = snapshot.recentInfringements
          .slice(0, query.limit)
          .map((record) =>
            toInfringementRowFromPublic(record, manifest.exportedAt)
          );

        return {
          data: rows,
          limit: query.limit,
          page: query.page,
          total: manifest.totalInfringements,
        };
      }
    }

    const startIndex = (query.page - 1) * query.limit;
    const matched: InfringementRow[] = [];
    let skipped = 0;

    const scanFromCursor = async (
      after: number
    ): Promise<InfringementListResult> => {
      const page = await this.exportInfringements(after, 2000);

      for (const record of page.records) {
        if (!matchesInfringementFilters(record, query)) {
          continue;
        }

        if (skipped < startIndex) {
          skipped += 1;
          continue;
        }

        matched.push(toInfringementRow(record, manifest.exportedAt));
        if (matched.length >= query.limit) {
          return {
            data: matched,
            limit: query.limit,
            page: query.page,
            total: manifest.totalInfringements,
          };
        }
      }

      if (page.nextCursor === null) {
        return {
          data: matched,
          limit: query.limit,
          page: query.page,
          total: manifest.totalInfringements,
        };
      }

      return await scanFromCursor(page.nextCursor);
    };

    return await scanFromCursor(0);
  }
}
