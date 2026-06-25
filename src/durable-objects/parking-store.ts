import { DurableObject } from "cloudflare:workers";
import { subDays } from "date-fns";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";

import type { CleanInfringement } from "../server/clean.ts";

const AUCKLAND_TZ = "Pacific/Auckland";
const STATS_LIVE_ID = 1;
const DASHBOARD_SNAPSHOT_CACHE_ID = 1;

export type SyncRunType = "hourly" | "manual" | "backfill";

export interface SyncWindowPayload {
  runType: SyncRunType;
  start: string;
  end: string;
  records: CleanInfringement[];
  recordsFetched: number;
  skipped: number;
}

export interface SyncWindowResult {
  runId: number;
  recordsFetched: number;
  recordsUpserted: number;
  skipped: number;
}

export interface ImportBatchPayload {
  records: CleanInfringement[];
  recordsReceived: number;
  skipped: number;
  final: boolean;
}

export interface ImportBatchResult {
  recordsReceived: number;
  recordsUpserted: number;
  skipped: number;
  recomputed: boolean;
  totalRecords: number;
}

export interface PublicTopItem {
  label: string;
  count: number;
}

export interface LocationRankItem {
  street?: string;
  suburb?: string;
  label: string;
  count: number;
}

export interface VehicleRankItem {
  make: string;
  model: string;
  label: string;
  count: number;
}

export type BrowseSort = "count" | "name";

export interface BrowseQuery {
  q?: string;
  page: number;
  limit: number;
  sort: BrowseSort;
  suburb?: string;
}

export interface BrowseResult<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}

export interface LocationMapPoint {
  id: string;
  street: string;
  suburb: string | null;
  town: string;
  count: number;
  geometry: [number, number][][];
}

export interface LocationCacheInput {
  street: string;
  suburb: string | null;
  town: string;
  lat: number;
  lon: number;
  displayName: string;
  geometry: [number, number][][];
}

export interface PublicDashboardSnapshot {
  at: string;
  live: PublicLiveStats;
  dailyTrend: DailyStatRow[];
  recentInfringements: InfringementRow[];
  topStreets: PublicTopItem[];
  topOffences: PublicTopItem[];
  streets: LocationRankItem[];
  suburbs: LocationRankItem[];
  vehicles: VehicleRankItem[];
  map: {
    routes: LocationMapPoint[];
    pendingGeocode: number;
  };
}

export interface PublicLiveStats {
  allTimeTotal: number;
  allTimeAmountCents: number;
  today: number;
  last24h: number;
  last7d: number;
  last30d: number;
  thisMonth: number;
  towedToday: number;
  lastSyncedAt: string | null;
  lastRecordAt: string | null;
}

export interface LiveStats {
  today: { count: number; totalCents: number };
  thisMonth: { count: number; totalCents: number };
  thisYear: { count: number; totalCents: number };
  allTime: { count: number; totalCents: number };
  updatedAt: string | null;
}

export interface DailyStatRow {
  date: string;
  count: number;
  totalCents: number;
}

export type TopGroupBy = "street" | "offence";
export type TopWindow = "all" | "7d" | "30d";

export interface TopStatRow {
  key: string;
  count: number;
  totalCents: number;
}

export interface InfringementRow {
  infringementNumber: number;
  occurredAt: string;
  amountCents: number;
  street: string;
  suburb: string | null;
  town: string | null;
  postCode: string | null;
  offenceCode: string | null;
  offenceDescription: string;
  offenceCategory: string | null;
  vehicleMake: string | null;
  vehicleModel: string | null;
  vehicleColour: string | null;
  vehicleType: string | null;
  isTowed: boolean;
  firstSeenAt: string;
  updatedAt: string;
}

export interface InfringementQuery {
  page: number;
  limit: number;
  from?: string;
  to?: string;
  street?: string;
  suburb?: string;
  vehicleMake?: string;
  vehicleModel?: string;
}

export interface InfringementListResult {
  data: InfringementRow[];
  page: number;
  limit: number;
  total: number;
}

export interface SyncRunRow {
  id: number;
  runType: string;
  windowStart: string;
  windowEnd: string;
  fetched: number;
  inserted: number;
  updated: number;
  status: string;
  error: string | null;
  startedAt: string;
  finishedAt: string | null;
}

export interface DateWindow {
  start: string;
  end: string;
}

export interface CacheStatus {
  source: "parking-store";
  totalRecords: number;
  lastHccFetchAt: string | null;
  lastSyncedAt: string | null;
  ingestWindows: number;
}

const isoNow = (): string => new Date().toISOString();

const isCoordinateRing = (value: unknown): value is [number, number][][] =>
  Array.isArray(value) &&
  value.every(
    (line) =>
      Array.isArray(line) &&
      line.length >= 3 &&
      line.every(
        (point) =>
          Array.isArray(point) &&
          point.length === 2 &&
          typeof point[0] === "number" &&
          typeof point[1] === "number"
      )
  );

const parseGeometryJson = (
  raw: string | null | undefined
): [number, number][][] => {
  if (raw === null || raw === undefined || raw === "") {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isCoordinateRing(parsed)) {
      return [];
    }
    return parsed;
  } catch {
    return [];
  }
};

const filterRoadGeometry = (
  geometry: [number, number][][]
): [number, number][][] => geometry.filter((line) => line.length >= 3);

const HAMILTON_CENTER_LAT = -37.787;
const HAMILTON_CENTER_LON = 175.279;
const GEOCODE_FAILURE_RETRY_MS = 7 * 24 * 60 * 60 * 1000;
const GEOCODE_CANDIDATE_POOL = 500;

const isRecentGeocodeFailure = (
  failedAt: string | null | undefined
): boolean => {
  if (failedAt === null || failedAt === undefined || failedAt === "") {
    return false;
  }

  const failed = Date.parse(failedAt);
  if (Number.isNaN(failed)) {
    return false;
  }

  return Date.now() - failed < GEOCODE_FAILURE_RETRY_MS;
};

const locationNeedsGeocode = (
  geometryJson: string | null | undefined,
  geocodeFailedAt: string | null | undefined
): boolean => {
  if (isRecentGeocodeFailure(geocodeFailedAt)) {
    return false;
  }

  const geometry = filterRoadGeometry(parseGeometryJson(geometryJson));
  return geometry.length === 0;
};

interface GeocodeCandidateRow extends Record<string, SqlStorageValue> {
  street: string;
  suburb: string | null;
  town: string;
  count: number;
  geometry_json: string | null;
  geocode_failed_at: string | null;
}

const filterGeocodeCandidates = (
  rows: GeocodeCandidateRow[],
  limit: number
): { street: string; suburb: string | null; town: string; count: number }[] => {
  const results: {
    street: string;
    suburb: string | null;
    town: string;
    count: number;
  }[] = [];

  for (const row of rows) {
    if (!locationNeedsGeocode(row.geometry_json, row.geocode_failed_at)) {
      continue;
    }

    results.push({
      count: row.count,
      street: row.street,
      suburb: row.suburb,
      town: row.town,
    });

    if (results.length >= limit) {
      break;
    }
  }

  return results;
};

