/** HTTP calls to backfill-related worker endpoints. */

import {
  describeConnectionFailure,
  describeFetchFailure,
  fetchWithTimeout,
} from "@scripts/dev-env.ts";
import {
  backfillHealthSchema,
  backfillResponseSchema,
  progressResponseSchema,
} from "@scripts/lib/backfill/schemas.ts";
import type {
  BackfillHealth,
  BackfillProgress,
  BackfillResponse,
} from "@scripts/lib/backfill/schemas.ts";
import type { WorkerScriptContext } from "@scripts/lib/worker/client.ts";
import { bearerHeaders } from "@scripts/lib/worker/client.ts";

/** Enqueue one backfill wave via `POST /api/v1/sync/backfill`. */
export const postBackfillWave = async (
  ctx: WorkerScriptContext,
  options: {
    chunkDays: string | undefined;
    currentFrom: string;
    delivery: string;
    force: boolean;
    from: string;
    granularity: string;
    to: string;
  }
): Promise<BackfillResponse | null> => {
  const url = new URL("/api/v1/sync/backfill", ctx.workerUrl);
  if (options.force) {
    url.searchParams.set("force", "true");
  }
  url.searchParams.set("delivery", options.delivery);
  url.searchParams.set("granularity", options.granularity);
  if (options.chunkDays !== undefined) {
    url.searchParams.set("chunkDays", options.chunkDays);
  }
  url.searchParams.set("from", options.currentFrom);
  url.searchParams.set("to", options.to);

  let response: Response;

  try {
    response = await fetchWithTimeout(url.toString(), {
      headers: bearerHeaders(ctx.apiKey),
      method: "POST",
      timeoutMs: options.delivery === "direct" ? 120_000 : undefined,
    });
  } catch (error) {
    console.error(describeConnectionFailure(error, "POST", url.toString()));
    process.exit(1);
  }

  const rawBody: unknown = await response.json().catch(() => null);
  const parsedBody = backfillResponseSchema.safeParse(rawBody);
  const body = parsedBody.success ? parsedBody.data : null;

  if (!response.ok) {
    console.error(
      describeFetchFailure(
        response,
        body?.error ?? rawBody,
        "POST",
        url.toString()
      )
    );
    process.exit(1);
  }

  return body;
};

/**
 * Fetch backfill progress for a date range.
 * Returns `{ kind: "unavailable" }` when the worker does not expose the endpoint (404).
 */
export const fetchBackfillProgress = async (
  ctx: WorkerScriptContext,
  start: string,
  end: string,
  granularity: string,
  chunkDays: string | undefined
): Promise<
  | { kind: "progress"; progress: BackfillProgress }
  | { kind: "unavailable"; status: number }
> => {
  const url = new URL(
    `${ctx.workerUrl}/api/v1/sync/backfill/progress`,
    ctx.workerUrl
  );
  url.searchParams.set("from", start);
  url.searchParams.set("to", end);
  url.searchParams.set("granularity", granularity);
  if (chunkDays !== undefined) {
    url.searchParams.set("chunkDays", chunkDays);
  }

  const response = await fetchWithTimeout(url.toString(), {
    headers: bearerHeaders(ctx.apiKey),
  });
  const rawBody: unknown = await response.json().catch(() => null);

  if (response.status === 404) {
    return { kind: "unavailable", status: response.status };
  }

  const parsed = progressResponseSchema.safeParse(rawBody);
  if (!response.ok || !parsed.success) {
    throw new Error(
      describeFetchFailure(response, rawBody, "GET", url.toString())
    );
  }

  return { kind: "progress", progress: parsed.data };
};

/** Fetch cache + sync status via `GET /api/v1/status` (progress fallback). */
export const fetchBackfillHealth = async (
  ctx: WorkerScriptContext
): Promise<BackfillHealth> => {
  const response = await fetchWithTimeout(`${ctx.workerUrl}/api/v1/status`, {
    headers: bearerHeaders(ctx.apiKey),
  });
  const rawBody: unknown = await response.json().catch(() => null);
  const parsed = backfillHealthSchema.safeParse(rawBody);

  if (!response.ok || !parsed.success) {
    throw new Error(
      describeFetchFailure(
        response,
        rawBody,
        "GET",
        `${ctx.workerUrl}/api/v1/status`
      )
    );
  }

  return parsed.data;
};
