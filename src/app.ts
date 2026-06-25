import type { Context } from "hono";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import type { Env } from "./env.ts";
import { verifyApiKey, verifyApiKeyOrCronSecret } from "./server/auth.ts";
import { getCacheStatus } from "./server/cache.ts";
import {
  browseStreets,
  browseSuburbs,
  browseVehicles,
  exploreInfringements,
  getTopVehicles,
} from "./server/explore.ts";
import { geocodeMissingLocations } from "./server/geocode.ts";
import {
  getMapPoints,
  getTopStreets,
  getTopSuburbs,
} from "./server/locations.ts";
import {
  getPublicLiveStats,
  getPublicTopOffences,
  getPublicTopStreets,
} from "./server/public-stats.ts";
import {
  getDailyStats,
  getLiveStats,
  getTopStats,
  listInfringements,
} from "./server/stats.ts";
import type { TopGroupBy, TopWindow } from "./server/stats.ts";
import { getParkingStore } from "./server/store.ts";
import { getLatestSyncRun, hourlySync, startBackfill } from "./server/sync.ts";

interface AppEnv {
  Bindings: Env;
}

const app = new Hono<AppEnv>();

const STORED_HEADERS = {
  "Cache-Control": "public, max-age=60",
  "X-Data-Source": "stored",
} as const;

const storedJson = (c: Context<AppEnv>, body: unknown, status = 200) =>
  c.json(body, status, STORED_HEADERS);

const jsonError = (status: number, message: string) =>
  Response.json({ error: message }, { status });

const handleAppError = (error: Error, _c: Context<AppEnv>): Response => {
  if (error instanceof HTTPException) {
    return error.getResponse();
  }

  console.error(error);
  return jsonError(500, "Internal server error");
};

app.onError(handleAppError);

const assertApiKey = (request: Request, env: Env): void => {
  if (!verifyApiKey(request, env)) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }
};

const assertApiKeyOrCronSecret = (request: Request, env: Env): void => {
  if (!verifyApiKeyOrCronSecret(request, env)) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }
};

