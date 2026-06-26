import { useQuery } from "@tanstack/react-query";

import { fetchDailyTrend } from "@/client/api";
import type { DailyStatPoint } from "@/client/api";
import { PACE_DAILY_TREND_DAYS } from "@/lib/pace-constants";
import { dailyTrendCoversDays, hasDailyTrendData } from "@/lib/trend";

export const useDailyTrend = (
  cached: DailyStatPoint[] | undefined,
  ready: boolean
): DailyStatPoint[] => {
  const needsFetch =
    ready &&
    (cached === undefined ||
      !hasDailyTrendData(cached) ||
      !dailyTrendCoversDays(cached, PACE_DAILY_TREND_DAYS));

  const { data: fetched } = useQuery({
    enabled: needsFetch,
    queryFn: async () => await fetchDailyTrend(PACE_DAILY_TREND_DAYS),
    queryKey: ["public", "stats", "daily", "fetch", PACE_DAILY_TREND_DAYS],
    staleTime: 60_000,
  });

  if (
    cached !== undefined &&
    hasDailyTrendData(cached) &&
    dailyTrendCoversDays(cached, PACE_DAILY_TREND_DAYS)
  ) {
    return cached;
  }

  return fetched ?? cached ?? [];
};