export const normalizeLocationGeometry = (
  geometry: number[][][]
): [number, number][][] => {
  if (!isCoordinateRing(geometry)) {
    return [];
  }
  return filterRoadGeometry(geometry);
};

const toMapRouteRow = (row: {
  street: string;
  suburb: string | null;
  town: string;
  count: number;
  geometry_json: string | null;
}): LocationMapPoint | null => {
  const geometry = filterRoadGeometry(parseGeometryJson(row.geometry_json));
  if (geometry.length === 0) {
    return null;
  }

  const suburbKey = row.suburb ?? "";
  return {
    count: row.count,
    geometry,
    id: `${row.street}|${suburbKey}`,
    street: row.street,
    suburb: row.suburb,
    town: row.town,
  };
};

const formatDateInAuckland = (date: Date): string =>
  formatInTimeZone(date, AUCKLAND_TZ, "yyyy-MM-dd");

const dateBounds = (dateStr: string): { start: string; end: string } => ({
  end: `${dateStr}T23:59:59.999+12:00`,
  start: `${dateStr}T00:00:00+12:00`,
});

const todayBounds = (now: Date): { start: string; end: string } => {
  const today = formatInTimeZone(now, AUCKLAND_TZ, "yyyy-MM-dd");
  return {
    end: `${today}T23:59:59.999+12:00`,
    start: `${today}T00:00:00+12:00`,
  };
};

const monthBoundsInAuckland = (now: Date): { start: string; end: string } => {
  const zoned = toZonedTime(now, AUCKLAND_TZ);
  const year = zoned.getFullYear();
  const month = zoned.getMonth() + 1;
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return {
    end: `${end}T23:59:59.999+12:00`,
    start: `${start}T00:00:00+12:00`,
  };
};

