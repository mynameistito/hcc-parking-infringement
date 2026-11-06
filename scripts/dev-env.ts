import { readFileSync } from "node:fs";
import path from "node:path";
/**
 * Shared environment for CLI scripts: `.dev.vars`, worker URL resolution,
 * and fetch helpers with timeouts and actionable error messages.
 */

import type { JSONValue } from "hono/utils/types";
import { z } from "zod";

const rootDir = path.resolve(import.meta.dirname, "..");
const DEFAULT_WORKER_URL = "http://127.0.0.1:5173";
const DEFAULT_FETCH_TIMEOUT_MS = 15_000;

/**
 *  Whether a worker URL targets a local dev server (not workers.dev).
 * @param url - Worker URL to inspect.
 * @returns Whether the requested condition holds.
 */
export const isLocalWorkerUrl = (url: string): boolean => {
  try {
    const { hostname } = new URL(url);

    return (
      hostname === "127.0.0.1" ||
      hostname === "localhost" ||
      hostname === "::1" ||
      hostname.startsWith("100.")
    );
  } catch {
    return false;
  }
};

/**
 *  Vite often binds `localhost` only; wrangler uses `127.0.0.1`. Try both.
 * @param workerUrl - Worker origin.
 * @returns The resulting `string[]` value.
 */
const localWorkerUrlAlternates = (workerUrl: string): string[] => {
  try {
    const parsed = new URL(workerUrl);
    const alternates: string[] = [];

    if (parsed.hostname === "127.0.0.1") {
      parsed.hostname = "localhost";
      alternates.push(parsed.toString().replace(/\/$/u, ""));
    } else if (parsed.hostname === "localhost") {
      parsed.hostname = "127.0.0.1";
      alternates.push(parsed.toString().replace(/\/$/u, ""));
    }

    return alternates;
  } catch {
    return [];
  }
};

/**
 *  Default export source when `--from` / `--from-port` are not set.
 * @returns The formatted or resolved string value.
 */
export const defaultLocalPushSourceUrl = (): string => {
  const workerUrl = process.env.WORKER_URL;

  if (workerUrl !== undefined && isLocalWorkerUrl(workerUrl)) {
    return workerUrl.replace(/\/$/u, "");
  }

  return "http://localhost:5173";
};

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

const parseDevVarLine = (line: string): [string, string] | null => {
  const trimmed = line.trim();

  if (trimmed === "" || trimmed.startsWith("#")) {
    return null;
  }

  const equalsIndex = trimmed.indexOf("=");

  if (equalsIndex === -1) {
    return null;
  }

  const key = trimmed.slice(0, equalsIndex).trim();
  let value = trimmed.slice(equalsIndex + 1).trim();

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  return [key, value];
};

const parseDevVars = (content: string): Map<string, string> => {
  const vars = new Map<string, string>();

  for (const line of content.split("\n")) {
    const entry = parseDevVarLine(line);

    if (entry !== null) {
      vars.set(...entry);
    }
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

    for (const [key, value] of vars) {
      process.env[key] ??= value;
    }
  } catch {
    // `.dev.vars` is optional for deployed targets.
  }
};

/**
 *  Worker base URL from `WORKER_URL` or the Vite dev default (`http://127.0.0.1:5173`).
 * @returns The formatted or resolved string value.
 */
export const getWorkerUrl = (): string =>
  (process.env.WORKER_URL ?? DEFAULT_WORKER_URL).replace(/\/$/u, "");

/**
 *  Minimal env for scripts that call the HCC Open Data API directly.
 * @returns The resulting `Pick<Env, "HCC_API_BASE">` value.
 */
export const getHccClientEnv = (): Pick<Env, "HCC_API_BASE"> => ({
  HCC_API_BASE: process.env.HCC_API_BASE,
});

/**
 *  Resolve worker URL from CLI `--port` / `--port=`, then `WORKER_URL`, then default.
 * @param args - Command-line argument tokens.
 * @returns The formatted or resolved string value.
 */
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

/** `fetch` options with an optional per-request timeout override. */
export interface FetchWithTimeoutInit extends RequestInit {
  timeoutMs?: number;
}

/**
 *  Fetch with an abort timeout so dead ports / proxies fail fast instead of hanging.
 * @param url - Worker URL to inspect.
 * @param init - Fetch request options.
 * @returns The resulting `Promise<Response>` value.
 */
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

