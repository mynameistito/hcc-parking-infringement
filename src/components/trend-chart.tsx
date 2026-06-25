import { useId } from "react";

import { buildYTicks, formatYTick } from "@/lib/chart-scale";
import { cn } from "@/lib/utils";

interface TrendChartProps {
  values: number[];
  xLabels: string[];
  valueStyle?: "number" | "currency";
  className?: string;
  compact?: boolean;
}

const CHART_WIDTH = 520;
const CHART_HEIGHT = 112;
const COMPACT_CHART_HEIGHT = 48;
const COMPACT_MARGIN = { bottom: 2, left: 2, right: 2, top: 2 };
const FULL_MARGIN = { bottom: 22, left: 36, right: 8, top: 8 };

const buildPoints = (
  values: number[],
  plotWidth: number,
  plotHeight: number,
  yMax: number,
  margin: { left: number; top: number }
) => {
  const step = values.length > 1 ? plotWidth / (values.length - 1) : 0;

  return values.map((value, index) => ({
    x: margin.left + index * step,
    y: margin.top + plotHeight - (value / yMax) * plotHeight,
  }));
};

export const TrendChart = ({
  values,
  xLabels,
  valueStyle = "number",
  className,
  compact = false,
}: TrendChartProps) => {
  const gradientId = useId();
  const margin = compact ? COMPACT_MARGIN : FULL_MARGIN;
  const chartHeight = compact ? COMPACT_CHART_HEIGHT : CHART_HEIGHT;
  const plotWidth = CHART_WIDTH - margin.left - margin.right;
  const plotHeight = chartHeight - margin.top - margin.bottom;
  const maxValue = Math.max(...values, 0);
  const minValue = Math.min(...values, 0);

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

  const yTicks = buildYTicks(
    maxValue === minValue && maxValue > 0 ? maxValue * 1.25 : maxValue
  );
  const yMax = yTicks.at(-1) ?? 10;
  const points = buildPoints(values, plotWidth, plotHeight, yMax, margin);

  const line = points
    .map((point, index) =>
      index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`
    )
    .join(" ");

  const first = points[0];
  const last = points.at(-1);
  const baseline = margin.top + plotHeight;
  const area =
    first !== undefined && last !== undefined
      ? `${line} L ${last.x} ${baseline} L ${first.x} ${baseline} Z`
      : "";

  const xTickCount = xLabels.length;
  const xStep = xTickCount > 1 ? plotWidth / (xTickCount - 1) : plotWidth / 2;

  return (
    <svg
      viewBox={`0 0 ${CHART_WIDTH} ${chartHeight}`}
      className={cn(compact ? "h-[40px]" : "h-[112px]", "w-full", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--chart-1)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--chart-1)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {!compact &&
        yTicks.map((tick) => {
          const y = margin.top + plotHeight - (tick / yMax) * plotHeight;
          return (
            <g key={tick}>
              <line
                x1={margin.left}
                y1={y}
                x2={CHART_WIDTH - margin.right}
                y2={y}
                stroke="var(--border)"
                strokeDasharray="3 4"
                strokeWidth="1"
              />
              <text
                x={margin.left - 8}
                y={y + 4}
                textAnchor="end"
                className="fill-muted-foreground text-[9px]"
              >
                {formatYTick(tick, valueStyle)}
              </text>
            </g>
          );
        })}

      {!compact && (
        <line
          x1={margin.left}
          y1={baseline}
          x2={CHART_WIDTH - margin.right}
          y2={baseline}
          stroke="var(--border)"
          strokeDasharray="3 4"
          strokeWidth="1"
        />
      )}

      {!compact &&
        xLabels.map((label, index) => {
          const x = margin.left + index * xStep;
          return (
            <g key={`${label}-${index}`}>
              <line
                x1={x}
                y1={baseline}
                x2={x}
                y2={baseline + 4}
                stroke="var(--border)"
                strokeWidth="1"
              />
              <text
                x={x}
                y={chartHeight - 4}
                textAnchor="middle"
                className="fill-muted-foreground text-[9px]"
              >
                {label}
              </text>
            </g>
          );
        })}

      {area.length > 0 ? <path d={area} fill={`url(#${gradientId})`} /> : null}
      {line.length > 0 ? (
        <path
          d={line}
          fill="none"
          stroke="var(--chart-1)"
          strokeWidth={compact ? "2" : "1.5"}
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
    </svg>
  );
};
