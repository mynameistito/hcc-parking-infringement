import { createContext, useContext, useId, useMemo } from "react";
import type {
  ComponentProps,
  ComponentType,
  CSSProperties,
  ReactNode,
} from "react";
import type { DefaultTooltipContentProps, TooltipValueType } from "recharts";
import { z } from "zod";

import { cn } from "@/lib/utils";

const { ResponsiveContainer, Tooltip } = await import("recharts");

const ITEMS_CENTER = "items-center";

const INITIAL_DIMENSION = { height: 200, width: 320 } as const;

type TooltipNameType = number | string;

/**
 * Labels, icons, and theme colors for chart series.
 */
export type ChartConfig = Record<
  string,
  {
    label?: ReactNode;
    icon?: ComponentType;
    color?: string;
  }
>;

type ChartConfigEntry = ChartConfig[string];

interface ChartContextProps {
  config: ChartConfig;
}

type TooltipPayloadItem = NonNullable<
  DefaultTooltipContentProps<TooltipValueType, TooltipNameType>["payload"]
>[number];

type TooltipPayloadArray = NonNullable<
  DefaultTooltipContentProps<TooltipValueType, TooltipNameType>["payload"]
>;

const ChartContext = createContext<ChartContextProps | null>(null);

const useChart = (): ChartContextProps => {
  const context = useContext(ChartContext);

  if (context === null) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }

  return context;
};

const chartPayloadSchema = z.looseObject({
  payload: z.record(z.string(), z.unknown()).optional(),
});

const getPayloadConfigFromPayload = (
  config: ChartConfig,
  payload: TooltipPayloadItem | undefined,
  key: string
): ChartConfigEntry | undefined => {
  const parsed = chartPayloadSchema.safeParse(payload);

  if (!parsed.success) {
    return config[key];
  }

  const directKey = z.string().safeParse(parsed.data[key]);
  const nestedKey = z.string().safeParse(parsed.data.payload?.[key]);

  if (directKey.success) {
    return config[directKey.data] ?? config[key];
  }

  return nestedKey.success
    ? (config[nestedKey.data] ?? config[key])
    : config[key];
};

type ChartVariables = CSSProperties &
  Record<`--${string}`, string | number | undefined>;

const resolveTooltipKey = (
  labelKey: string | undefined,
  item: TooltipPayloadItem | undefined,
  fallback: string
): string => {
  if (labelKey !== undefined) {
    return labelKey;
  }

  if (item?.dataKey !== undefined) {
    return String(item.dataKey);
  }

  if (item?.name !== undefined) {
    return String(item.name);
  }

  return fallback;
};

const resolveSeriesKey = (
  nameKey: string | undefined,
  item: TooltipPayloadItem
): string => {
  if (nameKey !== undefined) {
    return nameKey;
  }

  if (item.name !== undefined) {
    return String(item.name);
  }

  if (item.dataKey !== undefined) {
    return String(item.dataKey);
  }

  return "value";
};

const formatTooltipValue = (value: TooltipValueType): string =>
  Array.isArray(value) ? String(value) : value.toLocaleString();

const hasTooltipValue = (
  value: TooltipValueType | undefined
): value is TooltipValueType => value !== undefined && value !== null;

const fillColorSchema = z.object({ fill: z.string() });

const resolveIndicatorColor = (
  color: string | undefined,
  item: TooltipPayloadItem
): string => {
  if (color !== undefined) {
    return color;
  }

  const fill = fillColorSchema.safeParse(item.payload);

  return fill.success ? fill.data.fill : (item.color ?? "currentColor");
};

interface TooltipIndicatorProps {
  hideIndicator: boolean;
  indicator: "line" | "dot" | "dashed";
  indicatorColor: string;
  itemConfig: ChartConfigEntry | undefined;
  nestLabel: boolean;
}

const TooltipIndicator = ({
  hideIndicator,
  indicator,
  indicatorColor,
  itemConfig,
  nestLabel,
}: TooltipIndicatorProps) => {
  if (itemConfig?.icon !== undefined) {
    const Icon = itemConfig.icon;

    return <Icon />;
  }

  if (hideIndicator) {
    return null;
  }

  const style: ChartVariables = { "--chart-color": indicatorColor };

  return (
    <div
      className={cn("chart-indicator shrink-0 rounded-[2px] border", {
        "h-2.5 w-2.5": indicator === "dot",
        "my-0.5": nestLabel && indicator === "dashed",
        "w-0 border-[1.5px] border-dashed bg-transparent":
          indicator === "dashed",
        "w-1": indicator === "line",
      })}
      style={style}
    />
  );
};

interface TooltipPayloadRowProps {
  color: string | undefined;
  formatter: ChartTooltipContentProps["formatter"];
  hideIndicator: boolean;
  index: number;
  indicator: "line" | "dot" | "dashed";
  item: TooltipPayloadItem;
  itemConfig: ChartConfigEntry | undefined;
  nameKey: string | undefined;
  nestLabel: boolean;
  tooltipLabel: ReactNode;
  tooltipPayload: TooltipPayloadArray;
}

