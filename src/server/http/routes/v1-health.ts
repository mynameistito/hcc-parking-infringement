import { Hono } from "hono";

import { getCacheStatus } from "@/server/cache.ts";
import { storedJson } from "@/server/http/response.ts";
import type { AppEnv } from "@/server/http/response.ts";

/** Health and cache metadata routes. */
export const createV1HealthRoutes = (): Hono<AppEnv> => {
  const routes = new Hono<AppEnv>();

  routes.get("/health", async (c) => {
    const cache = await getCacheStatus(c.env);
    return c.json({
      dataSource: cache.source,
      status: "ok",
      timestamp: new Date().toISOString(),
      totalRecords: cache.totalRecords,
    });
  });

  routes.get("/cache", async (c) => {
    const cache = await getCacheStatus(c.env);
    return storedJson(c, {
      meta: {
        description:
          "All dashboard endpoints serve data from ParkingStore. HCC Open Data is only contacted during background sync.",
        ingestWindows: cache.ingestWindows,
        lastHccFetchAt: cache.lastHccFetchAt,
        lastSyncedAt: cache.lastSyncedAt,
        source: cache.source,
        totalRecords: cache.totalRecords,
      },
    });
  });

  return routes;
};
