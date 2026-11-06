import type { PublicTopItem } from "@/durable-objects/types/browse.ts";
import type { DailyStatRow } from "@/durable-objects/types/stats.ts";

/**
 * A public ranking label and count.
 */
export type TopItem = PublicTopItem;

/**
 * Daily infringement totals used by trend charts.
 */
export type DailyStatPoint = DailyStatRow;

export type {
  LocationRankItem,
  VehicleRankItem,
} from "@/durable-objects/types/browse.ts";
