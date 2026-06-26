import { AwsClient } from "aws4fetch";

const DEFAULT_SEED_BUCKET = "hcc-parking-infringement-seed";

export interface SeedR2Env {
  PARKING_SEED?: R2Bucket;
  R2_ACCESS_KEY_ID?: string;
  R2_ACCESS_KEY?: string;
  R2_SECRET_ACCESS_KEY?: string;
  PARKING_SEED_BUCKET?: string;
  R2_ACCOUNT_ID?: string;
}

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
  const response = await client.fetch(url);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      `R2 S3 GET ${key} failed: ${response.status} ${response.statusText}`
    );
  }

  return await response.text();
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
