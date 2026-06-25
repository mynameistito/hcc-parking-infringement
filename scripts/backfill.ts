/**
 * Trigger a backfill against your deployed (or local) worker.
 *
 * Usage:
 *   API_KEY=xxx WORKER_URL=https://your-worker.workers.dev bun run backfill
 *   API_KEY=xxx WORKER_URL=http://localhost:8787 bun run backfill -- --force
 */

import { z } from "zod";

const args = process.argv.slice(2);
const force = args.includes("--force");
const workerUrl = (process.env.WORKER_URL ?? "http://localhost:8787").replace(
  /\/$/u,
  ""
);
const apiKey = process.env.API_KEY;

if (apiKey === undefined || apiKey === "") {
  console.error("Missing API_KEY. Set it in the environment or .dev.vars.");
  console.error('  PowerShell: $env:API_KEY = "your-key"');
  console.error("  Bash:       export API_KEY=your-key");
  process.exit(1);
}

const backfillResponseSchema = z.object({
  enqueued: z.number().optional(),
  error: z.string().optional(),
  ok: z.boolean().optional(),
  skipped: z.number().optional(),
  total: z.number().optional(),
});

const url = new URL("/api/v1/sync/backfill", workerUrl);
if (force) {
  url.searchParams.set("force", "true");
}

const response = await fetch(url, {
  headers: {
    Accept: "application/json",
    Authorization: `Bearer ${apiKey}`,
  },
  method: "POST",
});

const rawBody: unknown = await response.json().catch(() => null);
const parsedBody = backfillResponseSchema.safeParse(rawBody);
const body = parsedBody.success ? parsedBody.data : null;

if (!response.ok) {
  console.error(
    `Backfill failed (${response.status}):`,
    body?.error ?? rawBody
  );
  process.exit(1);
}

console.log("Backfill queued:", body);
