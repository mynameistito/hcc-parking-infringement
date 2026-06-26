import { z } from "zod";

import { BACKFILL_HCC_CONCURRENCY } from "@/lib/backfill-constants.ts";

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

const acquireHccSlot = async (): Promise<void> => {
  if (hccInFlight < BACKFILL_HCC_CONCURRENCY) {
    hccInFlight += 1;
    return;
  }

  const waiter = Promise.withResolvers<null>();
  hccWaiters.push(() => {
    waiter.resolve(null);
  });
  await waiter.promise;
  hccInFlight += 1;
};

const releaseHccSlot = (): void => {
  hccInFlight -= 1;
  hccWaiters.shift()?.();
};

const withHccSlot = async <T>(task: () => Promise<T>): Promise<T> => {
  await acquireHccSlot();
  try {
    return await task();
  } finally {
    releaseHccSlot();
  }
};

export const fetchInfringements = async (
  env: HccClientEnv,
  options: FetchInfringementsOptions
): Promise<HccInfringementResponse> =>
  await withHccSlot(async () => {
    const url = new URL(apiBase(env));
    url.searchParams.set("Page", String(options.page));
    url.searchParams.set("Start_Date", options.startDate);
    url.searchParams.set("End_Date", options.endDate);

    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(
        `HCC API error ${response.status}: ${await response.text()}`
      );
    }

    const parsed = hccInfringementResponseSchema.safeParse(
      await response.json()
    );
    if (!parsed.success) {
      throw new Error("HCC API response missing Paging metadata");
    }

    return parsed.data;
  });

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
  page: number
): Promise<Record<string, unknown>[]> => {
  const response = await fetchInfringements(env, {
    endDate,
    page,
    startDate,
  });
  return readPageRecords(response);
};

export const fetchAllInWindow = async (
  env: HccClientEnv,
  startDate: string,
  endDate: string
): Promise<FetchAllResult> => {
  const response = await fetchInfringements(env, {
    endDate,
    page: 1,
    startDate,
  });
  const [paging] = response.Paging;
  if (paging === undefined) {
    return {
      lastPageRecords: 0,
      pageCount: 0,
      pageSize: 10_000,
      pagesFetched: 0,
      possiblyTruncated: false,
      records: [],
    };
  }

  const firstPageRecords = readPageRecords(response);

  if (paging.Page_Count <= 1) {
    return {
      lastPageRecords: firstPageRecords.length,
      pageCount: paging.Page_Count,
      pageSize: paging.Page_Size,
      pagesFetched: 1,
      possiblyTruncated: isFullPage(firstPageRecords.length, paging.Page_Size),
      records: firstPageRecords,
    };
  }

  const otherPages = Array.from(
    { length: paging.Page_Count - 1 },
    (_, index) => index + 2
  );
  const otherPageRecords = await Promise.all(
    otherPages.map(
      async (page) => await fetchPageRecords(env, startDate, endDate, page)
    )
  );

  const records = [...firstPageRecords, ...otherPageRecords.flat()];
  const lastPageRecords = otherPageRecords.at(-1)?.length ?? 0;

  return {
    lastPageRecords,
    pageCount: paging.Page_Count,
    pageSize: paging.Page_Size,
    pagesFetched: paging.Page_Count,
    possiblyTruncated: isFullPage(lastPageRecords, paging.Page_Size),
    records,
  };
};
