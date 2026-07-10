/**
 * Trigger and optionally follow the Cloudflare-hosted seed refresh.
 *
 * The refresh itself runs entirely on Cloudflare through a Cron-triggered,
 * alarm-driven Durable Object. This command is an operational client only.
 *
 * @example
 * bun run daily:refresh
 * bun run daily:refresh -- --no-wait
 * bun run daily:refresh -- --live-url=https://example.workers.dev
 * bun run daily:refresh -- --timeout-minutes=30
 */

import { setTimeout as sleep } from "node:timers/promises";

import {
  describeFetchFailure,
  fetchWithTimeout,
  loadDevVars,
} from "@scripts/dev-env.ts";
import { readArgValue, readFlag, scriptArgv } from "@scripts/lib/cli/args.ts";
import { z } from "zod";

const DEFAULT_LIVE_URL = "https://hcc-parking-infringement.mynameistito.com";
const DEFAULT_TIMEOUT_MINUTES = 30;
const POLL_INTERVAL_MS = 5000;

const coordinatorStatusSchema = z.object({
  attempts: z.number(),
  completedWindows: z.number(),
  finishedAt: z.string().nullable(),
  id: z.string().nullable(),
  lastError: z.string().nullable(),
  reason: z.enum(["cron", "manual"]).nullable(),
  startedAt: z.string().nullable(),
  status: z.enum(["idle", "planning", "running", "complete", "errored"]),
  totalWindows: z.number(),
});
const coordinatorResponseSchema = z.object({
  coordinator: coordinatorStatusSchema,
  ok: z.literal(true),
});
const liveStatsResponseSchema = z.object({
  data: z.object({
    lastRecordAt: z.string().nullable(),
    lastSyncedAt: z.string().nullable(),
  }),
});

type CoordinatorStatus = z.infer<typeof coordinatorStatusSchema>;

const requiredApiKey = (): string => {
  const apiKey = process.env.API_KEY ?? process.env.CRON_SECRET;
  if (apiKey === undefined || apiKey.trim().length === 0) {
    throw new Error(
      "Set API_KEY or CRON_SECRET in .dev.vars or the environment."
    );
  }
  return apiKey;
};

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const parseInstant = (value: string, label: string): number => {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) {
    throw new TypeError(`Invalid ${label}: ${value}`);
  }
  return parsed;
};

const parseTimeoutMinutes = (value: string | undefined): number => {
  if (value === undefined) {
    return DEFAULT_TIMEOUT_MINUTES;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid --timeout-minutes value: ${value}`);
  }
  return parsed;
};

const requestCoordinator = async (
  liveUrl: string,
  apiKey: string,
  method: "GET" | "POST"
): Promise<CoordinatorStatus> => {
  const path =
    method === "POST" ? "/api/v1/seed/refresh" : "/api/v1/seed/refresh/status";
  const url = `${liveUrl}${path}`;
  const response = await fetchWithTimeout(url, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    method,
    timeoutMs: 60_000,
  });
  const rawBody: unknown = await response.json().catch(() => null);
  const parsed = coordinatorResponseSchema.safeParse(rawBody);
  if (!response.ok || !parsed.success) {
    throw new Error(describeFetchFailure(response, rawBody, method, url));
  }
  return parsed.data.coordinator;
};

const printStatus = (status: CoordinatorStatus): void => {
  const progress =
    status.totalWindows === 0
      ? "planning"
      : `${status.completedWindows}/${status.totalWindows} windows`;
  console.log(
    `[daily] ${status.status} | ${progress} | attempts ${status.attempts}`
  );
};

const waitForRefresh = async (
  liveUrl: string,
  apiKey: string,
  jobId: string,
  timeoutMs: number
): Promise<CoordinatorStatus> => {
  const deadline = Date.now() + timeoutMs;
  let lastProgress = "";

  while (Date.now() < deadline) {
    let status: CoordinatorStatus;
    try {
      status = await requestCoordinator(liveUrl, apiKey, "GET");
    } catch (error: unknown) {
      console.warn(`[daily] status poll failed: ${errorMessage(error)}`);
      await sleep(POLL_INTERVAL_MS);
      continue;
    }
    if (status.id !== jobId) {
      throw new Error(
        `Refresh job changed from ${jobId} to ${status.id ?? "none"}.`
      );
    }

    const progress = `${status.status}:${status.completedWindows}:${status.attempts}`;
    if (progress !== lastProgress) {
      printStatus(status);
      lastProgress = progress;
    }

    if (status.status === "complete") {
      return status;
    }
    if (status.status === "errored") {
      throw new Error(status.lastError ?? "Cloudflare seed refresh failed.");
    }
    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error(`Timed out waiting for refresh ${jobId}.`);
};

const verifyPublishedSnapshot = async (
  liveUrl: string,
  expectedSyncedAfter: string | null
): Promise<void> => {
  const url = `${liveUrl}/api/v1/stats/live`;
  const response = await fetchWithTimeout(url, { timeoutMs: 60_000 });
  const rawBody: unknown = await response.json().catch(() => null);
  const parsed = liveStatsResponseSchema.safeParse(rawBody);
  if (!response.ok || !parsed.success) {
    throw new Error(describeFetchFailure(response, rawBody, "GET", url));
  }

  const { lastRecordAt, lastSyncedAt } = parsed.data.data;
  if (expectedSyncedAfter !== null) {
    if (lastSyncedAt === null) {
      throw new Error("Published snapshot is stale: lastSyncedAt=null.");
    }
    if (
      parseInstant(lastSyncedAt, "lastSyncedAt") <
      parseInstant(expectedSyncedAfter, "expected sync time")
    ) {
      throw new Error(
        `Published snapshot is stale: lastSyncedAt=${lastSyncedAt}.`
      );
    }
  }
  console.log(`[daily] published lastSyncedAt=${lastSyncedAt ?? "null"}`);
  console.log(`[daily] upstream lastRecordAt=${lastRecordAt ?? "null"}`);
};

loadDevVars();

const args = scriptArgv();
const liveUrl = (
  readArgValue(args, "live-url") ??
  process.env.WORKER_URL ??
  DEFAULT_LIVE_URL
).replace(/\/$/u, "");
const timeoutMinutes = parseTimeoutMinutes(
  readArgValue(args, "timeout-minutes")
);
const noWait = readFlag(args, "no-wait");
const apiKey = requiredApiKey();

console.log(`[daily] triggering Cloudflare refresh at ${liveUrl}`);
const started = await requestCoordinator(liveUrl, apiKey, "POST");
printStatus(started);
if (started.id === null) {
  throw new Error("Cloudflare did not return a refresh job id.");
}

if (noWait) {
  console.log(`[daily] refresh accepted: ${started.id}`);
} else {
  const completed = await waitForRefresh(
    liveUrl,
    apiKey,
    started.id,
    timeoutMinutes * 60_000
  );
  await verifyPublishedSnapshot(liveUrl, completed.startedAt);
  console.log(`[daily] refresh complete: ${completed.id}`);
}
