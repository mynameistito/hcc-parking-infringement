/**
 * Run wrangler dev with a built SPA so the dashboard + live WebSocket work.
 *
 * @example
 * bun run dev:wrangler
 * bun run scripts/wrangler-dev.ts -- --port=8787 --no-watch
 */

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

import { readArgValue, readFlag, scriptArgv } from "@scripts/lib/cli/args.ts";
import { waitForClose } from "@scripts/lib/process-close.ts";

const rootDir = path.resolve(import.meta.dirname, "..");
const clientIndex = path.join(rootDir, "dist", "client", "index.html");

const args = scriptArgv();
const port = readArgValue(args, "port") ?? "8787";
const watch = !readFlag(args, "no-watch");
const forceBuild = readFlag(args, "build");

const run = async (
  command: string,
  commandArgs: string[],
  options?: { background?: boolean }
): Promise<number> => {
  const child = spawn(command, commandArgs, {
    cwd: rootDir,
    shell: true,
    stdio: "inherit",
  });

  if (options?.background === true) {
    child.unref();

    return 0;
  }

  return await waitForClose(child);
};

if (!existsSync(clientIndex) || forceBuild) {
  console.log("Building dashboard assets for wrangler dev…\n");
  const buildCode = await run("bun", ["run", "build"]);

  if (buildCode !== 0) {
    process.exit(buildCode);
  }
}

if (watch) {
  console.log(
    "Watching frontend — rebuild with `vite build --watch` in background.\n"
  );
  void run("bunx", ["vite", "build", "--watch"], { background: true });
}

console.log(`Starting wrangler dev on http://localhost:${port}`);

console.log("Backfill against this worker:");

console.log(`  bun run backfill -- --port=${port}\n`);

const wranglerCode = await run("bunx", [
  "wrangler",
  "dev",
  "-c",
  "wrangler.jsonc",
  "--port",
  port,
  "--ip",
  "127.0.0.1",
]);

process.exit(wranglerCode);
