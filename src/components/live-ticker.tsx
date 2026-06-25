import { Banknote, Sigma } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import type { DailyStatPoint } from "@/client/api";
import { cn } from "@/lib/utils";

import { LiveTickerSkeleton } from "./data-skeletons";
import { PacePanel } from "./pace-panel";

const useAnimatedNumber = (value: number, duration = 600): number => {
  const [display, setDisplay] = useState(value);
  const frameRef = useRef<number | null>(null);
  const fromRef = useRef(value);

  useEffect(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
    }

    const from = fromRef.current;
    const to = value;
    if (from === to) {
      return () => {
        if (frameRef.current !== null) {
          cancelAnimationFrame(frameRef.current);
        }
      };
    }

    const startedAt = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      const next = Math.round(from + (to - from) * eased);
      setDisplay(next);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [value, duration]);

  useEffect(() => {
    fromRef.current = display;
  }, [display]);

  return display;
};

const numberFmt = new Intl.NumberFormat("en-NZ");
const currencyFmt = new Intl.NumberFormat("en-NZ", {
  currency: "NZD",
  maximumFractionDigits: 0,
  style: "currency",
});

export interface LiveStats {
  allTimeTotal: number;
  allTimeAmountCents: number;
  today: number;
  last24h: number;
  last7d: number;
  last30d: number;
  thisMonth: number;
  towedToday: number;
}

interface LiveTickerProps {
  stats: LiveStats;
  dailyTrend: DailyStatPoint[];
  isLoading?: boolean;
}

const LiveTickerContent = ({
  stats,
  dailyTrend,
}: {
  stats: LiveStats;
  dailyTrend: DailyStatPoint[];
}) => {
  const animatedTotal = useAnimatedNumber(stats.allTimeTotal);
  const [pulse, setPulse] = useState(false);
  const prevTotalRef = useRef(stats.allTimeTotal);
  const pulseTimerRef = useRef<number | null>(null);

  if (stats.allTimeTotal !== prevTotalRef.current) {
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
    <Card className="bg-card" aria-label="All-time parking infringement total">
      <CardContent className="p-0">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="flex min-h-[260px] flex-col justify-between p-5 sm:p-6 lg:p-8">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase">
              <Sigma className="size-4 text-[var(--ring)]" aria-hidden="true" />
              All-time infringements
            </div>
            <div>
              <p
                className={cn(
                  "font-mono text-5xl font-semibold tracking-[-0.05em] text-primary tabular-nums sm:text-7xl",
                  pulse && "animate-ticker-pulse"
                )}
                aria-live="polite"
              >
                {numberFmt.format(animatedTotal)}
              </p>
              <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
                Running total from the public infringement feed.
              </p>
            </div>
            <div className="mt-5 flex w-fit flex-wrap items-center gap-2 rounded-[6px] border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
              <Banknote
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
              Total fines
              <strong className="font-mono font-semibold text-foreground tabular-nums">
                {currencyFmt.format(stats.allTimeAmountCents / 100)}
              </strong>
            </div>
          </section>

          <PacePanel
            dailyTrend={dailyTrend}
            last24h={stats.last24h}
            last7d={stats.last7d}
            last30d={stats.last30d}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export const LiveTicker = ({
  stats,
  dailyTrend,
  isLoading,
}: LiveTickerProps) => {
  if (isLoading === true) {
    return <LiveTickerSkeleton />;
  }

  return <LiveTickerContent dailyTrend={dailyTrend} stats={stats} />;
};
