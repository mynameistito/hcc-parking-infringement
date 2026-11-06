import type { JSONValue } from "hono/utils/types";
import { z } from "zod";

const httpErrorSchema = z.object({ error: z.string() });

const DO_SQLITE_QUOTA_PATTERN =
  /exceeded allowed rows (?:read|written) in durable objects free tier/iu;

const TRANSIENT_ERROR_PATTERNS = [
  /durable object/iu,
  /failed to reach/iu,
  /network connection/iu,
  /connection (?:reset|closed|refused)/iu,
  /timed? ?out/iu,
  /overloaded/iu,
  /\b5\d{2}\b/u,
  /\b429\b/u,
  /temporarily unavailable/iu,
  /service unavailable/iu,
  /econnreset/iu,
  /enotfound/iu,
] as const;

const formatErrorMessage = (cause: unknown): string =>
  cause instanceof Error ? `${cause.name}: ${cause.message}` : String(cause);

/**
 * Extracts a string error field from an untrusted HTTP response body.
 * @param rawBody - Parsed response body of unknown shape.
 * @returns The error message, or undefined when absent or not a string.
 */
export const extractHttpErrorMessage = (
  rawBody: JSONValue
): string | undefined => {
  const parsed = httpErrorSchema.safeParse(rawBody);

  return parsed.success ? parsed.data.error : undefined;
};

/**
 * Checks for the Durable Object SQLite daily quota, which is not retryable.
 * @param cause - Error or other thrown value to inspect.
 * @returns Whether the quota message is present.
 */
export const isDoSqliteQuotaError = (cause: unknown): boolean => {
  const message = formatErrorMessage(cause);

  return DO_SQLITE_QUOTA_PATTERN.test(message);
};

/**
 * Checks an HTTP response body for the Durable Object SQLite quota message.
 * @param rawBody - Parsed response body of unknown shape.
 * @returns Whether the body contains the quota message.
 */
export const isDoSqliteQuotaResponse = (rawBody: JSONValue): boolean => {
  const message = extractHttpErrorMessage(rawBody);

  return message !== undefined && DO_SQLITE_QUOTA_PATTERN.test(message);
};

/**
 * Provides operator guidance for a Durable Object SQLite quota failure.
 * @returns The explanatory message and recovery command.
 */
export const describeDoSqliteQuotaError = (): string =>
  [
    "The deployed ParkingStore Durable Object hit the Workers Free plan SQLite quota.",
    "Reads and writes are blocked until the daily limit resets (00:00 UTC) or you upgrade to Workers Paid.",
    "For ~657k records you need Workers Paid (free tier allows ~5M row reads and ~100k row writes per day).",
    "After upgrading or quota reset, rerun: bun run push:local -- --from-port=8787",
  ].join("\n");

/**
 * Checks whether a queue, Durable Object, or network error merits a retry.
 * @param cause - Error or other thrown value to inspect.
 * @returns Whether the failure appears transient.
 */
export const isRetryableError = (cause: unknown): boolean => {
  if (isDoSqliteQuotaError(cause)) {
    return false;
  }

  const message = formatErrorMessage(cause);

  return TRANSIENT_ERROR_PATTERNS.some((pattern) => pattern.test(message));
};
