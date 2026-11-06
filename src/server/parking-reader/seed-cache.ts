import type { SeedManifestContext } from "@/server/seed-import.ts";

/** In-memory manifest and dashboard values used by the seed reader. */
export interface SeedReadCache {
  manifestContext: SeedManifestContext | null;
  snapshotPayload: string | null;
  snapshotKey: string | null;
}

/**
 * Creates an empty seed read cache.
 * @returns A cache with no manifest or snapshot loaded.
 */
export const createSeedReadCache = (): SeedReadCache => ({
  manifestContext: null,
  snapshotKey: null,
  snapshotPayload: null,
});

/**
 * Clears the manifest and snapshot held by a seed read cache.
 * @param cache - Cache to reset in place.
 */
export const resetSeedReadCache = (cache: SeedReadCache): void => {
  cache.manifestContext = null;
  cache.snapshotPayload = null;
  cache.snapshotKey = null;
};
