import type {
  LocationRankItem,
  PublicTopItem,
  VehicleRankItem,
} from "@/durable-objects/types/browse.ts";
import type { DailyStatRow } from "@/durable-objects/types/stats.ts";

export type { BrowseSort } from "@/durable-objects/types/browse.ts";

export type TopItem = PublicTopItem;
export type DailyStatPoint = DailyStatRow;

export type { LocationRankItem, VehicleRankItem };

export interface BrowseResponse<T> {
  readonly items: T[];
  readonly limit: number;
  readonly page: number;
  readonly total: number;
}
