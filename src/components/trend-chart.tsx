import { m, useReducedMotion } from "motion/react";
import { lazy, Suspense, useId, useMemo } from "react";

import type { ChartConfig } from "@/components/ui/chart";
import { buildYTicks } from "@/lib/chart-scale";
import { LOAD_IN_EASE } from "@/lib/motion-ease";
import { cn } from "@/lib/utils";

const TrendChartInner = lazy(async () => {
  const module = await import("@/components/trend-chart-inner");
  return { default: module.TrendChartInner };
});

interface TrendChartProps {
  values: number[];
  xLabels: string[];
  dates?: string[];
  valueStyle?: "number" | "currency";
  className?: string;
  compact?: boolean;
  /** Cap how many x-axis ticks are shown (full interactive chart only). */
  maxXLabels?: number;
  /** Stagger the left-to-right draw animation (ms). */
  revealDelay?: number;
}

const DRAW_DURATION_S = 1.4;

const useChartDomain = (values: number[]) =>
  useMemo(() => {
    const maxValue = Math.max(...values, 0);
    const minValue = Math.min(...values, 0);
    const yTicks = buildYTicks(
      maxValue === minValue && maxValue > 0 ? maxValue * 1.25 : maxValue
    );
    return yTicks.at(-1) ?? 10;
  }, [values]);

const ChartFallback = ({
  className,
  compact,
}: {
  className?: string;
  compact: boolean;
}) => (
  <div
    className={cn(
      "rounded-[4px] bg-muted/30",
      compact ? "h-[40px]" : "min-h-0 h-full",
      className
    )}
  />
);

export const TrendChart = ({
  values,
  xLabels,
  dates,
  valueStyle = "number",
  className,
  compact = false,
  maxXLabels = 7,
  revealDelay = 0,
}: TrendChartProps) => {
  const gradientId = useId();
  const yMax = useChartDomain(values);
  const reduceMotion = useReducedMotion() === true;

  const data = useMemo(
    () =>
      values.map((value, index) => ({
        date: dates?.[index] ?? `idx-${index}`,
        label: xLabels[index] ?? `point-${index}`,
        value,
      })),
    [dates, values, xLabels]
  );

  const chartConfig = useMemo(
    () =>
      ({
        value: {
          color: "var(--chart-1)",
          label: valueStyle === "currency" ? "Fines" : "Tickets",
        },
      }) satisfies ChartConfig,
    [valueStyle]
  );

  if (values.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-[4px] bg-muted/30 text-[10px] text-muted-foreground",
          compact ? "h-[40px]" : "min-h-[200px] h-full",
          className
        )}
      >
        No trend data yet
      </div>
    );
  }

  const height = compact ? 40 : 200;
  const margin = compact
    ? { bottom: 2, left: 2, right: 2, top: 2 }
    : { bottom: 4, left: 0, right: 0, top: 4 };

  return (
    <m.div
      animate={{ clipPath: "inset(0 0% 0 0)" }}
      aria-hidden={compact ? "true" : undefined}
      className={cn(
        "w-full",
        compact
          ? "h-[40px] overflow-hidden"
          : "min-h-0 h-full overflow-visible",
        className
      )}
      initial={reduceMotion ? false : { clipPath: "inset(0 100% 0 0)" }}
      transition={{
        delay: reduceMotion ? 0 : revealDelay / 1000,
        duration: reduceMotion ? 0 : DRAW_DURATION_S,
        ease: LOAD_IN_EASE,
      }}
    >
      <Suspense
        fallback={<ChartFallback className={className} compact={compact} />}
      >
        <TrendChartInner
          chartConfig={chartConfig}
          compact={compact}
          data={data}
          gradientId={gradientId}
          height={height}
          margin={margin}
          maxXLabels={maxXLabels}
          valueStyle={valueStyle}
          yMax={yMax}
        />
      </Suspense>
    </m.div>
  );
};
