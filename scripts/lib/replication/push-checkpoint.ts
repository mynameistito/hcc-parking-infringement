/** Persist push-local progress so a long replication can resume after failure. */

import { readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { z } from "zod";

const pushCheckpointSchema = z.object({
  fromUrl: z.string(),
  infringementCursor: z.number(),
  infringementPushed: z.number(),
  phase: z.enum(["infringements", "watermarks"]),
  toUrl: z.string(),
  updatedAt: z.string(),
  watermarkImported: z.number(),
  watermarkOffset: z.number(),
});

export type PushCheckpoint = z.infer<typeof pushCheckpointSchema>;

const checkpointPath = path.resolve(
  import.meta.dirname,
  "..",
  "..",
  ".push-local.checkpoint.json"
);

export const loadPushCheckpoint = async (): Promise<PushCheckpoint | null> => {
  try {
    const raw = await readFile(checkpointPath, "utf-8");
    const parsed = pushCheckpointSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
};

export const savePushCheckpoint = async (
  checkpoint: PushCheckpoint
): Promise<void> => {
  await writeFile(checkpointPath, `${JSON.stringify(checkpoint, null, 2)}\n`);
};

export const clearPushCheckpoint = async (): Promise<void> => {
  try {
    await unlink(checkpointPath);
  } catch {
    // No checkpoint to clear.
  }
};
