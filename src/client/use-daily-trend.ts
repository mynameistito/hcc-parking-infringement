import { useQuery } from "@tanstack/react-query";

import { fetchDailyTrend } from "./api";
import type { DailyStatPoint } from "./api";
import { hasDailyTrendData } from "@/lib/trend";

export const useDailyTrend = (
  cached: DailyStatPoint[] | undefined,
  ready: boolean
): DailyStatPoint[] => {
  const needsFetch =
    ready && (cached === undefined || !hasDailyTrendData(cached));

  const { data: fetched } = useQuery({
    enabled: needsFetch,
    queryFn: () => fetchDailyTrend(30),
    queryKey: ["public", "stats", "daily", "fetch"],
    staleTime: 60_000,
  });

  if (cached !== undefined && hasDailyTrendData(cached)) {
    return cached;
  }

  return fetched ?? cached ?? [];
};
