import type { ComponentProps } from "react";
import { Bar, BarChart, Rectangle, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { numberFmt } from "@/lib/format";

const truncateLabel = (label: string, maxLength = 22): string =>
  label.length > maxLength ? `${label.slice(0, maxLength - 1)}…` : label;

interface ChartEntry {
  fill: string;
  label: string;
  value: number;
}

const isChartEntry = (value: unknown): value is ChartEntry =>
  typeof value === "object" &&
  value !== null &&
  "label" in value &&
  "value" in value &&
  typeof Reflect.get(value, "label") === "string" &&
  typeof Reflect.get(value, "value") === "number";

type BarShapeProps = ComponentProps<typeof Rectangle> & {
  payload?: ChartEntry;
};

const barFillForIndex = (
  props: BarShapeProps,
  index: string | number | undefined
): string => {
  if (index === 0 || index === "0") {
    return "var(--color-value)";
  }
  if (isChartEntry(props.payload)) {
    return props.payload.fill;
  }
  return "var(--color-value)";
};

const rankedBarShape = (props: BarShapeProps, index?: string | number) => (
  <Rectangle {...props} fill={barFillForIndex(props, index)} />
);

const rankedBarChartConfig = {
  value: {
    color: "var(--chart-1)",
    label: "Tickets",
  },
} satisfies ChartConfig;

const chartEntryLabel = (
  payload: readonly { payload?: unknown }[] | undefined
): string => {
  const raw: unknown = payload?.[0]?.payload;
  return isChartEntry(raw) ? raw.label : "";
};

interface RankedBarChartInnerProps {
  data: ChartEntry[];
  yMax: number;
}

export const RankedBarChartInner = ({
  data,
  yMax,
}: RankedBarChartInnerProps) => (
  <ChartContainer
    className="aspect-auto h-full w-full"
    config={rankedBarChartConfig}
    initialDimension={{ height: 320, width: 640 }}
  >
    <BarChart
      accessibilityLayer
      data={data}
      layout="vertical"
      margin={{ bottom: 0, left: 0, right: 12, top: 0 }}
    >
      <XAxis domain={[0, yMax]} hide type="number" />
      <YAxis
        axisLine={false}
        dataKey="label"
        tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
        tickFormatter={(value: string) => truncateLabel(value)}
        tickLine={false}
        type="category"
        width={108}
      />
      <ChartTooltip
        content={
          <ChartTooltipContent
            formatter={(value) =>
              typeof value === "number"
                ? numberFmt.format(value)
                : String(value)
            }
            hideIndicator
            labelFormatter={(_, payload) => chartEntryLabel(payload)}
          />
        }
        cursor={{ fill: "var(--muted)", opacity: 0.35 }}
      />
      <Bar
        barSize={14}
        dataKey="value"
        isAnimationActive={false}
        radius={[0, 4, 4, 0]}
        shape={rankedBarShape}
      />
    </BarChart>
  </ChartContainer>
);