const formatErrorReason = (cause: unknown, timeoutMs: number): string => {
  if (cause instanceof Error && cause.name === "AbortError") {
    return `timed out after ${timeoutMs}ms`;
  }

  if (cause instanceof Error) {
    return cause.message;
  }

  return String(cause);
};

/**
 *  Fail fast when the worker port is wrong or unreachable.
 * @param workerUrl - Worker origin.
 * @param options - Operation settings and progress callbacks.
 */
export const assertWorkerReachable = async (
  workerUrl: string,
  options?: { path?: string; timeoutMs?: number }
): Promise<void> => {
  const baseUrl = workerUrl.replace(/\/$/u, "");

  const paths = [
    options?.path ?? "/api/v1/health/live",
    "/api/v1/health",
  ].filter((healthPath, index, all) => all.indexOf(healthPath) === index);

  const baseUrls = [baseUrl, ...localWorkerUrlAlternates(baseUrl)].filter(
    (candidate, index, all) => all.indexOf(candidate) === index
  );

  let lastError: Error | undefined;

  for (const candidateBase of baseUrls) {
    for (const healthPath of paths) {
      const url = `${candidateBase}${healthPath}`;

      try {
        const response = await fetchWithTimeout(url, {
          timeoutMs: options?.timeoutMs ?? DEFAULT_FETCH_TIMEOUT_MS,
        });

        if (response.ok) {
          return;
        }

        if (response.status === 404 && healthPath !== paths.at(-1)) {
          continue;
        }

        throw new Error(`GET ${url} returned HTTP ${response.status}`);
      } catch (error) {
        lastError =
          error instanceof Error
            ? error
            : new Error(String(error), { cause: error });
      }
    }
  }

  const reason = formatErrorReason(
    lastError,
    options?.timeoutMs ?? DEFAULT_FETCH_TIMEOUT_MS
  );

  const hints = isLocalWorkerUrl(workerUrl)
    ? [
        "Start a local worker first:",
        "  bun run dev              (Vite + DO, http://localhost:5173)",
        "  bun run dev:wrangler     (wrangler only, http://127.0.0.1:8787)",
        "Then push with an explicit source if needed:",
        "  bun run push:local -- --from=http://localhost:5173",
      ]
    : [
        "Check the worker URL and that the deployment is up.",
        "If you set WORKER_URL to production, pass --to= explicitly and use --from= for local.",
      ];

  throw new Error(
    [`Worker not reachable at ${workerUrl} (${reason}).`, ...hints].join("\n"),
    { cause: lastError }
  );
};

const errorMessageSchema = z.union([
  z.string().min(1),
  z.object({ error: z.string().min(1) }).transform((body) => body.error),
]);

const extractErrorMessage = (rawBody: JSONValue): string | undefined => {
  const parsed = errorMessageSchema.safeParse(rawBody);

  return parsed.success ? parsed.data : undefined;
};

/**
 *  Format an HTTP error with hints for common worker misconfiguration (405, 401).
 * @param response - Worker HTTP response.
 * @param rawBody - Raw Body supplied to this operation.
 * @param method - Method supplied to this operation.
 * @param url - Worker URL to inspect.
 * @returns The formatted or resolved string value.
 */
export const describeFetchFailure = (
  response: Response,
  rawBody: JSONValue,
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

const formatConnectionErrorReason = (cause: unknown): string => {
  if (cause instanceof Error && cause.name === "AbortError") {
    return "request timed out (wrong port, dev server not running, or HTTP proxy intercepting localhost)";
  }

  return formatErrorReason(cause, DEFAULT_FETCH_TIMEOUT_MS);
};

/**
 *  Format a connection/timeout error with dev-server startup hints.
 * @param cause - Failure reported by the operation.
 * @param method - Method supplied to this operation.
 * @param url - Worker URL to inspect.
 * @returns The formatted or resolved string value.
 */
export const describeConnectionFailure = (
  cause: unknown,
  method: string,
  url: string
): string => {
  const reason = formatConnectionErrorReason(cause);

  const lines = [
    `${method} could not reach ${url}`,
    reason,
    "Start a dev server (`bun run dev` or `bun run dev:wrangler`), pass `--port=...`, or set WORKER_URL.",
    "Use the exact port from the wrangler terminal (often 8787, not 8788).",
  ];

  return lines.join("\n");
};
