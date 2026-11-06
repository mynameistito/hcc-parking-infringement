import { readsParkingStoreFromSeed } from "@/server/parking-read-source.ts";

import { DurableObjectParkingStoreReader } from "./durable-object-reader.ts";
import { createSeedReadCache } from "./seed-cache.ts";
import type { SeedReadCache } from "./seed-cache.ts";
import { SeedParkingStoreReader } from "./seed-reader.ts";
import type { ParkingStoreReader } from "./types.ts";

export type { ParkingStoreReader } from "./types.ts";

export { createSeedReadCache, type SeedReadCache } from "./seed-cache.ts";

/**
 * Select the configured seed or Durable Object reader.
 * @param env - Worker runtime bindings.
 * @param seedCache - Request-local cache of seed data.
 * @returns The resulting `ParkingStoreReader` value.
 */
export const createParkingStoreReader = (
  env: Env,
  seedCache: SeedReadCache = createSeedReadCache()
): ParkingStoreReader =>
  readsParkingStoreFromSeed(env)
    ? new SeedParkingStoreReader(env, seedCache)
    : new DurableObjectParkingStoreReader(env);
