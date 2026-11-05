import type { Effect } from "effect";
import { Context } from "effect";

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
