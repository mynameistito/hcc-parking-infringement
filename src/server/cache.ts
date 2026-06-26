import type { CacheStatus } from "@/durable-objects/types.ts";
import type { AppScope } from "@/server/app-scope.ts";

export type { CacheStatus };

export const getCacheStatus = async (scope: AppScope): Promise<CacheStatus> =>
  await scope.parking.getCacheStatus();
