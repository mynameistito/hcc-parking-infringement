import { z } from "zod";

import type { Env } from "../env.ts";

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

const apiBase = (env: Env): string => {
  const base = env.HCC_API_BASE ?? DEFAULT_API_BASE;
  if (base.includes("get_parking_infringement")) {
    return base;
  }
  return `${base.replace(/\/$/u, "")}/get_parking_infringement`;
};

export const fetchInfringements = async (
  env: Env,
  options: FetchInfringementsOptions
): Promise<HccInfringementResponse> => {
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

  const parsed = hccInfringementResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new Error("HCC API response missing Paging metadata");
  }

  return parsed.data;
};

export interface FetchAllResult {
  records: Record<string, unknown>[];
  pageCount: number;
  pageSize: number;
  possiblyTruncated: boolean;
}

const fetchRemainingPages = async (
  env: Env,
  startDate: string,
  endDate: string,
  page: number,
  pageCount: number,
  pageSize: number,
  records: Record<string, unknown>[]
): Promise<FetchAllResult> => {
  if (page > pageCount) {
    const possiblyTruncated =
      pageCount === 1 && records.length >= pageSize && records.length > 0;

    return { pageCount, pageSize, possiblyTruncated, records };
  }

  const response = await fetchInfringements(env, {
    endDate,
    page,
    startDate,
  });
  const [paging] = response.Paging;
  if (paging === undefined) {
    const possiblyTruncated =
      pageCount === 1 && records.length >= pageSize && records.length > 0;

    return { pageCount, pageSize, possiblyTruncated, records };
  }

  const nextRecords = [...records];
  if (response.Data !== undefined && response.Data.length > 0) {
    nextRecords.push(...response.Data);
  }

  return await fetchRemainingPages(
    env,
    startDate,
    endDate,
    page + 1,
    paging.Page_Count,
    paging.Page_Size,
    nextRecords
  );
};

export const fetchAllInWindow = async (
  env: Env,
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
      pageCount: 0,
      pageSize: 10_000,
      possiblyTruncated: false,
      records: [],
    };
  }

  const records: Record<string, unknown>[] = [];
  if (response.Data !== undefined && response.Data.length > 0) {
    records.push(...response.Data);
  }

  if (paging.Page_Count <= 1) {
    const possiblyTruncated =
      records.length >= paging.Page_Size && records.length > 0;

    return {
      pageCount: paging.Page_Count,
      pageSize: paging.Page_Size,
      possiblyTruncated,
      records,
    };
  }

  return await fetchRemainingPages(
    env,
    startDate,
    endDate,
    2,
    paging.Page_Count,
    paging.Page_Size,
    records
  );
};
