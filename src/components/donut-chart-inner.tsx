import type { ComponentProps } from "react";
import { Pie, PieChart, Sector } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { numberFmt } from "@/lib/format";

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

type SectorShapeProps = ComponentProps<typeof Sector> & {
  payload?: ChartEntry;
};

const donutSectorShape = (props: SectorShapeProps) => {
  const fill = isChartEntry(props.payload)
    ? props.payload.fill
    : "var(--chart-1)";
  return <Sector {...props} fill={fill} stroke="var(--background)" />;
};

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
        <PieChart>
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
            shape={donutSectorShape}
            strokeWidth={2}
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
          />
        </PieChart>
      </ChartContainer>
      {showCenter ? (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          {centerValue === undefined ? null : (
            <span className="font-mono text-lg font-semibold tracking-[-0.03em] text-foreground tabular-nums">
              {centerValue}
            </span>
          )}
          {centerLabel === undefined ? null : (
            <span className="mt-0.5 text-[10px] text-muted-foreground uppercase">
              {centerLabel}
            </span>
          )}
        </div>
      ) : null}
    </div>
  );
};
