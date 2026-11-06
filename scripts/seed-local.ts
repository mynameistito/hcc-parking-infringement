import { spawn } from "node:child_process";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

import { waitForClose } from "@scripts/lib/process-close.ts";

import {
  DASHBOARD_SNAPSHOT_FILE,
  MANIFEST_FILE,
  seedManifestSchema,
} from "@/server/seed-manifest.ts";

const rootDirectory = path.resolve(import.meta.dirname, "..");
const seedDirectory = path.join(rootDirectory, "data", "seed");
const manifestPath = path.join(seedDirectory, MANIFEST_FILE);
const manifestText = await readFile(manifestPath, "utf-8").catch(() => null);
if (manifestText === null) {
  console.error(
    "Missing data/seed/manifest.json. Obtain an export as described in README.md."
  );
  process.exit(1);
}
let raw: unknown;
try {
  raw = JSON.parse(manifestText);
} catch (error) {
  if (!(error instanceof SyntaxError)) {
    throw error;
  }
  console.error("Invalid seed manifest: malformed JSON.");
  process.exit(1);
}
const parsed = seedManifestSchema.safeParse(raw);
if (!parsed.success) {
  console.error("Invalid seed manifest:", parsed.error.message);
  process.exit(1);
}
const manifest = parsed.data;
const files = [
  manifest.dashboardSnapshotKey ?? DASHBOARD_SNAPSHOT_FILE,
  ...manifest.infringementChunks,
  ...(manifest.watermarksKey === undefined ? [] : [manifest.watermarksKey]),
  MANIFEST_FILE,
];

// Preflight the complete export before writing; publish the manifest last.
for (const file of files) {
  const localPath = path.resolve(seedDirectory, file);
  const relative = path.relative(seedDirectory, localPath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    console.error(`Seed key must stay inside data/seed: ${file}`);
    process.exit(1);
  }
  const info = await stat(localPath).catch(() => null);
  if (info === null || !info.isFile()) {
    console.error(
      `Missing seed file: ${file}. Restore the complete export first.`
    );
    process.exit(1);
  }
}
if (process.argv.includes("--validate-only")) {
  console.log(`Validated ${files.length} local seed files.`);
} else {
  for (const file of files) {
    const child = spawn(
      process.execPath,
      [
        path.join(
          rootDirectory,
          "node_modules",
          "wrangler",
          "bin",
          "wrangler.js"
        ),
        "r2",
        "object",
        "put",
        `hcc-parking-infringement-seed/parking-store/v1/${file}`,
        "--file",
        path.join(seedDirectory, file),
        "--local",
      ],
      { cwd: rootDirectory, stdio: "inherit" }
    );
    const code = await waitForClose(child);
    if (code !== 0) {
      console.error(`Local seed upload failed: ${file}`);
      process.exit(code);
    }
  }
}
