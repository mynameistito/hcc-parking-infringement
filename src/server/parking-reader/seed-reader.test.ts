import { describe, expect, it } from "vitest";

import { parseSeedManifest } from "@/server/seed-manifest.ts";

import { createSeedReadCache } from "./seed-cache.ts";
import { SeedParkingStoreReader } from "./seed-reader.ts";

const exportedAt = "2026-11-06T07:00:00+13:00";
const manifestData = {
  exportedAt,
  infringementChunks: [],
  source: "hcc-open-data-worker-refresh",
  totalInfringements: 123,
  version: 1,
};

const statusFor = async (lastHccFetchAt?: unknown) => {
  const cache = createSeedReadCache();
  cache.manifestContext = {
    manifest: parseSeedManifest({ ...manifestData, lastHccFetchAt }),
    prefix: "test/",
  };
  // SAFETY: getCacheStatus consumes the supplied parsed manifest context and
  // does not access runtime bindings when that context is already loaded.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const reader = new SeedParkingStoreReader({} as Env, cache);
  return await reader.getCacheStatus();
};

describe("seed cache freshness metadata", () => {
  it("returns the retained HCC fetch time separately from snapshot export", async () => {
    const lastHccFetchAt = "2026-11-06T06:59:00+13:00";
    expect(await statusFor(lastHccFetchAt)).toMatchObject({
      lastHccFetchAt,
      lastSyncedAt: exportedAt,
      totalRecords: 123,
    });
  });

  it("keeps unknown fetch time null rather than inventing it from export time", async () => {
    expect(await statusFor()).toMatchObject({ lastHccFetchAt: null });
  });

  it.each([null, "invalid", 123])(
    "keeps invalid optional fetch metadata from breaking reads: %s",
    async (value) => {
      expect(await statusFor(value)).toMatchObject({
        lastHccFetchAt: null,
        totalRecords: 123,
      });
    }
  );
});
