import { z } from "zod";

export const seedChunkRequestSchema = z.object({
  chunk: z.string().min(1),
  prefix: z.string().optional(),
});

export const seedPrefixRequestSchema = z.object({
  prefix: z.string().optional(),
});

export const seedManifestResponseSchema = z.object({
  infringementChunks: z.array(z.string()),
});
