import type { SeedManifest } from "@/server/seed-manifest.ts";
import {
  MANIFEST_FILE,
  normalizeSeedPrefix,
  parseSeedInfringementLine,
  parseSeedManifest,
  parseSeedWatermarkLine,
  seedObjectKey,
} from "@/server/seed-manifest.ts";
import { getParkingStore } from "@/server/store.ts";

const INFRINGEMENT_UPSERT_BATCH = 500;

const readR2Text = async (
  bucket: R2Bucket,
  key: string
): Promise<string | null> => {
  const object = await bucket.get(key);
  if (object === null) {
    return null;
  }

  return await object.text();
};

const readConfiguredSeedPrefix = (env: Env): string | undefined => {
  const value = env.PARKING_STORE_SEED_PREFIX;
  return typeof value === "string" && value.length > 0 ? value : undefined;
};

const resolveSeedPrefix = (env: Env, override?: string): string => {
  const prefix = override ?? readConfiguredSeedPrefix(env) ?? "";
  const normalized = normalizeSeedPrefix(prefix);

  if (normalized === "") {
    throw new Error(
      "Set PARKING_STORE_SEED_PREFIX in wrangler vars (or pass prefix in the request body)."
    );
  }

  return normalized;
};

const requireSeedBucket = (env: Env): R2Bucket => {
  if (env.PARKING_SEED === undefined) {
    throw new Error(
      "PARKING_SEED R2 binding is not configured. Add an r2_buckets entry in wrangler.jsonc."
    );
  }

  return env.PARKING_SEED;
};

export const readSeedManifest = async (
  env: Env,
  prefixOverride?: string
): Promise<{ bucket: R2Bucket; manifest: SeedManifest; prefix: string }> => {
  const bucket = requireSeedBucket(env);
  const prefix = resolveSeedPrefix(env, prefixOverride);
  const raw = await readR2Text(bucket, seedObjectKey(prefix, MANIFEST_FILE));

  if (raw === null) {
    throw new Error(
      `Seed manifest not found at ${seedObjectKey(prefix, MANIFEST_FILE)}`
    );
  }

  return {
    bucket,
    manifest: parseSeedManifest(JSON.parse(raw)),
    prefix,
  };
};

const upsertLinesInBatches = async (
  env: Env,
  lines: string[],
  offset = 0,
  total = 0
): Promise<number> => {
  if (offset >= lines.length) {
    return total;
  }

  const batch = lines
    .slice(offset, offset + INFRINGEMENT_UPSERT_BATCH)
    .map((line) => parseSeedInfringementLine(line));

  const upserted = await getParkingStore(env).importStoredInfringements(batch);
  return await upsertLinesInBatches(
    env,
    lines,
    offset + INFRINGEMENT_UPSERT_BATCH,
    total + upserted
  );
};

export const importSeedInfringementChunk = async (
  env: Env,
  options: { chunk: string; prefixOverride?: string }
): Promise<{
  chunk: string;
  recordsUpserted: number;
}> => {
  const { bucket, manifest, prefix } = await readSeedManifest(
    env,
    options.prefixOverride
  );

  if (!manifest.infringementChunks.includes(options.chunk)) {
    throw new Error(`Unknown seed chunk "${options.chunk}"`);
  }

  const raw = await readR2Text(bucket, seedObjectKey(prefix, options.chunk));
  if (raw === null) {
    throw new Error(`Seed chunk not found: ${options.chunk}`);
  }

  const lines = raw.split(/\r?\n/u).filter((line) => line.trim().length > 0);
  const recordsUpserted = await upsertLinesInBatches(env, lines);

  return {
    chunk: options.chunk,
    recordsUpserted,
  };
};

export const importSeedWatermarks = async (
  env: Env,
  prefixOverride?: string
): Promise<{ imported: number }> => {
  const { bucket, manifest, prefix } = await readSeedManifest(
    env,
    prefixOverride
  );

  if (manifest.watermarksKey === undefined) {
    return { imported: 0 };
  }

  const raw = await readR2Text(
    bucket,
    seedObjectKey(prefix, manifest.watermarksKey)
  );

  if (raw === null) {
    throw new Error(`Seed watermarks not found: ${manifest.watermarksKey}`);
  }

  const watermarks = raw
    .split(/\r?\n/u)
    .filter((line) => line.trim().length > 0)
    .map((line) => parseSeedWatermarkLine(line));

  const imported = await getParkingStore(env).importWatermarks(watermarks);
  return { imported };
};
