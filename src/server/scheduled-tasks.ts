import type { AppScope } from "@/server/app-scope.ts";
import { geocodeMissingLocations } from "@/server/geocode.ts";
import { hourlySync } from "@/server/sync.ts";

export const runScheduledMaintenance = async (
  scope: AppScope
): Promise<void> => {
  if (scope.isSeedMode) {
    return;
  }

  await hourlySync(scope);
  await geocodeMissingLocations(scope, 25);
};
