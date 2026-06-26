import type { CacheStatus } from "@/durable-objects/types.ts";
import { readsParkingStoreFromSeed } from "@/server/parking-read-source.ts";
import { getSeedCacheStatus } from "@/server/seed-read.ts";
import { getParkingStore } from "@/server/store.ts";

export type { CacheStatus };

export const getCacheStatus = async (env: Env): Promise<CacheStatus> => {
  if (readsParkingStoreFromSeed(env)) {
    return await getSeedCacheStatus(env);
  }

  return await getParkingStore(env).getCacheStatus();
};
