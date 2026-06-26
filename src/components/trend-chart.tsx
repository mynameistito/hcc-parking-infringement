import { motion, useReducedMotion } from "motion/react";
import { useId, useMemo } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { LOAD_IN_EASE } from "@/components/load-in";
import { buildYTicks, formatYTick } from "@/lib/chart-scale";
import { cn } from "@/lib/utils";

interface TrendChartProps {
  values: number[];
  xLabels: string[];
  valueStyle?: "number" | "currency";
  className?: string;
  compact?: boolean;
  /** Stagger the left-to-right draw animation (ms). */
  revealDelay?: number;
}

const CHART_COLOR = "var(--chart-1)";
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

export const TrendChart = ({
  values,
  xLabels,
  valueStyle = "number",
  className,
  compact = false,
  revealDelay = 0,
}: TrendChartProps) => {
  const gradientId = useId();
  const yMax = useChartDomain(values);
  const reduceMotion = useReducedMotion() === true;

  const data = useMemo(
    () =>
      values.map((value, index) => ({
        label: xLabels[index] ?? "",
        value,
      })),
    [values, xLabels]
  );

  if (values.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-[4px] bg-muted/30 text-[10px] text-muted-foreground",
          compact ? "h-[40px]" : "h-[96px]",
          className
        )}
      >
        No trend data yet
      </div>
    );
  }

  const height = compact ? 40 : 112;
  const margin = compact
    ? { bottom: 2, left: 2, right: 2, top: 2 }
    : { bottom: 22, left: 36, right: 8, top: 8 };

  return (
    <motion.div
      animate={{ clipPath: "inset(0 0% 0 0)" }}
      aria-hidden="true"
      className={cn(
        "w-full overflow-hidden",
        compact ? "h-[40px]" : "h-[112px]",
        className
      )}
      initial={reduceMotion ? false : { clipPath: "inset(0 100% 0 0)" }}
      transition={{
        delay: reduceMotion ? 0 : revealDelay / 1000,
        duration: reduceMotion ? 0 : DRAW_DURATION_S,
        ease: LOAD_IN_EASE,
      }}
    >
      <AreaChart
        data={data}
        height={height}
        margin={margin}
        responsive
        width="100%"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLOR} stopOpacity={0.28} />
            <stop offset="100%" stopColor={CHART_COLOR} stopOpacity={0} />
          </linearGradient>
        </defs>

        <YAxis
          axisLine={false}
          domain={[0, yMax]}
          hide={compact}
          tick={
            compact ? false : { fill: "var(--muted-foreground)", fontSize: 9 }
          }
          tickFormatter={
            compact
              ? undefined
              : (value: number) => formatYTick(value, valueStyle)
          }
          tickLine={false}
          width={compact ? 0 : 28}
        />

        {!compact && (
          <>
            <CartesianGrid
              stroke="var(--border)"
              strokeDasharray="3 4"
              vertical={false}
            />
            <XAxis
              axisLine={{
                stroke: "var(--border)",
                strokeDasharray: "3 4",
              }}
              dataKey="label"
              tick={{ fill: "var(--muted-foreground)", fontSize: 9 }}
              tickLine={{ stroke: "var(--border)" }}
            />
          </>
        )}

        <Area
          activeDot={false}
          dataKey="value"
          dot={false}
          fill={`url(#${gradientId})`}
          isAnimationActive={false}
          stroke={CHART_COLOR}
          strokeWidth={compact ? 2 : 1.5}
          type="linear"
        />
      </AreaChart>
    </motion.div>
  );
};
