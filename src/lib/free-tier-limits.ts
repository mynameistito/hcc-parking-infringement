/** Cloudflare Workers Free plan budgets (headroom below hard limits). */

/** Daily Durable Object SQLite write limit used for free-tier budgeting. */
export const FREE_TIER_DO_SQLITE_WRITES_PER_DAY = 100_000;

/** Daily queue operation limit used for free-tier budgeting. */
export const FREE_TIER_QUEUE_OPS_PER_DAY = 10_000;

/** Leave room for hourly sync, stats flush, and dashboard reads. */
export const FREE_TIER_DO_WRITE_HEADROOM = 10_000;

/** Queue operations reserved outside the backfill budget. */
export const FREE_TIER_QUEUE_OP_HEADROOM = 1000;

/** Daily SQLite write budget after reserving headroom. */
export const FREE_TIER_DO_DAILY_WRITE_BUDGET =
  FREE_TIER_DO_SQLITE_WRITES_PER_DAY - FREE_TIER_DO_WRITE_HEADROOM;

/** Daily queue operation budget after reserving headroom. */
export const FREE_TIER_QUEUE_DAILY_OP_BUDGET =
  FREE_TIER_QUEUE_OPS_PER_DAY - FREE_TIER_QUEUE_OP_HEADROOM;

/** ~47k records/chunk × ~1 row write each — one chunk/day stays under the write cap. */
export const FREE_TIER_SEED_CHUNKS_PER_DAY = 1;

/**
 * Interprets the supported values for free-tier mode.
 * @param value - The environment value, if present.
 * @returns Whether free-tier mode is enabled.
 */
export const parseFreeTierMode = (value?: string): boolean =>
  value === "1" || value === "true" || value === "yes";

interface FreeTierEnv {
  FREE_TIER_MODE?: string;
}

/**
 * Reads the free-tier mode flag from an environment.
 * @param env - The environment containing the optional flag.
 * @returns Whether free-tier mode is enabled.
 */
export const isFreeTierMode = (env: FreeTierEnv): boolean =>
  parseFreeTierMode(env.FREE_TIER_MODE);

/** Concurrency and batch limits used by a backfill run. */
export interface BackfillTuning {
  hccConcurrency: number;
  maxDirectPerWave: number;
  maxEnqueuePerWave: number;
  queueConcurrency: number;
  queueWindowsPerMessage: number;
}

const PRODUCTION_BACKFILL_TUNING: BackfillTuning = {
  hccConcurrency: 8,
  maxDirectPerWave: 16,
  maxEnqueuePerWave: 3000,
  queueConcurrency: 6,
  queueWindowsPerMessage: 50,
};

/** Throttled backfill settings that keep DO writes and queue ops inside free-tier daily caps. */
const FREE_TIER_BACKFILL_TUNING: BackfillTuning = {
  hccConcurrency: 2,
  maxDirectPerWave: 4,
  maxEnqueuePerWave: 60,
  queueConcurrency: 1,
  queueWindowsPerMessage: 20,
};

/**
 * Selects backfill limits for the configured operating mode.
 * @param env - The environment containing the optional free-tier flag.
 * @returns Free-tier or production backfill limits.
 */
export const resolveBackfillTuning = (env: FreeTierEnv): BackfillTuning =>
  isFreeTierMode(env) ? FREE_TIER_BACKFILL_TUNING : PRODUCTION_BACKFILL_TUNING;

/**
 * Describes the current read source and the command for switching it.
 * @param readSource - The configured parking-store read source.
 * @returns Guidance for switching between seed and Durable Object reads.
 */
export const describeReadSourceFallback = (readSource: string): string =>
  readSource === "seed"
    ? "Reads are served from R2 seed. Switch to DO reads: bun run deploy:do"
    : "Reads are served from ParkingStore DO. R2 fallback: bun run deploy:seed";
