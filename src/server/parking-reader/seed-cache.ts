import type { SeedManifestContext } from "@/server/seed-import.ts";

export interface SeedReadCache {
  manifestContext: SeedManifestContext | null;
  snapshotPayload: string | null;
  snapshotKey: string | null;
}

export const createSeedReadCache = (): SeedReadCache => ({
  manifestContext: null,
  snapshotKey: null,
  snapshotPayload: null,
});

export const resetSeedReadCache = (cache: SeedReadCache): void => {
  cache.manifestContext = null;
  cache.snapshotPayload = null;
  cache.snapshotKey = null;
};
