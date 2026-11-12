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

const { Cell, Pie, PieChart } = await import("recharts");

const donutChartConfig = {
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

interface DonutChartInnerProps {
  centerLabel?: string;
  centerValue?: string;
  data: ChartEntry[];
}

/**
 * Render the loaded Recharts donut visualization.
 * @returns The rendered interface for the supplied data.
 */
export const DonutChartInner = ({
  centerLabel,
  centerValue,
  data,
}: DonutChartInnerProps) => {
  const showCenter = centerLabel !== undefined || centerValue !== undefined;

  return (
    <div className="relative h-full w-full">
      <ChartContainer
        className="aspect-auto h-full w-full"
        config={donutChartConfig}
        initialDimension={{ height: 176, width: 176 }}
      >
        <PieChart aria-label="Ticket distribution by category">
          <Pie
            cx="50%"
            cy="50%"
            data={data}
            dataKey="value"
            innerRadius="62%"
            isAnimationActive={false}
            nameKey="label"
            outerRadius="88%"
            paddingAngle={2}
            stroke="var(--background)"
            strokeWidth={2}
          >
            {data.map((entry) => (
              <Cell key={entry.label} fill={entry.fill} />
            ))}
          </Pie>
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
          />
        </PieChart>
      </ChartContainer>
      {showCenter ? (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          {centerValue === undefined ? null : (
            <span className="text-foreground font-mono text-lg font-semibold tracking-tight tabular-nums">
              {centerValue}
            </span>
          )}
          {centerLabel === undefined ? null : (
            <span className="text-muted-foreground mt-0.5 text-xs uppercase">
              {centerLabel}
            </span>
          )}
        </div>
      ) : null}
    </div>
  );
};
