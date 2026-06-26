/** Zod schemas and types for backfill CLI responses from the worker API. */

import { z } from "zod";

import { parseBackfillChunkDays } from "@/server/http/query.ts";

/** Response body from `POST /api/v1/sync/backfill`. */
export const backfillResponseSchema = z.object({
  chunkDays: z.number().optional(),
  continueFrom: z.string().nullable().optional(),
  delivery: z.enum(["direct", "queue"]).optional(),
  end: z.string().optional(),
  enqueued: z.number().optional(),
  error: z.string().optional(),
  ok: z.boolean().optional(),
  queueMessages: z.number().optional(),
  remaining: z.number().optional(),
  skipped: z.number().optional(),
  start: z.string().optional(),
  total: z.number().optional(),
});

export type BackfillResponse = z.infer<typeof backfillResponseSchema>;

/** Response body from `GET /api/v1/sync/backfill/progress`. */
export const progressResponseSchema = z.object({
  chunkDays: z.number(),
  completed: z.number(),
  end: z.string(),
  latestIngestedAt: z.string().nullable(),
  latestWindow: z
    .object({
      end: z.string(),
      start: z.string(),
    })
    .nullable(),
  ok: z.boolean().optional(),
  percent: z.number(),
  start: z.string(),
  total: z.number(),
  totalRecords: z.number(),
});

export type BackfillProgress = z.infer<typeof progressResponseSchema>;

/** Subset of `GET /api/v1/status` used by the backfill progress fallback. */
export const backfillHealthSchema = z.object({
  cache: z
    .object({
      ingestWindows: z.number(),
      totalRecords: z.number(),
    })
    .optional(),
  sync: z
    .object({
      endDate: z.string().optional(),
      recordsFetched: z.number().optional(),
      runType: z.string().optional(),
      startDate: z.string().optional(),
      status: z.string().optional(),
    })
    .nullable()
    .optional(),
});

export type BackfillHealth = z.infer<typeof backfillHealthSchema>;

/** Resolve chunk size from `--granularity` / `--chunkDays` query params. */
export const chunkDaysFor = (
  granularity: string,
  chunkDays: string | undefined
): number => parseBackfillChunkDays(granularity, chunkDays) ?? 7;
