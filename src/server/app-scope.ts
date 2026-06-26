import {
  createParkingStoreReader,
  createSeedReadCache,
} from "@/server/parking-reader/index.ts";
import type {
  ParkingStoreReader,
  SeedReadCache,
} from "@/server/parking-reader/index.ts";

export interface AppScope {
  readonly env: Env;
  readonly parking: ParkingStoreReader;
  readonly isSeedMode: boolean;
  readonly seedCache: SeedReadCache;
}

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
