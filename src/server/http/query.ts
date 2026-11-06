import type { TopGroupBy, TopWindow } from "@/durable-objects/types.ts";
import { BACKFILL_CHUNK_DAYS_DEFAULT } from "@/lib/backfill-constants.ts";

/**
 * Parses a positive integer prefix or uses a fallback.
 * @param value - The query parameter, if present.
 * @param fallback - The value to use when parsing fails or is not positive.
 * @returns The parsed integer or fallback.
 */
export const parsePositiveInt = (
  value: string | undefined,
  fallback: number
): number => {
  if (value === undefined || value === "") {
    return fallback;
  }

  // oxlint-disable-next-line unicorn/prefer-number-coercion -- This API accepts integer prefixes; Number would reject trailing text.
  const parsed = Number.parseInt(value, 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

/**
 * Selects how export totals are read.
 * @param value - The requested mode.
 * @returns `scan` for an explicit scan request, otherwise `cached`.
 */
export const parseExportTotalMode = (
  value: string | undefined
): "cached" | "scan" => (value === "scan" ? "scan" : "cached");

/**
 * Parses a nonnegative integer prefix or uses a fallback.
 * @param value - The query parameter, if present.
 * @param fallback - The value to use when parsing fails or is negative.
 * @returns The parsed integer or fallback.
 */
export const parseNonNegativeInt = (
  value: string | undefined,
  fallback: number
): number => {
  if (value === undefined || value === "") {
    return fallback;
  }

  // oxlint-disable-next-line unicorn/prefer-number-coercion -- This API accepts integer prefixes; Number would reject trailing text.
  const parsed = Number.parseInt(value, 10);

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

/**
 * Checks whether a date query parameter has the `YYYY-MM-DD` form.
 * @param value - The query parameter, if present.
 * @returns The input when it matches the form, otherwise undefined.
 */
export const parseDateParam = (
  value: string | undefined
): string | undefined => {
  if (value === undefined || value === "") {
    return undefined;
  }

  return /^\d{4}-\d{2}-\d{2}$/u.test(value) ? value : undefined;
};

/**
 * Interprets the supported truthy force-flag values.
 * @param value - The query parameter, if present.
 * @returns Whether the flag is enabled.
 */
export const parseForceFlag = (value: string | undefined): boolean =>
  value === "1" || value === "true" || value === "yes";

/**
 * Selects the browse sort order.
 * @param value - The requested sort order.
 * @returns `name` for an explicit name sort, otherwise `count`.
 */
export const parseBrowseSort = (value: string | undefined): "count" | "name" =>
  value === "name" ? "name" : "count";

/**
 * Trims an optional query value and discards an empty result.
 * @param value - The query parameter, if present.
 * @returns The trimmed value or undefined.
 */
export const optionalTrimmedQuery = (
  value: string | undefined
): string | undefined => {
  const trimmed = value?.trim();

  return trimmed !== undefined && trimmed !== "" ? trimmed : undefined;
};

/**
 * Builds browse options from query parameters, including pagination defaults.
 * @param query - A function that reads a named query parameter.
 * @returns Parsed search, sort, page, and limit options.
 */
export const parseBrowseQuery = (
  query: (key: string) => string | undefined
) => ({
  limit: Math.min(parsePositiveInt(query("limit"), 25), 100),
  page: parsePositiveInt(query("page"), 1),
  q: optionalTrimmedQuery(query("q")),
  sort: parseBrowseSort(query("sort")),
});

/**
 * Checks whether a query value names a supported top-stat grouping.
 * @param value - The query parameter, if present.
 * @returns Whether the value is a supported grouping.
 */
export const isTopGroupBy = (value: string | undefined): value is TopGroupBy =>
  value === "street" || value === "offence";

/**
 * Checks whether a query value names a supported top-stat window.
 * @param value - The requested window.
 * @returns Whether the value is a supported window.
 */
export const isTopWindow = (value: string): value is TopWindow =>
  value === "all" || value === "7d" || value === "30d";

/**
 * Resolves backfill window size from chunk and granularity parameters.
 * @param granularity - The requested named granularity.
 * @param chunkDays - An explicit chunk size, if provided.
 * @returns A positive chunk size or the configured default.
 */
export const parseBackfillChunkDays = (
  granularity: string | undefined,
  chunkDays: string | undefined
): number | undefined => {
  if (chunkDays !== undefined) {
    // oxlint-disable-next-line unicorn/prefer-number-coercion -- This API accepts integer prefixes; Number would reject trailing text.
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

/** Delivery modes for backfill work. */
export type BackfillDelivery = "direct" | "queue";

/**
 * Selects direct or queued backfill delivery.
 * @param value - The requested delivery mode.
 * @returns `queue` for an explicit queue request, otherwise `direct`.
 */
export const parseBackfillDelivery = (
  value: string | undefined
): BackfillDelivery => (value === "queue" ? "queue" : "direct");

/**
 * Checks that supplied backfill date parameters parsed successfully.
 * @param query - A function that reads a named query parameter.
 * @param from - The parsed start date, if valid.
 * @param to - The parsed end date, if valid.
 * @returns An error message for an invalid supplied date, otherwise undefined.
 */
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
