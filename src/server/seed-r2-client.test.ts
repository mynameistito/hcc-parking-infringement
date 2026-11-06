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
      await Promise.resolve();
    },
  };

  // SAFETY: this fake implements the get/text and put binding operations used
  // by this adapter; no other R2 operations enter the tested interface.
  const env: SeedR2Env = {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- SAFETY: binding fake implements every operation used by this adapter.
    PARKING_SEED: bucket as unknown as R2Bucket,
    PARKING_SEED_BUCKET: "test",
    R2_ACCOUNT_ID: "account",
  };

  return { entries, env, objects };
};

afterEach(() => vi.unstubAllGlobals());

describe("seed R2 binding cache", () => {
  it("continues reading and writing when the Cache API is unavailable", async () => {
    const { env } = fixture();
    vi.stubGlobal("caches", {
      open: async () => await Promise.reject(new Error("cache unavailable")),
    });
    expect(await readSeedObjectText(env, "manifest.json")).toBe("old");
    await writeSeedObjectText(env, "manifest.json", "fresh");
    expect(await readSeedObjectText(env, "manifest.json")).toBe("fresh");
  });

  it("serves cached reads and invalidates them after a successful write", async () => {
    const { env, objects } = fixture();
    expect(await readSeedObjectText(env, "manifest.json")).toBe("old");
    objects.set("manifest.json", "external update");
    expect(await readSeedObjectText(env, "manifest.json")).toBe("old");
    await writeSeedObjectText(env, "manifest.json", "published");
    expect(await readSeedObjectText(env, "manifest.json")).toBe("published");
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
    expect(
      await readSeedObjectText(
        { ...env, PARKING_SEED_CACHE_SECONDS: "0" },
        "manifest.json"
      )
    ).toBe("fresh");
  });

  it("isolates account and bucket keys and does not cache missing objects", async () => {
    const { entries, env, objects } = fixture();
    expect(await readSeedObjectText(env, "missing")).toBeNull();
    expect(entries.size).toBe(0);
    await readSeedObjectText(env, "manifest.json");
    objects.set("manifest.json", "other bucket");
    expect(
      await readSeedObjectText(
        { ...env, PARKING_SEED_BUCKET: "other" },
        "manifest.json"
      )
    ).toBe("other bucket");
    objects.set("manifest.json", "other account");
    expect(
      await readSeedObjectText(
        { ...env, R2_ACCOUNT_ID: "other" },
        "manifest.json"
      )
    ).toBe("other account");
  });
});
