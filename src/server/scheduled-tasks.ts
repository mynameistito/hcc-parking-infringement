import type { AppScope } from "@/server/app-scope.ts";
import { geocodeMissingLocations } from "@/server/geocode.ts";
import { refreshLiveSeedFromHcc } from "@/server/live-seed-refresh.ts";
import { resetSeedReadCache } from "@/server/parking-reader/index.ts";
import { hourlySync } from "@/server/sync.ts";

export const runScheduledMaintenance = async (
  scope: AppScope
): Promise<void> => {
  if (scope.isSeedMode) {
    const result = await refreshLiveSeedFromHcc(scope.env);
    resetSeedReadCache(scope.seedCache);
    console.log("[seed-refresh] R2 seed refreshed", result);
    return;
  }

  await hourlySync(scope);
  await geocodeMissingLocations(scope, 25);
};
