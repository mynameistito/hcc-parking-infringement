/**
 * Trigger a manual sync (last 7 days) against your worker.
 *
 * Usage:
 *   bun run sync
 *   API_KEY=xxx WORKER_URL=https://your-worker.workers.dev bun run sync
 */

import {
  describeConnectionFailure,
  describeFetchFailure,
  getWorkerUrl,
  loadDevVars,
} from "@scripts/dev-env.ts";
import { z } from "zod";

loadDevVars();

const workerUrl = getWorkerUrl();
const apiKey = process.env.API_KEY ?? process.env.CRON_SECRET;

if (apiKey === undefined || apiKey === "") {
  console.error("Missing API_KEY or CRON_SECRET (environment or `.dev.vars`).");
  process.exit(1);
}

const syncResponseSchema = z.record(z.string(), z.unknown());
const url = `${workerUrl}/api/v1/sync`;

let response: Response;

try {
  response = await fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    method: "POST",
  });
} catch (error) {
  console.error(describeConnectionFailure(error, "POST", url));
  process.exit(1);
}

const rawBody: unknown = await response.json().catch(() => null);
const parsedBody = syncResponseSchema.safeParse(rawBody);
const body = parsedBody.success ? parsedBody.data : null;

if (!response.ok) {
  console.error(describeFetchFailure(response, rawBody, "POST", url));
  process.exit(1);
}

console.log("Sync complete:", body);
