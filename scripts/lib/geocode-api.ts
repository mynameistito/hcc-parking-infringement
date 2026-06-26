/** Worker API client for the geocode CLI script. */

import { bearerHeaders } from "@scripts/lib/worker-client.ts";
import { z } from "zod";

/** Response from `POST /api/v1/geocode/run`. */
export const geocodeRunResultSchema = z.object({
  failed: z.number().optional(),
  geocoded: z.number().optional(),
  ok: z.boolean().optional(),
  pending: z.number().optional(),
});

export type GeocodeRunResult = z.infer<typeof geocodeRunResultSchema>;

/** Response from `GET /api/v1/locations/map`. */
export const mapResponseSchema = z.object({
  data: z
    .object({
      pendingGeocode: z.number().optional(),
      routes: z.array(z.unknown()).optional(),
    })
    .optional(),
});

export type MapSnapshot = z.infer<typeof mapResponseSchema>["data"];

/** Run one geocode batch on the worker. */
export const runGeocodeBatch = async (
  workerUrl: string,
  apiKey: string,
  limit: number
): Promise<GeocodeRunResult> => {
  const url = new URL("/api/v1/geocode/run", workerUrl);
  url.searchParams.set("limit", String(limit));

  const response = await fetch(url, {
    headers: bearerHeaders(apiKey),
    method: "POST",
  });

  const rawBody: unknown = await response.json().catch(() => null);
  const parsedBody = geocodeRunResultSchema.safeParse(rawBody);

  if (!response.ok) {
    throw new Error(
      `POST ${url} failed (${response.status}): ${JSON.stringify(rawBody)}`
    );
  }

  return parsedBody.success ? parsedBody.data : {};
};

/** Read map route count and pending geocode total from the public map endpoint. */
export const fetchMapSnapshot = async (
  workerUrl: string
): Promise<MapSnapshot | undefined> => {
  const response = await fetch(`${workerUrl}/api/v1/locations/map`);
  const rawBody: unknown = await response.json();
  const parsed = mapResponseSchema.safeParse(rawBody);
  return parsed.success ? parsed.data.data : undefined;
};
