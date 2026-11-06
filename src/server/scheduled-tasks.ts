import type { AppScope } from "@/server/app-scope.ts";
import { geocodeMissingLocations } from "@/server/geocode.ts";
import { getSeedRefreshCoordinator } from "@/server/seed-refresh-coordinator.ts";
import type {
  SeedRefreshStatusDto,
  StartSeedRefreshInput,
} from "@/server/seed-refresh-coordinator.ts";
import { hourlySync } from "@/server/sync.ts";

/**
 *  Start or deduplicate the Cloudflare-native seed refresh coordinator.
 * @param env - Worker runtime bindings.
 * @param options - Operation settings and progress callbacks.
 * @returns The resulting `Promise<SeedRefreshStatusDto>` value.
 */
export const startSeedRefresh = async (
  env: Env,
  options: StartSeedRefreshInput
): Promise<SeedRefreshStatusDto> =>
  await getSeedRefreshCoordinator(env).startRefresh(options);

/**
 *  Read the durable progress of the active or most recent seed refresh.
 * @param env - Worker runtime bindings.
 * @returns The resulting `Promise<SeedRefreshStatusDto>` value.
 */
export const getSeedRefreshStatus = async (
  env: Env
): Promise<SeedRefreshStatusDto> =>
  await getSeedRefreshCoordinator(env).getStatus();

/**
 * Run scheduled seed refresh or Durable Object maintenance.
 * @param scope - Request services and storage mode.
 * @param scheduledTime - Scheduled execution timestamp in milliseconds.
 */
export const runScheduledMaintenance = async (
  scope: AppScope,
  scheduledTime?: number
): Promise<void> => {
  if (scope.isSeedMode) {
    const result = await startSeedRefresh(scope.env, {
      reason: "cron",
      scheduledTime,
    });

    console.log("[seed-refresh] coordinator started", result);

    return;
  }

  await hourlySync(scope);
  await geocodeMissingLocations(scope, 25);
};
