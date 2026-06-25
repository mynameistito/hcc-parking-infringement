import { Banknote, Sigma } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { LiveTickerSkeleton } from "./data-skeletons";

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
  isLoading?: boolean;
}

interface StatPillProps {
  label: string;
  value: number;
}

const StatPill = ({ label, value }: StatPillProps) => {
  const animated = useAnimatedNumber(value);
  return (
    <div className="rounded-[6px] border border-border bg-background px-3 py-3">
      <span className="block font-mono text-lg font-semibold tabular-nums tracking-[-0.02em]">
        {numberFmt.format(animated)}
      </span>
      <span className="mt-1 block text-xs text-muted-foreground">{label}</span>
    </div>
  );
};

const LiveTickerContent = ({ stats }: { stats: LiveStats }) => {
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

          <aside className="border-t border-border bg-muted p-4 sm:p-5 lg:border-t-0 lg:border-l">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-primary">
                Current Pace
              </h2>
              <span className="text-xs text-muted-foreground">
                Live snapshot
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <StatPill label="Today" value={stats.today} />
              <StatPill label="Last 24h" value={stats.last24h} />
              <StatPill label="Last 7d" value={stats.last7d} />
              <StatPill label="Last 30d" value={stats.last30d} />
              <StatPill label="This month" value={stats.thisMonth} />
              <StatPill label="Towed today" value={stats.towedToday} />
            </div>
          </aside>
        </div>
      </CardContent>
    </Card>
  );
};

export const LiveTicker = ({ stats, isLoading }: LiveTickerProps) => {
  if (isLoading === true) {
    return <LiveTickerSkeleton />;
  }

  return <LiveTickerContent stats={stats} />;
};
