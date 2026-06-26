/**
 * Trigger a backfill against your deployed (or local) worker.
 *
 * Usage:
 *   bun run backfill
 *   bun run backfill -- --force
 *   bun run backfill -- --granularity=day --from=1990-01-01
 *   bun run backfill -- --port=8787
 *   bun run backfill -- --port 8787
 *   bun run backfill -- --no-track
 *   API_KEY=xxx WORKER_URL=https://your-worker.workers.dev bun run backfill
 */

import { setTimeout as sleep } from "node:timers/promises";

import {
  assertWorkerReachable,
  describeConnectionFailure,
  describeFetchFailure,
  fetchWithTimeout,
  loadDevVars,
  resolveWorkerUrl,
} from "@scripts/dev-env.ts";
import { formatInTimeZone } from "date-fns-tz";
import { z } from "zod";

import { splitDateRange } from "@/server/sync.ts";

loadDevVars();

const AUCKLAND_TZ = "Pacific/Auckland";
const BACKFILL_EARLIEST = "1990-01-01";
const POLL_MS = 2000;

const args = process.argv.slice(2);
const force = args.includes("--force");
const track = !args.includes("--no-track");
let workerUrl: string;

try {
  workerUrl = resolveWorkerUrl(args);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
const apiKey = process.env.API_KEY;

const getArg = (name: string): string | undefined => {
  const match = args.find((arg) => arg.startsWith(`--${name}=`));
  return match?.split("=")[1];
};

const today = (): string =>
  formatInTimeZone(new Date(), AUCKLAND_TZ, "yyyy-MM-dd");

const authHeaders = (): HeadersInit => ({
  Accept: "application/json",
  Authorization: `Bearer ${apiKey}`,
});

const backfillResponseSchema = z.object({
  chunkDays: z.number().optional(),
  continueFrom: z.string().nullable().optional(),
  end: z.string().optional(),
  enqueued: z.number().optional(),
  error: z.string().optional(),
  ok: z.boolean().optional(),
  remaining: z.number().optional(),
  skipped: z.number().optional(),
  start: z.string().optional(),
  total: z.number().optional(),
});

const progressResponseSchema = z.object({
  chunkDays: z.number(),
  completed: z.number(),
  end: z.string(),
  latestIngestedAt: z.string().nullable(),
  latestWindow: z
    .object({
      end: z.string(),
      start: z.string(),
    })
    .nullable(),
  ok: z.boolean().optional(),
  percent: z.number(),
  start: z.string(),
  total: z.number(),
  totalRecords: z.number(),
});

const healthResponseSchema = z.object({
  cache: z
    .object({
      ingestWindows: z.number(),
      totalRecords: z.number(),
    })
    .optional(),
  sync: z
    .object({
      endDate: z.string().optional(),
      recordsFetched: z.number().optional(),
      runType: z.string().optional(),
      startDate: z.string().optional(),
      status: z.string().optional(),
    })
    .nullable()
    .optional(),
});

const formatWindowLabel = (
  start: string | undefined,
  end: string | undefined
): string => {
  if (start === undefined || end === undefined) {
    return "waiting…";
  }
  if (start === end) {
    return start;
  }
  return `${start} → ${end}`;
};

const renderBar = (percent: number, width = 28): string => {
  const filled = Math.round((percent / 100) * width);
  return `[${"█".repeat(filled)}${"░".repeat(width - filled)}]`;
};

const formatNumber = (value: number): string => value.toLocaleString("en-NZ");

const chunkDaysFor = (
  granularity: string,
  chunkDays: string | undefined
): number => {
  if (chunkDays !== undefined) {
    const parsed = Number.parseInt(chunkDays, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return granularity === "day" ? 1 : 7;
};

const renderProgressLine = (
  progress: z.infer<typeof progressResponseSchema>
): string => {
  const bar = renderBar(progress.percent);
  const windowLabel =
    progress.latestWindow === null
      ? "waiting…"
      : formatWindowLabel(
          progress.latestWindow.start,
          progress.latestWindow.end
        );

  return [
    bar,
    `${progress.percent.toFixed(1)}%`,
    `${formatNumber(progress.completed)}/${formatNumber(progress.total)} windows`,
    `${formatNumber(progress.totalRecords)} records`,
    `latest ${windowLabel}`,
  ].join("  ");
};

const renderFallbackLine = (options: {
  baselineRecords: number;
  baselineWindows: number;
  expectedTotal: number;
  health: z.infer<typeof healthResponseSchema>;
}): string => {
  const records = options.health.cache?.totalRecords ?? 0;
  const windows = options.health.cache?.ingestWindows ?? 0;
  const { sync } = options.health;
  const windowLabel = formatWindowLabel(sync?.startDate, sync?.endDate);

  return [
    `${formatNumber(records)} records (+${formatNumber(records - options.baselineRecords)})`,
    `${formatNumber(windows)} windows (+${formatNumber(windows - options.baselineWindows)})`,
    `target ~${formatNumber(options.expectedTotal)} windows`,
    `latest ${windowLabel}`,
    sync?.runType ?? "",
  ]
    .filter((part) => part.length > 0)
    .join("  ");
};

const fetchProgress = async (
  start: string,
  end: string,
  granularity: string,
  chunkDays: string | undefined
): Promise<
  | { kind: "progress"; progress: z.infer<typeof progressResponseSchema> }
  | { kind: "unavailable"; status: number }
> => {
  const url = new URL(`${workerUrl}/api/v1/sync/backfill/progress`, workerUrl);
  url.searchParams.set("from", start);
  url.searchParams.set("to", end);
  url.searchParams.set("granularity", granularity);
  if (chunkDays !== undefined) {
    url.searchParams.set("chunkDays", chunkDays);
  }

  const response = await fetchWithTimeout(url.toString(), {
    headers: authHeaders(),
  });
  const rawBody: unknown = await response.json().catch(() => null);

  if (response.status === 404) {
    return { kind: "unavailable", status: response.status };
  }

  const parsed = progressResponseSchema.safeParse(rawBody);
  if (!response.ok || !parsed.success) {
    throw new Error(
      describeFetchFailure(response, rawBody, "GET", url.toString())
    );
  }

  return { kind: "progress", progress: parsed.data };
};

const fetchHealth = async (): Promise<z.infer<typeof healthResponseSchema>> => {
  const response = await fetchWithTimeout(`${workerUrl}/api/v1/status`, {
    headers: authHeaders(),
  });
  const rawBody: unknown = await response.json().catch(() => null);
  const parsed = healthResponseSchema.safeParse(rawBody);

  if (!response.ok || !parsed.success) {
    throw new Error(
      describeFetchFailure(
        response,
        rawBody,
        "GET",
        `${workerUrl}/api/v1/status`
      )
    );
  }

  return parsed.data;
};

const warnIfWorkerLooksOutdated = (
  body: z.infer<typeof backfillResponseSchema>,
  granularity: string,
  from: string
): void => {
  const expectedChunkDays = granularity === "day" ? 1 : 7;
  const expectedTotal = splitDateRange(
    from,
    body.end ?? today(),
    expectedChunkDays
  ).length;

  if (body.chunkDays === undefined) {
    console.warn(
      "\nWarning: worker response has no chunkDays — it may be running old code.",
      "Restart with `bun run dev` (or redeploy) so daily backfill + progress tracking work."
    );
  } else if (body.chunkDays !== expectedChunkDays) {
    console.warn(
      `\nWarning: worker used chunkDays=${body.chunkDays}, expected ${expectedChunkDays}.`
    );
  }

  if (
    granularity === "day" &&
    body.total !== undefined &&
    body.total < expectedTotal / 2
  ) {
    console.warn(
      `\nWarning: only ${body.total} windows queued but ~${expectedTotal} daily windows expected.`,
      "The worker on this port may not support ?granularity=day yet."
    );
  }

  if (
    body.enqueued === 0 &&
    body.skipped === body.total &&
    body.total === 339
  ) {
    console.warn(
      "\nAll 339 weekly windows were skipped (already ingested).",
      "Daily gaps from 1990+ need the updated worker:",
      "bun run dev",
      "bun run backfill -- --port=5173 --granularity=day --from=1990-01-01"
    );
  }
};

const trackBackfill = async (
  start: string,
  end: string,
  granularity: string,
  chunkDays: string | undefined,
  enqueued: number
): Promise<void> => {
  const expectedTotal = splitDateRange(
    start,
    end,
    chunkDaysFor(granularity, chunkDays)
  ).length;

  const initialProgress = await fetchProgress(
    start,
    end,
    granularity,
    chunkDays
  );

  if (enqueued === 0) {
    if (initialProgress.kind === "progress") {
      console.log(
        `\nNothing queued — ${initialProgress.progress.completed}/${initialProgress.progress.total} windows already ingested.`
      );
      return;
    }

    console.log(
      `\nNothing queued — worker skipped existing windows (progress API unavailable on this port).`,
      `Expected ~${formatNumber(expectedTotal)} ${granularity} windows for ${start} → ${end}.`
    );
    return;
  }

  if (initialProgress.kind === "progress") {
    console.log("\nBackfill tracker (Ctrl+C to stop watching):\n");

    const pollProgress = async (
      lastCompleted: number,
      idlePolls: number
    ): Promise<void> => {
      const result = await fetchProgress(start, end, granularity, chunkDays);
      if (result.kind !== "progress") {
        return;
      }

      const { progress } = result;
      const nextIdlePolls =
        progress.completed === lastCompleted ? idlePolls + 1 : 0;
      const nextCompleted =
        progress.completed === lastCompleted
          ? lastCompleted
          : progress.completed;

      process.stdout.write(`\r\u001B[K${renderProgressLine(progress)}`);

      if (progress.completed >= progress.total) {
        process.stdout.write("\n\nBackfill complete.\n");
        return;
      }

      if (nextIdlePolls >= 30) {
        process.stdout.write(
          "\n\nTracker paused — no new windows in 60s. Queue may still be running; re-run to resume watching.\n"
        );
        return;
      }

      await sleep(POLL_MS);
      await pollProgress(nextCompleted, nextIdlePolls);
    };

    await pollProgress(-1, 0);
    return;
  }

  console.log(
    "\nBackfill tracker (basic — progress API unavailable, polling /api/v1/status):\n"
  );

  const baseline = await fetchHealth();
  const baselineRecords = baseline.cache?.totalRecords ?? 0;
  const baselineWindows = baseline.cache?.ingestWindows ?? 0;

  const pollHealth = async (
    lastRecords: number,
    idlePolls: number
  ): Promise<void> => {
    const health = await fetchHealth();
    const records = health.cache?.totalRecords ?? 0;
    const nextIdlePolls = records === lastRecords ? idlePolls + 1 : 0;

    process.stdout.write(
      `\r\u001B[K${renderFallbackLine({
        baselineRecords,
        baselineWindows,
        expectedTotal,
        health,
      })}`
    );

    if (nextIdlePolls >= 30) {
      process.stdout.write(
        "\n\nTracker paused — no new records in 60s. Queue may still be running.\n"
      );
      return;
    }

    await sleep(POLL_MS);
    await pollHealth(records, nextIdlePolls);
  };

  await pollHealth(baselineRecords, 0);
};

const WAVE_DRAIN_POLL_MS = 5000;
const WAVE_DRAIN_TIMEOUT_MS = 10 * 60 * 1000;

const waitForWaveDrain = async (
  start: string,
  end: string,
  granularity: string,
  chunkDays: string | undefined,
  baselineCompleted: number,
  targetDelta: number
): Promise<void> => {
  const deadline = Date.now() + WAVE_DRAIN_TIMEOUT_MS;

  const pollWaveDrain = async (): Promise<void> => {
    if (Date.now() >= deadline) {
      console.warn(
        "\nWave pause timed out — continuing to enqueue next wave anyway."
      );
      return;
    }

    const result = await fetchProgress(start, end, granularity, chunkDays);
    if (
      result.kind === "progress" &&
      result.progress.completed - baselineCompleted >= targetDelta
    ) {
      return;
    }

    await sleep(WAVE_DRAIN_POLL_MS);
    await pollWaveDrain();
  };

  await pollWaveDrain();
};

const postBackfillWave = async (
  options: {
    chunkDays: string | undefined;
    force: boolean;
    from: string;
    granularity: string;
    to: string;
  },
  currentFrom: string
): Promise<z.infer<typeof backfillResponseSchema> | null> => {
  const url = new URL("/api/v1/sync/backfill", workerUrl);
  if (options.force) {
    url.searchParams.set("force", "true");
  }
  url.searchParams.set("granularity", options.granularity);
  if (options.chunkDays !== undefined) {
    url.searchParams.set("chunkDays", options.chunkDays);
  }
  url.searchParams.set("from", currentFrom);
  url.searchParams.set("to", options.to);

  let response: Response;

  try {
    response = await fetchWithTimeout(url.toString(), {
      headers: authHeaders(),
      method: "POST",
    });
  } catch (error) {
    console.error(describeConnectionFailure(error, "POST", url.toString()));
    process.exit(1);
  }

  const rawBody: unknown = await response.json().catch(() => null);
  const parsedBody = backfillResponseSchema.safeParse(rawBody);
  const body = parsedBody.success ? parsedBody.data : null;

  if (!response.ok) {
    console.error(
      describeFetchFailure(
        response,
        body?.error ?? rawBody,
        "POST",
        url.toString()
      )
    );
    process.exit(1);
  }

  return body;
};

const queueBackfillWaves = async (options: {
  chunkDays: string | undefined;
  force: boolean;
  from: string;
  granularity: string;
  to: string;
}): Promise<{
  bodies: z.infer<typeof backfillResponseSchema>[];
  totalEnqueued: number;
}> => {
  const queueFrom = async (
    currentFrom: string,
    bodies: z.infer<typeof backfillResponseSchema>[],
    totalEnqueued: number
  ): Promise<{
    bodies: z.infer<typeof backfillResponseSchema>[];
    totalEnqueued: number;
  }> => {
    const body = await postBackfillWave(options, currentFrom);
    const nextBodies = [...bodies, body ?? {}];
    const enqueued = body?.enqueued ?? 0;
    const nextTotalEnqueued = totalEnqueued + enqueued;

    console.log("Backfill queued:", body);

    const continueFrom = body?.continueFrom;
    const remaining = body?.remaining ?? 0;

    if (continueFrom === undefined || continueFrom === null || remaining <= 0) {
      return { bodies: nextBodies, totalEnqueued: nextTotalEnqueued };
    }

    console.log(
      `\n${formatNumber(remaining)} windows remaining — waiting for this wave to ingest before queuing more…`
    );

    const progressBefore = await fetchProgress(
      options.from,
      options.to,
      options.granularity,
      options.chunkDays
    );
    const baselineCompleted =
      progressBefore.kind === "progress"
        ? progressBefore.progress.completed
        : 0;

    await waitForWaveDrain(
      options.from,
      options.to,
      options.granularity,
      options.chunkDays,
      baselineCompleted,
      enqueued
    );

    return await queueFrom(continueFrom, nextBodies, nextTotalEnqueued);
  };

  return await queueFrom(options.from, [], 0);
};

if (apiKey === undefined || apiKey === "") {
  console.error("Missing API_KEY. Set it in the environment or `.dev.vars`.");
  console.error('  PowerShell: $env:API_KEY = "your-key"');
  console.error("  Bash:       export API_KEY=your-key");
  process.exit(1);
}

const granularity = getArg("granularity") ?? "week";
const chunkDays = getArg("chunkDays");
const from = getArg("from") ?? BACKFILL_EARLIEST;
const to = getArg("to") ?? today();

console.log(`Target worker: ${workerUrl}`);
console.log(`Backfill range: ${from} → ${to} (${granularity})`);

try {
  await assertWorkerReachable(workerUrl);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

const { bodies, totalEnqueued } = await queueBackfillWaves({
  chunkDays,
  force,
  from,
  granularity,
  to,
});

const body = bodies.at(-1) ?? null;

console.log(`Worker: ${workerUrl}`);
if (bodies.length > 1) {
  console.log(
    `Queued ${formatNumber(totalEnqueued)} windows in ${bodies.length} waves.`
  );
}

if (body !== null) {
  warnIfWorkerLooksOutdated(body, granularity, from);
}

if (track && body !== null) {
  try {
    await trackBackfill(
      body.start ?? from,
      body.end ?? to,
      granularity,
      chunkDays,
      totalEnqueued
    );
  } catch (error) {
    console.error(
      "\nProgress tracker stopped:",
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}
