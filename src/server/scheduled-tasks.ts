import { geocodeMissingLocations } from "@/server/geocode.ts";
import { readsParkingStoreFromSeed } from "@/server/parking-read-source.ts";
import { hourlySync } from "@/server/sync.ts";

export const runScheduledMaintenance = async (env: Env): Promise<void> => {
  if (readsParkingStoreFromSeed(env)) {
    return;
  }

  await hourlySync(env);
  await geocodeMissingLocations(env, 25);
};
