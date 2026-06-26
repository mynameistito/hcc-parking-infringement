import { Hono } from "hono";

import { toPublicInfringementList } from "@/contracts/projections.ts";
import {
  browseStreets,
  browseSuburbs,
  browseVehicles,
  exploreInfringements,
} from "@/server/explore.ts";
import {
  optionalTrimmedQuery,
  parseBrowseQuery,
  parsePositiveInt,
} from "@/server/http/query.ts";
import { jsonError, storedJson } from "@/server/http/response.ts";
import type { AppEnv } from "@/server/http/response.ts";

export const createV1BrowseRoutes = (): Hono<AppEnv> => {
  const routes = new Hono<AppEnv>();

  routes.get("/browse/suburbs", async (c) => {
    const result = await browseSuburbs(
      c.env,
      parseBrowseQuery((key) => c.req.query(key))
    );
    return storedJson(c, { meta: { source: "stored" }, ...result });
  });

  routes.get("/browse/streets", async (c) => {
    const result = await browseStreets(c.env, {
      ...parseBrowseQuery((key) => c.req.query(key)),
      suburb: optionalTrimmedQuery(c.req.query("suburb")),
    });
    return storedJson(c, { meta: { source: "stored" }, ...result });
  });

  routes.get("/browse/vehicles", async (c) => {
    const result = await browseVehicles(
      c.env,
      parseBrowseQuery((key) => c.req.query(key))
    );
    return storedJson(c, { meta: { source: "stored" }, ...result });
  });

  routes.get("/explore/suburbs/:suburb/streets", async (c) => {
    const suburb = decodeURIComponent(c.req.param("suburb")).trim();
    if (suburb === "") {
      return jsonError(400, "suburb required");
    }
    const result = await browseStreets(c.env, {
      ...parseBrowseQuery((key) => c.req.query(key)),
      suburb,
    });
    return storedJson(c, { meta: { source: "stored", suburb }, ...result });
  });

  routes.get("/explore/infringements", async (c) => {
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

    return storedJson(c, {
      meta: { source: "stored" },
      ...result,
      data: toPublicInfringementList(result.data),
    });
  });

  return routes;
};
