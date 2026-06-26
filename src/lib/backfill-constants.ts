export const BACKFILL_CHUNK_DAYS_DEFAULT = 7;
export const BACKFILL_EARLIEST = "1990-01-01";
export const PAGE_SIZE_LIMIT = 10_000;
export const BACKFILL_QUEUE_CONCURRENCY = 6;
export const BACKFILL_HCC_CONCURRENCY = 8;
/** Max date windows per HTTP wave when using queue delivery. */
export const MAX_BACKFILL_ENQUEUE_PER_WAVE = 3000;
/** Max date windows processed per HTTP request in direct delivery (no queue writes). */
export const MAX_BACKFILL_DIRECT_PER_WAVE = 16;
/** Pack multiple date windows into one queue message to save write operations. */
export const BACKFILL_QUEUE_WINDOWS_PER_MESSAGE = 50;
