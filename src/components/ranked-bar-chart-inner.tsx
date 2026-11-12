import { z } from "zod";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { isChartEntry } from "@/lib/chart-entry";
import type { ChartEntry } from "@/lib/chart-entry";
import { numberFmt } from "@/lib/format";

const { Bar, BarChart, Cell, LabelList, XAxis, YAxis } =
  await import("recharts");

const truncateLabel = (label: string, maxLength = 22): string =>
  label.length > maxLength ? `${label.slice(0, maxLength - 1)}…` : label;

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

/**
 * Render the loaded Recharts ranked bar visualization.
 * @returns The rendered interface for the supplied data.
 */
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
      aria-label="Streets ranked by ticket count"
      data={data}
      layout="vertical"
      margin={{ bottom: 0, left: 0, right: 64, top: 0 }}
    >
      <XAxis domain={[0, yMax]} hide type="number" />
      <YAxis
        axisLine={false}
        dataKey="label"
        tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
        tickFormatter={(value: string) => truncateLabel(value)}
        tickLine={false}
        type="category"
        width={120}
      />
      <ChartTooltip
        content={
          <ChartTooltipContent
            formatter={(value) => {
              const parsed = z.number().safeParse(value);

              return parsed.success
                ? numberFmt.format(parsed.data)
                : String(value);
            }}
            hideIndicator
            labelFormatter={(_, payload) => chartEntryLabel(payload)}
          />
        }
        cursor={{ fill: "var(--muted)", opacity: 0.35 }}
      />
      <Bar
        barSize={18}
        dataKey="value"
        isAnimationActive={false}
        radius={[0, 4, 4, 0]}
      >
        {data.map((entry) => (
          <Cell key={entry.label} fill={entry.fill} />
        ))}
        <LabelList
          dataKey="value"
          position="right"
          offset={8}
          fill="var(--foreground)"
          fontSize={12}
          formatter={(value) => {
            const parsed = z.number().safeParse(value);

            return parsed.success
              ? numberFmt.format(parsed.data)
              : String(value);
          }}
        />
      </Bar>
    </BarChart>
  </ChartContainer>
);
