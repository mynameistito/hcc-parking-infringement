import { Hono } from "hono";

import { nowInAucklandIso } from "@/lib/auckland-time.ts";
import { getCacheStatus } from "@/server/cache.ts";
import { storedJson } from "@/server/http/response.ts";
import type { AppEnv } from "@/server/http/response.ts";

export const createV1HealthRoutes = (): Hono<AppEnv> => {
  const routes = new Hono<AppEnv>();

  routes.get("/health/live", (c) =>
    c.json({
      status: "ok",
      timestamp: nowInAucklandIso(),
    })
  );

  routes.get("/health", async (c) => {
    const cache = await getCacheStatus(c.var.scope);
    return c.json({
      dataSource: cache.source,
      status: "ok",
      timestamp: nowInAucklandIso(),
      totalRecords: cache.totalRecords,
    });
  });

  routes.get("/cache", async (c) => {
    const cache = await getCacheStatus(c.var.scope);
    return storedJson(c, {
      meta: {
        description: c.var.scope.isSeedMode
          ? "Dashboard endpoints read from the R2 parking-store seed while PARKING_STORE_READ_SOURCE=seed."
          : "All dashboard endpoints serve data from ParkingStore. HCC Open Data is only contacted during background sync.",
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
