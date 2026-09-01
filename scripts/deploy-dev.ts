/** Deploy the isolated Workers.dev environment without touching production. */

import { spawn } from "node:child_process";
import { once } from "node:events";
import path from "node:path";

const rootDir = path.resolve(import.meta.dirname, "..");
const generatedConfig = path.join(
  rootDir,
  "dist",
  "hcc_parking_infringement",
  "wrangler.json"
);

const isCloseEvent = (event: unknown): event is [number | null] =>
  Array.isArray(event) && event.length > 0;

const run = async (command: string, args: string[]): Promise<void> => {
  const child = spawn(command, args, {
    cwd: rootDir,
    env: { ...process.env, CLOUDFLARE_ENV: "dev" },
    shell: true,
    stdio: "inherit",
  });
  const event: unknown = await once(child, "close");
  if (!isCloseEvent(event)) {
    process.exit(1);
  }
  const [exitCode] = event;
  if (exitCode !== 0) {
    process.exit(exitCode ?? 1);
  }
};

await run("bunx", ["vite", "build"]);
await run("bunx", ["wrangler", "deploy", "-c", generatedConfig]);
