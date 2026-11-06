import { afterEach, describe, expect, it, vi } from "vitest";

import { readSeedObjectText, writeSeedObjectText } from "./seed-r2-client";
import type { SeedR2Env } from "./seed-r2-client";

const fixture = () => {
  const objects = new Map<string, string>([["manifest.json", "old"]]);
  const entries = new Map<string, Response>();

  const cache = {
    delete: async (key: string) => await Promise.resolve(entries.delete(key)),
    match: async (key: string) =>
      await Promise.resolve(entries.get(key)?.clone()),
    put: async (key: string, response: Response) => {
      entries.set(key, response.clone());
      await Promise.resolve();
    },
  };

  vi.stubGlobal("caches", { open: async () => await Promise.resolve(cache) });

  const bucket = {
    get: async (key: string) => {
      const value = objects.get(key);

      return await Promise.resolve(
        value === undefined
          ? null
          : { text: async () => await Promise.resolve(value) }
      );
    },
    put: async (key: string, value: string) => {
      objects.set(key, value);

      return await Promise.resolve(null);
    },
  };

  const env: SeedR2Env = {
    PARKING_SEED: bucket,
    PARKING_SEED_BUCKET: "test",
    R2_ACCOUNT_ID: "account",
  };

  return { entries, env, objects };
};

describe("seed R2 binding cache", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("continues reading and writing when the Cache API is unavailable", async () => {
    const { env } = fixture();
    vi.stubGlobal("caches", {
      open: async () => await Promise.reject(new Error("cache unavailable")),
    });
    await expect(readSeedObjectText(env, "manifest.json")).resolves.toBe("old");
    await writeSeedObjectText(env, "manifest.json", "fresh");
    await expect(readSeedObjectText(env, "manifest.json")).resolves.toBe(
      "fresh"
    );
  });

  it("serves cached reads and invalidates them after a successful write", async () => {
    const { env, objects } = fixture();
    await expect(readSeedObjectText(env, "manifest.json")).resolves.toBe("old");
    objects.set("manifest.json", "external update");
    await expect(readSeedObjectText(env, "manifest.json")).resolves.toBe("old");
    await writeSeedObjectText(env, "manifest.json", "published");
    await expect(readSeedObjectText(env, "manifest.json")).resolves.toBe(
      "published"
    );
  });

  it("preserves decimal-prefix cache durations", async () => {
    const { entries, env } = fixture();
    await readSeedObjectText(
      { ...env, PARKING_SEED_CACHE_SECONDS: "12seconds" },
      "manifest.json"
    );
    expect([...entries.values()][0]?.headers.get("Cache-Control")).toBe(
      "public, max-age=12"
    );
  });

  it("bypasses previously cached values when caching is disabled", async () => {
    const { env, objects } = fixture();
    await readSeedObjectText(env, "manifest.json");
    objects.set("manifest.json", "fresh");
    await expect(
      readSeedObjectText(
        { ...env, PARKING_SEED_CACHE_SECONDS: "0" },
        "manifest.json"
      )
    ).resolves.toBe("fresh");
  });

  it("isolates account and bucket keys and does not cache missing objects", async () => {
    const { entries, env, objects } = fixture();
    await expect(readSeedObjectText(env, "missing")).resolves.toBeNull();
    expect(entries.size).toBe(0);
    await readSeedObjectText(env, "manifest.json");
    objects.set("manifest.json", "other bucket");
    await expect(
      readSeedObjectText(
        { ...env, PARKING_SEED_BUCKET: "other" },
        "manifest.json"
      )
    ).resolves.toBe("other bucket");
    objects.set("manifest.json", "other account");
    await expect(
      readSeedObjectText({ ...env, R2_ACCOUNT_ID: "other" }, "manifest.json")
    ).resolves.toBe("other account");
  });
});
