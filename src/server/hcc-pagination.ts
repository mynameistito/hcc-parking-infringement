import { Context, Effect, Layer } from "effect";

import { err, ok } from "@/lib/result.ts";
import { HccTransport } from "@/server/hcc-transport.ts";
import type {
  HccFetchError,
  HccInfringementResponse,
} from "@/server/hcc-transport.ts";

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

export class HccClient extends Context.Service<
  HccClient,
  {
    readonly fetchAll: (
      startDate: string,
      endDate: string
    ) => Effect.Effect<FetchAllResult, HccFetchError>;
  }
>()("hcc/HccClient") {}

/** Pagination policy depends on an explicitly supplied HCC transport. */
export const makeHccClient = Effect.gen(function* makePaginationClient() {
  const transport = yield* HccTransport;

  const fetchAll = Effect.fn("HccClient.fetchAll")(function* fetchAll(
    startDate: string,
    endDate: string
  ) {
    const response = yield* transport.fetchPage(startDate, endDate, 1);
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
        possiblyTruncated: isFullPage(
          firstPageRecords.length,
          paging.Page_Size
        ),
        records: firstPageRecords,
      };
    }

    const pages = Array.from(
      { length: paging.Page_Count - 1 },
      (_, index) => index + 2
    );

    const responses = yield* Effect.all(
      pages.map((page) =>
        transport
          .fetchPage(startDate, endDate, page)
          .pipe(Effect.match({ onFailure: err, onSuccess: ok }))
      ),
      { concurrency: "unbounded" }
    );

    const records = [...firstPageRecords];
    let lastPageRecords = 0;

    for (const page of responses) {
      if (!page.ok) {
        return yield* Effect.fail(page.error);
      }

      const pageRecords = readPageRecords(page.value);
      records.push(...pageRecords);
      lastPageRecords = pageRecords.length;
    }

    return {
      lastPageRecords,
      pageCount: paging.Page_Count,
      pageSize: paging.Page_Size,
      pagesFetched: paging.Page_Count,
      possiblyTruncated: isFullPage(lastPageRecords, paging.Page_Size),
      records,
    };
  });

  return HccClient.of({ fetchAll });
});

export const hccClientLayer = Layer.effect(HccClient, makeHccClient);
