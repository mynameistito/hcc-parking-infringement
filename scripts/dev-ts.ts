/**
 * Vite dev on your Tailscale IP so other devices on your tailnet can reach the app.
 *
 * @example
 * bun run dev:ts
 * bun run dev:ts -- --port=5174
 * DEV_HOST=100.71.192.25 bun run dev:ts
 */

import { spawn } from "node:child_process";
import { once } from "node:events";
import { connect } from "node:net";
import path from "node:path";

import { readArgValue, readFlag, scriptArgv } from "@scripts/lib/cli/args.ts";

const rootDir = path.resolve(import.meta.dirname, "..");
const DEFAULT_PORT = "5173";

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

const readStdout = async (child: ReturnType<typeof spawn>): Promise<string> => {
  const chunks: Buffer[] = [];
  child.stdout?.on("data", (chunk: Buffer) => {
    chunks.push(chunk);
  });
  await once(child, "close");
  return Buffer.concat(chunks).toString("utf-8").trim();
};

const resolveTailscaleHost = async (): Promise<string> => {
  const fromEnv = process.env.DEV_HOST?.trim();
  if (fromEnv !== undefined && fromEnv.length > 0) {
    return fromEnv;
  }

  try {
    const child = spawn("tailscale", ["ip", "-4"], {
      shell: true,
      stdio: ["ignore", "pipe", "ignore"],
    });
    const output = await readStdout(child);
    if (output.length > 0) {
      return output.split(/\s+/u)[0] ?? output;
    }
  } catch {
    // Tailscale CLI unavailable — fall through.
  }

  console.warn(
    "Could not detect a Tailscale IPv4 address. Set DEV_HOST or install the Tailscale CLI."
  );
  return "0.0.0.0";
};

const isPortInUse = async (host: string, port: number): Promise<boolean> => {
  const socket = connect({ host, port });

  try {
    await once(socket, "connect");
    socket.destroy();
    return true;
  } catch {
    socket.destroy();
    return false;
  }
};

const assertPortAvailable = async (
  host: string,
  port: number,
  strictPort: boolean
): Promise<void> => {
  if (!(await isPortInUse(host, port))) {
    return;
  }

  const hint = strictPort
    ? `Stop the process using port ${port} or omit --strictPort.`
    : `Stop the process using port ${port} or pass --port=${port + 1}.`;

  throw new Error(
    `Port ${port} is already in use on ${host}.\n${hint}\n` +
      `Find the listener with: netstat -ano | findstr :${port}`
  );
};

const args = scriptArgv();
const portValue =
  readArgValue(args, "port") ?? process.env.DEV_PORT ?? DEFAULT_PORT;
const normalizedPort = portValue.replaceAll(/^["']|["']$/gu, "");

if (!/^\d+$/u.test(normalizedPort)) {
  throw new Error(`Invalid --port value "${portValue}" — expected a number.`);
}

const port = Number(normalizedPort);
const strictPort = readFlag(args, "strictPort");
const host = await resolveTailscaleHost();

await assertPortAvailable(host, port, strictPort);

const workerUrl = `http://${host}:${port}`;
process.env.WORKER_URL ??= workerUrl;

const forwardedArgs = args.filter(
  (arg, index, all) =>
    arg !== "--strictPort" &&
    arg !== `--port=${normalizedPort}` &&
    !(arg === "--port" && all[index + 1] === normalizedPort)
);

const viteArgs = [
  "dev",
  "--host",
  host,
  "--port",
  normalizedPort,
  ...forwardedArgs,
];

if (strictPort) {
  viteArgs.push("--strictPort");
}

console.log(`Starting Vite on ${workerUrl}`);
console.log("Tailnet dashboard:", workerUrl);
console.log("WORKER_URL for scripts:", workerUrl, "\n");

const child = spawn("bunx", ["vite", ...viteArgs], {
  cwd: rootDir,
  env: process.env,
  shell: true,
  stdio: "inherit",
});

process.exit(await waitForClose(child));
