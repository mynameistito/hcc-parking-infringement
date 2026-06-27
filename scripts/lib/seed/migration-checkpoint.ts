/** Resume state for R2 seed → ParkingStore DO migration. */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const CHECKPOINT_DIR = path.join(".data", "migration");
const CHECKPOINT_FILE = path.join(CHECKPOINT_DIR, "seed-to-do.json");

export interface SeedToDoMigrationCheckpoint {
  completedChunks: string[];
  lastChunk: string | null;
  targetUrl: string;
  updatedAt: string;
}

const isSeedToDoMigrationCheckpoint = (
  value: unknown
): value is SeedToDoMigrationCheckpoint =>
  typeof value === "object" &&
  value !== null &&
  "targetUrl" in value &&
  typeof value.targetUrl === "string" &&
  "completedChunks" in value &&
  Array.isArray(value.completedChunks);

const readCheckpointFile =
  async (): Promise<SeedToDoMigrationCheckpoint | null> => {
    try {
      const raw = await readFile(CHECKPOINT_FILE, "utf-8");
      const parsed: unknown = JSON.parse(raw);
      if (!isSeedToDoMigrationCheckpoint(parsed)) {
        return null;
      }

      return parsed;
    } catch {
      return null;
    }
  };

export const loadSeedToDoMigrationCheckpoint = async (
  targetUrl: string
): Promise<SeedToDoMigrationCheckpoint | null> => {
  const checkpoint = await readCheckpointFile();
  if (checkpoint === null || checkpoint.targetUrl !== targetUrl) {
    return null;
  }

  return checkpoint;
};

export const saveSeedToDoMigrationCheckpoint = async (
  checkpoint: SeedToDoMigrationCheckpoint
): Promise<void> => {
  await mkdir(CHECKPOINT_DIR, { recursive: true });
  await writeFile(CHECKPOINT_FILE, `${JSON.stringify(checkpoint, null, 2)}\n`);
};

export const clearSeedToDoMigrationCheckpoint = async (): Promise<void> => {
  try {
    await writeFile(CHECKPOINT_FILE, "");
  } catch {
    // No checkpoint yet.
  }
};
