import { chartColorAt } from "@/lib/chart-colors";
import { numberFmt } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface PieLegendItem {
  count: number;
  label: string;
}

interface PieLegendProps {
  items: PieLegendItem[];
  className?: string;
  total?: number;
}

export const PieLegend = ({ items, className, total }: PieLegendProps) => {
  const sum = total ?? items.reduce((acc, item) => acc + item.count, 0);

  if (items.length === 0) {
    return null;
  }

  return (
    <ul
      className={cn(
        "max-h-52 space-y-1 overflow-y-auto pr-1 text-xs",
        className
      )}
    >
      {items.map((item, index) => {
        const share = sum > 0 ? (item.count / sum) * 100 : 0;
        return (
          <li
            key={`${item.label}-${index}`}
            className="grid grid-cols-[0.625rem_minmax(0,1fr)_auto_auto] items-center gap-x-2 gap-y-0.5 rounded-[4px] px-1 py-0.5 hover:bg-muted/60"
          >
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: chartColorAt(index) }}
              aria-hidden="true"
            />
            <span className="truncate text-foreground" title={item.label}>
              {item.label}
            </span>
            <span className="font-mono text-muted-foreground tabular-nums">
              {share.toFixed(1)}%
            </span>
            <span className="font-mono text-foreground tabular-nums">
              {numberFmt.format(item.count)}
            </span>
          </li>
        );
      })}
    </ul>
  );
};
