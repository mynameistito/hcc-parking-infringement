/** R2 parking-store seed manifest and NDJSON chunk layout. */

import { z } from "zod";

import { cleanInfringementSchema } from "@/server/clean-schema.ts";

export const SEED_MANIFEST_VERSION = 1 as const;

export const seedManifestSchema = z.object({
  dashboardSnapshotKey: z.string().optional(),
  exportedAt: z.string(),
  infringementChunks: z.array(z.string()),
  source: z.string(),
  totalInfringements: z.number(),
  version: z.literal(SEED_MANIFEST_VERSION),
  watermarksKey: z.string().optional(),
});

export type SeedManifest = z.infer<typeof seedManifestSchema>;

export const parseSeedManifest = (raw: unknown): SeedManifest =>
  seedManifestSchema.parse(raw);

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

export const parseSeedWatermarkLine = (
  line: string
): z.infer<typeof seedWatermarkSchema> =>
  seedWatermarkSchema.parse(JSON.parse(line));

export const normalizeSeedPrefix = (prefix: string): string => {
  const trimmed = prefix.trim();
  if (trimmed === "") {
    return "";
  }

  return trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
};

export const seedObjectKey = (prefix: string, name: string): string =>
  `${normalizeSeedPrefix(prefix)}${name}`;

export const MANIFEST_FILE = "manifest.json";
export const DASHBOARD_SNAPSHOT_FILE = "dashboard-snapshot.json";
