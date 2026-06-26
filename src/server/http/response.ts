import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

interface AppEnv {
  Bindings: Env;
}

export const STORED_HEADERS = {
  "Cache-Control": "public, max-age=60",
  "X-Data-Source": "stored",
} as const;

export const storedJson = (
  c: Context<AppEnv>,
  body: unknown,
  status: ContentfulStatusCode = 200
) => c.json(body, status, STORED_HEADERS);

export const jsonError = (status: number, message: string) =>
  Response.json({ error: message }, { status });

export type { AppEnv };
