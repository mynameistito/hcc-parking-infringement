import type { ComponentProps } from "react";
import {
  Bar,
  BarChart,
  Rectangle,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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

interface RankedBarTooltipProps {
  active?: boolean;
  payload?: readonly { payload?: unknown }[];
}

const RankedBarTooltip = ({ active, payload }: RankedBarTooltipProps) => {
  if (active !== true) {
    return null;
  }
  if (payload === undefined || payload.length === 0) {
    return null;
  }
  const entry = payload[0]?.payload;
  if (!isChartEntry(entry)) {
    return null;
  }
  return (
    <div className="rounded-[4px] border border-border bg-popover px-2.5 py-1.5 text-xs shadow-sm">
      <p className="max-w-48 font-medium text-foreground">{entry.label}</p>
      <p className="mt-0.5 font-mono text-muted-foreground tabular-nums">
        {numberFmt.format(entry.value)}
      </p>
    </div>
  );
};

type BarShapeProps = ComponentProps<typeof Rectangle> & {
  payload?: ChartEntry;
};

const barFillForIndex = (
  props: BarShapeProps,
  index: string | number | undefined
): string => {
  if (index === 0 || index === "0") {
    return "var(--chart-1)";
  }
  if (isChartEntry(props.payload)) {
    return props.payload.fill;
  }
  return "var(--chart-1)";
};

const rankedBarShape = (props: BarShapeProps, index?: string | number) => (
  <Rectangle {...props} fill={barFillForIndex(props, index)} />
);

interface RankedBarChartInnerProps {
  data: ChartEntry[];
  yMax: number;
}

export const RankedBarChartInner = ({
  data,
  yMax,
}: RankedBarChartInnerProps) => (
  <ResponsiveContainer height="100%" width="100%">
    <BarChart
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
      <Tooltip
        content={RankedBarTooltip}
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
  </ResponsiveContainer>
);
