import { Hono } from "hono";

import { PACE_DAILY_TREND_DAYS } from "@/lib/pace-constants.ts";
import { verifyApiKey } from "@/server/auth.ts";
import { assertApiKey } from "@/server/http/auth-guards.ts";
import {
  isTopGroupBy,
  isTopWindow,
  parseDateParam,
  parsePositiveInt,
} from "@/server/http/query.ts";
import { jsonError, storedJson } from "@/server/http/response.ts";
import type { AppEnv } from "@/server/http/response.ts";
import {
  getPublicDailyTrend,
  getPublicLiveStats,
  getPublicTopOffences,
  getPublicTopStreets,
} from "@/server/public-stats.ts";
import { getDailyStats, getLiveStats, getTopStats } from "@/server/stats.ts";
import { getParkingStore } from "@/server/store.ts";

/** Live stats, daily trends, top lists, and WebSocket upgrade. */
export const createV1StatsRoutes = (): Hono<AppEnv> => {
  const routes = new Hono<AppEnv>();

  routes.get("/stats/live", async (c) => {
    if (verifyApiKey(c.req.raw, c.env)) {
      const stats = await getLiveStats(c.env);
      return storedJson(c, { meta: { source: "stored" }, ...stats });
    }

    try {
      const data = await getPublicLiveStats(c.env);
      return storedJson(c, {
        data,
        meta: { source: "stored" },
      });
    } catch (error) {
      console.error("live stats error", error);
      return jsonError(500, "Failed to load live stats");
    }
  });

  routes.get("/stats/daily", async (c) => {
    const from = parseDateParam(c.req.query("from"));
    const to = parseDateParam(c.req.query("to"));

    if (from !== undefined || to !== undefined) {
      assertApiKey(c.req.raw, c.env);

      if (from === undefined || to === undefined) {
        return jsonError(400, "from and to query params required (YYYY-MM-DD)");
      }

      const stats = await getDailyStats(c.env, from, to);
      return storedJson(c, {
        data: stats,
        from,
        meta: { source: "stored" },
        to,
      });
    }

    const days = Math.min(
      parsePositiveInt(c.req.query("days"), PACE_DAILY_TREND_DAYS),
      PACE_DAILY_TREND_DAYS
    );

    try {
      const data = await getPublicDailyTrend(c.env, days);
      return storedJson(c, {
        data,
        meta: { days, source: "stored" },
      });
    } catch (error) {
      console.error("daily stats error", error);
      return jsonError(500, "Failed to load daily stats");
    }
  });

  routes.get("/live/ws", async (c) => {
    const stub = getParkingStore(c.env);
    return await stub.fetch(c.req.raw);
  });

  routes.get("/stats/top", async (c) => {
    const groupByParam = c.req.query("groupBy") ?? "street";
    const windowParam = c.req.query("window");
    const limit = Math.min(
      parsePositiveInt(
        c.req.query("limit"),
        windowParam === undefined ? 5 : 10
      ),
      windowParam === undefined ? 20 : 100
    );

    if (windowParam !== undefined) {
      assertApiKey(c.req.raw, c.env);

      if (!isTopGroupBy(groupByParam)) {
        return jsonError(400, "groupBy must be street or offence");
      }
      if (!isTopWindow(windowParam)) {
        return jsonError(400, "window must be all, 7d, or 30d");
      }

      const data = await getTopStats(c.env, groupByParam, windowParam, limit);
      return storedJson(c, {
        data,
        groupBy: groupByParam,
        limit,
        meta: { source: "stored" },
        window: windowParam,
      });
    }

    if (groupByParam !== "street" && groupByParam !== "offence") {
      return jsonError(400, "groupBy must be street or offence");
    }

    try {
      const items =
        groupByParam === "street"
          ? await getPublicTopStreets(c.env, limit)
          : await getPublicTopOffences(c.env, limit);

      return storedJson(c, {
        data: { groupBy: groupByParam, items },
        meta: { source: "stored" },
      });
    } catch (error) {
      console.error("top stats error", error);
      return jsonError(500, "Failed to load top stats");
    }
  });

  return routes;
};
