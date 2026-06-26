import type { CacheStatus } from "@/durable-objects/types.ts";
import { getParkingStore } from "@/server/store.ts";

export type { CacheStatus };

export const getCacheStatus = async (env: Env): Promise<CacheStatus> =>
  await getParkingStore(env).getCacheStatus();
