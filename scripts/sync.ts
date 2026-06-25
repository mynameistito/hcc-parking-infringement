/**
 * Trigger a manual sync (last 2 days) against your worker.
 *
 * Usage:
 *   API_KEY=xxx WORKER_URL=https://your-worker.workers.dev bun run sync
 */

import { z } from "zod";

const workerUrl = (process.env.WORKER_URL ?? "http://localhost:8787").replace(
  /\/$/u,
  ""
);
const apiKey = process.env.API_KEY ?? process.env.CRON_SECRET;

if (apiKey === undefined || apiKey === "") {
  console.error("Missing API_KEY or CRON_SECRET.");
  process.exit(1);
}

const syncResponseSchema = z.record(z.string(), z.unknown());

const response = await fetch(`${workerUrl}/api/v1/sync`, {
  headers: {
    Accept: "application/json",
    Authorization: `Bearer ${apiKey}`,
  },
  method: "POST",
});

const rawBody: unknown = await response.json().catch(() => null);
const parsedBody = syncResponseSchema.safeParse(rawBody);
const body = parsedBody.success ? parsedBody.data : null;

if (!response.ok) {
  console.error(`Sync failed (${response.status}):`, body);
  process.exit(1);
}

console.log("Sync complete:", body);
