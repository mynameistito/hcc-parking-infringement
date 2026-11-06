import { Effect, Layer } from "effect";
import { z } from "zod";

import { BACKFILL_HCC_CONCURRENCY } from "@/lib/backfill-constants.ts";
import { err, ok } from "@/lib/result.ts";
import type { Result } from "@/lib/result.ts";
import { rawInfringementRecordSchema } from "@/server/clean-schema.ts";
import { HccClient, hccClientLayer } from "@/server/hcc-pagination.ts";
import type { FetchAllResult } from "@/server/hcc-pagination.ts";
import { HccTransport } from "@/server/hcc-transport.ts";
import type {
  HccFetchError,
  HccInfringementResponse,
} from "@/server/hcc-transport.ts";

export type {
  HccFetchError,
  HccInfringementResponse,
} from "@/server/hcc-transport.ts";

export type { FetchAllResult } from "@/server/hcc-pagination.ts";

/** HTTP adapter configuration, with the council API as the default endpoint. */
export interface HccClientEnv {
  readonly HCC_API_BASE?: string;
}

const DEFAULT_API_BASE =
  "https://api.hcc.govt.nz/OpenData/get_parking_infringement";

/**
 * Formats an HCC transport or response error for operators.
 * @param error - Structured HCC fetch failure.
 * @returns A human-readable failure description.
 */
export const formatHccFetchError = (error: HccFetchError): string => {
  if (error.tag === "http") {
    return `HCC API error ${error.status}: ${error.body}`;
  }

  if (error.tag === "malformed") {
    return `HCC API response missing Paging metadata: ${error.detail}`;
  }

  if (error.tag === "malformed_json") {
    return "HCC API returned malformed JSON";
  }

  return error.tag === "cancelled"
    ? "HCC request cancelled"
    : "HCC transport failed";
};

const hccPagingSchema = z.object({
  Current_Page: z.number(),
  Dataset_Name: z.string().optional(),
  Page_Count: z.number(),
  Page_Size: z.number(),
});

const hccInfringementResponseSchema = z.object({
  Data: z.array(rawInfringementRecordSchema).optional(),
  Paging: z.array(hccPagingSchema).min(1),
});

/** Date window, page, and optional transport controls for an HCC request. */
export interface FetchInfringementsOptions {
  startDate: string;
  endDate: string;
  page: number;
  signal?: AbortSignal;
  fetch?: typeof fetch;
}

const apiBase = (env: HccClientEnv): string => {
  const base = env.HCC_API_BASE ?? DEFAULT_API_BASE;

  if (base.includes("get_parking_infringement")) {
    return base;
  }

  return `${base.replace(/\/$/u, "")}/get_parking_infringement`;
};

interface HccWaiter {
  wake?: () => void;
}

let hccInFlight = 0;
const hccWaiters: (() => void)[] = [];
const isAborted = (signal?: AbortSignal): boolean => signal?.aborted === true;

const acquireHccSlot = async (signal?: AbortSignal): Promise<boolean> => {
  if (signal?.aborted === true) {
    return false;
  }

  if (hccInFlight < BACKFILL_HCC_CONCURRENCY) {
    hccInFlight += 1;

    return true;
  }

  const { promise, resolve } = Promise.withResolvers<boolean>();
  const waiter: HccWaiter = {};

  const onAbort = () => {
    const index =
      waiter.wake === undefined ? -1 : hccWaiters.indexOf(waiter.wake);

    if (index !== -1) {
      hccWaiters.splice(index, 1);
    }

    resolve(false);
  };

  waiter.wake = () => {
    signal?.removeEventListener("abort", onAbort);
    resolve(true);
  };

  hccWaiters.push(waiter.wake);
  signal?.addEventListener("abort", onAbort, { once: true });

  return await promise;
};

const releaseHccSlot = (): void => {
  const next = hccWaiters.shift();

  if (next) {
    next();

    return;
  }

  hccInFlight -= 1;
};

/**
 * Fetches and validates one page of HCC infringements.
 * @param env - HCC endpoint configuration.
 * @param options - Date range, page, and transport controls.
 * @returns A validated response or a structured fetch error.
 */
