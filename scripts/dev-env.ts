import { readFileSync } from "node:fs";
import path from "node:path";

const rootDir = path.resolve(import.meta.dirname, "..");
const DEFAULT_WORKER_URL = "http://127.0.0.1:5173";
const WRANGLER_DEV_URL = "http://127.0.0.1:8787";
const DEFAULT_FETCH_TIMEOUT_MS = 15_000;

let devVarsLoaded = false;

/** Keep local worker requests off HTTP proxies (e.g. Socket Firewall). */
const ensureLocalNoProxy = (): void => {
  const hosts = ["localhost", "127.0.0.1", "::1"];
  const existing = process.env.NO_PROXY ?? process.env.no_proxy ?? "";
  const parts = existing
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  for (const host of hosts) {
    if (!parts.includes(host)) {
      parts.push(host);
    }
  }

  const value = parts.join(",");
  process.env.NO_PROXY = value;
  process.env.no_proxy = value;

  // Socket Firewall and similar tools often ignore NO_PROXY for HTTP_PROXY traffic.
  delete process.env.HTTP_PROXY;
  delete process.env.http_proxy;
  delete process.env.HTTPS_PROXY;
  delete process.env.https_proxy;
  delete process.env.ALL_PROXY;
  delete process.env.all_proxy;
};

ensureLocalNoProxy();

const parseDevVars = (content: string): Record<string, string> => {
  const vars: Record<string, string> = {};

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#")) {
      continue;
    }

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, equalsIndex).trim();
    let value = trimmed.slice(equalsIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    vars[key] = value;
  }

  return vars;
};

/** Load `.dev.vars` into `process.env` when a key is not already set. */
export const loadDevVars = (): void => {
  if (devVarsLoaded) {
    return;
  }

  devVarsLoaded = true;

  try {
    const content = readFileSync(path.join(rootDir, ".dev.vars"), "utf-8");
    const vars = parseDevVars(content);

    for (const [key, value] of Object.entries(vars)) {
      process.env[key] ??= value;
    }
  } catch {
    // `.dev.vars` is optional for deployed targets.
  }
};

export const getWorkerUrl = (): string =>
  (process.env.WORKER_URL ?? DEFAULT_WORKER_URL).replace(/\/$/u, "");

/** Minimal env for scripts that call the HCC Open Data API directly. */
export const getHccClientEnv = (): Pick<Env, "HCC_API_BASE"> => ({
  HCC_API_BASE: process.env.HCC_API_BASE,
});

export const WRANGLER_DEV_PORT = "8787";
export const WRANGLER_DEV_DEFAULT_URL = WRANGLER_DEV_URL;

/** Resolve worker URL from CLI `--port` / `--port=`, then `WORKER_URL`, then default. */
export const resolveWorkerUrl = (args: string[] = []): string => {
  const portFromEquals = args
    .find((arg) => arg.startsWith("--port="))
    ?.split("=")[1]
    ?.trim();
  const portFlagIndex = args.indexOf("--port");
  const portFromFlag =
    portFlagIndex === -1 ? undefined : args[portFlagIndex + 1]?.trim();
  const port = portFromEquals ?? portFromFlag;

  if (port !== undefined && port !== "") {
    const normalizedPort = port.replaceAll(/^["']|["']$/gu, "");
    if (!/^\d+$/u.test(normalizedPort)) {
      throw new Error(`Invalid --port value "${port}" — expected a number.`);
    }
    return `http://127.0.0.1:${normalizedPort}`;
  }

  return getWorkerUrl().replace("://localhost", "://127.0.0.1");
};

export interface FetchWithTimeoutInit extends RequestInit {
  timeoutMs?: number;
}

/** Fetch with an abort timeout so dead ports / proxies fail fast instead of hanging. */
export const fetchWithTimeout = async (
  url: string,
  init?: FetchWithTimeoutInit
): Promise<Response> => {
  const timeoutMs = init?.timeoutMs ?? DEFAULT_FETCH_TIMEOUT_MS;
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
};

const formatErrorReason = (error: unknown, timeoutMs: number): string => {
  if (error instanceof Error && error.name === "AbortError") {
    return `timed out after ${timeoutMs}ms`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
};

/** Fail fast when the worker port is wrong or unreachable. */
export const assertWorkerReachable = async (
  workerUrl: string,
  options?: { timeoutMs?: number }
): Promise<void> => {
  const url = `${workerUrl.replace(/\/$/u, "")}/api/v1/health`;

  try {
    const response = await fetchWithTimeout(url, {
      timeoutMs: options?.timeoutMs ?? DEFAULT_FETCH_TIMEOUT_MS,
    });

    if (!response.ok) {
      throw new Error(`GET ${url} returned HTTP ${response.status}`);
    }
  } catch (error) {
    const reason = formatErrorReason(
      error,
      options?.timeoutMs ?? DEFAULT_FETCH_TIMEOUT_MS
    );

    throw new Error(
      [
        `Worker not reachable at ${workerUrl} (${reason}).`,
        "Check the port shown in your wrangler dev terminal, e.g.:",
        "  bun run backfill -- --port=8787",
        "Or set WORKER_URL in `.dev.vars` to match (use 127.0.0.1, not localhost).",
        "If you use Socket Firewall, keep it running but scripts clear HTTP_PROXY for local calls.",
      ].join("\n"),
      { cause: error }
    );
  }
};

const extractErrorMessage = (rawBody: unknown): string | undefined => {
  if (rawBody === null || rawBody === undefined) {
    return undefined;
  }

  if (typeof rawBody === "string" && rawBody.length > 0) {
    return rawBody;
  }

  if (typeof rawBody === "object" && rawBody !== null && "error" in rawBody) {
    const { error } = rawBody as { error: unknown };
    if (typeof error === "string" && error.length > 0) {
      return error;
    }
  }

  return undefined;
};

export const describeFetchFailure = (
  response: Response,
  rawBody: unknown,
  method: string,
  url: string
): string => {
  const lines = [`${method} ${url} failed (${response.status})`];
  const message = extractErrorMessage(rawBody);

  if (message !== undefined) {
    lines.push(message);
  }

  if (response.status === 405) {
    lines.push(
      "Method not allowed — start a dev server:",
      "  bun run dev              (Vite, default http://localhost:5173)",
      "  bun run dev:wrangler     (wrangler, default http://localhost:8787)",
      "If the port differs, pass `--port=...` or set WORKER_URL.",
      "If you use Socket Firewall or an HTTP proxy, ensure localhost is in NO_PROXY (scripts add this automatically)."
    );
  } else if (response.status === 401) {
    lines.push("Unauthorized — API_KEY must match the value in `.dev.vars`.");
  }

  return lines.join("\n");
};

const formatConnectionErrorReason = (error: unknown): string => {
  if (error instanceof Error && error.name === "AbortError") {
    return "request timed out (wrong port, dev server not running, or HTTP proxy intercepting localhost)";
  }

  return formatErrorReason(error, DEFAULT_FETCH_TIMEOUT_MS);
};

export const describeConnectionFailure = (
  error: unknown,
  method: string,
  url: string
): string => {
  const reason = formatConnectionErrorReason(error);

  const lines = [
    `Could not reach ${url}`,
    reason,
    "Start a dev server (`bun run dev` or `bun run dev:wrangler`), pass `--port=...`, or set WORKER_URL.",
    "Use the exact port from the wrangler terminal (often 8787, not 8788).",
  ];

  return lines.join("\n");
};
