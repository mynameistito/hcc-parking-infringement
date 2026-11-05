export interface ChartEntry {
  fill: string;
  label: string;
  value: number;
}

/** Check whether a chart payload has a label and numeric value. */
export const isChartEntry = (value: unknown): value is ChartEntry =>
  typeof value === "object" &&
  value !== null &&
  "label" in value &&
  "value" in value &&
  typeof Reflect.get(value, "label") === "string" &&
  typeof Reflect.get(value, "value") === "number";
