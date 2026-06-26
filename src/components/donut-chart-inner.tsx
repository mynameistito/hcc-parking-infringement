import type { ComponentProps } from "react";
import { Pie, PieChart, ResponsiveContainer, Sector, Tooltip } from "recharts";

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

interface DonutTooltipProps {
  active?: boolean;
  payload?: readonly { payload?: unknown }[];
}

const DonutTooltip = ({ active, payload }: DonutTooltipProps) => {
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
      <p className="max-w-40 font-medium text-foreground">{entry.label}</p>
      <p className="mt-0.5 font-mono text-muted-foreground tabular-nums">
        {numberFmt.format(entry.value)}
      </p>
    </div>
  );
};

type SectorShapeProps = ComponentProps<typeof Sector> & {
  payload?: ChartEntry;
};

const donutSectorShape = (props: SectorShapeProps) => {
  const fill = isChartEntry(props.payload)
    ? props.payload.fill
    : "var(--chart-1)";
  return <Sector {...props} fill={fill} stroke="var(--background)" />;
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
      <ResponsiveContainer height="100%" width="100%">
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
          <Tooltip content={DonutTooltip} />
        </PieChart>
      </ResponsiveContainer>
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
