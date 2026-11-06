/** R2 parking-store seed manifest and NDJSON chunk layout. */

import { z } from "zod";

import { optionalHccFetchInstantSchema } from "@/lib/hcc-fetch-instant.ts";
import { cleanInfringementSchema } from "@/server/clean-schema.ts";

export const SEED_MANIFEST_VERSION = 1 as const;

export const seedManifestSchema = z.object({
  dashboardSnapshotKey: z.string().optional(),
  exportedAt: z.string(),
  infringementChunks: z.array(z.string()),
  lastHccFetchAt: optionalHccFetchInstantSchema,
  source: z.string(),
  totalInfringements: z.number(),
  version: z.literal(SEED_MANIFEST_VERSION),
  watermarksKey: z.string().optional(),
});

/** Validated manifest describing the objects in a parking-store seed. */
export type SeedManifest = z.infer<typeof seedManifestSchema>;

/**
 * Validates a parsed seed manifest against the supported schema.
 * @param raw - Untrusted parsed manifest value.
 * @returns The validated seed manifest.
 */
export const parseSeedManifest = (
  // oxlint-disable-next-line anti-slop/no-unknown-parameters -- Seed manifests are untrusted and the schema validates this value immediately.
  raw: unknown
): SeedManifest => seedManifestSchema.parse(raw);

/**
 * Parses and validates one NDJSON infringement line.
 * @param line - Serialized infringement record.
 * @returns The validated cleaned infringement.
 */
export const parseSeedInfringementLine = (
  line: string
): z.infer<typeof cleanInfringementSchema> =>
  cleanInfringementSchema.parse(JSON.parse(line));

export const seedWatermarkSchema = z.object({
  end: z.string(),
  ingestedAt: z.string(),
  recordCount: z.number(),
  start: z.string(),
});

/**
 * Parses and validates one NDJSON ingestion watermark line.
 * @param line - Serialized watermark record.
 * @returns The validated watermark.
 */
export const parseSeedWatermarkLine = (
  line: string
): z.infer<typeof seedWatermarkSchema> =>
  seedWatermarkSchema.parse(JSON.parse(line));

/**
 * Trims a seed object prefix and adds a trailing slash when needed.
 * @param prefix - Configured object key prefix.
 * @returns The normalized prefix, or an empty string.
 */
export const normalizeSeedPrefix = (prefix: string): string => {
  const trimmed = prefix.trim();

  if (trimmed === "") {
    return "";
  }

  return trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
};

/**
 * Joins a normalized seed prefix and an object name.
 * @param prefix - Configured object key prefix.
 * @param name - Object name within the seed.
 * @returns The complete storage object key.
 */
export const seedObjectKey = (prefix: string, name: string): string =>
  `${normalizeSeedPrefix(prefix)}${name}`;

export const MANIFEST_FILE = "manifest.json";
export const DASHBOARD_SNAPSHOT_FILE = "dashboard-snapshot.json";
