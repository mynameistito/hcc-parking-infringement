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

const run = async (command: string, args: string[]): Promise<void> => {
  const child = spawn(command, args, {
    cwd: rootDir,
    env: { ...process.env, CLOUDFLARE_ENV: "dev" },
    shell: true,
    stdio: "inherit",
  });
  const [exitCode] = (await once(child, "close")) as [number | null];
  if (exitCode !== 0) {
    process.exit(exitCode ?? 1);
  }
};

await run("bunx", ["vite", "build"]);
await run("bunx", ["wrangler", "deploy", "-c", generatedConfig]);
