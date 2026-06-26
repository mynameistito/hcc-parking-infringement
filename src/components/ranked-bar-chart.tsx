import { lazy, Suspense, useMemo } from "react";

import { chartColorAt } from "@/lib/chart-colors";
import { buildYTicks } from "@/lib/chart-scale";
import { cn } from "@/lib/utils";

const RankedBarChartInner = lazy(async () => {
  const module = await import("@/components/ranked-bar-chart-inner");
  return { default: module.RankedBarChartInner };
});

export interface RankedBarChartItem {
  count: number;
  label: string;
}

interface RankedBarChartProps {
  items: RankedBarChartItem[];
  className?: string;
  maxHeight?: number;
}

const ChartFallback = ({ rows }: { rows: number }) => (
  <div
    className="flex flex-col justify-center gap-2.5 px-1"
    style={{ height: Math.min(rows * 28 + 8, 480) }}
    aria-hidden="true"
  >
    {Array.from({ length: Math.min(rows, 12) }, (_, index) => (
      <div key={index} className="h-3.5 animate-pulse rounded bg-muted/40" />
    ))}
  </div>
);

export const RankedBarChart = ({
  items,
  className,
  maxHeight = 480,
}: RankedBarChartProps) => {
  const data = useMemo(
    () =>
      items.map((item, index) => ({
        fill: chartColorAt(index),
        label: item.label,
        value: item.count,
      })),
    [items]
  );

  const yMax = useMemo(() => {
    const maxValue = Math.max(...data.map((entry) => entry.value), 0);
    return buildYTicks(maxValue).at(-1) ?? 10;
  }, [data]);

  if (data.length === 0) {
    return (
      <div
        className={cn(
          "flex h-32 items-center justify-center rounded-[4px] bg-muted/30 text-xs text-muted-foreground",
          className
        )}
      >
        No data yet
      </div>
    );
  }

  const contentHeight = data.length * 28 + 8;
  const scrollable = contentHeight > maxHeight;

  return (
    <div
      className={cn("w-full", scrollable && "overflow-y-auto pr-1", className)}
      style={{ maxHeight: scrollable ? maxHeight : undefined }}
    >
      <div style={{ height: contentHeight }}>
        <Suspense fallback={<ChartFallback rows={data.length} />}>
          <RankedBarChartInner data={data} yMax={yMax} />
        </Suspense>
      </div>
    </div>
  );
};
