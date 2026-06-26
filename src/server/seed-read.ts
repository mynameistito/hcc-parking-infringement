import { fullDashboardMessageSchema } from "@/contracts/public-api.ts";
import { normalizeLocationGeometry } from "@/durable-objects/geometry.ts";
import type {
  ExportInfringementsResult,
  ExportTotalMode,
  ExportWatermarksResult,
} from "@/durable-objects/parking-store/replication.ts";
import type {
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

export { DASHBOARD_SNAPSHOT_FILE } from "@/server/seed-manifest.ts";

let cachedManifestContext: SeedManifestContext | null = null;
let cachedSnapshotPayload: string | null = null;
let cachedSnapshotKey: string | null = null;

const loadManifestContext = async (env: Env): Promise<SeedManifestContext> => {
  if (cachedManifestContext !== null) {
    return cachedManifestContext;
  }

  cachedManifestContext = await readSeedManifest(env);
  return cachedManifestContext;
};

const parseDashboardSnapshotPayload = (
  payload: string
): PublicDashboardSnapshot | null => {
  try {
    const parsed: unknown = JSON.parse(payload);
    const message = fullDashboardMessageSchema.safeParse(parsed);
    if (!message.success) {
      return null;
    }

    const { type: _type, ...rest } = message.data;

    return {
      at: rest.at,
      dailyTrend: rest.dailyTrend ?? [],
      live: rest.live,
      map: {
        pendingGeocode: rest.map.pendingGeocode,
        routes: rest.map.routes.map((route) => ({
          ...route,
          geometry: normalizeLocationGeometry(route.geometry),
        })),
      },
      paceTrends: rest.paceTrends ?? {
        last30d: { current: 0, direction: "flat", percent: 0, previous: 0 },
        last365d: { current: 0, direction: "flat", percent: 0, previous: 0 },
        last7d: { current: 0, direction: "flat", percent: 0, previous: 0 },
      },
      recentInfringements: rest.recentInfringements,
      streets: rest.streets,
      suburbs: rest.suburbs,
      topOffences: rest.topOffences,
      topStreets: rest.topStreets,
      vehicles: rest.vehicles,
    };
  } catch {
    return null;
  }
};

export const readSeedDashboardSnapshotPayload = async (
  env: Env
): Promise<string> => {
  const { manifest, prefix } = await loadManifestContext(env);
  const snapshotKey = manifest.dashboardSnapshotKey ?? DASHBOARD_SNAPSHOT_FILE;
  const objectKey = seedObjectKey(prefix, snapshotKey);

  if (cachedSnapshotKey === objectKey && cachedSnapshotPayload !== null) {
    return cachedSnapshotPayload;
  }

  const raw = await readSeedObjectText(env, objectKey);
  if (raw === null) {
    const { manifest: seedManifest } = await loadManifestContext(env);
    const syncedAt =
      migrateOptionalSyncInstant(seedManifest.exportedAt) ?? nowInAucklandIso();
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

  cachedSnapshotKey = objectKey;
  cachedSnapshotPayload = raw;
  return raw;
};

const readSeedDashboardSnapshot = async (
  env: Env
): Promise<PublicDashboardSnapshot | null> =>
  parseDashboardSnapshotPayload(await readSeedDashboardSnapshotPayload(env));

export const getSeedCacheStatus = async (env: Env): Promise<CacheStatus> => {
  const { manifest } = await loadManifestContext(env);

  return {
    ingestWindows: 0,
    lastHccFetchAt: null,
    lastSyncedAt:
      migrateOptionalSyncInstant(manifest.exportedAt) ?? nowInAucklandIso(),
    source: "parking-store-seed",
    totalRecords: manifest.totalInfringements,
  };
};

export const exportSeedInfringements = async (
  env: Env,
  after: number,
  limit: number,
  _totalMode: ExportTotalMode = "cached"
): Promise<ExportInfringementsResult> => {
  const { manifest, prefix } = await loadManifestContext(env);

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

    const raw = await readSeedObjectText(env, seedObjectKey(prefix, chunkName));
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
};

export const exportSeedWatermarks = async (
  env: Env,
  offset: number,
  limit: number
): Promise<ExportWatermarksResult> => {
  const { manifest, prefix } = await loadManifestContext(env);

  if (manifest.watermarksKey === undefined) {
    return { nextOffset: null, total: 0, watermarks: [] };
  }

  const raw = await readSeedObjectText(
    env,
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
};

export const getSeedPublicLiveStats = async (
  env: Env
): Promise<PublicLiveStats> => {
  const snapshot = await readSeedDashboardSnapshot(env);
  if (snapshot !== null) {
    return snapshot.live;
  }

  const { manifest } = await loadManifestContext(env);
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
};

export const getSeedLiveStats = async (env: Env): Promise<LiveStats> => {
  const live = await getSeedPublicLiveStats(env);

  return {
    allTime: { count: live.allTimeTotal, totalCents: live.allTimeAmountCents },
    thisMonth: { count: live.thisMonth, totalCents: 0 },
    thisYear: { count: live.last365d, totalCents: 0 },
    today: { count: live.today, totalCents: 0 },
    updatedAt: live.lastSyncedAt,
  };
};

export const getSeedDailyStats = async (
  env: Env,
  from: string,
  to: string
): Promise<DailyStatRow[]> => {
  const snapshot = await readSeedDashboardSnapshot(env);
  if (snapshot === null) {
    return [];
  }

  return snapshot.dailyTrend.filter(
    (row) => row.date >= from && row.date <= to
  );
};

const mapTopItemsToStatRows = (items: PublicTopItem[]): TopStatRow[] =>
  items.map((item) => ({
    count: item.count,
    key: item.label,
    totalCents: 0,
  }));

export const getSeedTopStats = async (
  env: Env,
  groupBy: TopGroupBy,
  _window: TopWindow,
  limit: number
): Promise<TopStatRow[]> => {
  const snapshot = await readSeedDashboardSnapshot(env);
  if (snapshot === null) {
    return [];
  }

  const items =
    groupBy === "street" ? snapshot.topStreets : snapshot.topOffences;

  return mapTopItemsToStatRows(items.slice(0, limit));
};

export const getSeedPublicTop = async (
  env: Env,
  groupBy: "street" | "offence",
  limit: number
): Promise<PublicTopItem[]> => {
  const snapshot = await readSeedDashboardSnapshot(env);
  if (snapshot === null) {
    return [];
  }

  const items =
    groupBy === "street" ? snapshot.topStreets : snapshot.topOffences;

  return items.slice(0, limit);
};

export const getSeedTopStreets = async (
  env: Env,
  limit: number
): Promise<LocationRankItem[]> => {
  const snapshot = await readSeedDashboardSnapshot(env);
  return snapshot?.streets.slice(0, limit) ?? [];
};

export const getSeedTopSuburbs = async (
  env: Env,
  limit: number
): Promise<LocationRankItem[]> => {
  const snapshot = await readSeedDashboardSnapshot(env);
  return snapshot?.suburbs.slice(0, limit) ?? [];
};

export const getSeedTopVehicles = async (
  env: Env,
  limit: number
): Promise<VehicleRankItem[]> => {
  const snapshot = await readSeedDashboardSnapshot(env);
  return snapshot?.vehicles.slice(0, limit) ?? [];
};

export const getSeedMapPoints = async (
  env: Env,
  limit: number
): Promise<{ pendingGeocode: number; routes: LocationMapPoint[] }> => {
  const snapshot = await readSeedDashboardSnapshot(env);
  if (snapshot === null) {
    return { pendingGeocode: 0, routes: [] };
  }

  return {
    pendingGeocode: snapshot.map.pendingGeocode,
    routes: snapshot.map.routes.slice(0, limit),
  };
};

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

export const listSeedInfringements = async (
  env: Env,
  query: InfringementQuery
): Promise<InfringementListResult> => {
  const { manifest } = await loadManifestContext(env);

  if (!hasInfringementFilters(query) && query.page === 1) {
    const snapshot = await readSeedDashboardSnapshot(env);
    if (snapshot !== null && snapshot.recentInfringements.length > 0) {
      const rows = snapshot.recentInfringements
        .slice(0, query.limit)
        .map((record) => ({
          amountCents: record.amountCents,
          firstSeenAt: manifest.exportedAt,
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
          updatedAt: manifest.exportedAt,
          vehicleColour: record.vehicleColour,
          vehicleMake: record.vehicleMake,
          vehicleModel: record.vehicleModel,
          vehicleType: record.vehicleType,
        }));

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
    const page = await exportSeedInfringements(env, after, 2000);

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
};

export const resetSeedReadCacheForTests = (): void => {
  cachedManifestContext = null;
  cachedSnapshotPayload = null;
  cachedSnapshotKey = null;
};
