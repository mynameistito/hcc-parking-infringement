import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import type { DailyStatPoint } from "@/client/api";
import { buildPaceTrends } from "@/lib/trend-window";
import type { TrendResult } from "@/lib/trend";
import { cn } from "@/lib/utils";

import { TrendChart } from "./trend-chart";

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
      return;
    }

    const startedAt = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(Math.round(from + (to - from) * eased));
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

  return display;
};

const numberFmt = new Intl.NumberFormat("en-NZ");

const formatTrendPercent = (percent: number | null): string => {
  if (percent === null) {
    return "—";
  }
  const sign = percent > 0 ? "+" : percent < 0 ? "−" : "";
  return `${sign}${Math.abs(percent).toFixed(1)}%`;
};

const TrendBadge = ({ trend }: { trend: TrendResult }) => {
  const isDown = trend.direction === "down";
  const isUp = trend.direction === "up";
  const Icon = isUp ? ArrowUpRight : isDown ? ArrowDownRight : Minus;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-medium tabular-nums",
        !isUp && !isDown && "text-muted-foreground",
        isDown && "text-[var(--chart-2)]",
        isUp && "text-destructive"
      )}
    >
      <Icon className="size-3" aria-hidden="true" />
      {formatTrendPercent(trend.percent)}
    </span>
  );
};

interface PaceStatBoxProps {
  label: string;
  value: number;
  trend: TrendResult;
  chartValues: number[];
  chartLabels: string[];
}

const PaceStatBox = ({
  label,
  value,
  trend,
  chartValues,
  chartLabels,
}: PaceStatBoxProps) => {
  const animated = useAnimatedNumber(value);

  return (
    <div className="rounded-[6px] border border-border bg-background px-3 py-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] text-muted-foreground">{label}</span>
        <TrendBadge trend={trend} />
      </div>
      <span className="mt-0.5 block font-mono text-3xl font-semibold leading-none tabular-nums tracking-[-0.04em]">
        {numberFmt.format(animated)}
      </span>
      <TrendChart
        values={chartValues}
        xLabels={chartLabels}
        className="mt-1.5 h-[40px]"
        compact
      />
    </div>
  );
};

interface PacePanelProps {
  dailyTrend: DailyStatPoint[];
  last24h: number;
  last7d: number;
  last30d: number;
}

export const PacePanel = ({
  dailyTrend,
  last24h,
  last7d,
  last30d,
}: PacePanelProps) => {
  const { trends, windows } = useMemo(
    () => buildPaceTrends(dailyTrend),
    [dailyTrend]
  );

  return (
    <aside className="border-t border-border p-3 sm:p-4 lg:border-t-0 lg:border-l">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-primary">Current pace</h2>
        <span className="text-[11px] text-muted-foreground">Live snapshot</span>
      </div>
      <div className="flex flex-col gap-1.5">
        <PaceStatBox
          label="Last 24h"
          value={last24h}
          trend={trends.last24h}
          chartValues={windows.last24h.values}
          chartLabels={windows.last24h.labels}
        />
        <PaceStatBox
          label="Last 7d"
          value={last7d}
          trend={trends.last7d}
          chartValues={windows.last7d.values}
          chartLabels={windows.last7d.labels}
        />
        <PaceStatBox
          label="Last 30d"
          value={last30d}
          trend={trends.last30d}
          chartValues={windows.last30d.values}
          chartLabels={windows.last30d.labels}
        />
      </div>
    </aside>
  );
};
