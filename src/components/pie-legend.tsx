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
    // oxlint-disable jsx-a11y/no-noninteractive-tabindex, jsx-a11y/prefer-tag-over-role -- This named group is scrollable content, not form controls; keyboard users need focus to scroll it.
    <div
      role="group"
      aria-label="Chart legend"
      tabIndex={0}
      className={cn(
        "focus-visible:outline-ring max-h-52 overflow-y-auto pr-1 text-xs focus-visible:outline-2",
        className
      )}
    >
      {/* oxlint-enable jsx-a11y/no-noninteractive-tabindex, jsx-a11y/prefer-tag-over-role */}
      <ul className="flex flex-col gap-1">
        {items.map((item, index) => {
          const share = sum > 0 ? (item.count / sum) * 100 : 0;

          return (
            <li
              key={`${item.label}-${index}`}
              className="hover:bg-muted/60 grid grid-cols-[0.625rem_minmax(0,1fr)_auto_auto] items-center gap-x-2 gap-y-0.5 rounded-[4px] px-1 py-0.5"
            >
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: chartColorAt(index) }}
                aria-hidden="true"
              />
              <span className="text-foreground min-w-0 break-words">
                {item.label}
              </span>
              <span className="text-muted-foreground font-mono tabular-nums">
                {share.toFixed(1)}%
              </span>
              <span className="text-foreground font-mono tabular-nums">
                {numberFmt.format(item.count)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
