import { Hono } from "hono";

import { toPublicInfringementList } from "@/contracts/projections.ts";
import { getTopVehicles } from "@/server/explore.ts";
import { geocodeMissingLocations } from "@/server/geocode.ts";
import { parsePositiveInt } from "@/server/http/query.ts";
import { storedJson } from "@/server/http/response.ts";
import type { AppEnv } from "@/server/http/response.ts";
import {
  getMapPoints,
  getTopStreets,
  getTopSuburbs,
} from "@/server/locations.ts";
import { listInfringements } from "@/server/stats.ts";

/** Public dashboard data: locations, vehicles, recent infringements. */
export const createV1PublicRoutes = (): Hono<AppEnv> => {
  const routes = new Hono<AppEnv>();

  routes.get("/locations/streets", async (c) => {
    const limit = Math.min(parsePositiveInt(c.req.query("limit"), 10), 50);
    const streets = await getTopStreets(c.env, limit);
    return storedJson(c, { data: streets, meta: { source: "stored" } });
  });

  routes.get("/locations/suburbs", async (c) => {
    const limit = Math.min(parsePositiveInt(c.req.query("limit"), 10), 50);
    const suburbs = await getTopSuburbs(c.env, limit);
    return storedJson(c, { data: suburbs, meta: { source: "stored" } });
  });

  routes.get("/locations/map", async (c) => {
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

  routes.get("/vehicles/top", async (c) => {
    const limit = Math.min(parsePositiveInt(c.req.query("limit"), 10), 50);
    const vehicles = await getTopVehicles(c.env, limit);
    return storedJson(c, { data: vehicles, meta: { source: "stored" } });
  });

  routes.get("/infringements/recent", async (c) => {
    const limit = Math.min(parsePositiveInt(c.req.query("limit"), 15), 50);
    const result = await listInfringements(c.env, {
      limit,
      page: 1,
    });
    return storedJson(c, {
      meta: { source: "stored" },
      ...result,
      data: toPublicInfringementList(result.data),
    });
  });

  return routes;
};
