/** HTTP helpers for pushing local ParkingStore data to a remote worker. */

import {
  describeConnectionFailure,
  describeFetchFailure,
  fetchWithTimeout,
} from "@scripts/dev-env.ts";
import type { WorkerScriptContext } from "@scripts/lib/worker-client.ts";
import { bearerHeaders } from "@scripts/lib/worker-client.ts";
import { z } from "zod";

import { cleanInfringementSchema } from "@/server/clean-schema.ts";

const exportInfringementsSchema = z.object({
  nextCursor: z.number().nullable(),
  ok: z.boolean().optional(),
  records: z.array(cleanInfringementSchema),
  total: z.number(),
});

const exportWatermarksSchema = z.object({
  nextOffset: z.number().nullable(),
  ok: z.boolean().optional(),
  total: z.number(),
  watermarks: z.array(
    z.object({
      end: z.string(),
      ingestedAt: z.string(),
      recordCount: z.number(),
      start: z.string(),
    })
  ),
});

const importStoredSchema = z.object({
  ok: z.boolean().optional(),
  recordsReceived: z.number(),
  recordsUpserted: z.number(),
  totalRecords: z.number(),
});

export const fetchExportInfringements = async (
  ctx: WorkerScriptContext,
  after: number,
  limit: number
) => {
  const url = new URL("/api/v1/export/infringements", ctx.workerUrl);
  url.searchParams.set("after", String(after));
  url.searchParams.set("limit", String(limit));

  const response = await fetchWithTimeout(url.toString(), {
    headers: bearerHeaders(ctx.apiKey),
    timeoutMs: 60_000,
  });
  const rawBody: unknown = await response.json().catch(() => null);
  const parsed = exportInfringementsSchema.safeParse(rawBody);

  if (!response.ok || !parsed.success) {
    throw new Error(
      describeFetchFailure(response, rawBody, "GET", url.toString())
    );
  }

  return parsed.data;
};

export const postImportStored = async (
  ctx: WorkerScriptContext,
  records: z.infer<typeof cleanInfringementSchema>[],
  final: boolean
) => {
  const url = new URL("/api/v1/import/stored", ctx.workerUrl);
  const response = await fetchWithTimeout(url.toString(), {
    body: JSON.stringify({ final, records }),
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${ctx.apiKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
    timeoutMs: 120_000,
  });
  const rawBody: unknown = await response.json().catch(() => null);
  const parsed = importStoredSchema.safeParse(rawBody);

  if (!response.ok || !parsed.success) {
    throw new Error(
      describeFetchFailure(response, rawBody, "POST", url.toString())
    );
  }

  return parsed.data;
};

export const fetchExportWatermarks = async (
  ctx: WorkerScriptContext,
  offset: number,
  limit: number
) => {
  const url = new URL("/api/v1/export/watermarks", ctx.workerUrl);
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("limit", String(limit));

  const response = await fetchWithTimeout(url.toString(), {
    headers: bearerHeaders(ctx.apiKey),
    timeoutMs: 60_000,
  });
  const rawBody: unknown = await response.json().catch(() => null);
  const parsed = exportWatermarksSchema.safeParse(rawBody);

  if (!response.ok || !parsed.success) {
    throw new Error(
      describeFetchFailure(response, rawBody, "GET", url.toString())
    );
  }

  return parsed.data;
};

export const postImportWatermarks = async (
  ctx: WorkerScriptContext,
  watermarks: z.infer<typeof exportWatermarksSchema>["watermarks"]
) => {
  const url = new URL("/api/v1/import/watermarks", ctx.workerUrl);
  const response = await fetchWithTimeout(url.toString(), {
    body: JSON.stringify({ watermarks }),
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${ctx.apiKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
    timeoutMs: 120_000,
  });
  const rawBody: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      describeFetchFailure(response, rawBody, "POST", url.toString())
    );
  }
};

export const postFinalizeStoredImport = async (
  ctx: WorkerScriptContext
): Promise<void> => {
  const url = new URL("/api/v1/import/stored/finalize", ctx.workerUrl);

  try {
    const response = await fetchWithTimeout(url.toString(), {
      headers: bearerHeaders(ctx.apiKey),
      method: "POST",
      timeoutMs: 120_000,
    });
    const rawBody: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(
        describeFetchFailure(response, rawBody, "POST", url.toString())
      );
    }
  } catch (error) {
    throw new Error(describeConnectionFailure(error, "POST", url.toString()), {
      cause: error,
    });
  }
};
