/** Heat colour + line weight for infringement counts on the road map. */

const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const value = hex.replace("#", "");
  return {
    b: Number.parseInt(value.slice(4, 6), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    r: Number.parseInt(value.slice(0, 2), 16),
  };
};

const lerpHex = (from: string, to: string, t: number): string => {
  const a = hexToRgb(from);
  const b = hexToRgb(to);
  const r = Math.round(a.r + (b.r - a.r) * t);
  const g = Math.round(a.g + (b.g - a.g) * t);
  const bl = Math.round(a.b + (b.b - a.b) * t);
  return `rgb(${r}, ${g}, ${bl})`;
};

export const heatColor = (ratio: number): string => {
  const t = Math.max(0, Math.min(1, ratio));
  if (t < 0.5) {
    const u = t / 0.5;
    return lerpHex("#38bdf8", "#fbbf24", u);
  }
  const u = (t - 0.5) / 0.5;
  return lerpHex("#fbbf24", "#ef4444", u);
};

export const heatLineWeight = (ratio: number): number => {
  const t = Math.max(0, Math.min(1, ratio));
  return 3 + t * 7;
};

export const heatLineOpacity = (ratio: number): number => {
  const t = Math.max(0, Math.min(1, ratio));
  return 0.55 + t * 0.4;
};
