import type { SeedRefreshCoordinator } from "@/durable-objects/seed-refresh-coordinator.ts";

const SEED_REFRESH_COORDINATOR_NAME = "parking-seed-refresh";

/** Persisted lifecycle state exposed by the seed refresh coordinator. */
export type SeedRefreshStatus =
  | "idle"
  | "planning"
  | "running"
  | "complete"
  | "errored";

/** Safe operational status returned to authenticated callers. */
export interface SeedRefreshStatusDto {
  readonly attempts: number;
  readonly completedWindows: number;
  readonly finishedAt: string | null;
  readonly id: string | null;
  readonly lastError: string | null;
  readonly reason: "cron" | "manual" | null;
  readonly startedAt: string | null;
  readonly status: SeedRefreshStatus;
  readonly totalWindows: number;
}

/** Input accepted by the coordinator's idempotent start operation. */
export interface StartSeedRefreshInput {
  readonly reason: "cron" | "manual";
  readonly scheduledTime?: number;
}

/** Resolve the single coordination atom for the published parking seed. */
export const getSeedRefreshCoordinator = (
  env: Env
): DurableObjectStub<SeedRefreshCoordinator> =>
  env.SEED_REFRESH_COORDINATOR.getByName(SEED_REFRESH_COORDINATOR_NAME);
