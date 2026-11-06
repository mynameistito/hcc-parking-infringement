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
