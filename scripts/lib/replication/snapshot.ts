/** Full ParkingStore JSON snapshot format for offline export/import. */

import { createWriteStream } from "node:fs";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { finished } from "node:stream/promises";

import { z } from "zod";

import { cleanInfringementSchema } from "@/server/clean-schema.ts";

export const PARKING_STORE_SNAPSHOT_VERSION = 1 as const;

export const ingestWatermarkExportSchema = z.object({
  end: z.string(),
  ingestedAt: z.string(),
  recordCount: z.number(),
  start: z.string(),
});

export const parkingStoreSnapshotSchema = z.object({
  exportedAt: z.string(),
  infringements: z.array(cleanInfringementSchema),
  source: z.string(),
  totalInfringements: z.number(),
  version: z.literal(PARKING_STORE_SNAPSHOT_VERSION),
  watermarks: z.array(ingestWatermarkExportSchema),
});

export type ParkingStoreSnapshot = z.infer<typeof parkingStoreSnapshotSchema>;
export type IngestWatermarkExport = z.infer<typeof ingestWatermarkExportSchema>;

export const parseParkingStoreSnapshot = (raw: unknown): ParkingStoreSnapshot =>
  parkingStoreSnapshotSchema.parse(raw);

export const readParkingStoreSnapshot = async (
  filePath: string
): Promise<ParkingStoreSnapshot> => {
  const raw = await readFile(filePath, "utf-8");
  return parseParkingStoreSnapshot(JSON.parse(raw));
};

export const ensureParentDir = async (filePath: string): Promise<void> => {
  await mkdir(path.dirname(filePath), { recursive: true });
};

export interface SnapshotWriteHandle {
  appendInfringements: (
    records: z.infer<typeof cleanInfringementSchema>[]
  ) => void;
  close: (options: {
    totalInfringements: number;
    watermarks: IngestWatermarkExport[];
  }) => Promise<void>;
}

/** Stream a large snapshot to disk without holding all infringements in memory. */
export const createSnapshotWriter = async (
  filePath: string,
  meta: { exportedAt: string; source: string }
): Promise<SnapshotWriteHandle> => {
  await ensureParentDir(filePath);

  const stream = createWriteStream(filePath, { encoding: "utf-8" });
  let wroteRecord = false;

  stream.write(
    `{"version":${PARKING_STORE_SNAPSHOT_VERSION},"exportedAt":${JSON.stringify(meta.exportedAt)},"source":${JSON.stringify(meta.source)},"infringements":[`
  );

  return {
    appendInfringements: (records) => {
      for (const record of records) {
        stream.write(`${wroteRecord ? "," : ""}${JSON.stringify(record)}`);
        wroteRecord = true;
      }
    },
    close: async ({ totalInfringements, watermarks }) => {
      stream.write(
        `],"totalInfringements":${totalInfringements},"watermarks":${JSON.stringify(watermarks)}}`
      );
      stream.end();
      await finished(stream);
    },
  };
};
