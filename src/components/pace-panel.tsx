import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import type { DailyStatPoint } from "@/client/api";
import type { TrendResult } from "@/lib/trend";
import { buildPacePanelData } from "@/lib/trend-window";
import type { PaceTrends } from "@/lib/trend-window";
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
  let sign = "";
  if (percent > 0) {
    sign = "+";
  } else if (percent < 0) {
    sign = "−";
  }
  return `${sign}${Math.abs(percent).toFixed(1)}%`;
};

const TrendBadge = ({ trend }: { trend: TrendResult }) => {
  const isDown = trend.direction === "down";
  const isUp = trend.direction === "up";
  let Icon = Minus;
  if (isUp) {
    Icon = ArrowUpRight;
  } else if (isDown) {
    Icon = ArrowDownRight;
  }

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
  last7d: number;
  last30d: number;
  last365d: number;
  paceTrends?: PaceTrends;
}

export const PacePanel = ({
  dailyTrend,
  last7d,
  last30d,
  last365d,
  paceTrends,
}: PacePanelProps) => {
  const panel = useMemo(
    () =>
      buildPacePanelData(
        dailyTrend,
        {
          last30d,
          last365d,
          last7d,
        },
        paceTrends
      ),
    [dailyTrend, last365d, last30d, last7d, paceTrends]
  );

  return (
    <aside className="border-t border-border p-3 sm:p-4 lg:border-t-0 lg:border-l">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-primary">Current pace</h2>
        <span className="text-[11px] text-muted-foreground">Live snapshot</span>
      </div>
      <div className="flex flex-col gap-1.5">
        <PaceStatBox
          label="Last 7D"
          value={panel.values.last7d}
          trend={panel.trends.last7d}
          chartValues={panel.windows.last7d.values}
          chartLabels={panel.windows.last7d.labels}
        />
        <PaceStatBox
          label="Last 30D"
          value={panel.values.last30d}
          trend={panel.trends.last30d}
          chartValues={panel.windows.last30d.values}
          chartLabels={panel.windows.last30d.labels}
        />
        <PaceStatBox
          label="Last 365D"
          value={panel.values.last365d}
          trend={panel.trends.last365d}
          chartValues={panel.windows.last365d.values}
          chartLabels={panel.windows.last365d.labels}
        />
      </div>
    </aside>
  );
};
