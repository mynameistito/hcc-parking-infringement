import type { ChartBreakdowns, TopItem } from "@/contracts/public-api";
import type { SeedManifestContext } from "@/server/seed-import.ts";

export interface HistoricalChartCache {
  breakdowns: ChartBreakdowns;
  streets: TopItem[];
}

export interface SeedReadCache {
  historicalCharts: HistoricalChartCache | null;
  manifestContext: SeedManifestContext | null;
  snapshotPayload: string | null;
  snapshotKey: string | null;
}

export const createSeedReadCache = (): SeedReadCache => ({
  historicalCharts: null,
  manifestContext: null,
  snapshotKey: null,
  snapshotPayload: null,
});

export const resetSeedReadCache = (cache: SeedReadCache): void => {
  cache.historicalCharts = null;
  cache.manifestContext = null;
  cache.snapshotPayload = null;
  cache.snapshotKey = null;
};
