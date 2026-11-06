import { setTimeout as delay } from "node:timers/promises";

import { bearerHeaders } from "@scripts/lib/worker/client.ts";
import type { JSONValue } from "hono/utils/types";
import { z } from "zod";

import {
  describeDoSqliteQuotaError,
  extractHttpErrorMessage,
  isDoSqliteQuotaResponse,
} from "@/lib/transient-error.ts";
import { seedManifestResponseSchema } from "@/server/seed-request.ts";

const jsonHeaders = (apiKey: string): HeadersInit => ({
  Accept: "application/json",
  Authorization: `Bearer ${apiKey}`,
  "Content-Type": "application/json",
});

/**
 * Signals that a seed import reached the worker request quota.
 */
export class SeedApplyQuotaError extends Error {
  /**
   * Describe the quota failure reported by the destination worker.
   * @param message - Quota diagnostic and recovery guidance.
   */
  constructor(message: string) {
    super(message);
    this.name = "SeedApplyQuotaError";
  }
}

const throwIfQuotaResponse = (rawBody: JSONValue): void => {
  if (!isDoSqliteQuotaResponse(rawBody)) {
    return;
  }

  const message =
    extractHttpErrorMessage(rawBody) ?? "DO SQLite quota exceeded";

  throw new SeedApplyQuotaError(
    `${message}\n\n${describeDoSqliteQuotaError()}`
  );
};

const fetchSeedManifest = async (
  workerUrl: string,
  apiKey: string
): Promise<{ infringementChunks: string[] }> => {
  const response = await fetch(`${workerUrl}/api/v1/import/seed/manifest`, {
    headers: bearerHeaders(apiKey),
  });

  const body = z.json().parse(await response.json().catch(() => null));

  if (!response.ok) {
    throw new Error(
      `GET /import/seed/manifest failed (${response.status}): ${JSON.stringify(body)}`
    );
  }

  return seedManifestResponseSchema.parse(body);
};

/**
 * Finalize the seed import on the destination worker.
 * @param options - Operation settings and progress callbacks.
 */
export const finalizeSeedOnRemote = async (options: {
  apiKey: string;
  prefix?: string;
  toUrl: string;
}): Promise<void> => {
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

  const watermarksBody = z
    .json()
    .parse(await watermarksResponse.json().catch(() => null));

  throwIfQuotaResponse(watermarksBody);

  if (!watermarksResponse.ok) {
    throw new Error(
      `POST /import/seed/watermarks failed (${watermarksResponse.status}): ${JSON.stringify(watermarksBody)}`
    );
  }

  const finalizeResponse = await fetch(
    `${options.toUrl}/api/v1/import/seed/finalize`,
    {
      headers: bearerHeaders(options.apiKey),
      method: "POST",
    }
  );

  const finalizeBody = z
    .json()
    .parse(await finalizeResponse.json().catch(() => null));

  throwIfQuotaResponse(finalizeBody);

  if (!finalizeResponse.ok) {
    throw new Error(
      `POST /import/seed/finalize failed (${finalizeResponse.status}): ${JSON.stringify(finalizeBody)}`
    );
  }
};

/**
 * Chunk completion and finalization status of a seed import.
 */
export interface ApplySeedOnRemoteResult {
  allChunksImported: boolean;
  appliedChunks: string[];
  completed: boolean;
  remainingChunks: string[];
}

/**
 * Apply uploaded seed chunks to the destination worker.
 * @param options - Operation settings and progress callbacks.
 * @returns The resulting `Promise<ApplySeedOnRemoteResult>` value.
 */
export const applySeedOnRemote = async (options: {
  apiKey: string;
  maxChunks?: number;
  onChunkApplied?: (chunk: string) => Promise<void> | void;
  pauseMs: number;
  prefix?: string;
  skipFinalize?: boolean;
  startAfterChunk?: string;
  toUrl: string;
}): Promise<ApplySeedOnRemoteResult> => {
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

  const pendingChunks = infringementChunks.slice(startIndex);

  const chunkLimit =
    options.maxChunks === undefined
      ? pendingChunks.length
      : Math.max(0, options.maxChunks);

  const chunksToApply = pendingChunks.slice(0, chunkLimit);
  const appliedChunks: string[] = [];

  for (const chunk of chunksToApply) {
    const response = await fetch(`${options.toUrl}/api/v1/import/seed/chunk`, {
      body: JSON.stringify({
        chunk,
        prefix: options.prefix,
      }),
      headers: jsonHeaders(options.apiKey),
      method: "POST",
    });

    const body = z.json().parse(await response.json().catch(() => null));
    throwIfQuotaResponse(body);

    if (!response.ok) {
      throw new Error(
        `POST /import/seed/chunk ${chunk} failed (${response.status}): ${JSON.stringify(body)}`
      );
    }

    console.log(`[seed] applied ${chunk}`, body);
    appliedChunks.push(chunk);
    await options.onChunkApplied?.(chunk);

    if (options.pauseMs > 0) {
      await delay(options.pauseMs);
    }
  }

  const remainingChunks = pendingChunks.slice(appliedChunks.length);
  const allChunksImported = remainingChunks.length === 0;

  if (!allChunksImported || options.skipFinalize === true) {
    return {
      allChunksImported,
      appliedChunks,
      completed: false,
      remainingChunks,
    };
  }

  await finalizeSeedOnRemote(options);

  return {
    allChunksImported: true,
    appliedChunks,
    completed: true,
    remainingChunks: [],
  };
};
