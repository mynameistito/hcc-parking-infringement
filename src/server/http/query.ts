import type { TopGroupBy, TopWindow } from "@/durable-objects/types.ts";
import { BACKFILL_CHUNK_DAYS_DEFAULT } from "@/lib/backfill-constants.ts";

/** Parse a positive integer query param with fallback. */
export const parsePositiveInt = (
  value: string | undefined,
  fallback: number
): number => {
  if (value === undefined || value === "") {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const parseExportTotalMode = (
  value: string | undefined
): "cached" | "scan" => (value === "scan" ? "scan" : "cached");

export const parseNonNegativeInt = (
  value: string | undefined,
  fallback: number
): number => {
  if (value === undefined || value === "") {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

/** Parse `YYYY-MM-DD` date query param; returns undefined when invalid. */
export const parseDateParam = (
  value: string | undefined
): string | undefined => {
  if (value === undefined || value === "") {
    return undefined;
  }
  return /^\d{4}-\d{2}-\d{2}$/u.test(value) ? value : undefined;
};

/** Parse common truthy force-flag query values. */
export const parseForceFlag = (value: string | undefined): boolean =>
  value === "1" || value === "true" || value === "yes";

export const parseBrowseSort = (value: string | undefined): "count" | "name" =>
  value === "name" ? "name" : "count";

export const optionalTrimmedQuery = (
  value: string | undefined
): string | undefined => {
  const trimmed = value?.trim();
  return trimmed !== undefined && trimmed !== "" ? trimmed : undefined;
};

export const parseBrowseQuery = (
  query: (key: string) => string | undefined
) => ({
  limit: Math.min(parsePositiveInt(query("limit"), 25), 100),
  page: parsePositiveInt(query("page"), 1),
  q: optionalTrimmedQuery(query("q")),
  sort: parseBrowseSort(query("sort")),
});

export const isTopGroupBy = (value: string | undefined): value is TopGroupBy =>
  value === "street" || value === "offence";

export const isTopWindow = (value: string): value is TopWindow =>
  value === "all" || value === "7d" || value === "30d";

/** Resolve backfill window size from granularity/chunkDays query params. */
export const parseBackfillChunkDays = (
  granularity: string | undefined,
  chunkDays: string | undefined
): number | undefined => {
  if (chunkDays !== undefined) {
    const parsed = Number.parseInt(chunkDays, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  if (granularity === "day") {
    return 1;
  }

  if (granularity === "week") {
    return 7;
  }

  if (granularity === "month") {
    return 30;
  }

  return BACKFILL_CHUNK_DAYS_DEFAULT;
};

export type BackfillDelivery = "direct" | "queue";

/** How backfill work is scheduled: inline processing or Cloudflare Queue. */
export const parseBackfillDelivery = (
  value: string | undefined
): BackfillDelivery => (value === "queue" ? "queue" : "direct");

/** Validate optional from/to backfill query params; returns an error message when invalid. */
export const parseBackfillDateRange = (
  query: (key: string) => string | undefined,
  from: string | undefined,
  to: string | undefined
): string | undefined => {
  if (query("from") !== undefined && from === undefined) {
    return "from must be YYYY-MM-DD";
  }

  if (query("to") !== undefined && to === undefined) {
    return "to must be YYYY-MM-DD";
  }

  return undefined;
};
