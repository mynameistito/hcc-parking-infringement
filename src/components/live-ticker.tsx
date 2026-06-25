import { useEffect, useRef, useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
}

interface StatPillProps {
  label: string;
  value: number;
}

const StatPill = ({ label, value }: StatPillProps) => {
  const animated = useAnimatedNumber(value);
  return (
    <div className="rounded-lg border border-border bg-muted/40 px-2 py-3 text-center">
      <span className="block font-mono text-lg font-bold tabular-nums">
        {numberFmt.format(animated)}
      </span>
      <span className="mt-0.5 block text-[0.65rem] font-semibold tracking-wider text-muted-foreground uppercase">
        {label}
      </span>
    </div>
  );
};

export const LiveTicker = ({ stats }: LiveTickerProps) => {
  const animatedTotal = useAnimatedNumber(stats.allTimeTotal);
  const [pulse, setPulse] = useState(false);
  const prevTotal = useRef(stats.allTimeTotal);

  useEffect(() => {
    let timer: number | undefined;

    if (stats.allTimeTotal !== prevTotal.current) {
      prevTotal.current = stats.allTimeTotal;
      setPulse(true);
      timer = window.setTimeout(() => {
        setPulse(false);
      }, 550);
    }

    return () => {
      if (timer !== undefined) {
        window.clearTimeout(timer);
      }
    };
  }, [stats.allTimeTotal]);

  return (
    <Card
      className="border-primary/20 bg-card shadow-[0_0_60px_rgba(99,102,241,0.12)]"
      aria-label="All-time parking infringement total"
    >
      <CardContent className="px-4 py-8 text-center sm:px-6">
        <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
          All-time infringements
        </p>
        <p
          className={cn(
            "mt-2 font-mono text-5xl font-bold tracking-tight text-primary tabular-nums sm:text-6xl",
            pulse && "animate-ticker-pulse"
          )}
          aria-live="polite"
        >
          {numberFmt.format(animatedTotal)}
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Total fines:{" "}
          <strong className="font-semibold text-foreground">
            {currencyFmt.format(stats.allTimeAmountCents / 100)}
          </strong>
        </p>

        <div className="mt-7 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <StatPill label="Today" value={stats.today} />
          <StatPill label="Last 24h" value={stats.last24h} />
          <StatPill label="Last 7d" value={stats.last7d} />
          <StatPill label="Last 30d" value={stats.last30d} />
          <StatPill label="This month" value={stats.thisMonth} />
          <StatPill label="Towed today" value={stats.towedToday} />
        </div>
      </CardContent>
    </Card>
  );
};
