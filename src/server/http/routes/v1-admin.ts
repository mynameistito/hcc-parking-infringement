import { Hono } from "hono";

import { todayInAuckland } from "@/lib/auckland-time.ts";
import { getBackfillProgress } from "@/server/backfill-progress.ts";
import { getCacheStatus } from "@/server/cache.ts";
import { geocodeMissingLocations } from "@/server/geocode.ts";
import {
  assertApiKey,
  assertApiKeyOrCronSecret,
} from "@/server/http/auth-guards.ts";
import {
  optionalTrimmedQuery,
  parseBackfillChunkDays,
  parseBackfillDateRange,
  parseDateParam,
  parseForceFlag,
  parsePositiveInt,
} from "@/server/http/query.ts";
import { jsonError, storedJson } from "@/server/http/response.ts";
import type { AppEnv } from "@/server/http/response.ts";
import { importInfringements } from "@/server/import.ts";
import { listInfringements } from "@/server/stats.ts";
import {
  BACKFILL_EARLIEST,
  getLatestSyncRun,
  hourlySync,
  startBackfill,
} from "@/server/sync.ts";

export const createV1AdminRoutes = (): Hono<AppEnv> => {
  const routes = new Hono<AppEnv>();

  routes.get("/cache/status", async (c) => {
    assertApiKey(c.req.raw, c.env);
    const cache = await getCacheStatus(c.env);
    return storedJson(c, {
      ...cache,
      hccFetchPolicy: {
        backfill: "skips already-ingested windows",
        dailyBackfill: `POST /api/v1/sync/backfill?granularity=week&from=${BACKFILL_EARLIEST}`,
        force: "POST /api/v1/sync/backfill?force=true",
        hourly: "last 7 days only",
      },
    });
  });

  routes.get("/infringements", async (c) => {
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

  routes.get("/status", async (c) => {
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

  routes.post("/sync", async (c) => {
    assertApiKeyOrCronSecret(c.req.raw, c.env);

    try {
      const result = await hourlySync(c.env, "manual");
      return c.json({ ok: true, ...result });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return jsonError(500, message);
    }
  });

  routes.get("/sync/backfill/progress", async (c) => {
    assertApiKey(c.req.raw, c.env);

    const from = parseDateParam(c.req.query("from")) ?? BACKFILL_EARLIEST;
    const to = parseDateParam(c.req.query("to")) ?? todayInAuckland();
    const chunkDays = parseBackfillChunkDays(
      c.req.query("granularity"),
      c.req.query("chunkDays")
    );

    const rangeError = parseBackfillDateRange(
      (key) => c.req.query(key),
      from,
      to
    );
    if (rangeError !== undefined) {
      return jsonError(400, rangeError);
    }

    try {
      const progress = await getBackfillProgress(c.env, {
        chunkDays,
        end: to,
        start: from,
      });
      return storedJson(c, { ok: true, ...progress });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return jsonError(500, message);
    }
  });

  routes.post("/sync/backfill", async (c) => {
    assertApiKey(c.req.raw, c.env);

    try {
      const force = parseForceFlag(c.req.query("force"));
      const from = parseDateParam(c.req.query("from"));
      const to = parseDateParam(c.req.query("to"));
      const chunkDays = parseBackfillChunkDays(
        c.req.query("granularity"),
        c.req.query("chunkDays")
      );

      const rangeError = parseBackfillDateRange(
        (key) => c.req.query(key),
        from,
        to
      );
      if (rangeError !== undefined) {
        return jsonError(400, rangeError);
      }

      const result = await startBackfill(c.env, {
        chunkDays,
        end: to,
        force,
        start: from,
      });
      return c.json({ force, ok: true, ...result });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return jsonError(500, message);
    }
  });

  routes.post("/import/infringements", async (c) => {
    assertApiKey(c.req.raw, c.env);

    try {
      const body: unknown = await c.req.json();
      const result = await importInfringements(c.env, body);
      return c.json({ ok: true, ...result });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return jsonError(400, message);
    }
  });

  routes.post("/geocode/run", async (c) => {
    assertApiKey(c.req.raw, c.env);
    const limit = Math.min(parsePositiveInt(c.req.query("limit"), 50), 100);
    const result = await geocodeMissingLocations(c.env, limit);
    return c.json({ ok: true, ...result });
  });

  return routes;
};