const TooltipPayloadRow = ({
  color,
  formatter,
  hideIndicator,
  index,
  indicator,
  item,
  itemConfig,
  nestLabel,
  tooltipLabel,
  tooltipPayload,
}: TooltipPayloadRowProps) => {
  const indicatorColor = resolveIndicatorColor(color, item);

  if (
    formatter !== undefined &&
    item.value !== undefined &&
    item.name !== undefined
  ) {
    const { name, value } = item;

    return (
      <div
        className={cn(
          "[&>svg]:text-muted-foreground flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5",
          indicator === "dot" && ITEMS_CENTER
        )}
      >
        {formatter(value, name, item, index, tooltipPayload)}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "[&>svg]:text-muted-foreground flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5",
        indicator === "dot" && ITEMS_CENTER
      )}
    >
      <TooltipIndicator
        hideIndicator={hideIndicator}
        indicator={indicator}
        indicatorColor={indicatorColor}
        itemConfig={itemConfig}
        nestLabel={nestLabel}
      />
      <div
        className={cn(
          "flex flex-1 justify-between leading-none",
          nestLabel ? "items-end" : ITEMS_CENTER
        )}
      >
        <div className="grid gap-1.5">
          {nestLabel ? tooltipLabel : null}
          <span className="text-muted-foreground">
            {itemConfig?.label ?? item.name}
          </span>
        </div>
        {hasTooltipValue(item.value) ? (
          <span className="text-foreground font-mono font-medium tabular-nums">
            {formatTooltipValue(item.value)}
          </span>
        ) : null}
      </div>
    </div>
  );
};

type ChartTooltipContentProps = ComponentProps<typeof Tooltip> &
  ComponentProps<"div"> & {
    hideLabel?: boolean;
    hideIndicator?: boolean;
    indicator?: "line" | "dot" | "dashed";
    nameKey?: string;
    labelKey?: string;
  } & Omit<
    DefaultTooltipContentProps<TooltipValueType, TooltipNameType>,
    "accessibilityLayer"
  >;

const ChartTooltipContent = ({
  active,
  payload,
  className,
  indicator = "dot",
  hideLabel = false,
  hideIndicator = false,
  label,
  labelFormatter,
  labelClassName,
  formatter,
  color,
  nameKey,
  labelKey,
}: ChartTooltipContentProps) => {
  const { config } = useChart();

  if (active !== true || payload === undefined || payload.length === 0) {
    return null;
  }

  const tooltipLabel = (() => {
    if (hideLabel || payload === undefined || payload.length === 0) {
      return null;
    }

    const [item] = payload;
    const key = resolveTooltipKey(labelKey, item, "value");
    const itemConfig = getPayloadConfigFromPayload(config, item, key);

    const parsedLabel = z.string().safeParse(label);

    const value =
      labelKey === undefined && parsedLabel.success
        ? (config[parsedLabel.data]?.label ?? parsedLabel.data)
        : itemConfig?.label;

    if (labelFormatter !== undefined) {
      return (
        <div className={cn("font-medium", labelClassName)}>
          {labelFormatter(value, payload)}
        </div>
      );
    }

    if (value === undefined || value === null || value === "") {
      return null;
    }

    return <div className={cn("font-medium", labelClassName)}>{value}</div>;
  })();

  const nestLabel = payload.length === 1 && indicator !== "dot";

  const rows: ReactNode[] = [];

  for (const item of payload) {
    if (item.type === "none") {
      continue;
    }

    const index = rows.length;
    const key = resolveSeriesKey(nameKey, item);
    const itemConfig = getPayloadConfigFromPayload(config, item, key);

    rows.push(
      <TooltipPayloadRow
        color={color}
        formatter={formatter}
        hideIndicator={hideIndicator}
        index={index}
        indicator={indicator}
        item={item}
        itemConfig={itemConfig}
        key={String(item.dataKey ?? item.name ?? key)}
        nameKey={nameKey}
        nestLabel={nestLabel}
        tooltipLabel={tooltipLabel}
        tooltipPayload={payload}
      />
    );
  }

  return (
    <div
      className={cn(
        "border-border/50 bg-background grid min-w-32 items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl",
        className
      )}
    >
      {nestLabel ? null : tooltipLabel}
      <div className="grid gap-1.5">{rows} </div>
    </div>
  );
};

const ChartContainer = ({
  id,
  className,
  children,
  config,
  initialDimension = INITIAL_DIMENSION,
  ...props
}: Omit<ComponentProps<"div">, "style"> & {
  config: ChartConfig;
  children: ComponentProps<typeof ResponsiveContainer>["children"];
  initialDimension?: {
    width: number;
    height: number;
  };
}) => {
  const uniqueId = useId();
  const chartId = `chart-${id ?? uniqueId.replaceAll(":", "")}`;
  const contextValue = useMemo(() => ({ config }), [config]);
  const variables: ChartVariables = { "--color-value": config.value?.color };

  return (
    <ChartContext.Provider value={contextValue}>
      <div
        data-slot="chart"
        data-chart={chartId}
        className={cn(
          "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border flex aspect-video justify-center text-xs [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-hidden [&_.recharts-sector]:outline-hidden [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-surface]:outline-hidden",
          className
        )}
        {...props}
        style={variables}
      >
        <ResponsiveContainer initialDimension={initialDimension}>
          {children}
        </ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
};

const ChartTooltip = Tooltip;

export { ChartContainer, ChartTooltip, ChartTooltipContent };
