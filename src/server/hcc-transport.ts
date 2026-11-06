import type { Effect } from "effect";
import { Context } from "effect";

import type { RawInfringementRecord } from "@/server/clean-schema.ts";

/** Pagination metadata returned by the HCC open data API. */
interface HccPaging {
  Dataset_Name?: string;
  Current_Page: number;
  Page_Count: number;
  Page_Size: number;
}

/** HCC infringement page and its pagination metadata. */
export interface HccInfringementResponse {
  Paging: HccPaging[];
  Data?: RawInfringementRecord[];
}

/** Structured failure returned by the HCC transport. */
export type HccFetchError =
  | { tag: "http"; status: number; body: string }
  | { tag: "malformed"; detail: string }
  | { tag: "malformed_json" | "transport" | "cancelled" };

/** Effect service for fetching individual HCC infringement pages. */
export class HccTransport extends Context.Service<
  HccTransport,
  {
    readonly fetchPage: (
      startDate: string,
      endDate: string,
      page: number
    ) => Effect.Effect<HccInfringementResponse, HccFetchError>;
  }
>()("hcc/HccTransport") {}
