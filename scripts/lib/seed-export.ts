/** Export local ParkingStore data as NDJSON seed chunks for R2 upload. */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { formatNumber } from "@scripts/lib/backfill-progress.ts";
import type { IngestWatermarkExport } from "@scripts/lib/parking-store-snapshot.ts";
import {
  fetchExportInfringements,
  fetchExportWatermarks,
} from "@scripts/lib/replication-api.ts";
import type { WorkerScriptContext } from "@scripts/lib/worker-client.ts";

import type { SeedManifest } from "@/server/seed-manifest.ts";
import {
  MANIFEST_FILE,
  SEED_MANIFEST_VERSION,
} from "@/server/seed-manifest.ts";

export interface ExportSeedChunksOptions {
  chunkRecords: number;
  label: string;
  onProgress?: (message: string) => void;
  outDir: string;
  skipWatermarks: boolean;
  source: WorkerScriptContext;
}

export interface ExportSeedChunksResult {
  files: string[];
  manifest: SeedManifest;
  outDir: string;
}

const padChunkIndex = (index: number): string => String(index).padStart(4, "0");

const writeNdjsonChunk = async (
  filePath: string,
  lines: string[]
): Promise<void> => {
  await writeFile(filePath, `${lines.join("\n")}\n`, "utf-8");
};

export const exportSeedChunksFromWorker = async (
  options: ExportSeedChunksOptions
): Promise<ExportSeedChunksResult> => {
  await mkdir(options.outDir, { recursive: true });

  const infringementChunks: string[] = [];
  let cursor = 0;
  let exported = 0;
  let total = 0;
  let chunkIndex = 1;
  let pendingLines: string[] = [];

  const flushChunk = async (): Promise<void> => {
    if (pendingLines.length === 0) {
      return;
    }

    const name = `infringements-${padChunkIndex(chunkIndex)}.ndjson`;
    const filePath = path.join(options.outDir, name);
    await writeNdjsonChunk(filePath, pendingLines);
    infringementChunks.push(name);
    pendingLines = [];
    chunkIndex += 1;
  };

  while (true) {
    const page = await fetchExportInfringements(
      options.source,
      cursor,
      options.chunkRecords,
      total === 0 ? "scan" : "cached"
    );
    ({ total } = page);

    if (page.records.length === 0) {
      break;
    }

    for (const record of page.records) {
      pendingLines.push(JSON.stringify(record));

      if (pendingLines.length >= options.chunkRecords) {
        await flushChunk();
      }
    }

    exported += page.records.length;
    cursor = page.nextCursor ?? cursor;

    options.onProgress?.(
      `[${options.label}] pulled ${formatNumber(exported)}/${formatNumber(total)} from local DO`
    );

    if (page.nextCursor === null) {
      break;
    }

    cursor = page.nextCursor;
  }

  await flushChunk();

  let watermarksKey: string | undefined;
  const watermarks: IngestWatermarkExport[] = [];

  if (!options.skipWatermarks) {
    let offset = 0;

    while (true) {
      const page = await fetchExportWatermarks(
        options.source,
        offset,
        options.chunkRecords
      );

      if (page.watermarks.length === 0) {
        break;
      }

      watermarks.push(...page.watermarks);
      offset = page.nextOffset ?? offset;

      options.onProgress?.(
        `[${options.label}] watermarks ${formatNumber(watermarks.length)}/${formatNumber(page.total)}`
      );

      if (page.nextOffset === null) {
        break;
      }

      offset = page.nextOffset;
    }

    if (watermarks.length > 0) {
      watermarksKey = "watermarks.ndjson";
      await writeNdjsonChunk(
        path.join(options.outDir, watermarksKey),
        watermarks.map((watermark) => JSON.stringify(watermark))
      );
    }
  }

  const manifest: SeedManifest = {
    exportedAt: new Date().toISOString(),
    infringementChunks,
    source: options.source.workerUrl,
    totalInfringements: exported,
    version: SEED_MANIFEST_VERSION,
    watermarksKey,
  };

  await writeFile(
    path.join(options.outDir, MANIFEST_FILE),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf-8"
  );

  const files = [
    MANIFEST_FILE,
    ...infringementChunks,
    ...(watermarksKey === undefined ? [] : [watermarksKey]),
  ];

  return {
    files,
    manifest,
    outDir: options.outDir,
  };
};
