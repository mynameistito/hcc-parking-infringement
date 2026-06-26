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

/** Whether a queue/DO/network failure is likely transient and worth retrying. */
export const isRetryableError = (error: unknown): boolean => {
  const message = formatErrorMessage(error);
  return TRANSIENT_ERROR_PATTERNS.some((pattern) => pattern.test(message));
};
