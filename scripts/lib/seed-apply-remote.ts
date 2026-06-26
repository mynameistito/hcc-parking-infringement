import { setTimeout as delay } from "node:timers/promises";

import { bearerHeaders } from "@scripts/lib/worker-client.ts";

import { seedManifestResponseSchema } from "@/server/seed-request.ts";

const jsonHeaders = (apiKey: string): HeadersInit => ({
  Accept: "application/json",
  Authorization: `Bearer ${apiKey}`,
  "Content-Type": "application/json",
});

export const fetchSeedManifest = async (
  workerUrl: string,
  apiKey: string
): Promise<{ infringementChunks: string[] }> => {
  const response = await fetch(`${workerUrl}/api/v1/import/seed/manifest`, {
    headers: bearerHeaders(apiKey),
  });
  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      `GET /import/seed/manifest failed (${response.status}): ${JSON.stringify(body)}`
    );
  }

  return seedManifestResponseSchema.parse(body);
};

export const applySeedOnRemote = async (options: {
  apiKey: string;
  pauseMs: number;
  prefix?: string;
  startAfterChunk?: string;
  toUrl: string;
}): Promise<void> => {
  const { infringementChunks } = await fetchSeedManifest(
    options.toUrl,
    options.apiKey
  );

  const startIndex =
    options.startAfterChunk === undefined
      ? 0
      : infringementChunks.indexOf(options.startAfterChunk) + 1;

  if (options.startAfterChunk !== undefined && startIndex === 0) {
    throw new Error(`Unknown start-after-chunk: ${options.startAfterChunk}`);
  }

  for (const chunk of infringementChunks.slice(startIndex)) {
    const response = await fetch(`${options.toUrl}/api/v1/import/seed/chunk`, {
      body: JSON.stringify({
        chunk,
        ...(options.prefix === undefined ? {} : { prefix: options.prefix }),
      }),
      headers: jsonHeaders(options.apiKey),
      method: "POST",
    });
    const body: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(
        `POST /import/seed/chunk ${chunk} failed (${response.status}): ${JSON.stringify(body)}`
      );
    }

    console.log(`[seed] applied ${chunk}`, body);

    if (options.pauseMs > 0) {
      await delay(options.pauseMs);
    }
  }

  const watermarksResponse = await fetch(
    `${options.toUrl}/api/v1/import/seed/watermarks`,
    {
      body:
        options.prefix === undefined
          ? undefined
          : JSON.stringify({ prefix: options.prefix }),
      headers: jsonHeaders(options.apiKey),
      method: "POST",
    }
  );

  if (!watermarksResponse.ok) {
    const body: unknown = await watermarksResponse.json().catch(() => null);
    throw new Error(
      `POST /import/seed/watermarks failed (${watermarksResponse.status}): ${JSON.stringify(body)}`
    );
  }

  const finalizeResponse = await fetch(
    `${options.toUrl}/api/v1/import/seed/finalize`,
    {
      headers: bearerHeaders(options.apiKey),
      method: "POST",
    }
  );

  if (!finalizeResponse.ok) {
    const body: unknown = await finalizeResponse.json().catch(() => null);
    throw new Error(
      `POST /import/seed/finalize failed (${finalizeResponse.status}): ${JSON.stringify(body)}`
    );
  }
};
