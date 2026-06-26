import { Hono } from "hono";

import type { AppEnv } from "@/server/http/response.ts";
import { createV1AdminRoutes } from "@/server/http/routes/v1-admin.ts";
import { createV1BrowseRoutes } from "@/server/http/routes/v1-browse.ts";
import { createV1HealthRoutes } from "@/server/http/routes/v1-health.ts";
import { createV1PublicRoutes } from "@/server/http/routes/v1-public.ts";
import { createV1StatsRoutes } from "@/server/http/routes/v1-stats.ts";

/** Hono router for `/api/v1` public and gated endpoints. */
export const createV1Routes = (): Hono<AppEnv> => {
  const v1 = new Hono<AppEnv>();

  v1.route("/", createV1HealthRoutes());
  v1.route("/", createV1StatsRoutes());
  v1.route("/", createV1PublicRoutes());
  v1.route("/", createV1BrowseRoutes());
  v1.route("/", createV1AdminRoutes());

  return v1;
};
