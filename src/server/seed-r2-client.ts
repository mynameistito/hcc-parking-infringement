import { AwsClient } from "aws4fetch";

const DEFAULT_SEED_BUCKET = "hcc-parking-infringement-seed";
const SEED_OBJECT_CACHE = "parking-seed-objects";

export interface SeedR2Env {
  PARKING_SEED?: R2Bucket;
  R2_ACCESS_KEY_ID?: string;
  R2_ACCESS_KEY?: string;
  R2_SECRET_ACCESS_KEY?: string;
  PARKING_SEED_BUCKET?: string;
  PARKING_SEED_CACHE_SECONDS?: string;
  R2_ACCOUNT_ID?: string;
}

const DEFAULT_SEED_CACHE_SECONDS = 60;

const resolveR2AccessKeyId = (env: SeedR2Env): string | undefined => {
  const accessKeyId = env.R2_ACCESS_KEY_ID ?? env.R2_ACCESS_KEY;
  return accessKeyId !== undefined && accessKeyId.length > 0
    ? accessKeyId
    : undefined;
};

const resolveSeedBucketName = (env: SeedR2Env): string =>
  env.PARKING_SEED_BUCKET ?? DEFAULT_SEED_BUCKET;

const resolveR2AccountId = (env: SeedR2Env): string => {
  const accountId = env.R2_ACCOUNT_ID;
  if (accountId === undefined || accountId.length === 0) {
    throw new Error(
      "Set R2_ACCOUNT_ID in wrangler vars when using R2 S3 API credentials."
    );
  }

  return accountId;
};

const hasR2Binding = (
  env: SeedR2Env
): env is SeedR2Env & { PARKING_SEED: R2Bucket } =>
  env.PARKING_SEED !== undefined;

const hasR2S3Credentials = (env: SeedR2Env): boolean => {
  const accessKeyId = resolveR2AccessKeyId(env);
  const secretAccessKey = env.R2_SECRET_ACCESS_KEY;
  return (
    accessKeyId !== undefined &&
    secretAccessKey !== undefined &&
    secretAccessKey.length > 0
  );
};

export const assertSeedR2Configured = (env: SeedR2Env): void => {
  if (hasR2Binding(env) || hasR2S3Credentials(env)) {
    return;
  }

  throw new Error(
    "Configure PARKING_SEED R2 binding or R2_ACCESS_KEY_ID (or R2_ACCESS_KEY) + R2_SECRET_ACCESS_KEY secrets for seed reads."
  );
};

const readViaBinding = async (
  bucket: R2Bucket,
  key: string
): Promise<string | null> => {
  const object = await bucket.get(key);
  if (object === null) {
    return null;
  }

  return await object.text();
};

const buildS3ObjectUrl = (
  accountId: string,
  bucketName: string,
  key: string
): string => {
  const encodedKey = key.split("/").map(encodeURIComponent).join("/");
  return `https://${accountId}.r2.cloudflarestorage.com/${bucketName}/${encodedKey}`;
};

const resolveSeedCacheSeconds = (env: SeedR2Env): number => {
  const value = Number.parseInt(env.PARKING_SEED_CACHE_SECONDS ?? "", 10);
  if (!Number.isFinite(value) || value < 0) {
    return DEFAULT_SEED_CACHE_SECONDS;
  }

  return value;
};

const readCachedObjectText = async (url: string): Promise<string | null> => {
  if (typeof caches === "undefined") {
    return null;
  }

  const cache = await caches.open(SEED_OBJECT_CACHE);
  const response = await cache.match(url);
  if (response === undefined) {
    return null;
  }

  return await response.text();
};

const writeCachedObjectText = async (
  url: string,
  env: SeedR2Env,
  text: string
): Promise<void> => {
  if (typeof caches === "undefined") {
    return;
  }

  const cache = await caches.open(SEED_OBJECT_CACHE);
  const maxAge = resolveSeedCacheSeconds(env);
  if (maxAge === 0) {
    await cache.delete(url);
    return;
  }

  await cache.put(
    url,
    new Response(text, {
      headers: {
        "Cache-Control": `public, max-age=${maxAge}`,
        "Content-Type": "application/json; charset=utf-8",
      },
    })
  );
};

const deleteCachedObjectText = async (url: string): Promise<void> => {
  if (typeof caches === "undefined") {
    return;
  }

  const cache = await caches.open(SEED_OBJECT_CACHE);
  await cache.delete(url);
};

const readViaS3Api = async (
  env: SeedR2Env,
  key: string
): Promise<string | null> => {
  const accessKeyId = resolveR2AccessKeyId(env);
  const secretAccessKey = env.R2_SECRET_ACCESS_KEY;
  if (accessKeyId === undefined || secretAccessKey === undefined) {
    throw new Error("R2 S3 credentials are not configured.");
  }

  const client = new AwsClient({
    accessKeyId,
    region: "auto",
    secretAccessKey,
    service: "s3",
  });
  const url = buildS3ObjectUrl(
    resolveR2AccountId(env),
    resolveSeedBucketName(env),
    key
  );
  const cached = await readCachedObjectText(url);
  if (cached !== null) {
    return cached;
  }

  const response = await client.fetch(url);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      `R2 S3 GET ${key} failed: ${response.status} ${response.statusText}`
    );
  }

  const text = await response.text();
  await writeCachedObjectText(url, env, text);
  return text;
};

const writeViaBinding = async (
  bucket: R2Bucket,
  key: string,
  value: string,
  contentType: string
): Promise<void> => {
  await bucket.put(key, value, {
    httpMetadata: { contentType },
  });
};

const writeViaS3Api = async (
  env: SeedR2Env,
  key: string,
  value: string,
  contentType: string
): Promise<void> => {
  const accessKeyId = resolveR2AccessKeyId(env);
  const secretAccessKey = env.R2_SECRET_ACCESS_KEY;
  if (accessKeyId === undefined || secretAccessKey === undefined) {
    throw new Error("R2 S3 credentials are not configured.");
  }

  const client = new AwsClient({
    accessKeyId,
    region: "auto",
    secretAccessKey,
    service: "s3",
  });
  const url = buildS3ObjectUrl(
    resolveR2AccountId(env),
    resolveSeedBucketName(env),
    key
  );
  const response = await client.fetch(url, {
    body: value,
    headers: { "Content-Type": contentType },
    method: "PUT",
  });

  if (!response.ok) {
    throw new Error(
      `R2 S3 PUT ${key} failed: ${response.status} ${response.statusText}`
    );
  }

  await deleteCachedObjectText(url);
};

export const readSeedObjectText = async (
  env: SeedR2Env,
  key: string
): Promise<string | null> => {
  assertSeedR2Configured(env);

  if (hasR2Binding(env)) {
    return await readViaBinding(env.PARKING_SEED, key);
  }

  return await readViaS3Api(env, key);
};

export const writeSeedObjectText = async (
  env: SeedR2Env,
  key: string,
  value: string,
  contentType = "application/json; charset=utf-8"
): Promise<void> => {
  assertSeedR2Configured(env);

  if (hasR2Binding(env)) {
    await writeViaBinding(env.PARKING_SEED, key, value, contentType);
    return;
  }

  await writeViaS3Api(env, key, value, contentType);
};
