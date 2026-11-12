import { lazy, Suspense, useMemo } from "react";
import type { CSSProperties } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { chartColorAt } from "@/lib/chart-colors";
import { buildYTicks } from "@/lib/chart-scale";
import { cn } from "@/lib/utils";

const RankedBarChartInner = lazy(async () => {
  const module = await import("@/components/ranked-bar-chart-inner");

  return { default: module.RankedBarChartInner };
});

/**
 * A labeled count displayed as a ranked bar.
 */
interface RankedBarChartItem {
  count: number;
  label: string;
}

interface RankedBarChartProps {
  items: RankedBarChartItem[];
  className?: string;
  maxHeight?: number;
}

interface RankedChartStyle extends CSSProperties {
  "--chart-height"?: string;
  "--chart-max-height"?: string;
}

const ChartFallback = ({ rows }: { rows: number }) => {
  const style: RankedChartStyle = {
    "--chart-height": `${Math.min(rows * 28 + 8, 480)}px`,
  };

  return (
    <div
      className="chart-height flex flex-col justify-center gap-2.5 px-1"
      style={style}
      aria-hidden="true"
    >
      {Array.from({ length: Math.min(rows, 12) }, (_, index) => (
        <Skeleton key={index} className="h-3.5" />
      ))}
    </div>
  );
};

/**
 * Display ranked counts in a scrollable bar chart.
 * @returns The rendered interface for the supplied data.
 */
export const RankedBarChart = ({
  items,
  className,
  maxHeight = 480,
}: RankedBarChartProps) => {
  const data = useMemo(
    () =>
      [...items]
        .toSorted((a, b) => b.count - a.count)
        .map((item) => ({
          fill: chartColorAt(0),
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
          "bg-muted/30 text-muted-foreground flex h-32 items-center justify-center rounded-md text-xs",
          className
        )}
      >
        No data yet
      </div>
    );
  }

  const contentHeight = data.length * 36 + 8;
  const scrollable = contentHeight > maxHeight;

  const outerStyle: RankedChartStyle = {
    "--chart-max-height": scrollable ? `${maxHeight}px` : undefined,
  };

  const innerStyle: RankedChartStyle = {
    "--chart-height": `${contentHeight}px`,
  };

  return (
    <div
      className={cn(
        "chart-max-height w-full",
        scrollable && "overflow-y-auto pr-1",
        className
      )}
      style={outerStyle}
    >
      <div className="chart-height" style={innerStyle}>
        <Suspense fallback={<ChartFallback rows={data.length} />}>
          <RankedBarChartInner data={data} yMax={yMax} />
        </Suspense>
      </div>
    </div>
  );
};
