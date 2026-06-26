import {
  getParkingStoreReadSource,
  readsParkingStoreFromSeed,
} from "@/server/parking-read-source.ts";

import { DurableObjectParkingStoreReader } from "./durable-object-reader.ts";
import { createSeedReadCache } from "./seed-cache.ts";
import type { SeedReadCache } from "./seed-cache.ts";
import { SeedParkingStoreReader } from "./seed-reader.ts";
import type { ParkingStoreReader } from "./types.ts";

export type { ParkingStoreReader } from "./types.ts";
export { emptyBrowseResult } from "./types.ts";
export {
  createSeedReadCache,
  resetSeedReadCache,
  type SeedReadCache,
} from "./seed-cache.ts";

export const createParkingStoreReader = (
  env: Env,
  seedCache: SeedReadCache = createSeedReadCache()
): ParkingStoreReader =>
  readsParkingStoreFromSeed(env)
    ? new SeedParkingStoreReader(env, seedCache)
    : new DurableObjectParkingStoreReader(env);

export { getParkingStoreReadSource, readsParkingStoreFromSeed };
