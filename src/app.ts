import type { Context, MiddlewareHandler } from "hono";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import { createAppScope } from "@/server/app-scope.ts";
import { jsonError } from "@/server/http/response.ts";
import type { AppEnv } from "@/server/http/response.ts";
import { createV1Routes } from "@/server/http/routes/v1.ts";

const attachAppScope: MiddlewareHandler<AppEnv> = async (c, next) => {
  c.set("scope", createAppScope(c.env));
  // eslint-disable-next-line node/callback-return -- Hono middleware awaits `next()` without returning it.
  await next();
};

const app = new Hono<AppEnv>();

app.use("*", attachAppScope);

const handleAppError = (error: Error, _c: Context<AppEnv>): Response => {
  if (error instanceof HTTPException) {
    return error.getResponse();
  }

  console.error(error);
  return jsonError(500, "Internal server error");
};

app.onError(handleAppError);
app.route("/api/v1", createV1Routes());
app.notFound((c) => c.json({ error: "Not found" }, 404));

export { app };
