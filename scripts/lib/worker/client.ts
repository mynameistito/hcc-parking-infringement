import { getWorkerUrl } from "@scripts/dev-env.ts";
import { z } from "zod";

/** Authenticated worker URL + API key used by CLI scripts. */
export interface WorkerScriptContext {
  apiKey: string;
  workerUrl: string;
}

/**
 * Read `API_KEY` or `CRON_SECRET` from the environment.
 * Exits the process when neither is set.
 */
export const requireApiKey = (
  message = "Missing API_KEY (environment or `.dev.vars`)."
): string => {
  const apiKey = process.env.API_KEY ?? process.env.CRON_SECRET;
  if (apiKey === undefined || apiKey === "") {
    console.error(message);
    process.exit(1);
  }
  return apiKey;
};

/** Build a script context from `WORKER_URL` (or override) and a valid API key. */
export const createWorkerContext = (
  workerUrl = getWorkerUrl()
): WorkerScriptContext => ({
  apiKey: requireApiKey(),
  workerUrl,
});

/** Standard JSON + bearer auth headers for worker API calls. */
export const bearerHeaders = (apiKey: string): HeadersInit => ({
  Accept: "application/json",
  Authorization: `Bearer ${apiKey}`,
});

const storedTotalSchema = z.object({
  total: z.number().optional(),
});

/**
 * Count infringements in ParkingStore for an inclusive date range
 * via the gated `/api/v1/infringements` endpoint.
 */
export const fetchStoredInfringementCount = async (
  ctx: WorkerScriptContext,
  from: string,
  to: string
): Promise<number> => {
  const url = new URL(`${ctx.workerUrl}/api/v1/infringements`);
  url.searchParams.set("from", from);
  url.searchParams.set("to", to);
  url.searchParams.set("limit", "1");
  url.searchParams.set("page", "1");

  const response = await fetch(url, {
    headers: bearerHeaders(ctx.apiKey),
  });
  const parsed = storedTotalSchema.safeParse(await response.json());
  return parsed.success ? (parsed.data.total ?? 0) : 0;
};
