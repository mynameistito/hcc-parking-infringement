import type { CacheStatus } from "@/durable-objects/types.ts";
import type { AppScope } from "@/server/app-scope.ts";

export type { CacheStatus } from "@/durable-objects/types.ts";

/**
 * Reads the current parking-store cache status.
 * @param scope - The application scope containing the parking reader.
 * @returns The current cache status.
 */
export const getCacheStatus = async (scope: AppScope): Promise<CacheStatus> =>
  await scope.parking.getCacheStatus();
