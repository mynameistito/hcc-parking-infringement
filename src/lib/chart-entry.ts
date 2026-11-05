export interface ChartEntry {
  fill: string;
  label: string;
  value: number;
}

/** Validate the fill, label, and numeric value required by chart consumers. */
export const isChartEntry = (value: unknown): value is ChartEntry =>
  typeof value === "object" &&
  value !== null &&
  "fill" in value &&
  "label" in value &&
  "value" in value &&
  typeof Reflect.get(value, "fill") === "string" &&
  typeof Reflect.get(value, "label") === "string" &&
  typeof Reflect.get(value, "value") === "number";
