/** Default backfill window size — splits to daily jobs when HCC hits the page cap. */
export const BACKFILL_CHUNK_DAYS_DEFAULT = 7;

/** Parallel backfill jobs per queue batch (HCC fetches overlap; DO writes serialize). */
export const BACKFILL_QUEUE_CONCURRENCY = 6;

/** Cap in-flight HTTP requests to the HCC Open Data API (windows + pagination pages). */
export const BACKFILL_HCC_CONCURRENCY = 8;
