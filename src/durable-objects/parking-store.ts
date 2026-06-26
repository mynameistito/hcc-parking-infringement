import { DurableObject } from "cloudflare:workers";
import { parseISO, subDays } from "date-fns";

import { toMapRouteRow } from "@/durable-objects/geometry.ts";
import {
  DASHBOARD_SNAPSHOT_CACHE_ID,
  GEOCODE_CANDIDATE_POOL,
  HAMILTON_CENTER_LAT,
  HAMILTON_CENTER_LON,
  isoNow,
  STATS_LIVE_ID,
} from "@/durable-objects/parking-store/constants.ts";
import {
  buildColdDashboardSnapshotPayload,
  buildFullDashboardSnapshotPayload,
  getDashboardSnapshotPayloadWeight,
  snapshotIsComplete,
} from "@/durable-objects/parking-store/dashboard-snapshot.ts";
import {
  filterGeocodeCandidates,
  geocodeRetryCutoffIso,
} from "@/durable-objects/parking-store/geocode-candidates.ts";
import type { GeocodeCandidateRow } from "@/durable-objects/parking-store/geocode-candidates.ts";
import { runParkingStoreMigrations } from "@/durable-objects/parking-store/schema.ts";
import {
  aggregatePeriod,
  aggregateWindow,
  mapPublicLiveStatsRow,
  recomputeStatsLive,
} from "@/durable-objects/parking-store/stats.ts";
import {
  clearSyncMeta,
  finishSyncRun,
  getSyncMeta,
  hasWatermark,
  recordWatermark,
  setSyncMeta,
  startSyncRun,
  upsertInfringements,
} from "@/durable-objects/parking-store/sync.ts";
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
  PublicDashboardSnapshot,
  PublicLiveStats,
  PublicPaceTrends,
  PublicTopItem,
  SyncRunRow,
  SyncWindowPayload,
  SyncWindowResult,
  TopGroupBy,
  TopStatRow,
  TopWindow,
  VehicleRankItem,
} from "@/durable-objects/types.ts";
import {
  dateBounds,
  formatDateInAuckland,
  monthBoundsInAuckland,
  todayBounds,
  yearBoundsInAuckland,
} from "@/lib/auckland-time.ts";
import { PACE_DAILY_TREND_DAYS } from "@/lib/pace-constants.ts";
import { toTrendResult } from "@/lib/trend.ts";
import type { TrendResult } from "@/lib/trend.ts";

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
    // Runtime completes the close handshake via web_socket_auto_reply_to_close.
  }

  private async migrate(): Promise<void> {
    await Promise.resolve();

    runParkingStoreMigrations(this.ctx.storage.sql, {
      recomputeStats: () => {
        this.recomputeStats();
      },
      refreshDashboardSnapshotCache: () => {
        this.refreshDashboardSnapshotCache();
      },
    });
  }

  applySyncWindow(payload: SyncWindowPayload): SyncWindowResult {
    const { sql } = this.ctx.storage;
    const runId = startSyncRun(
      sql,
      payload.runType,
      payload.start,
      payload.end
    );

    try {
      const recordsUpserted = upsertInfringements(sql, payload.records);

      if (payload.runType === "backfill") {
        this.markBackfillStatsDirty();
      } else {
        this.recomputeStats();
        this.broadcastLiveUpdate();
      }

      finishSyncRun(sql, runId, "success", {
        fetched: payload.recordsFetched,
        upserted: recordsUpserted,
      });

      recordWatermark(sql, payload.start, payload.end, payload.recordsFetched);
      setSyncMeta(sql, "last_hcc_fetch_at", isoNow());

      return {
        recordsFetched: payload.recordsFetched,
        recordsUpserted,
        runId,
        skipped: payload.skipped,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      finishSyncRun(sql, runId, "error", {
        error: message,
        fetched: 0,
        upserted: 0,
      });
      throw error;
    }
  }

  recordBackfillFailure(start: string, end: string, error: string): void {
    const { sql } = this.ctx.storage;
    const runId = startSyncRun(sql, "backfill", start, end);
    finishSyncRun(sql, runId, "error", {
      error,
      fetched: 0,
      upserted: 0,
    });
  }

  importInfringementBatch(payload: ImportBatchPayload): ImportBatchResult {
    const { sql } = this.ctx.storage;
    const recordsUpserted = upsertInfringements(sql, payload.records);

    if (payload.final) {
      this.recomputeStats();
      setSyncMeta(sql, "last_csv_import_at", isoNow());
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
        last_365d: number;
        this_month: number;
        towed_today: number;
        last_synced_at: string | null;
        last_record_at: string | null;
      }>("SELECT * FROM stats_live WHERE id = ? LIMIT 1", STATS_LIVE_ID)
      .toArray();

    return mapPublicLiveStatsRow(rows[0]);
  }

  getLiveStats(): LiveStats {
    const cached = this.ctx.storage.sql
      .exec<{ last_synced_at: string | null }>(
        "SELECT last_synced_at FROM stats_live WHERE id = ? LIMIT 1",
        STATS_LIVE_ID
      )
      .one();

    const now = new Date();
    const today = aggregatePeriod(
      this.ctx.storage.sql,
      todayBounds(now).start,
      todayBounds(now).end
    );
    const thisMonth = aggregatePeriod(
      this.ctx.storage.sql,
      monthBoundsInAuckland(now).start,
      monthBoundsInAuckland(now).end
    );
    const thisYear = aggregatePeriod(
      this.ctx.storage.sql,
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
        geocodeRetryCutoffIso()
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
    return hasWatermark(this.ctx.storage.sql, start, end);
  }

  filterPendingChunks(windows: DateWindow[]): DateWindow[] {
    const { sql } = this.ctx.storage;
    return windows.filter(
      (window) => !hasWatermark(sql, window.start, window.end)
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
      lastHccFetchAt: getSyncMeta(this.ctx.storage.sql, "last_hcc_fetch_at"),
      lastSyncedAt: statsRow?.last_synced_at ?? null,
      source: "parking-store",
      totalRecords: totalRow?.total ?? 0,
    };
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
    const completed = this.countIngestWatermarksInRange(start, end, chunkDays);
    const latest = this.getLatestIngestWatermarkInRange(start, end, chunkDays);

    return {
      completed,
      latestIngestedAt: latest?.ingestedAt ?? null,
      latestWindow: latest ? { end: latest.end, start: latest.start } : null,
      totalRecords: this.readTotalRecordsForProgress(),
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
    const row =
      chunkDays === 1
        ? this.ctx.storage.sql
            .exec<{ count: number }>(
              `SELECT count(*) as count FROM ingest_watermarks
               WHERE window_start = window_end
                 AND window_start >= ?
                 AND window_start <= ?`,
              start,
              end
            )
            .one()
        : this.ctx.storage.sql
            .exec<{ count: number }>(
              `SELECT count(*) as count FROM ingest_watermarks
               WHERE window_start >= ?
                 AND window_end <= ?
                 AND window_start != window_end`,
              start,
              end
            )
            .one();

    return row?.count ?? 0;
  }

  getLatestIngestWatermarkInRange(
    start: string,
    end: string,
    chunkDays: number
  ): { end: string; ingestedAt: string; start: string } | null {
    const rows =
      chunkDays === 1
        ? this.ctx.storage.sql
            .exec<{
              window_start: string;
              window_end: string;
              ingested_at: string;
            }>(
              `SELECT window_start, window_end, ingested_at FROM ingest_watermarks
               WHERE window_start = window_end
                 AND window_start >= ?
                 AND window_start <= ?
               ORDER BY ingested_at DESC
               LIMIT 1`,
              start,
              end
            )
            .toArray()
        : this.ctx.storage.sql
            .exec<{
              window_start: string;
              window_end: string;
              ingested_at: string;
            }>(
              `SELECT window_start, window_end, ingested_at FROM ingest_watermarks
               WHERE window_start >= ?
                 AND window_end <= ?
                 AND window_start != window_end
               ORDER BY ingested_at DESC
               LIMIT 1`,
              start,
              end
            )
            .toArray();

    const [row] = rows;
    if (row === undefined) {
      return null;
    }

    return {
      end: row.window_end,
      ingestedAt: row.ingested_at,
      start: row.window_start,
    };
  }

  private refreshDashboardSnapshotCache(): void {
    this.dashboardSnapshotPayload = buildFullDashboardSnapshotPayload(
      this.buildFullDashboardSnapshotSync()
    );
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

  private getDashboardSnapshotPayload(): string {
    const payload =
      this.dashboardSnapshotPayload ??
      this.readStoredDashboardSnapshotPayload();

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
        this.readPublicLiveStatsSync(),
        this.readPaceTrendsSync(),
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

  private readDailyTrendSync(days = PACE_DAILY_TREND_DAYS): DailyStatRow[] {
    const now = new Date();
    const from = formatDateInAuckland(subDays(now, days - 1));
    const to = formatDateInAuckland(now);
    return this.getDailyStats(from, to);
  }

  private readPaceTrendsSync(): PublicPaceTrends {
    return {
      last30d: this.computePaceTrend(30),
      last365d: this.computePaceTrend(365),
      last7d: this.computePaceTrend(7),
    };
  }

  private computePaceTrend(days: number): TrendResult {
    const { sql } = this.ctx.storage;
    const now = new Date();
    const today = formatDateInAuckland(now);
    const todayWindow = dateBounds(today);
    const currentStart = formatDateInAuckland(subDays(now, days));
    const current = aggregateWindow(
      sql,
      `${currentStart}T00:00:00+12:00`,
      todayWindow.end
    ).count;

    const currentStartDate = parseISO(`${currentStart}T12:00:00`);
    const priorEndDay = formatDateInAuckland(subDays(currentStartDate, 1));
    const priorStartDay = formatDateInAuckland(subDays(currentStartDate, days));
    const previous = aggregateWindow(
      sql,
      dateBounds(priorStartDay).start,
      dateBounds(priorEndDay).end
    ).count;

    const earliestRow = this.ctx.storage.sql
      .exec<{ earliest: string | null }>(
        "SELECT min(substr(occurred_at, 1, 10)) as earliest FROM infringements"
      )
      .one();

    if (
      earliestRow?.earliest !== null &&
      earliestRow?.earliest !== undefined &&
      earliestRow.earliest > priorStartDay
    ) {
      return { current, direction: "flat", percent: null, previous };
    }

    return toTrendResult(current, previous);
  }

  private buildFullDashboardSnapshotSync(): PublicDashboardSnapshot {
    return {
      at: isoNow(),
      dailyTrend: this.readDailyTrendSync(PACE_DAILY_TREND_DAYS),
      live: this.readPublicLiveStatsSync(),
      map: this.readMapPointsSync(50),
      paceTrends: this.readPaceTrendsSync(),
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

  private recomputeStats(): void {
    recomputeStatsLive(this.ctx.storage.sql);
  }

  private markBackfillStatsDirty(): void {
    setSyncMeta(this.ctx.storage.sql, "backfill_stats_dirty", "1");
  }

  private isBackfillStatsDirty(): boolean {
    return getSyncMeta(this.ctx.storage.sql, "backfill_stats_dirty") === "1";
  }

  private clearBackfillStatsDirty(): void {
    clearSyncMeta(this.ctx.storage.sql, "backfill_stats_dirty");
  }

  private readTotalRecordsForProgress(): number {
    const statsRow = this.ctx.storage.sql
      .exec<{ all_time_total: number }>(
        "SELECT all_time_total FROM stats_live WHERE id = ? LIMIT 1",
        STATS_LIVE_ID
      )
      .one();

    if (statsRow !== undefined && statsRow.all_time_total > 0) {
      return statsRow.all_time_total;
    }

    const countRow = this.ctx.storage.sql
      .exec<{ total: number }>("SELECT count(*) as total FROM infringements")
      .one();

    return countRow?.total ?? 0;
  }
}
