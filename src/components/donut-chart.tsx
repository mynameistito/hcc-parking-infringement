import { lazy, Suspense, useMemo } from "react";

import { PieLegend } from "@/components/pie-legend";
import { chartColorAt } from "@/lib/chart-colors";
import { numberFmt } from "@/lib/format";
import { cn } from "@/lib/utils";

const DonutChartInner = lazy(async () => {
  const module = await import("@/components/donut-chart-inner");
  return { default: module.DonutChartInner };
});

export interface DonutChartItem {
  count: number;
  label: string;
}

interface DonutChartProps {
  items: DonutChartItem[];
  className?: string;
  /** When set, only the top N slices are drawn; remainder rolls into Other. */
  collapseAfter?: number;
  centerLabel?: string;
  showLegend?: boolean;
  size?: "md" | "lg";
}

const ChartFallback = ({ size }: { size: "md" | "lg" }) => (
  <div
    className={cn(
      "mx-auto animate-pulse rounded-full bg-muted/40",
      size === "lg" ? "size-44" : "size-36"
    )}
    aria-hidden="true"
  />
);

const buildChartData = (
  items: DonutChartItem[],
  collapseAfter?: number
): {
  data: { fill: string; label: string; value: number }[];
  total: number;
} => {
  const total = items.reduce((sum, item) => sum + item.count, 0);
  if (items.length === 0) {
    return { data: [], total: 0 };
  }

  const collapse =
    collapseAfter !== undefined &&
    collapseAfter > 0 &&
    items.length > collapseAfter;

  const visible = collapse ? items.slice(0, collapseAfter) : items;
  const other = collapse ? items.slice(collapseAfter) : [];
  const otherTotal = other.reduce((sum, item) => sum + item.count, 0);

  const data = visible.map((item, index) => ({
    fill: chartColorAt(index),
    label: item.label,
    value: item.count,
  }));

  if (otherTotal > 0) {
    data.push({
      fill: chartColorAt(data.length),
      label: `Other (${other.length} categories)`,
      value: otherTotal,
    });
  }

  return { data, total };
};

export const DonutChart = ({
  items,
  className,
  collapseAfter,
  centerLabel,
  showLegend = true,
  size = "md",
}: DonutChartProps) => {
  const { data, total } = useMemo(
    () => buildChartData(items, collapseAfter),
    [collapseAfter, items]
  );

  if (data.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-[4px] bg-muted/30 text-xs text-muted-foreground",
          size === "lg" ? "h-52" : "h-44",
          className
        )}
      >
        No data yet
      </div>
    );
  }

  const chartHeight = size === "lg" ? "h-44" : "h-36";

  return (
    <div
      className={cn(
        "grid gap-3",
        showLegend &&
          "sm:grid-cols-[minmax(9rem,11rem)_minmax(0,1fr)] sm:items-start",
        className
      )}
    >
      <div className={cn("w-full", chartHeight)}>
        <Suspense fallback={<ChartFallback size={size} />}>
          <DonutChartInner
            centerLabel={centerLabel}
            centerValue={numberFmt.format(total)}
            data={data}
          />
        </Suspense>
      </div>
      {showLegend ? <PieLegend items={items} total={total} /> : null}
    </div>
  );
};