const parsePositiveInt = (
  value: string | undefined,
  fallback: number
): number => {
  if (value === undefined || value === "") {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const parseDateParam = (value: string | undefined): string | undefined => {
  if (value === undefined || value === "") {
    return undefined;
  }
  return /^\d{4}-\d{2}-\d{2}$/u.test(value) ? value : undefined;
};

const parseForceFlag = (value: string | undefined): boolean =>
  value === "1" || value === "true" || value === "yes";

const parseBrowseSort = (value: string | undefined): "count" | "name" =>
  value === "name" ? "name" : "count";

const optionalTrimmedQuery = (
  value: string | undefined
): string | undefined => {
  const trimmed = value?.trim();
  return trimmed !== undefined && trimmed !== "" ? trimmed : undefined;
};

const isTopGroupBy = (value: string | undefined): value is TopGroupBy =>
  value === "street" || value === "offence";

const isTopWindow = (value: string): value is TopWindow =>
  value === "all" || value === "7d" || value === "30d";

app.get("/api/health", async (c) => {
  const cache = await getCacheStatus(c.env);
  return c.json({
    dataSource: cache.source,
    status: "ok",
    timestamp: new Date().toISOString(),
    totalRecords: cache.totalRecords,
  });
});

app.get("/api/public/cache", async (c) => {
  const cache = await getCacheStatus(c.env);
  return storedJson(c, {
    meta: {
      description:
        "All public endpoints serve data from ParkingStore. HCC Open Data is only contacted during background sync.",
      ingestWindows: cache.ingestWindows,
      lastHccFetchAt: cache.lastHccFetchAt,
      lastSyncedAt: cache.lastSyncedAt,
      source: cache.source,
      totalRecords: cache.totalRecords,
    },
  });
});

app.get("/api/public/stats/live", async (c) => {
  try {
    const data = await getPublicLiveStats(c.env);
    return storedJson(c, {
      data,
      meta: { source: "stored" },
    });
  } catch (error) {
    console.error("public live stats error", error);
    return jsonError(500, "Failed to load live stats");
  }
});

app.get("/api/public/live/ws", async (c) => {
  const stub = getParkingStore(c.env);
  return await stub.fetch(c.req.raw);
});

app.get("/api/public/stats/top", async (c) => {
  const groupBy = c.req.query("groupBy") ?? "street";
  const limit = Math.min(parsePositiveInt(c.req.query("limit"), 5), 20);

  if (groupBy !== "street" && groupBy !== "offence") {
    return jsonError(400, "groupBy must be street or offence");
  }

  try {
    const items =
      groupBy === "street"
        ? await getPublicTopStreets(c.env, limit)
        : await getPublicTopOffences(c.env, limit);

    return storedJson(c, {
      data: { groupBy, items },
      meta: { source: "stored" },
    });
  } catch (error) {
    console.error("public top stats error", error);
    return jsonError(500, "Failed to load top stats");
  }
});

app.get("/api/public/locations/streets", async (c) => {
  const limit = Math.min(parsePositiveInt(c.req.query("limit"), 10), 50);
  const streets = await getTopStreets(c.env, limit);
  return storedJson(c, { data: streets, meta: { source: "stored" } });
});

app.get("/api/public/locations/suburbs", async (c) => {
  const limit = Math.min(parsePositiveInt(c.req.query("limit"), 10), 50);
  const suburbs = await getTopSuburbs(c.env, limit);
  return storedJson(c, { data: suburbs, meta: { source: "stored" } });
});

app.get("/api/public/locations/map", async (c) => {
  const limit = Math.min(parsePositiveInt(c.req.query("limit"), 50), 100);
  c.executionCtx.waitUntil(geocodeMissingLocations(c.env, 25));
  const map = await getMapPoints(c.env, limit);
  return storedJson(c, {
    data: map,
    meta: {
      geocoder: "Overpass (Hamilton)",
      mapTiles: "OpenStreetMap",
      source: "stored",
    },
  });
});

app.get("/api/public/vehicles/top", async (c) => {
  const limit = Math.min(parsePositiveInt(c.req.query("limit"), 10), 50);
  const vehicles = await getTopVehicles(c.env, limit);
  return storedJson(c, { data: vehicles, meta: { source: "stored" } });
});

app.get("/api/public/browse/suburbs", async (c) => {
  const result = await browseSuburbs(c.env, {
    limit: Math.min(parsePositiveInt(c.req.query("limit"), 25), 100),
    page: parsePositiveInt(c.req.query("page"), 1),
    q: optionalTrimmedQuery(c.req.query("q")),
    sort: parseBrowseSort(c.req.query("sort")),
  });
  return storedJson(c, { meta: { source: "stored" }, ...result });
});

app.get("/api/public/browse/streets", async (c) => {
  const result = await browseStreets(c.env, {
    limit: Math.min(parsePositiveInt(c.req.query("limit"), 25), 100),
    page: parsePositiveInt(c.req.query("page"), 1),
    q: optionalTrimmedQuery(c.req.query("q")),
    sort: parseBrowseSort(c.req.query("sort")),
    suburb: optionalTrimmedQuery(c.req.query("suburb")),
  });
  return storedJson(c, { meta: { source: "stored" }, ...result });
});

app.get("/api/public/browse/vehicles", async (c) => {
  const result = await browseVehicles(c.env, {
    limit: Math.min(parsePositiveInt(c.req.query("limit"), 25), 100),
    page: parsePositiveInt(c.req.query("page"), 1),
    q: optionalTrimmedQuery(c.req.query("q")),
    sort: parseBrowseSort(c.req.query("sort")),
  });
  return storedJson(c, { meta: { source: "stored" }, ...result });
});

app.get("/api/public/explore/suburbs/:suburb/streets", async (c) => {
  const suburb = decodeURIComponent(c.req.param("suburb")).trim();
  if (suburb === "") {
    return jsonError(400, "suburb required");
  }
  const result = await browseStreets(c.env, {
    limit: Math.min(parsePositiveInt(c.req.query("limit"), 25), 100),
    page: parsePositiveInt(c.req.query("page"), 1),
    q: optionalTrimmedQuery(c.req.query("q")),
    sort: parseBrowseSort(c.req.query("sort")),
    suburb,
  });
  return storedJson(c, { meta: { source: "stored", suburb }, ...result });
});

app.get("/api/public/explore/infringements", async (c) => {
  const page = parsePositiveInt(c.req.query("page"), 1);
  const limit = Math.min(parsePositiveInt(c.req.query("limit"), 15), 50);
  const street = optionalTrimmedQuery(c.req.query("street"));
  const suburb = optionalTrimmedQuery(c.req.query("suburb"));
  const vehicleMake = optionalTrimmedQuery(c.req.query("vehicleMake"));
  const vehicleModel = optionalTrimmedQuery(c.req.query("vehicleModel"));

  if (
    street === undefined &&
    suburb === undefined &&
    vehicleMake === undefined
  ) {
    return jsonError(
      400,
      "At least one of street, suburb, or vehicleMake is required"
    );
  }

  const result = await exploreInfringements(c.env, {
    limit,
    page,
    street,
    suburb,
    vehicleMake,
    vehicleModel,
  });

  return storedJson(c, { meta: { source: "stored" }, ...result });
});

app.get("/api/v1/cache/status", async (c) => {
  assertApiKey(c.req.raw, c.env);
  const cache = await getCacheStatus(c.env);
  return storedJson(c, {
    ...cache,
    hccFetchPolicy: {
      backfill: "skips already-ingested windows",
      force: "POST /api/v1/sync/backfill?force=true",
      hourly: "last 2 days only",
    },
  });
});

app.get("/api/v1/stats/live", async (c) => {
  assertApiKey(c.req.raw, c.env);
  const stats = await getLiveStats(c.env);
  return storedJson(c, { meta: { source: "stored" }, ...stats });
});

app.get("/api/v1/stats/daily", async (c) => {
  assertApiKey(c.req.raw, c.env);
  const from = parseDateParam(c.req.query("from"));
  const to = parseDateParam(c.req.query("to"));

  if (from === undefined || to === undefined) {
    return jsonError(400, "from and to query params required (YYYY-MM-DD)");
  }

  const stats = await getDailyStats(c.env, from, to);
  return storedJson(c, { data: stats, from, meta: { source: "stored" }, to });
});

app.get("/api/v1/stats/top", async (c) => {
  assertApiKey(c.req.raw, c.env);
  const groupByParam = c.req.query("groupBy");
  const windowParam = c.req.query("window") ?? "all";
  const limit = parsePositiveInt(c.req.query("limit"), 10);

  if (!isTopGroupBy(groupByParam)) {
    return jsonError(400, "groupBy must be street or offence");
  }
  if (!isTopWindow(windowParam)) {
    return jsonError(400, "window must be all, 7d, or 30d");
  }

  const data = await getTopStats(
    c.env,
    groupByParam,
    windowParam,
    Math.min(limit, 100)
  );
  return storedJson(c, {
    data,
    groupBy: groupByParam,
    limit,
    meta: { source: "stored" },
    window: windowParam,
  });
});

app.get("/api/v1/infringements", async (c) => {
  assertApiKey(c.req.raw, c.env);
  const page = parsePositiveInt(c.req.query("page"), 1);
  const limit = Math.min(parsePositiveInt(c.req.query("limit"), 50), 200);
  const from = parseDateParam(c.req.query("from"));
  const to = parseDateParam(c.req.query("to"));
  const street = optionalTrimmedQuery(c.req.query("street"));
  const suburb = optionalTrimmedQuery(c.req.query("suburb"));
  const vehicleMake = optionalTrimmedQuery(c.req.query("vehicleMake"));
  const vehicleModel = optionalTrimmedQuery(c.req.query("vehicleModel"));

  const result = await listInfringements(c.env, {
    from,
    limit,
    page,
    street,
    suburb,
    to,
    vehicleMake,
    vehicleModel,
  });

  return storedJson(c, { meta: { source: "stored" }, ...result });
});

app.get("/api/v1/health", async (c) => {
  assertApiKey(c.req.raw, c.env);
  const [latestRun, cache] = await Promise.all([
    getLatestSyncRun(c.env),
    getCacheStatus(c.env),
  ]);

  return storedJson(c, {
    cache,
    status: "ok",
    sync: latestRun
      ? {
          endDate: latestRun.windowEnd,
          errorMessage: latestRun.error,
          finishedAt: latestRun.finishedAt,
          id: latestRun.id,
          recordsFetched: latestRun.fetched,
          recordsUpserted: latestRun.inserted + latestRun.updated,
          runType: latestRun.runType,
          startDate: latestRun.windowStart,
          startedAt: latestRun.startedAt,
          status: latestRun.status,
        }
      : null,
  });
});

app.post("/api/v1/sync", async (c) => {
  assertApiKeyOrCronSecret(c.req.raw, c.env);

  try {
    const result = await hourlySync(c.env, "manual");
    return c.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return jsonError(500, message);
  }
});

app.post("/api/v1/sync/backfill", async (c) => {
  assertApiKey(c.req.raw, c.env);

  try {
    const force = parseForceFlag(c.req.query("force"));
    const result = await startBackfill(c.env, { force });
    return c.json({ force, ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return jsonError(500, message);
  }
});

app.post("/api/v1/geocode/run", async (c) => {
  assertApiKey(c.req.raw, c.env);
  const limit = Math.min(parsePositiveInt(c.req.query("limit"), 50), 100);
  const result = await geocodeMissingLocations(c.env, limit);
  return c.json({ ok: true, ...result });
});

app.notFound(async (c) => {
  if (!c.req.path.startsWith("/api/")) {
    return await c.env.ASSETS.fetch(c.req.raw);
  }
  return jsonError(404, "Not found");
});

export { app };
