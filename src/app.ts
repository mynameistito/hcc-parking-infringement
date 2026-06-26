import type { Context } from "hono";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import { jsonError } from "@/server/http/response.ts";
import type { AppEnv } from "@/server/http/response.ts";
import { createV1Routes } from "@/server/http/routes/v1.ts";

const app = new Hono<AppEnv>();

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