const yearBoundsInAuckland = (now: Date): { start: string; end: string } => {
  const year = toZonedTime(now, AUCKLAND_TZ).getFullYear();
  return {
    end: `${year}-12-31T23:59:59.999+12:00`,
    start: `${year}-01-01T00:00:00+12:00`,
  };
};

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
    // Runtime completes the close handshake via web_socket_auto_reply_to_close.
  }

  private async migrate(): Promise<void> {
    await Promise.resolve();

    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS _sql_schema_migrations (
        id INTEGER PRIMARY KEY,
        applied_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    const currentVersion = this.ctx.storage.sql
      .exec<{ version: number }>(
        "SELECT COALESCE(MAX(id), 0) as version FROM _sql_schema_migrations"
      )
      .one().version;

    if (currentVersion < 1) {
      this.ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS infringements (
          infringement_number INTEGER PRIMARY KEY,
          occurred_at TEXT NOT NULL,
          amount_cents INTEGER NOT NULL,
          street TEXT NOT NULL,
          suburb TEXT,
          town TEXT,
          post_code TEXT,
          offence_code TEXT,
          offence_description TEXT NOT NULL,
          offence_category TEXT,
          vehicle_make TEXT,
          vehicle_model TEXT,
          is_towed INTEGER NOT NULL DEFAULT 0,
          first_seen_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_infringements_occurred_at ON infringements (occurred_at);
        CREATE INDEX IF NOT EXISTS idx_infringements_street ON infringements (street);
        CREATE INDEX IF NOT EXISTS idx_infringements_offence_description ON infringements (offence_description);

        CREATE TABLE IF NOT EXISTS sync_runs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          run_type TEXT NOT NULL,
          window_start TEXT NOT NULL,
          window_end TEXT NOT NULL,
          fetched INTEGER NOT NULL DEFAULT 0,
          inserted INTEGER NOT NULL DEFAULT 0,
          updated INTEGER NOT NULL DEFAULT 0,
          status TEXT NOT NULL,
          error TEXT,
          started_at TEXT NOT NULL,
          finished_at TEXT
        );

        CREATE TABLE IF NOT EXISTS stats_live (
          id INTEGER PRIMARY KEY,
          all_time_total INTEGER NOT NULL DEFAULT 0,
          all_time_amount_cents INTEGER NOT NULL DEFAULT 0,
          today INTEGER NOT NULL DEFAULT 0,
          last_24h INTEGER NOT NULL DEFAULT 0,
          last_7d INTEGER NOT NULL DEFAULT 0,
          last_30d INTEGER NOT NULL DEFAULT 0,
          this_month INTEGER NOT NULL DEFAULT 0,
          this_year INTEGER NOT NULL DEFAULT 0,
          towed_all_time INTEGER NOT NULL DEFAULT 0,
          towed_today INTEGER NOT NULL DEFAULT 0,
          last_synced_at TEXT,
          last_record_at TEXT
        );

        INSERT OR IGNORE INTO stats_live (id) VALUES (1);

        CREATE TABLE IF NOT EXISTS daily_counts (
          date TEXT PRIMARY KEY,
          count INTEGER NOT NULL DEFAULT 0,
          amount_cents INTEGER NOT NULL DEFAULT 0,
          towed_count INTEGER NOT NULL DEFAULT 0
        );

        INSERT INTO _sql_schema_migrations (id) VALUES (1);
      `);
    }

    if (currentVersion < 2) {
      this.ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS ingest_watermarks (
          window_start TEXT NOT NULL,
          window_end TEXT NOT NULL,
          record_count INTEGER NOT NULL DEFAULT 0,
          ingested_at TEXT NOT NULL,
          PRIMARY KEY (window_start, window_end)
        );

        CREATE TABLE IF NOT EXISTS sync_meta (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );

        INSERT INTO _sql_schema_migrations (id) VALUES (2);
      `);
    }

    if (currentVersion < 3) {
      this.ctx.storage.sql.exec(`
        ALTER TABLE infringements ADD COLUMN closed_at TEXT;
        ALTER TABLE infringements ADD COLUMN additional_costs_cents INTEGER NOT NULL DEFAULT 0;
        ALTER TABLE infringements ADD COLUMN court_serve_method TEXT;
        ALTER TABLE infringements ADD COLUMN vehicle_colour TEXT;
        ALTER TABLE infringements ADD COLUMN vehicle_type TEXT;
        ALTER TABLE infringements ADD COLUMN infringement_type INTEGER;

        CREATE TABLE IF NOT EXISTS location_cache (
          street TEXT NOT NULL,
          suburb TEXT NOT NULL DEFAULT '',
          town TEXT NOT NULL DEFAULT 'Hamilton',
          lat REAL NOT NULL,
          lon REAL NOT NULL,
          display_name TEXT NOT NULL DEFAULT '',
          geocoded_at TEXT NOT NULL,
          PRIMARY KEY (street, suburb)
        );

        CREATE INDEX IF NOT EXISTS idx_location_cache_coords ON location_cache (lat, lon);

        INSERT INTO _sql_schema_migrations (id) VALUES (3);
      `);
    }

    if (currentVersion < 4) {
      this.ctx.storage.sql.exec(`
        ALTER TABLE location_cache ADD COLUMN geometry_json TEXT;
        INSERT INTO _sql_schema_migrations (id) VALUES (4);
      `);
    }

    if (currentVersion < 5) {
      this.ctx.storage.sql.exec(`
        ALTER TABLE location_cache ADD COLUMN geocode_failed_at TEXT;
        INSERT INTO _sql_schema_migrations (id) VALUES (5);
      `);
    }

    if (currentVersion < 6) {
      this.ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS dashboard_snapshot_cache (
          id INTEGER PRIMARY KEY,
          payload TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        INSERT INTO _sql_schema_migrations (id) VALUES (6);
      `);
    }

    if (currentVersion < 7) {
      this.ctx.storage.sql.exec(`
        CREATE INDEX IF NOT EXISTS idx_infringements_location
          ON infringements (street, suburb, town);
        CREATE INDEX IF NOT EXISTS idx_infringements_vehicle
          ON infringements (vehicle_make, vehicle_model);

        INSERT INTO _sql_schema_migrations (id) VALUES (7);
      `);
    }
  }

  applySyncWindow(payload: SyncWindowPayload): SyncWindowResult {
    const runId = this.startSyncRun(
      payload.runType,
      payload.start,
      payload.end
    );

    try {
      const recordsUpserted = this.upsertInfringements(payload.records);
      this.recomputeStats();

      this.finishSyncRun(runId, "success", {
        fetched: payload.recordsFetched,
        upserted: recordsUpserted,
      });

      this.recordWatermark(payload.start, payload.end, payload.recordsFetched);
      this.setSyncMeta("last_hcc_fetch_at", isoNow());
      this.broadcastLiveUpdate();

      return {
        recordsFetched: payload.recordsFetched,
        recordsUpserted,
        runId,
        skipped: payload.skipped,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.finishSyncRun(runId, "error", {
        error: message,
        fetched: 0,
        upserted: 0,
      });
      throw error;
    }
  }

  importInfringementBatch(payload: ImportBatchPayload): ImportBatchResult {
    const recordsUpserted = this.upsertInfringements(payload.records);

    if (payload.final) {
      this.recomputeStats();
      this.setSyncMeta("last_csv_import_at", isoNow());
      this.broadcastLiveUpdate();
    }

    return {
      recomputed: payload.final,
      recordsReceived: payload.recordsReceived,
      recordsUpserted,
      skipped: payload.skipped,
      totalRecords: this.countInfringementsSync(),
    };
  }

  getPublicLiveStats(): PublicLiveStats {
    return this.readPublicLiveStatsSync();
  }

  private readPublicLiveStatsSync(): PublicLiveStats {
    const rows = this.ctx.storage.sql
      .exec<{
        all_time_total: number;
        all_time_amount_cents: number;
        today: number;
        last_24h: number;
        last_7d: number;
        last_30d: number;
        this_month: number;
        towed_today: number;
        last_synced_at: string | null;
        last_record_at: string | null;
      }>("SELECT * FROM stats_live WHERE id = ? LIMIT 1", STATS_LIVE_ID)
      .toArray();

    const [row] = rows;

    if (row === undefined) {
      return {
        allTimeAmountCents: 0,
        allTimeTotal: 0,
        last24h: 0,
        last30d: 0,
        last7d: 0,
        lastRecordAt: null,
        lastSyncedAt: null,
        thisMonth: 0,
        today: 0,
        towedToday: 0,
      };
    }

    return {
      allTimeAmountCents: row.all_time_amount_cents,
      allTimeTotal: row.all_time_total,
      last24h: row.last_24h,
      last30d: row.last_30d,
      last7d: row.last_7d,
      lastRecordAt: row.last_record_at,
      lastSyncedAt: row.last_synced_at,
      thisMonth: row.this_month,
      today: row.today,
      towedToday: row.towed_today,
    };
  }

  getLiveStats(): LiveStats {
    const cached = this.ctx.storage.sql
      .exec<{ last_synced_at: string | null }>(
        "SELECT last_synced_at FROM stats_live WHERE id = ? LIMIT 1",
        STATS_LIVE_ID
      )
      .one();

    const now = new Date();
    const today = this.aggregatePeriod(
      todayBounds(now).start,
      todayBounds(now).end
    );
    const thisMonth = this.aggregatePeriod(
      monthBoundsInAuckland(now).start,
      monthBoundsInAuckland(now).end
    );
    const thisYear = this.aggregatePeriod(
      yearBoundsInAuckland(now).start,
      yearBoundsInAuckland(now).end
    );
    const allTime = this.ctx.storage.sql
      .exec<{ count: number; total_cents: number }>(
        "SELECT count(*) as count, coalesce(sum(amount_cents), 0) as total_cents FROM infringements"
      )
      .one();

    return {
      allTime: {
        count: allTime?.count ?? 0,
        totalCents: allTime?.total_cents ?? 0,
      },
      thisMonth,
      thisYear,
      today,
      updatedAt: cached?.last_synced_at ?? null,
    };
  }

  getDailyStats(from: string, to: string): DailyStatRow[] {
    const rows = this.ctx.storage.sql
      .exec<{ date: string; count: number; amount_cents: number }>(
        `SELECT date, count, amount_cents FROM daily_counts
         WHERE date >= ? AND date <= ?
         ORDER BY date`,
        from,
        to
      )
      .toArray();

    return rows.map((row) => ({
      count: row.count,
      date: row.date,
      totalCents: row.amount_cents,
    }));
  }

  getTopStats(
    groupBy: TopGroupBy,
    window: TopWindow,
    limit: number
  ): TopStatRow[] {
    const column = groupBy === "street" ? "street" : "offence_description";
    const startDate =
      window === "all"
        ? null
        : formatDateInAuckland(subDays(new Date(), window === "7d" ? 7 : 30));

    const rows =
      startDate === null
        ? this.ctx.storage.sql
            .exec<{ key: string; count: number; total_cents: number }>(
              `SELECT ${column} as key, count(*) as count, coalesce(sum(amount_cents), 0) as total_cents
             FROM infringements
             WHERE ${column} != ''
             GROUP BY ${column}
             ORDER BY count DESC
             LIMIT ?`,
              limit
            )
            .toArray()
        : this.ctx.storage.sql
            .exec<{ key: string; count: number; total_cents: number }>(
              `SELECT ${column} as key, count(*) as count, coalesce(sum(amount_cents), 0) as total_cents
             FROM infringements
             WHERE ${column} != '' AND occurred_at >= ?
             GROUP BY ${column}
             ORDER BY count DESC
             LIMIT ?`,
              `${startDate}T00:00:00+12:00`,
              limit
            )
            .toArray();

    return rows.map((row) => ({
      count: row.count,
      key: row.key,
      totalCents: row.total_cents,
    }));
  }

  getPublicTop(groupBy: "street" | "offence", limit: number): PublicTopItem[] {
    const rows = this.getTopStats(groupBy, "all", limit);
    return rows.map((row) => ({ count: row.count, label: row.key.trim() }));
  }

  getTopStreets(limit: number): LocationRankItem[] {
    const rows = this.getTopStats("street", "all", limit);
    return rows.map((row) => ({
      count: row.count,
      label: row.key,
      street: row.key,
    }));
  }

  getTopSuburbs(limit: number): LocationRankItem[] {
    const rows = this.ctx.storage.sql
      .exec<{ suburb: string; count: number }>(
        `SELECT coalesce(suburb, 'Unknown') as suburb, count(*) as count
         FROM infringements
         WHERE suburb IS NOT NULL AND suburb != ''
         GROUP BY suburb
         ORDER BY count DESC
         LIMIT ?`,
        limit
      )
      .toArray();

    return rows.map((row) => ({
      count: row.count,
      label: row.suburb,
      suburb: row.suburb,
    }));
  }

  getStreetsInSuburb(suburb: string, limit: number): LocationRankItem[] {
    const result = this.browseStreets({
      limit,
      page: 1,
      sort: "count",
      suburb,
    });
    return result.items;
  }

  browseSuburbs(query: BrowseQuery): BrowseResult<LocationRankItem> {
    const q = query.q?.trim() ?? "";
    const pattern = `%${q}%`;
    const offset = (query.page - 1) * query.limit;
    const orderBy =
      query.sort === "name" ? "label COLLATE NOCASE ASC" : "count DESC";

    const totalRow = this.ctx.storage.sql
      .exec<{ total: number }>(
        `WITH grouped AS (
           SELECT coalesce(nullif(trim(suburb), ''), 'Unknown') AS label,
                  count(*) AS count
           FROM infringements
           GROUP BY coalesce(nullif(trim(suburb), ''), 'Unknown')
         )
         SELECT count(*) AS total
         FROM grouped
         WHERE (? = '' OR lower(label) LIKE lower(?))`,
        q,
        pattern
      )
      .one();

    const rows = this.ctx.storage.sql
      .exec<{ label: string; count: number }>(
        `WITH grouped AS (
           SELECT coalesce(nullif(trim(suburb), ''), 'Unknown') AS label,
                  count(*) AS count
           FROM infringements
           GROUP BY coalesce(nullif(trim(suburb), ''), 'Unknown')
         )
         SELECT label, count
         FROM grouped
         WHERE (? = '' OR lower(label) LIKE lower(?))
         ORDER BY ${orderBy}
         LIMIT ? OFFSET ?`,
        q,
        pattern,
        query.limit,
        offset
      )
      .toArray();

    return {
      items: rows.map((row) => ({
        count: row.count,
        label: row.label,
        suburb: row.label,
      })),
      limit: query.limit,
      page: query.page,
      total: totalRow?.total ?? 0,
    };
  }

  browseStreets(query: BrowseQuery): BrowseResult<LocationRankItem> {
    const q = query.q?.trim() ?? "";
    const pattern = `%${q}%`;
    const offset = (query.page - 1) * query.limit;
    const orderBy =
      query.sort === "name" ? "street COLLATE NOCASE ASC" : "count DESC";

    let suburbFilter = "";
    if (
      query.suburb !== undefined &&
      query.suburb !== null &&
      query.suburb !== ""
    ) {
      suburbFilter =
        query.suburb === "Unknown"
          ? "AND (suburb IS NULL OR trim(suburb) = '')"
          : "AND suburb = ?";
    }
    const suburbParams =
      query.suburb !== undefined &&
      query.suburb !== null &&
      query.suburb !== "" &&
      query.suburb !== "Unknown"
        ? [query.suburb]
        : [];

    const totalRow = this.ctx.storage.sql
      .exec<{ total: number }>(
        `WITH grouped AS (
           SELECT street,
                  coalesce(nullif(trim(suburb), ''), 'Unknown') AS suburb,
                  count(*) AS count
           FROM infringements
           WHERE street != '' AND street != 'Unknown'
             ${suburbFilter}
           GROUP BY street, coalesce(nullif(trim(suburb), ''), 'Unknown')
         )
         SELECT count(*) AS total
         FROM grouped
         WHERE (? = '' OR lower(street) LIKE lower(?) OR lower(suburb) LIKE lower(?))`,
        ...suburbParams,
        q,
        pattern,
        pattern
      )
      .one();

    const rows = this.ctx.storage.sql
      .exec<{ street: string; suburb: string; count: number }>(
        `WITH grouped AS (
           SELECT street,
                  coalesce(nullif(trim(suburb), ''), 'Unknown') AS suburb,
                  count(*) AS count
           FROM infringements
           WHERE street != '' AND street != 'Unknown'
             ${suburbFilter}
           GROUP BY street, coalesce(nullif(trim(suburb), ''), 'Unknown')
         )
         SELECT street, suburb, count
         FROM grouped
         WHERE (? = '' OR lower(street) LIKE lower(?) OR lower(suburb) LIKE lower(?))
         ORDER BY ${orderBy}
         LIMIT ? OFFSET ?`,
        ...suburbParams,
        q,
        pattern,
        pattern,
        query.limit,
        offset
      )
      .toArray();

    return {
      items: rows.map((row) => ({
        count: row.count,
        label:
          row.suburb === "Unknown"
            ? row.street
            : `${row.street} · ${row.suburb}`,
        street: row.street,
        suburb: row.suburb,
      })),
      limit: query.limit,
      page: query.page,
      total: totalRow?.total ?? 0,
    };
  }

  browseVehicles(query: BrowseQuery): BrowseResult<VehicleRankItem> {
    const q = query.q?.trim() ?? "";
    const pattern = `%${q}%`;
    const offset = (query.page - 1) * query.limit;
    const orderBy =
      query.sort === "name"
        ? "make COLLATE NOCASE ASC, model COLLATE NOCASE ASC"
        : "count DESC";

    const totalRow = this.ctx.storage.sql
      .exec<{ total: number }>(
        `WITH grouped AS (
           SELECT coalesce(nullif(trim(vehicle_make), ''), 'Unknown') AS make,
                  coalesce(nullif(trim(vehicle_model), ''), '') AS model,
                  count(*) AS count
           FROM infringements
           WHERE (vehicle_make IS NOT NULL AND trim(vehicle_make) != '')
              OR (vehicle_model IS NOT NULL AND trim(vehicle_model) != '')
           GROUP BY vehicle_make, vehicle_model
         )
         SELECT count(*) AS total
         FROM grouped
         WHERE (? = '' OR lower(make) LIKE lower(?) OR lower(model) LIKE lower(?))`,
        q,
        pattern,
        pattern
      )
      .one();

    const rows = this.ctx.storage.sql
      .exec<{ make: string; model: string; count: number }>(
        `WITH grouped AS (
           SELECT coalesce(nullif(trim(vehicle_make), ''), 'Unknown') AS make,
                  coalesce(nullif(trim(vehicle_model), ''), '') AS model,
                  count(*) AS count
           FROM infringements
           WHERE (vehicle_make IS NOT NULL AND trim(vehicle_make) != '')
              OR (vehicle_model IS NOT NULL AND trim(vehicle_model) != '')
           GROUP BY vehicle_make, vehicle_model
         )
         SELECT make, model, count
         FROM grouped
         WHERE (? = '' OR lower(make) LIKE lower(?) OR lower(model) LIKE lower(?))
         ORDER BY ${orderBy}
         LIMIT ? OFFSET ?`,
        q,
        pattern,
        pattern,
        query.limit,
        offset
      )
      .toArray();

    return {
      items: rows.map((row) => ({
        count: row.count,
        label: row.model ? `${row.make} ${row.model}` : row.make,
        make: row.make,
        model: row.model,
      })),
      limit: query.limit,
      page: query.page,
      total: totalRow?.total ?? 0,
    };
  }

  getTopVehicles(limit: number): VehicleRankItem[] {
    const rows = this.ctx.storage.sql
      .exec<{ make: string; model: string; count: number }>(
        `SELECT coalesce(nullif(trim(vehicle_make), ''), 'Unknown') as make,
                coalesce(nullif(trim(vehicle_model), ''), '') as model,
                count(*) as count
         FROM infringements
         WHERE (vehicle_make IS NOT NULL AND trim(vehicle_make) != '')
            OR (vehicle_model IS NOT NULL AND trim(vehicle_model) != '')
         GROUP BY vehicle_make, vehicle_model
         ORDER BY count DESC
         LIMIT ?`,
        limit
      )
      .toArray();

    return rows.map((row) => ({
      count: row.count,
      label: row.model ? `${row.make} ${row.model}` : row.make,
      make: row.make,
      model: row.model,
    }));
  }

  getLocationsNeedingGeocode(
    limit: number
  ): { street: string; suburb: string | null; town: string; count: number }[] {
    const rows = this.ctx.storage.sql
      .exec<GeocodeCandidateRow>(
        `SELECT i.street,
                nullif(i.suburb, '') as suburb,
                coalesce(i.town, 'Hamilton') as town,
                count(*) as count,
                lc.geometry_json,
                lc.geocode_failed_at
         FROM infringements i
         LEFT JOIN location_cache lc
           ON i.street = lc.street
           AND coalesce(i.suburb, '') = lc.suburb
         WHERE i.street != ''
           AND i.street != 'Unknown'
         GROUP BY i.street, i.suburb, i.town, lc.geometry_json, lc.geocode_failed_at
         ORDER BY count DESC
         LIMIT ?`,
        GEOCODE_CANDIDATE_POOL
      )
      .toArray();

    return filterGeocodeCandidates(rows, limit);
  }

  countLocationsNeedingGeocode(): number {
    return this.countLocationsNeedingGeocodeSync();
  }

  markGeocodeFailed(street: string, suburb: string | null, town: string): void {
    const now = isoNow();

    this.ctx.storage.sql.exec(
      `INSERT INTO location_cache (street, suburb, town, lat, lon, display_name, geocoded_at, geometry_json, geocode_failed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?)
       ON CONFLICT(street, suburb) DO UPDATE SET
         town = excluded.town,
         geocode_failed_at = excluded.geocode_failed_at`,
      street,
      suburb ?? "",
      town,
      HAMILTON_CENTER_LAT,
      HAMILTON_CENTER_LON,
      "",
      now,
      now
    );
  }

  private countLocationsNeedingGeocodeSync(): number {
    const retryCutoff = new Date(
      Date.now() - GEOCODE_FAILURE_RETRY_MS
    ).toISOString();
    const row = this.ctx.storage.sql
      .exec<{ total: number }>(
        `SELECT count(*) as total
         FROM (
           SELECT i.street,
                  coalesce(i.suburb, '') as suburb,
                  coalesce(i.town, 'Hamilton') as town,
                  lc.geometry_json,
                  lc.geocode_failed_at
           FROM infringements i
           LEFT JOIN location_cache lc
             ON i.street = lc.street
             AND coalesce(i.suburb, '') = lc.suburb
           WHERE i.street != ''
             AND i.street != 'Unknown'
           GROUP BY i.street, coalesce(i.suburb, ''), coalesce(i.town, 'Hamilton')
         )
         WHERE (geometry_json IS NULL OR geometry_json = '' OR geometry_json = '[]')
           AND (
             geocode_failed_at IS NULL
             OR geocode_failed_at = ''
             OR geocode_failed_at < ?
           )`,
        retryCutoff
      )
      .one();

    return row?.total ?? 0;
  }

  saveLocationCache(input: LocationCacheInput): void {
    this.ctx.storage.sql.exec(
      `INSERT INTO location_cache (street, suburb, town, lat, lon, display_name, geocoded_at, geometry_json, geocode_failed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)
       ON CONFLICT(street, suburb) DO UPDATE SET
         town = excluded.town,
         lat = excluded.lat,
         lon = excluded.lon,
         display_name = excluded.display_name,
         geocoded_at = excluded.geocoded_at,
         geometry_json = excluded.geometry_json,
         geocode_failed_at = NULL`,
      input.street,
      input.suburb ?? "",
      input.town,
      input.lat,
      input.lon,
      input.displayName,
      isoNow(),
      JSON.stringify(input.geometry)
    );
    this.broadcastLiveUpdate();
  }

  getMapPoints(limit: number): {
    routes: LocationMapPoint[];
    pendingGeocode: number;
  } {
    const rows = this.ctx.storage.sql
      .exec<{
        street: string;
        suburb: string | null;
        town: string;
        count: number;
        geometry_json: string | null;
      }>(
        `SELECT i.street,
                nullif(i.suburb, '') as suburb,
                coalesce(i.town, 'Hamilton') as town,
                count(*) as count,
                lc.geometry_json
         FROM infringements i
         INNER JOIN location_cache lc
           ON i.street = lc.street
           AND coalesce(i.suburb, '') = lc.suburb
         WHERE i.street != ''
           AND lc.geometry_json IS NOT NULL
           AND lc.geometry_json != ''
           AND lc.geometry_json != '[]'
         GROUP BY i.street, i.suburb, i.town, lc.geometry_json
         ORDER BY count DESC
         LIMIT ?`,
        limit
      )
      .toArray();

    const pendingGeocode = this.countLocationsNeedingGeocodeSync();

    return {
      pendingGeocode,
      routes: rows
        .map((row) => toMapRouteRow(row))
        .filter((row): row is LocationMapPoint => row !== null),
    };
  }

  listInfringements(query: InfringementQuery): InfringementListResult {
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (query.from !== undefined && query.from !== "") {
      conditions.push("occurred_at >= ?");
      params.push(`${query.from}T00:00:00+12:00`);
    }
    if (query.to !== undefined && query.to !== "") {
      conditions.push("occurred_at <= ?");
      params.push(`${query.to}T23:59:59.999+12:00`);
    }
    if (query.street !== undefined && query.street !== "") {
      conditions.push("street = ?");
      params.push(query.street);
    }
    if (query.suburb !== undefined && query.suburb !== "") {
      if (query.suburb === "Unknown") {
        conditions.push("(suburb IS NULL OR suburb = '')");
      } else {
        conditions.push("suburb = ?");
        params.push(query.suburb);
      }
    }
    if (query.vehicleMake !== undefined && query.vehicleMake !== "") {
      conditions.push(
        "coalesce(nullif(trim(vehicle_make), ''), 'Unknown') = ?"
      );
      params.push(query.vehicleMake);
    }
    if (query.vehicleModel !== undefined) {
      conditions.push("coalesce(nullif(trim(vehicle_model), ''), '') = ?");
      params.push(query.vehicleModel);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const offset = (query.page - 1) * query.limit;

    const totalRow = this.ctx.storage.sql
      .exec<{ total: number }>(
        `SELECT count(*) as total FROM infringements ${whereClause}`,
        ...params
      )
      .one();

    const rows = this.ctx.storage.sql
      .exec<{
        infringement_number: number;
        occurred_at: string;
        amount_cents: number;
        street: string;
        suburb: string | null;
        town: string | null;
        post_code: string | null;
        offence_code: string | null;
        offence_description: string;
        offence_category: string | null;
        vehicle_make: string | null;
        vehicle_model: string | null;
        vehicle_colour: string | null;
        vehicle_type: string | null;
        is_towed: number;
        first_seen_at: string;
        updated_at: string;
      }>(
        `SELECT * FROM infringements ${whereClause}
         ORDER BY occurred_at DESC
         LIMIT ? OFFSET ?`,
        ...params,
        query.limit,
        offset
      )
      .toArray();

    return {
      data: rows.map((row) => ({
        amountCents: row.amount_cents,
        firstSeenAt: row.first_seen_at,
        infringementNumber: row.infringement_number,
        isTowed: row.is_towed === 1,
        occurredAt: row.occurred_at,
        offenceCategory: row.offence_category,
        offenceCode: row.offence_code,
        offenceDescription: row.offence_description,
        postCode: row.post_code,
        street: row.street,
        suburb: row.suburb,
        town: row.town,
        updatedAt: row.updated_at,
        vehicleColour: row.vehicle_colour,
        vehicleMake: row.vehicle_make,
        vehicleModel: row.vehicle_model,
        vehicleType: row.vehicle_type,
      })),
      limit: query.limit,
      page: query.page,
      total: totalRow?.total ?? 0,
    };
  }

  getLatestSyncRun(): SyncRunRow | null {
    const rows = this.ctx.storage.sql
      .exec<{
        id: number;
        run_type: string;
        window_start: string;
        window_end: string;
        fetched: number;
        inserted: number;
        updated: number;
        status: string;
        error: string | null;
        started_at: string;
        finished_at: string | null;
      }>(`SELECT * FROM sync_runs ORDER BY started_at DESC LIMIT 1`)
      .toArray();

    const [row] = rows;

    if (row === undefined) {
      return null;
    }

    return {
      error: row.error,
      fetched: row.fetched,
      finishedAt: row.finished_at,
      id: row.id,
      inserted: row.inserted,
      runType: row.run_type,
      startedAt: row.started_at,
      status: row.status,
      updated: row.updated,
      windowEnd: row.window_end,
      windowStart: row.window_start,
    };
  }

  isWindowIngested(start: string, end: string): boolean {
    return this.hasWatermark(start, end);
  }

  filterPendingChunks(windows: DateWindow[]): DateWindow[] {
    return windows.filter(
      (window) => !this.hasWatermark(window.start, window.end)
    );
  }

  getCacheStatus(): CacheStatus {
    const totalRow = this.ctx.storage.sql
      .exec<{ total: number }>("SELECT count(*) as total FROM infringements")
      .one();

    const watermarkRow = this.ctx.storage.sql
      .exec<{ count: number }>(
        "SELECT count(*) as count FROM ingest_watermarks"
      )
      .one();

    const statsRow = this.ctx.storage.sql
      .exec<{ last_synced_at: string | null }>(
        "SELECT last_synced_at FROM stats_live WHERE id = ? LIMIT 1",
        STATS_LIVE_ID
      )
      .one();

    return {
      ingestWindows: watermarkRow?.count ?? 0,
      lastHccFetchAt: this.getSyncMeta("last_hcc_fetch_at"),
      lastSyncedAt: statsRow?.last_synced_at ?? null,
      source: "parking-store",
      totalRecords: totalRow?.total ?? 0,
    };
  }

  private refreshDashboardSnapshotCache(): void {
    this.dashboardSnapshotPayload = JSON.stringify({
      type: "full",
      ...this.buildFullDashboardSnapshotSync(),
    });
    this.ctx.storage.sql.exec(
      `INSERT INTO dashboard_snapshot_cache (id, payload, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         payload = excluded.payload,
         updated_at = excluded.updated_at`,
      DASHBOARD_SNAPSHOT_CACHE_ID,
      this.dashboardSnapshotPayload,
      isoNow()
    );
  }

  private readStoredDashboardSnapshotPayload(): string | null {
    const rows = this.ctx.storage.sql
      .exec<{ payload: string }>(
        "SELECT payload FROM dashboard_snapshot_cache WHERE id = ? LIMIT 1",
        DASHBOARD_SNAPSHOT_CACHE_ID
      )
      .toArray();

    return rows[0]?.payload ?? null;
  }

  private buildColdDashboardSnapshotPayload(): string {
    return JSON.stringify({
      at: isoNow(),
      dailyTrend: [],
      live: this.readPublicLiveStatsSync(),
      map: {
        pendingGeocode: 0,
        routes: [],
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

  private static getDashboardSnapshotPayloadWeight(payload: string): number {
    try {
      const parsed: unknown = JSON.parse(payload);
      if (typeof parsed !== "object" || parsed === null) {
        return 0;
      }

      const snapshot = parsed as {
        map?: { routes?: unknown[] };
        recentInfringements?: unknown[];
        streets?: unknown[];
        suburbs?: unknown[];
        topOffences?: unknown[];
        topStreets?: unknown[];
        vehicles?: unknown[];
      };

      return (
        (snapshot.recentInfringements?.length ?? 0) +
        (snapshot.topStreets?.length ?? 0) +
        (snapshot.topOffences?.length ?? 0) +
        (snapshot.streets?.length ?? 0) +
        (snapshot.suburbs?.length ?? 0) +
        (snapshot.vehicles?.length ?? 0) +
        (snapshot.map?.routes?.length ?? 0)
      );
    } catch {
      return 0;
    }
  }

  private static snapshotHasDailyTrend(payload: string): boolean {
    try {
      const parsed: unknown = JSON.parse(payload);
      if (typeof parsed !== "object" || parsed === null) {
        return false;
      }
      const dailyTrend = Reflect.get(parsed, "dailyTrend");
      return Array.isArray(dailyTrend) && dailyTrend.length > 0;
    } catch {
      return false;
    }
  }

  private getDashboardSnapshotPayload(): string {
    const payload =
      this.dashboardSnapshotPayload ??
      this.readStoredDashboardSnapshotPayload();

    if (
      payload !== null &&
      ParkingStore.getDashboardSnapshotPayloadWeight(payload) > 0 &&
      ParkingStore.snapshotHasDailyTrend(payload)
    ) {
      this.dashboardSnapshotPayload = payload;
      return payload;
    }

    this.refreshDashboardSnapshotCache();
    return (
      this.dashboardSnapshotPayload ?? this.buildColdDashboardSnapshotPayload()
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

  private readDailyTrendSync(days = 30): DailyStatRow[] {
    const now = new Date();
    const from = formatDateInAuckland(subDays(now, days - 1));
    const to = formatDateInAuckland(now);
    return this.getDailyStats(from, to);
  }

  private buildFullDashboardSnapshotSync(): PublicDashboardSnapshot {
    return {
      at: isoNow(),
      dailyTrend: this.readDailyTrendSync(30),
      live: this.readPublicLiveStatsSync(),
      map: this.readMapPointsSync(50),
      recentInfringements: this.listInfringements({
        limit: 15,
        page: 1,
      }).data,
      streets: this.readTopStreetsRankedSync(10),
      suburbs: this.readTopSuburbsRankedSync(10),
      topOffences: this.readTopGroupedSync("offence", 5),
      topStreets: this.readTopGroupedSync("street", 5),
      vehicles: this.readTopVehiclesSync(10),
    };
  }

  private readTopGroupedSync(
    groupBy: "street" | "offence",
    limit: number
  ): PublicTopItem[] {
    const column = groupBy === "street" ? "street" : "offence_description";
    const rows = this.ctx.storage.sql
      .exec<{ key: string; count: number }>(
        `SELECT ${column} as key, count(*) as count
         FROM infringements
         WHERE ${column} != ''
         GROUP BY ${column}
         ORDER BY count DESC
         LIMIT ?`,
        limit
      )
      .toArray();

    return rows.map((row) => ({
      count: row.count,
      label: row.key.trim(),
    }));
  }

  private readTopStreetsRankedSync(limit: number): LocationRankItem[] {
    return this.readTopGroupedSync("street", limit).map((row) => ({
      count: row.count,
      label: row.label,
      street: row.label,
    }));
  }

  private readTopSuburbsRankedSync(limit: number): LocationRankItem[] {
    const rows = this.ctx.storage.sql
      .exec<{ suburb: string; count: number }>(
        `SELECT coalesce(suburb, 'Unknown') as suburb, count(*) as count
         FROM infringements
         WHERE suburb IS NOT NULL AND suburb != ''
         GROUP BY suburb
         ORDER BY count DESC
         LIMIT ?`,
        limit
      )
      .toArray();

    return rows.map((row) => ({
      count: row.count,
      label: row.suburb,
      suburb: row.suburb,
    }));
  }

  private readTopVehiclesSync(limit: number): VehicleRankItem[] {
    const rows = this.ctx.storage.sql
      .exec<{ make: string; model: string; count: number }>(
        `SELECT coalesce(nullif(trim(vehicle_make), ''), 'Unknown') as make,
                coalesce(nullif(trim(vehicle_model), ''), '') as model,
                count(*) as count
         FROM infringements
         WHERE (vehicle_make IS NOT NULL AND trim(vehicle_make) != '')
            OR (vehicle_model IS NOT NULL AND trim(vehicle_model) != '')
         GROUP BY vehicle_make, vehicle_model
         ORDER BY count DESC
         LIMIT ?`,
        limit
      )
      .toArray();

    return rows.map((row) => ({
      count: row.count,
      label: row.model ? `${row.make} ${row.model}` : row.make,
      make: row.make,
      model: row.model,
    }));
  }

  private readMapPointsSync(limit: number): {
    routes: LocationMapPoint[];
    pendingGeocode: number;
  } {
    const rows = this.ctx.storage.sql
      .exec<{
        street: string;
        suburb: string | null;
        town: string;
        count: number;
        geometry_json: string | null;
      }>(
        `SELECT i.street,
                nullif(i.suburb, '') as suburb,
                coalesce(i.town, 'Hamilton') as town,
                count(*) as count,
                lc.geometry_json
         FROM infringements i
         INNER JOIN location_cache lc
           ON i.street = lc.street
           AND coalesce(i.suburb, '') = lc.suburb
         WHERE i.street != ''
           AND lc.geometry_json IS NOT NULL
           AND lc.geometry_json != ''
           AND lc.geometry_json != '[]'
         GROUP BY i.street, i.suburb, i.town, lc.geometry_json
         ORDER BY count DESC
         LIMIT ?`,
        limit
      )
      .toArray();

    return {
      pendingGeocode: this.countLocationsNeedingGeocodeSync(),
      routes: rows
        .map((row) => toMapRouteRow(row))
        .filter((row): row is LocationMapPoint => row !== null),
    };
  }

  private countInfringementsSync(): number {
    const totalRow = this.ctx.storage.sql
      .exec<{ total: number }>("SELECT count(*) as total FROM infringements")
      .one();

    return totalRow?.total ?? 0;
  }

  private startSyncRun(
    runType: SyncRunType,
    start: string,
    end: string
  ): number {
    const result = this.ctx.storage.sql.exec<{ id: number }>(
      `INSERT INTO sync_runs (run_type, window_start, window_end, status, started_at)
       VALUES (?, ?, ?, 'running', ?)
       RETURNING id`,
      runType,
      start,
      end,
      isoNow()
    );
    const runId = result.one().id;
    if (!runId) {
      throw new Error("Failed to create sync run");
    }
    return runId;
  }

  private finishSyncRun(
    runId: number,
    status: "success" | "error",
    details: { fetched: number; upserted: number; error?: string }
  ): void {
    this.ctx.storage.sql.exec(
      `UPDATE sync_runs
       SET finished_at = ?, status = ?, fetched = ?, inserted = ?, updated = 0, error = ?
       WHERE id = ?`,
      isoNow(),
      status,
      details.fetched,
      details.upserted,
      details.error ?? null,
      runId
    );
  }

  private upsertInfringements(records: CleanInfringement[]): number {
    if (records.length === 0) {
      return 0;
    }

    const now = isoNow();

    for (const record of records) {
      this.ctx.storage.sql.exec(
        `INSERT INTO infringements (
          infringement_number, occurred_at, closed_at, amount_cents,
          additional_costs_cents, street, suburb, town, post_code,
          offence_code, offence_description, offence_category,
          infringement_type, court_serve_method,
          vehicle_colour, vehicle_make, vehicle_model, vehicle_type,
          is_towed, first_seen_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(infringement_number) DO UPDATE SET
          occurred_at = excluded.occurred_at,
          closed_at = excluded.closed_at,
          amount_cents = excluded.amount_cents,
          additional_costs_cents = excluded.additional_costs_cents,
          street = excluded.street,
          suburb = excluded.suburb,
          town = excluded.town,
          post_code = excluded.post_code,
          offence_code = excluded.offence_code,
          offence_description = excluded.offence_description,
          offence_category = excluded.offence_category,
          infringement_type = excluded.infringement_type,
          court_serve_method = excluded.court_serve_method,
          vehicle_colour = excluded.vehicle_colour,
          vehicle_make = excluded.vehicle_make,
          vehicle_model = excluded.vehicle_model,
          vehicle_type = excluded.vehicle_type,
          is_towed = excluded.is_towed,
          updated_at = excluded.updated_at`,
        record.infringementNumber,
        record.occurredAt,
        record.closedAt,
        record.amountCents,
        record.additionalCostsCents,
        record.street,
        record.suburb,
        record.town,
        record.postCode,
        record.offenceCode,
        record.offenceDescription,
        record.offenceCategory,
        record.infringementType,
        record.courtServeMethod,
        record.vehicleColour,
        record.vehicleMake,
        record.vehicleModel,
        record.vehicleType,
        record.isTowed ? 1 : 0,
        now,
        now
      );
    }

    return records.length;
  }

  private aggregateWindow(
    start: string,
    end: string
  ): { count: number; amountCents: number; towedCount: number } {
    const row = this.ctx.storage.sql
      .exec<{ count: number; amount_cents: number; towed_count: number }>(
        `SELECT count(*) as count,
                coalesce(sum(amount_cents), 0) as amount_cents,
                coalesce(sum(case when is_towed = 1 then 1 else 0 end), 0) as towed_count
         FROM infringements
         WHERE occurred_at >= ? AND occurred_at <= ?`,
        start,
        end
      )
      .one();

    return {
      amountCents: row?.amount_cents ?? 0,
      count: row?.count ?? 0,
      towedCount: row?.towed_count ?? 0,
    };
  }

  private aggregatePeriod(
    start: string,
    end: string
  ): { count: number; totalCents: number } {
    const row = this.aggregateWindow(start, end);
    return { count: row.count, totalCents: row.amountCents };
  }

  private recomputeStats(): void {
    const now = new Date();
    const today = formatDateInAuckland(now);
    const todayWindow = dateBounds(today);
    const monthBounds = monthBoundsInAuckland(now);
    const yearBounds = yearBoundsInAuckland(now);
    const last24hStart = subDays(now, 1).toISOString();
    const last7dStart = formatDateInAuckland(subDays(now, 7));
    const last30dStart = formatDateInAuckland(subDays(now, 30));

    const allTime = this.aggregateWindow(
      "1970-01-01T00:00:00+12:00",
      "2099-12-31T23:59:59.999+12:00"
    );
    const todayStats = this.aggregateWindow(todayWindow.start, todayWindow.end);
    const monthStats = this.aggregateWindow(monthBounds.start, monthBounds.end);
    const yearStats = this.aggregateWindow(yearBounds.start, yearBounds.end);
    const last24h = this.aggregateWindow(last24hStart, isoNow());
    const last7d = this.aggregateWindow(
      `${last7dStart}T00:00:00+12:00`,
      todayWindow.end
    );
    const last30d = this.aggregateWindow(
      `${last30dStart}T00:00:00+12:00`,
      todayWindow.end
    );

    const lastRecord = this.ctx.storage.sql
      .exec<{ latest: string | null }>(
        "SELECT max(occurred_at) as latest FROM infringements"
      )
      .one();

    const syncedAt = isoNow();

    this.ctx.storage.sql.exec(
      `INSERT INTO stats_live (
        id, all_time_total, all_time_amount_cents, today, last_24h, last_7d,
        last_30d, this_month, this_year, towed_all_time, towed_today,
        last_synced_at, last_record_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        all_time_total = excluded.all_time_total,
        all_time_amount_cents = excluded.all_time_amount_cents,
        today = excluded.today,
        last_24h = excluded.last_24h,
        last_7d = excluded.last_7d,
        last_30d = excluded.last_30d,
        this_month = excluded.this_month,
        this_year = excluded.this_year,
        towed_all_time = excluded.towed_all_time,
        towed_today = excluded.towed_today,
        last_synced_at = excluded.last_synced_at,
        last_record_at = excluded.last_record_at`,
      STATS_LIVE_ID,
      allTime.count,
      allTime.amountCents,
      todayStats.count,
      last24h.count,
      last7d.count,
      last30d.count,
      monthStats.count,
      yearStats.count,
      allTime.towedCount,
      todayStats.towedCount,
      syncedAt,
      lastRecord?.latest ?? null
    );

    const dailyRows = this.ctx.storage.sql
      .exec<{
        date: string;
        count: number;
        amount_cents: number;
        towed_count: number;
      }>(
        `SELECT substr(occurred_at, 1, 10) as date,
                count(*) as count,
                coalesce(sum(amount_cents), 0) as amount_cents,
                coalesce(sum(case when is_towed = 1 then 1 else 0 end), 0) as towed_count
         FROM infringements
         GROUP BY substr(occurred_at, 1, 10)`
      )
      .toArray();

    for (const row of dailyRows) {
      this.ctx.storage.sql.exec(
        `INSERT INTO daily_counts (date, count, amount_cents, towed_count)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(date) DO UPDATE SET
           count = excluded.count,
           amount_cents = excluded.amount_cents,
           towed_count = excluded.towed_count`,
        row.date,
        row.count,
        row.amount_cents,
        row.towed_count
      );
    }
  }

  private hasWatermark(start: string, end: string): boolean {
    const rows = this.ctx.storage.sql
      .exec<{ found: number }>(
        `SELECT 1 as found FROM ingest_watermarks
         WHERE window_start = ? AND window_end = ?
         LIMIT 1`,
        start,
        end
      )
      .toArray();

    return rows.length > 0;
  }

  private recordWatermark(
    start: string,
    end: string,
    recordCount: number
  ): void {
    this.ctx.storage.sql.exec(
      `INSERT INTO ingest_watermarks (window_start, window_end, record_count, ingested_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(window_start, window_end) DO UPDATE SET
         record_count = excluded.record_count,
         ingested_at = excluded.ingested_at`,
      start,
      end,
      recordCount,
      isoNow()
    );
  }

  private setSyncMeta(key: string, value: string): void {
    this.ctx.storage.sql.exec(
      `INSERT INTO sync_meta (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      key,
      value
    );
  }

  private getSyncMeta(key: string): string | null {
    const row = this.ctx.storage.sql
      .exec<{ value: string }>(
        "SELECT value FROM sync_meta WHERE key = ? LIMIT 1",
        key
      )
      .one();

    return row?.value ?? null;
  }
}
