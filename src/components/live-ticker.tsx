import { Banknote, Sigma } from "lucide-react";
import { useEffect, useState } from "react";

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

/**
 * Displays live infringement totals and their recent pace.
 * @returns The live totals and pace panel.
 */
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

  const [pulseTotal, setPulseTotal] = useState<number | null>(null);
  const [previousTotal, setPreviousTotal] = useState(stats.allTimeTotal);

  if (!loading && stats.allTimeTotal !== previousTotal) {
    setPreviousTotal(stats.allTimeTotal);
    setPulseTotal(stats.allTimeTotal);
  }

  // Restart the pulse timeout when another total arrives before it expires.
  useEffect(() => {
    const timer =
      pulseTotal === null
        ? null
        : window.setTimeout(() => {
            setPulseTotal(null);
          }, 550);

    return () => {
      if (timer !== null) {
        window.clearTimeout(timer);
      }
    };
  }, [pulseTotal]);

  return (
    <Card aria-busy={loading} aria-label="All-time parking infringement total">
      <CardContent flush>
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)] xl:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)]">
          <section className="flex min-h-[260px] flex-col justify-between p-5 sm:p-6 lg:p-8">
            <div className="text-muted-foreground flex min-h-4 items-center gap-2 text-xs font-medium uppercase">
              <Sigma className="text-ring size-4" aria-hidden="true" />
              All-time infringements
            </div>

            <div>
              <div
                className={cn(
                  "text-primary min-h-12 font-mono text-5xl leading-none font-semibold tracking-tighter tabular-nums sm:min-h-[4.5rem] sm:text-7xl",
                  pulseTotal !== null && "animate-ticker-pulse"
                )}
                aria-live="polite"
              >
                {loading ? (
                  <Skeleton className="inline-block h-12 w-48 sm:h-[4.5rem] sm:w-64" />
                ) : (
                  numberFmt.format(animatedTotal)
                )}
              </div>
              <p className="text-muted-foreground mt-3 min-h-6 max-w-md text-sm leading-6">
                Running total from the public infringement feed.
              </p>
            </div>

            <div className="mt-5 min-h-10">
              <div className="border-border bg-muted text-muted-foreground flex w-fit flex-wrap items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                <Banknote
                  className="text-muted-foreground size-4"
                  aria-hidden="true"
                />
                Total fines
                {loading ? (
                  <Skeleton className="h-5 w-24" />
                ) : (
                  <strong className="text-foreground font-mono font-semibold tabular-nums">
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
