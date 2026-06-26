/**
 * Run wrangler dev with a built SPA so the dashboard + live WebSocket work.
 *
 * Usage:
 *   bun run dev:wrangler
 *   bun run dev:wrangler -- --port 8787
 *   bun run dev:wrangler -- --no-watch
 *   bun run dev:wrangler -- --build
 */

import { spawn } from "node:child_process";
import { once } from "node:events";
import { existsSync } from "node:fs";
import path from "node:path";

const rootDir = path.resolve(import.meta.dirname, "..");
const clientIndex = path.join(rootDir, "dist", "client", "index.html");

const args = process.argv.slice(2);
const getArg = (name: string): string | undefined => {
  const match = args.find((arg) => arg.startsWith(`--${name}=`));
  if (match !== undefined) {
    return match.split("=")[1];
  }

  const flagIndex = args.indexOf(`--${name}`);
  if (flagIndex === -1) {
    return undefined;
  }

  return args[flagIndex + 1];
};

const port = getArg("port") ?? "8787";
const watch = !args.includes("--no-watch");
const forceBuild = args.includes("--build");

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
