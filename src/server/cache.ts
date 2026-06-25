import type { CacheStatus } from "../durable-objects/parking-store.ts";
import type { Env } from "../env.ts";
import { getParkingStore } from "./store.ts";

export type { CacheStatus };

export const getCacheStatus = async (env: Env): Promise<CacheStatus> =>
  await getParkingStore(env).getCacheStatus();
