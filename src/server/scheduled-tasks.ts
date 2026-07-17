import type { AppScope } from "@/server/app-scope.ts";
import { geocodeMissingLocations } from "@/server/geocode.ts";
import { getSeedRefreshCoordinator } from "@/server/seed-refresh-coordinator.ts";
import type {
  SeedRefreshStatusDto,
  StartSeedRefreshInput,
} from "@/server/seed-refresh-coordinator.ts";
import { hourlySync } from "@/server/sync.ts";

/** Start or deduplicate the Cloudflare-native seed refresh coordinator. */
export const startSeedRefresh = async (
  env: Env,
  options: StartSeedRefreshInput
): Promise<SeedRefreshStatusDto> =>
  await getSeedRefreshCoordinator(env).startRefresh(options);

/** Read the durable progress of the active or most recent seed refresh. */
export const getSeedRefreshStatus = async (
  env: Env
): Promise<SeedRefreshStatusDto> =>
  await getSeedRefreshCoordinator(env).getStatus();

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
