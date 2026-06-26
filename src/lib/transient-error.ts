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

const formatErrorMessage = (error: unknown): string =>
  error instanceof Error ? `${error.name}: ${error.message}` : String(error);

export const extractHttpErrorMessage = (
  rawBody: unknown
): string | undefined => {
  if (typeof rawBody === "object" && rawBody !== null && "error" in rawBody) {
    const { error } = rawBody;
    return typeof error === "string" ? error : undefined;
  }

  return undefined;
};

/** Cloudflare DO SQLite daily free-tier quota (reads/writes) — not retryable. */
export const isDoSqliteQuotaError = (error: unknown): boolean => {
  const message = formatErrorMessage(error);
  return DO_SQLITE_QUOTA_PATTERN.test(message);
};

export const isDoSqliteQuotaResponse = (rawBody: unknown): boolean => {
  const message = extractHttpErrorMessage(rawBody);
  return message !== undefined && DO_SQLITE_QUOTA_PATTERN.test(message);
};

export const describeDoSqliteQuotaError = (): string =>
  [
    "The deployed ParkingStore Durable Object hit the Workers Free plan SQLite quota.",
    "Reads and writes are blocked until the daily limit resets (00:00 UTC) or you upgrade to Workers Paid.",
    "For ~657k records you need Workers Paid (free tier allows ~5M row reads and ~100k row writes per day).",
    "After upgrading or quota reset, rerun: bun run push:local -- --from-port=8787",
  ].join("\n");

/** Whether a queue/DO/network failure is likely transient and worth retrying. */
export const isRetryableError = (error: unknown): boolean => {
  if (isDoSqliteQuotaError(error)) {
    return false;
  }

  const message = formatErrorMessage(error);
  return TRANSIENT_ERROR_PATTERNS.some((pattern) => pattern.test(message));
};
