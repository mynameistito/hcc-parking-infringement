import { z } from "zod";

const chartEntrySchema = z.object({
  fill: z.string(),
  label: z.string(),
  value: z.number(),
});

/**
 * A labeled numeric chart value and its display color.
 */
export interface ChartEntry {
  fill: string;
  label: string;
  value: number;
}

/**
 *  Validate the fill, label, and numeric value required by chart consumers.
 * @param value - Value to inspect or format.
 * @returns The resulting `value is ChartEntry` value.
 */
export const isChartEntry = (value: unknown): value is ChartEntry =>
  chartEntrySchema.safeParse(value).success;
