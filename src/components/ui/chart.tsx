import * as React from "react";
import * as RechartsPrimitive from "recharts";
import type { TooltipValueType } from "recharts";

import { cn } from "@/lib/utils";

const THEMES = { dark: ".dark", light: "" } as const;
type ChartTheme = keyof typeof THEMES;

const INITIAL_DIMENSION = { height: 200, width: 320 } as const;
type TooltipNameType = number | string;

export type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode;
    icon?: React.ComponentType;
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<ChartTheme, string> }
  )
>;

type ChartConfigEntry = ChartConfig[string];

interface ChartContextProps {
  config: ChartConfig;
}

type TooltipPayloadItem = NonNullable<
  RechartsPrimitive.DefaultTooltipContentProps<
    TooltipValueType,
    TooltipNameType
  >["payload"]
>[number];

type TooltipPayloadArray = NonNullable<
  RechartsPrimitive.DefaultTooltipContentProps<
    TooltipValueType,
    TooltipNameType
  >["payload"]
>;

type LegendPayloadItem = NonNullable<
  RechartsPrimitive.DefaultLegendContentProps["payload"]
>[number];

const CHART_THEMES = ["light", "dark"] as const satisfies readonly ChartTheme[];

const ChartContext = React.createContext<ChartContextProps | null>(null);

const useChart = (): ChartContextProps => {
  const context = React.useContext(ChartContext);

  if (context === null) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }

  return context;
};

const readStringProperty = (obj: object, key: string): string | undefined => {
  if (!Object.hasOwn(obj, key)) {
    return undefined;
  }
  const value: unknown = Reflect.get(obj, key);
  return typeof value === "string" ? value : undefined;
};

const getPayloadConfigFromPayload = (
  config: ChartConfig,
  payload: unknown,
  key: string
): ChartConfigEntry | undefined => {
  if (typeof payload !== "object" || payload === null) {
    return undefined;
  }

  const nestedPayload =
    "payload" in payload &&
    typeof payload.payload === "object" &&
    payload.payload !== null
      ? payload.payload
      : undefined;

  const directKey = readStringProperty(payload, key);
  const nestedKey =
    nestedPayload === undefined
      ? undefined
      : readStringProperty(nestedPayload, key);

  const configLabelKey = directKey ?? nestedKey ?? key;

  if (configLabelKey in config) {
    return config[configLabelKey];
  }

  return config[key];
};

const hasColorConfig = (itemConfig: ChartConfigEntry): boolean => {
  if ("theme" in itemConfig && itemConfig.theme !== undefined) {
    return true;
  }
  return "color" in itemConfig && itemConfig.color !== undefined;
};

const resolveThemeColor = (
  itemConfig: ChartConfigEntry,
  theme: ChartTheme
): string | undefined => {
  if ("theme" in itemConfig && itemConfig.theme !== undefined) {
    return itemConfig.theme[theme];
  }
  if ("color" in itemConfig) {
    return itemConfig.color;
  }
  return undefined;
};

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(([, itemConfig]) =>
    hasColorConfig(itemConfig)
  );

  if (colorConfig.length === 0) {
    return null;
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: CHART_THEMES.map((theme) => {
          const prefix = THEMES[theme];
          const cssVars = colorConfig
            .map(([key, itemConfig]) => {
              const color = resolveThemeColor(itemConfig, theme);
              return color !== undefined && color !== ""
                ? `  --color-${key}: ${color};`
                : null;
            })
            .filter((line): line is string => line !== null)
            .join("\n");

          return `
${prefix} [data-chart=${id}] {
${cssVars}
}
`;
        }).join("\n"),
      }}
    />
  );
};

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

const formatTooltipValue = (value: TooltipValueType): string => {
  if (typeof value === "number") {
    return value.toLocaleString();
  }
  return String(value);
};

const hasTooltipValue = (
  value: TooltipValueType | undefined
): value is TooltipValueType => value !== undefined && value !== null;

const readFillColor = (payload: unknown): string | undefined => {
  if (typeof payload !== "object" || payload === null) {
    return undefined;
  }
  const fill: unknown = Reflect.get(payload, "fill");
  return typeof fill === "string" ? fill : undefined;
};

const resolveIndicatorColor = (
  color: string | undefined,
  item: TooltipPayloadItem
): string => {
  if (color !== undefined) {
    return color;
  }

  const fill = readFillColor(item.payload);
  if (fill !== undefined) {
    return fill;
  }

  if (typeof item.color === "string") {
    return item.color;
  }

  return "currentColor";
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

  return (
    <div
      className={cn("shrink-0 rounded-[2px] border", {
        "h-2.5 w-2.5": indicator === "dot",
        "my-0.5": nestLabel && indicator === "dashed",
        "w-0 border-[1.5px] border-dashed bg-transparent":
          indicator === "dashed",
        "w-1": indicator === "line",
      })}
      style={{
        backgroundColor: indicatorColor,
        borderColor: indicatorColor,
      }}
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
  tooltipLabel: React.ReactNode;
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
          "flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
          indicator === "dot" && "items-center"
        )}
      >
        {formatter(value, name, item, index, tooltipPayload)}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
        indicator === "dot" && "items-center"
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
          nestLabel ? "items-end" : "items-center"
        )}
      >
        <div className="grid gap-1.5">
          {nestLabel ? tooltipLabel : null}
          <span className="text-muted-foreground">
            {itemConfig?.label ?? item.name}
          </span>
        </div>
        {hasTooltipValue(item.value) ? (
          <span className="font-mono font-medium text-foreground tabular-nums">
            {formatTooltipValue(item.value)}
          </span>
        ) : null}
      </div>
    </div>
  );
};

