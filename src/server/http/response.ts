import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

import type { AppScope } from "@/server/app-scope.ts";

interface AppEnv {
  Bindings: Env;
  Variables: {
    scope: AppScope;
  };
}

const STORED_HEADERS = {
  "Cache-Control": "public, max-age=60",
  "X-Data-Source": "stored",
} as const;

/**
 * Sends a JSON response with headers identifying cached stored data.
 * @param c - The request context used to construct the response.
 * @param body - The response body to serialize.
 * @param status - The HTTP status to return.
 * @returns The JSON response with stored-data cache headers.
 */
export const storedJson = (
  c: Context<AppEnv>,
  body: unknown,
  status: ContentfulStatusCode = 200
) => c.json(body, status, STORED_HEADERS);

/**
 * Constructs a JSON error response.
 * @param status - The HTTP status to return.
 * @param message - The error message to include.
 * @returns The JSON error response.
 */
export const jsonError = (status: number, message: string) =>
  Response.json({ error: message }, { status });

export type { AppEnv };
