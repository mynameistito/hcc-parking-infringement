import {
  createParkingStoreReader,
  createSeedReadCache,
} from "@/server/parking-reader/index.ts";
import type {
  ParkingStoreReader,
  SeedReadCache,
} from "@/server/parking-reader/index.ts";

/**
 * Request services and storage mode selected from worker bindings.
 */
export interface AppScope {
  readonly env: Env;
  readonly parking: ParkingStoreReader;
  readonly isSeedMode: boolean;
  readonly seedCache: SeedReadCache;
}

/**
 * Compose request services from worker bindings.
 * @param env - Worker runtime bindings.
 * @returns The resulting `AppScope` value.
 */
export const createAppScope = (env: Env): AppScope => {
  const seedCache = createSeedReadCache();
  const parking = createParkingStoreReader(env, seedCache);

  return {
    env,
    isSeedMode: parking.isSeedMode,
    parking,
    seedCache,
  };
};
