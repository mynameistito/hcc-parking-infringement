/**
 * Trigger a manual sync (last 7 days) against your worker.
 *
 * @example
 * bun run sync
 */

import {
  describeConnectionFailure,
  describeFetchFailure,
  loadDevVars,
} from "@scripts/dev-env.ts";
import {
  bearerHeaders,
  createWorkerContext,
} from "@scripts/lib/worker-client.ts";
import { z } from "zod";

loadDevVars();

const { apiKey, workerUrl } = createWorkerContext();

const syncResponseSchema = z.record(z.string(), z.unknown());
const url = `${workerUrl}/api/v1/sync`;

let response: Response;

try {
  response = await fetch(url, {
    headers: bearerHeaders(apiKey),
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
