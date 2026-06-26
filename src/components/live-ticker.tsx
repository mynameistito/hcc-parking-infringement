import { Banknote, Sigma } from "lucide-react";
import { useRef, useState } from "react";

import { PacePanel } from "@/components/pace-panel";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { DailyStatPoint, PublicLiveStats } from "@/contracts/public-api";
import { useAnimatedNumber } from "@/hooks/use-animated-number";
import { moneyFmt, numberFmt } from "@/lib/format";
import type { PaceTrends } from "@/lib/trend-window";
import { cn } from "@/lib/utils";

interface LiveTickerProps {
  stats: Pick<
    PublicLiveStats,
    "allTimeTotal" | "allTimeAmountCents" | "last7d" | "last30d" | "last365d"
  >;
  dailyTrend: DailyStatPoint[];
  paceTrends?: PaceTrends;
  isLoading?: boolean;
}

export const LiveTicker = ({
  stats,
  dailyTrend,
  paceTrends,
  isLoading,
}: LiveTickerProps) => {
  const loading = isLoading === true;
  const animatedTotal = useAnimatedNumber(loading ? 0 : stats.allTimeTotal, {
    duration: 600,
    initialDuration: 1200,
  });
  const animatedFinesCents = useAnimatedNumber(
    loading ? 0 : stats.allTimeAmountCents,
    {
      duration: 600,
      initialDuration: 1100,
    }
  );
  const [pulse, setPulse] = useState(false);
  const prevTotalRef = useRef(stats.allTimeTotal);
  const pulseTimerRef = useRef<number | null>(null);

  if (!loading && stats.allTimeTotal !== prevTotalRef.current) {
    prevTotalRef.current = stats.allTimeTotal;
    setPulse(true);
    if (pulseTimerRef.current !== null) {
      window.clearTimeout(pulseTimerRef.current);
    }
    pulseTimerRef.current = window.setTimeout(() => {
      setPulse(false);
      pulseTimerRef.current = null;
    }, 550);
  }

  return (
    <Card
      className="bg-card"
      aria-busy={loading}
      aria-label="All-time parking infringement total"
    >
      <CardContent className="p-0">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)] xl:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)]">
          <section className="flex min-h-[260px] flex-col justify-between p-5 sm:p-6 lg:p-8">
            <div className="flex min-h-4 items-center gap-2 text-xs font-medium text-muted-foreground uppercase">
              <Sigma className="size-4 text-[var(--ring)]" aria-hidden="true" />
              All-time infringements
            </div>

            <div>
              <p
                className={cn(
                  "min-h-12 font-mono text-5xl font-semibold leading-none tracking-[-0.05em] text-primary tabular-nums sm:min-h-[4.5rem] sm:text-7xl",
                  pulse && "animate-ticker-pulse"
                )}
                aria-live="polite"
              >
                {loading ? (
                  <Skeleton className="inline-block h-12 w-48 sm:h-[4.5rem] sm:w-64" />
                ) : (
                  numberFmt.format(animatedTotal)
                )}
              </p>
              <p className="mt-3 min-h-6 max-w-md text-sm leading-6 text-muted-foreground">
                Running total from the public infringement feed.
              </p>
            </div>

            <div className="mt-5 min-h-10">
              <div className="flex w-fit flex-wrap items-center gap-2 rounded-[6px] border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
                <Banknote
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
                Total fines
                {loading ? (
                  <Skeleton className="h-5 w-24 rounded-[4px]" />
                ) : (
                  <strong className="font-mono font-semibold text-foreground tabular-nums">
                    {moneyFmt.format(animatedFinesCents / 100)}
                  </strong>
                )}
              </div>
            </div>
          </section>

          <PacePanel
            dailyTrend={dailyTrend}
            isLoading={loading}
            last7d={stats.last7d}
            last30d={stats.last30d}
            last365d={stats.last365d ?? 0}
            paceTrends={paceTrends}
          />
        </div>
      </CardContent>
    </Card>
  );
};
