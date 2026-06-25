import { format } from "date-fns";
import { Banknote, Sigma } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { PublicInfringement } from "../client/api";

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
  recentInfringements: PublicInfringement[];
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

const formatVehicle = (record: PublicInfringement): string => {
  const parts = [record.vehicleMake, record.vehicleModel].filter(Boolean);
  if (parts.length > 0) {
    return parts.join(" ");
  }
  return record.vehicleType ?? "Unknown";
};

export const LiveTicker = ({ stats, recentInfringements }: LiveTickerProps) => {
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
    <Card className="bg-card" aria-label="All-time parking infringement total">
      <CardContent className="p-0">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_430px]">
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
            <div className="grid grid-cols-2 gap-2">
              <StatPill label="Today" value={stats.today} />
              <StatPill label="Last 24h" value={stats.last24h} />
              <StatPill label="Last 7d" value={stats.last7d} />
              <StatPill label="Last 30d" value={stats.last30d} />
              <StatPill label="This month" value={stats.thisMonth} />
              <StatPill label="Towed today" value={stats.towedToday} />
            </div>
            <div className="mt-5 border-t border-border pt-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-primary">
                  Latest Instances
                </h2>
                <span className="text-xs text-muted-foreground">
                  Newest first
                </span>
              </div>
              <div className="max-h-[290px] overflow-auto rounded-[6px] border border-border bg-background">
                <table className="w-full min-w-[520px] border-collapse text-left text-xs">
                  <thead className="sticky top-0 z-10 bg-muted text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 font-medium">Date</th>
                      <th className="px-3 py-2 font-medium">Vehicle</th>
                      <th className="px-3 py-2 font-medium">Street</th>
                      <th className="px-3 py-2 text-right font-medium">Fine</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentInfringements.length === 0 ? (
                      <tr>
                        <td
                          className="px-3 py-6 text-center text-muted-foreground"
                          colSpan={4}
                        >
                          Waiting for infringement rows...
                        </td>
                      </tr>
                    ) : (
                      recentInfringements.map((record) => (
                        <tr
                          key={record.infringementNumber}
                          className="border-t border-border/70"
                        >
                          <td className="whitespace-nowrap px-3 py-2 font-mono tabular-nums text-muted-foreground">
                            <time dateTime={record.occurredAt}>
                              {format(new Date(record.occurredAt), "d MMM yy")}
                            </time>
                          </td>
                          <td
                            className="max-w-[9rem] truncate px-3 py-2"
                            title={formatVehicle(record)}
                          >
                            {formatVehicle(record)}
                          </td>
                          <td
                            className="max-w-[11rem] truncate px-3 py-2 text-muted-foreground"
                            title={
                              record.suburb === null ||
                              record.suburb.length === 0
                                ? record.street
                                : `${record.street}, ${record.suburb}`
                            }
                          >
                            {record.street}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-right font-mono font-semibold tabular-nums">
                            {currencyFmt.format(record.amountCents / 100)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </aside>
        </div>
      </CardContent>
    </Card>
  );
};