export const fetchInfringements = async (
  env: HccClientEnv,
  options: FetchInfringementsOptions
): Promise<Result<HccInfringementResponse, HccFetchError>> => {
  if (!(await acquireHccSlot(options.signal))) {
    return err({ tag: "cancelled" });
  }

  try {
    if (isAborted(options.signal)) {
      return err({ tag: "cancelled" });
    }

    const url = new URL(apiBase(env));
    url.searchParams.set("Page", String(options.page));
    url.searchParams.set("Start_Date", options.startDate);
    url.searchParams.set("End_Date", options.endDate);

    let response: Response;

    try {
      response = await (options.fetch ?? fetch)(url.toString(), {
        headers: { Accept: "application/json" },
        signal: options.signal,
      });
    } catch {
      return err({
        tag: isAborted(options.signal) ? "cancelled" : "transport",
      });
    }

    if (!response.ok) {
      try {
        return err({
          body: await response.text(),
          status: response.status,
          tag: "http",
        });
      } catch {
        return err({
          tag: isAborted(options.signal) ? "cancelled" : "transport",
        });
      }
    }

    let body: unknown;

    try {
      body = await response.json();
    } catch (error) {
      if (isAborted(options.signal)) {
        return err({ tag: "cancelled" });
      }

      return err({
        tag: error instanceof SyntaxError ? "malformed_json" : "transport",
      });
    }

    const parsed = hccInfringementResponseSchema.safeParse(body);

    if (!parsed.success) {
      return err({
        detail: parsed.error.message,
        tag: "malformed",
      });
    }

    return ok(parsed.data);
  } finally {
    releaseHccSlot();
  }
};

/** Optional cancellation signal and fetch implementation for HCC requests. */
export interface HccRequestOptions {
  signal?: AbortSignal;
  fetch?: typeof fetch;
}

/**
 * Creates the Effect transport layer used by the paginated HCC client.
 * @param env - HCC endpoint configuration.
 * @param options - Optional cancellation and fetch controls.
 * @returns A layer providing the HCC transport.
 */
export const hccTransportLayer = (
  env: HccClientEnv,
  options: HccRequestOptions = {}
) =>
  Layer.succeed(
    HccTransport,
    HccTransport.of({
      fetchPage: Effect.fn("HccTransport.fetchPage")(function* fetchPage(
        startDate: string,
        endDate: string,
        page: number
      ) {
        const result = yield* Effect.promise(
          async (signal) =>
            await fetchInfringements(env, {
              endDate,
              page,
              startDate,
              ...options,
              signal:
                options.signal === undefined
                  ? signal
                  : AbortSignal.any([signal, options.signal]),
            })
        );

        return yield* result.ok
          ? Effect.succeed(result.value)
          : Effect.fail(result.error);
      }),
    })
  );

/**
 * Fetches all HCC pages for a date window at the Promise boundary.
 * @param env - HCC endpoint configuration.
 * @param startDate - First date in the requested window.
 * @param endDate - Last date in the requested window.
 * @param options - Optional cancellation and fetch controls.
 * @returns The records or a structured HCC fetch error.
 */
export const fetchAllInWindow = async (
  env: HccClientEnv,
  startDate: string,
  endDate: string,
  options: HccRequestOptions = {}
): Promise<Result<FetchAllResult, HccFetchError>> =>
  await Effect.runPromise(
    Effect.gen(function* runHccFetch() {
      const client = yield* HccClient;

      return yield* client.fetchAll(startDate, endDate);
    }).pipe(
      Effect.provide(
        hccClientLayer.pipe(Layer.provide(hccTransportLayer(env, options)))
      ),
      Effect.match({ onFailure: err, onSuccess: ok })
    )
  );

/**
 * Fetches a complete HCC date window and throws on failure.
 * @param env - HCC endpoint configuration.
 * @param startDate - First date in the requested window.
 * @param endDate - Last date in the requested window.
 * @returns The fetched records and pagination status.
 */
export const fetchAllInWindowOrThrow = async (
  env: HccClientEnv,
  startDate: string,
  endDate: string
): Promise<FetchAllResult> => {
  const result = await fetchAllInWindow(env, startDate, endDate);

  if (!result.ok) {
    throw new Error(formatHccFetchError(result.error));
  }

  return result.value;
};
