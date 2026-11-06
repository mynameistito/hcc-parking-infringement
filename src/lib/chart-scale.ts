/**
 * Rounds a positive chart maximum up to a 1, 2, 5, or 10 scale step.
 * @param value - The maximum value to cover.
 * @returns A rounded ceiling, or 10 for nonpositive values.
 */
export const niceCeil = (value: number): number => {
  if (value <= 0) {
    return 10;
  }

  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  let nice = 10;

  if (normalized <= 1) {
    nice = 1;
  } else if (normalized <= 2) {
    nice = 2;
  } else if (normalized <= 5) {
    nice = 5;
  }

  return nice * magnitude;
};

/**
 * Builds evenly spaced rounded tick values from zero to a chart ceiling.
 * @param max - The maximum value to cover.
 * @param tickCount - The number of intervals between ticks.
 * @returns The rounded tick values, beginning at zero.
 */
export const buildYTicks = (max: number, tickCount = 4): number[] => {
  const ceiling = niceCeil(max);
  const step = ceiling / tickCount;

  return Array.from({ length: tickCount + 1 }, (_, index) =>
    Math.round(step * index)
  );
};

/**
 * Formats a chart tick as a number or compact dollar value.
 * @param value - The tick value.
 * @param style - The desired number or currency format.
 * @returns The formatted tick label.
 */
export const formatYTick = (value: number, style: "number" | "currency") => {
  if (style === "currency") {
    if (value >= 1000) {
      return `$${Math.round(value / 1000)}k`;
    }

    return `$${value}`;
  }

  return String(value);
};