type ChartTooltipContentProps = React.ComponentProps<
  typeof RechartsPrimitive.Tooltip
> &
  React.ComponentProps<"div"> & {
    hideLabel?: boolean;
    hideIndicator?: boolean;
    indicator?: "line" | "dot" | "dashed";
    nameKey?: string;
    labelKey?: string;
  } & Omit<
    RechartsPrimitive.DefaultTooltipContentProps<
      TooltipValueType,
      TooltipNameType
    >,
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

  const tooltipLabel = React.useMemo(() => {
    if (hideLabel || payload === undefined || payload.length === 0) {
      return null;
    }

    const [item] = payload;
    const key = resolveTooltipKey(labelKey, item, "value");
    const itemConfig = getPayloadConfigFromPayload(config, item, key);
    const value =
      labelKey === undefined && typeof label === "string"
        ? (config[label]?.label ?? label)
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
  }, [
    label,
    labelFormatter,
    payload,
    hideLabel,
    labelClassName,
    config,
    labelKey,
  ]);

  if (active !== true || payload === undefined || payload.length === 0) {
    return null;
  }

  const nestLabel = payload.length === 1 && indicator !== "dot";

  return (
    <div
      className={cn(
        "grid min-w-32 items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
        className
      )}
    >
      {nestLabel ? null : tooltipLabel}
      <div className="grid gap-1.5">
        {payload
          .filter((item) => item.type !== "none")
          .map((item, index) => {
            const key = resolveSeriesKey(nameKey, item);
            const itemConfig = getPayloadConfigFromPayload(config, item, key);

            return (
              <TooltipPayloadRow
                color={color}
                formatter={formatter}
                hideIndicator={hideIndicator}
                index={index}
                indicator={indicator}
                item={item}
                itemConfig={itemConfig}
                key={`${key}-${index}`}
                nameKey={nameKey}
                nestLabel={nestLabel}
                tooltipLabel={tooltipLabel}
                tooltipPayload={payload}
              />
            );
          })}
      </div>
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
}: React.ComponentProps<"div"> & {
  config: ChartConfig;
  children: React.ComponentProps<
    typeof RechartsPrimitive.ResponsiveContainer
  >["children"];
  initialDimension?: {
    width: number;
    height: number;
  };
}) => {
  const uniqueId = React.useId();
  const chartId = `chart-${id ?? uniqueId.replaceAll(":", "")}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        data-chart={chartId}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-hidden [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector]:outline-hidden [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-surface]:outline-hidden",
          className
        )}
        {...props}
      >
        <ChartStyle config={config} id={chartId} />
        <RechartsPrimitive.ResponsiveContainer
          initialDimension={initialDimension}
        >
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
};

const ChartTooltip = RechartsPrimitive.Tooltip;

const resolveLegendKey = (
  nameKey: string | undefined,
  item: LegendPayloadItem
): string => {
  if (nameKey !== undefined) {
    return nameKey;
  }
  if (typeof item.value === "string") {
    return item.value;
  }
  if (typeof item.value === "number") {
    return String(item.value);
  }
  if (typeof item.dataKey === "string") {
    return item.dataKey;
  }
  if (typeof item.dataKey === "number") {
    return String(item.dataKey);
  }
  return "value";
};

const ChartLegend = RechartsPrimitive.Legend;

const ChartLegendContent = ({
  className,
  hideIcon = false,
  payload,
  verticalAlign = "bottom",
  nameKey,
}: React.ComponentProps<"div"> & {
  hideIcon?: boolean;
  nameKey?: string;
} & RechartsPrimitive.DefaultLegendContentProps) => {
  const { config } = useChart();

  if (payload === undefined || payload.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-4",
        verticalAlign === "top" ? "pb-3" : "pt-3",
        className
      )}
    >
      {payload
        .filter((item) => item.type !== "none")
        .map((item, index) => {
          const key = resolveLegendKey(nameKey, item);
          const itemConfig = getPayloadConfigFromPayload(config, item, key);

          return (
            <div
              key={`${key}-${index}`}
              className={cn(
                "flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground"
              )}
            >
              {itemConfig?.icon !== undefined && !hideIcon ? (
                <itemConfig.icon />
              ) : (
                <div
                  className="h-2 w-2 shrink-0 rounded-[2px]"
                  style={{
                    backgroundColor: item.color,
                  }}
                />
              )}
              {itemConfig?.label}
            </div>
          );
        })}
    </div>
  );
};

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
};
