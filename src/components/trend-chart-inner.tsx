import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { formatYTick } from "@/lib/chart-scale";
import { moneyFmt, numberFmt } from "@/lib/format";
import {
  formatTrendAxisDate,
  formatTrendTooltipDate,
  xAxisTickInterval,
} from "@/lib/trend-window";

interface TrendPoint {
  date: string;
  label: string;
  value: number;
}

const isTrendPoint = (value: unknown): value is TrendPoint =>
  typeof value === "object" &&
  value !== null &&
  "date" in value &&
  typeof Reflect.get(value, "date") === "string" &&
  "value" in value &&
  typeof Reflect.get(value, "value") === "number";

const trendTooltipLabel = (
  payload: readonly { payload?: unknown }[] | undefined
): string => {
  const raw: unknown = payload?.[0]?.payload;
  if (!isTrendPoint(raw)) {
    return "";
  }
  return formatTrendTooltipDate(raw.date);
};

interface CompactTrendChartProps {
  data: TrendPoint[];
  gradientId: string;
  height: number;
  margin: { bottom: number; left: number; right: number; top: number };
  yMax: number;
}

const CompactTrendChart = ({
  data,
  gradientId,
  height,
  margin,
  yMax,
}: CompactTrendChartProps) => (
  <AreaChart
    data={data}
    height={height}
    margin={margin}
    responsive
    width="100%"
  >
    <defs>
      <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.28} />
        <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
      </linearGradient>
    </defs>

    <YAxis
      axisLine={false}
      domain={[0, yMax]}
      hide
      tickLine={false}
      width={0}
    />

    <Area
      activeDot={false}
      dataKey="value"
      dot={false}
      fill={`url(#${gradientId})`}
      isAnimationActive={false}
      stroke="var(--chart-1)"
      strokeWidth={2}
      type="linear"
    />
  </AreaChart>
);

interface InteractiveTrendChartProps {
  chartConfig: ChartConfig;
  data: TrendPoint[];
  gradientId: string;
  maxXLabels: number;
  valueStyle: "number" | "currency";
  yMax: number;
}

const formatTrendValue = (
  value: unknown,
  valueStyle: "number" | "currency"
): string => {
  if (typeof value !== "number") {
    return String(value);
  }
  if (valueStyle === "currency") {
    return moneyFmt.format(value);
  }
  return numberFmt.format(value);
};

const InteractiveTrendChart = ({
  chartConfig,
  data,
  gradientId,
  maxXLabels,
  valueStyle,
  yMax,
}: InteractiveTrendChartProps) => (
  <ChartContainer
    className="aspect-auto h-full min-h-[200px] w-full"
    config={chartConfig}
    initialDimension={{ height: 280, width: 640 }}
  >
    <AreaChart
      accessibilityLayer
      data={data}
      margin={{ bottom: 8, left: 4, right: 8, top: 8 }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-value)" stopOpacity={0.28} />
          <stop offset="100%" stopColor="var(--color-value)" stopOpacity={0} />
        </linearGradient>
      </defs>

      <CartesianGrid strokeDasharray="3 4" vertical={false} />

      <YAxis
        axisLine={false}
        domain={[0, yMax]}
        tick={{ fill: "var(--muted-foreground)", fontSize: 9 }}
        tickFormatter={(value: number) => formatYTick(value, valueStyle)}
        tickLine={false}
        tickMargin={4}
        width={36}
      />

      <XAxis
        axisLine={{
          stroke: "var(--border)",
          strokeDasharray: "3 4",
        }}
        dataKey="date"
        height={28}
        interval={xAxisTickInterval(data.length, maxXLabels)}
        minTickGap={16}
        tick={{ fill: "var(--muted-foreground)", fontSize: 9 }}
        tickFormatter={(dateKey: string) =>
          formatTrendAxisDate(dateKey, data.length)
        }
        tickLine={{ stroke: "var(--border)" }}
        tickMargin={8}
      />

      <ChartTooltip
        allowEscapeViewBox={{ x: false, y: true }}
        content={
          <ChartTooltipContent
            formatter={(value) => formatTrendValue(value, valueStyle)}
            indicator="line"
            labelFormatter={(_, payload) => trendTooltipLabel(payload)}
          />
        }
        cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
        isAnimationActive={false}
        shared={false}
      />

      <Area
        activeDot={{
          fill: "var(--color-value)",
          r: 4,
          stroke: "var(--background)",
          strokeWidth: 2,
        }}
        dataKey="value"
        dot={false}
        fill={`url(#${gradientId})`}
        isAnimationActive={false}
        stroke="var(--color-value)"
        strokeWidth={1.5}
        type="linear"
      />
    </AreaChart>
  </ChartContainer>
);

export interface TrendChartInnerProps {
  chartConfig: ChartConfig;
  compact: boolean;
  data: TrendPoint[];
  gradientId: string;
  height: number;
  margin: { bottom: number; left: number; right: number; top: number };
  maxXLabels: number;
  valueStyle: "number" | "currency";
  yMax: number;
}

export const TrendChartInner = ({
  chartConfig,
  compact,
  data,
  gradientId,
  height,
  margin,
  maxXLabels,
  valueStyle,
  yMax,
}: TrendChartInnerProps) => {
  if (compact) {
    return (
      <CompactTrendChart
        data={data}
        gradientId={gradientId}
        height={height}
        margin={margin}
        yMax={yMax}
      />
    );
  }

  return (
    <InteractiveTrendChart
      chartConfig={chartConfig}
      data={data}
      gradientId={gradientId}
      maxXLabels={maxXLabels}
      valueStyle={valueStyle}
      yMax={yMax}
    />
  );
};
