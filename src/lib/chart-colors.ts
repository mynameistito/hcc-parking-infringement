/** Theme-aligned chart palette with enough hues for full breakdown legends. */
const CHART_PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "#5b8def",
  "#e85d75",
  "#e8c77b",
  "#2ec4b6",
  "#f4a261",
  "#7c9082",
  "#bc6c25",
] as const;

/**
 * Selects a chart color, cycling through the palette for larger indices.
 * @param index - The palette index.
 * @returns The selected color, or the first color when the index is invalid.
 */
export const chartColorAt = (index: number): string =>
  CHART_PALETTE[index % CHART_PALETTE.length] ?? CHART_PALETTE[0];
