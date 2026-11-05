import { z } from "zod";

import { BACKFILL_HCC_CONCURRENCY } from "@/lib/backfill-constants.ts";
import { err, ok } from "@/lib/result.ts";
import type { Result } from "@/lib/result.ts";

export type HccClientEnv = Pick<Env, "HCC_API_BASE">;

const DEFAULT_API_BASE =
  "https://api.hcc.govt.nz/OpenData/get_parking_infringement";

export interface HccPaging {
  Dataset_Name?: string;
  Current_Page: number;
  Page_Count: number;
  Page_Size: number;
}

export interface HccInfringementResponse {
  Paging: HccPaging[];
  Data?: Record<string, unknown>[];
}

export type HccFetchError =
  | { tag: "http"; status: number; body: string }
  | { tag: "malformed"; detail: string }
  | { tag: "malformed_json" | "transport" | "cancelled" };

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
  Data: z.array(z.record(z.string(), z.unknown())).optional(),
  Paging: z.array(hccPagingSchema).min(1),
});

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
  const waiter: { wake?: () => void } = {};
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

export interface FetchAllResult {
  lastPageRecords: number;
  pageCount: number;
  pagesFetched: number;
  pageSize: number;
  possiblyTruncated: boolean;
  records: Record<string, unknown>[];
}

const isFullPage = (recordCount: number, pageSize: number): boolean =>
  recordCount >= pageSize && recordCount > 0;

const readPageRecords = (
  response: HccInfringementResponse
): Record<string, unknown>[] =>
  response.Data !== undefined && response.Data.length > 0 ? response.Data : [];

const fetchPageRecords = async (
  env: HccClientEnv,
  startDate: string,
  endDate: string,
  page: number,
  options: HccRequestOptions
): Promise<Result<Record<string, unknown>[], HccFetchError>> => {
  const response = await fetchInfringements(env, {
    endDate,
    page,
    startDate,
    ...options,
  });
  if (!response.ok) {
    return response;
  }

  return ok(readPageRecords(response.value));
};

export interface HccRequestOptions {
  signal?: AbortSignal;
  fetch?: typeof fetch;
}

export const fetchAllInWindow = async (
  env: HccClientEnv,
  startDate: string,
  endDate: string,
  options: HccRequestOptions = {}
): Promise<Result<FetchAllResult, HccFetchError>> => {
  const firstPage = await fetchInfringements(env, {
    endDate,
    page: 1,
    startDate,
    ...options,
  });
  if (!firstPage.ok) {
    return firstPage;
  }

  const response = firstPage.value;
  const [paging] = response.Paging;
  if (paging === undefined) {
    return ok({
      lastPageRecords: 0,
      pageCount: 0,
      pageSize: 10_000,
      pagesFetched: 0,
      possiblyTruncated: false,
      records: [],
    });
  }

  const firstPageRecords = readPageRecords(response);

  if (paging.Page_Count <= 1) {
    return ok({
      lastPageRecords: firstPageRecords.length,
      pageCount: paging.Page_Count,
      pageSize: paging.Page_Size,
      pagesFetched: 1,
      possiblyTruncated: isFullPage(firstPageRecords.length, paging.Page_Size),
      records: firstPageRecords,
    });
  }

  const otherPages = Array.from(
    { length: paging.Page_Count - 1 },
    (_, index) => index + 2
  );
  const otherPageResults = await Promise.all(
    otherPages.map(
      async (page) =>
        await fetchPageRecords(env, startDate, endDate, page, options)
    )
  );

  const records: Record<string, unknown>[] = [...firstPageRecords];
  let lastPageRecords = 0;

  for (const pageResult of otherPageResults) {
    if (!pageResult.ok) {
      return pageResult;
    }
    records.push(...pageResult.value);
    lastPageRecords = pageResult.value.length;
  }

  return ok({
    lastPageRecords,
    pageCount: paging.Page_Count,
    pageSize: paging.Page_Size,
    pagesFetched: paging.Page_Count,
    possiblyTruncated: isFullPage(lastPageRecords, paging.Page_Size),
    records,
  });
};

/** CLI helper: throw on HCC fetch failure instead of returning Result. */
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
