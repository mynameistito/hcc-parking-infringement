/**
 * Run the daily local backfill -> R2 seed upload/apply -> live verification flow.
 *
 * @example
 * bun run daily:refresh
 * bun run daily:refresh -- --from=2026-06-29
 * bun run daily:refresh -- --from=2026-06-29 --to=2026-06-30 --deploy
 */

import { spawn } from "node:child_process";
import { once } from "node:events";
import path from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

import { assertWorkerReachable, loadDevVars } from "@scripts/dev-env.ts";
import { readArgValue, readFlag, scriptArgv } from "@scripts/lib/cli/args.ts";

import { addDaysInAuckland, todayInAuckland } from "@/lib/auckland-time.ts";

const rootDir = path.resolve(import.meta.dirname, "..");
const DEFAULT_LIVE_URL = "https://hcc-parking-infringement.mynameistito.com";
const DEFAULT_IMPORT_URL =
  "https://hcc-parking-infringement.mynameistito.workers.dev";

const isCloseEvent = (event: unknown): event is [number | null] =>
  Array.isArray(event) && event.length > 0;

const waitForClose = async (
  child: ReturnType<typeof spawn>
): Promise<number> => {
  const event: unknown = await once(child, "close");
  if (!isCloseEvent(event)) {
    return 1;
  }

  const [code] = event;
  return typeof code === "number" ? code : 1;
};

const run = async (label: string, command: string, args: string[]) => {
  console.log(`\n[daily] ${label}`);
  const child = spawn(command, args, {
    cwd: rootDir,
    shell: true,
    stdio: "inherit",
  });
  const code = await waitForClose(child);

  if (code !== 0) {
    throw new Error(`${label} failed with exit code ${code}`);
  }
};

const startWranglerDev = (port: string): ReturnType<typeof spawn> => {
  console.log(`\n[daily] starting local wrangler dev on port ${port}`);
  return spawn(
    "bunx",
    [
      "wrangler",
      "dev",
      "-c",
      "wrangler.jsonc",
      "--port",
      port,
      "--ip",
      "127.0.0.1",
    ],
    {
      cwd: rootDir,
      shell: true,
      stdio: "inherit",
    }
  );
};

const stopProcessTree = async (child: ReturnType<typeof spawn>) => {
  if (child.pid === undefined || child.killed) {
    return;
  }

  if (process.platform === "win32") {
    const killer = spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
      stdio: "ignore",
    });
    await once(killer, "close").catch((error: unknown) => {
      console.warn(
        "[daily] taskkill failed:",
        error instanceof Error ? error.message : String(error)
      );
      return [1];
    });
    return;
  }

  child.kill("SIGTERM");
};

const waitForLocalWorker = async (workerUrl: string) => {
  const startedAt = Date.now();
  const timeoutMs = 120_000;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      await assertWorkerReachable(workerUrl, { timeoutMs: 3000 });
      console.log(`[daily] local worker reachable at ${workerUrl}`);
      return;
    } catch {
      await sleep(1000);
    }
  }

  throw new Error(`Timed out waiting for local worker at ${workerUrl}`);
};

const verifyLive = async (liveUrl: string) => {
  console.log(`\n[daily] verifying live ${liveUrl}`);
  const response = await fetch(`${liveUrl}/api/v1/health`);
  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      `Live health failed (${response.status}): ${JSON.stringify(body)}`
    );
  }

  console.log("[daily] live health", body);
};

loadDevVars();

const args = scriptArgv();
const port = readArgValue(args, "port") ?? "8787";
const to = readArgValue(args, "to") ?? todayInAuckland();
const from = readArgValue(args, "from") ?? addDaysInAuckland(to, -1);
const importUrl = readArgValue(args, "import-url") ?? DEFAULT_IMPORT_URL;
const liveUrl = readArgValue(args, "live-url") ?? DEFAULT_LIVE_URL;
const deploy = readFlag(args, "deploy");
const localUrl = `http://127.0.0.1:${port}`;

let wranglerDev: ReturnType<typeof spawn> | undefined;

try {
  console.log(`[daily] date range ${from} -> ${to}`);

  await run("build", "bun", ["run", "build"]);

  if (deploy) {
    await run("deploy patched worker", "bun", ["run", "deploy:seed"]);
  }

  wranglerDev = startWranglerDev(port);
  await waitForLocalWorker(localUrl);

  await run("local backfill", "bun", [
    "run",
    "backfill",
    "--",
    `--port=${port}`,
    "--delivery=direct",
    `--from=${from}`,
    `--to=${to}`,
    "--no-track",
  ]);

  await run("seed upload and apply", "bun", [
    "run",
    "seed:from-local",
    "--",
    `--from-port=${port}`,
    "--apply",
    `--to=${importUrl}`,
  ]);

  await verifyLive(liveUrl.replace(/\/$/u, ""));
  console.log("\n[daily] complete");
} finally {
  if (wranglerDev !== undefined) {
    console.log("\n[daily] stopping local wrangler dev");
    await stopProcessTree(wranglerDev);
  }
}
