import { geocodeMissingLocations } from "@/server/geocode.ts";
import { hourlySync } from "@/server/sync.ts";

export const runScheduledMaintenance = async (env: Env): Promise<void> => {
  await hourlySync(env);
  await geocodeMissingLocations(env, 25);
};
