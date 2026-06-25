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

export const buildYTicks = (max: number, tickCount = 4): number[] => {
  const ceiling = niceCeil(max);
  const step = ceiling / tickCount;
  return Array.from({ length: tickCount + 1 }, (_, index) =>
    Math.round(step * index)
  );
};

const compactFmt = new Intl.NumberFormat("en-NZ", {
  maximumFractionDigits: 2,
  notation: "compact",
});

export const formatChartValue = (
  value: number,
  style: "number" | "currency"
) => {
  if (style === "currency") {
    if (value >= 1000) {
      return `$${compactFmt.format(value).toLowerCase()}`;
    }
    return new Intl.NumberFormat("en-NZ", {
      currency: "NZD",
      maximumFractionDigits: 0,
      style: "currency",
    }).format(value);
  }

  if (value >= 1000) {
    return compactFmt.format(value).toLowerCase();
  }
  return String(Math.round(value));
};

export const formatYTick = (value: number, style: "number" | "currency") => {
  if (style === "currency") {
    if (value >= 1000) {
      return `$${Math.round(value / 1000)}k`;
    }
    return `$${value}`;
  }
  return String(value);
};
