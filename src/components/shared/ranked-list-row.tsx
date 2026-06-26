import { ChevronRight } from "lucide-react";

import { numberFmt } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface RankedListRowProps {
  rank?: number;
  label: string;
  subtitle?: string;
  count: number;
  onClick?: () => void;
  selected?: boolean;
  showBar?: boolean;
  barWidth?: string;
  className?: string;
  countClassName?: string;
}

/** Reusable ranked row: rank, label, optional subtitle/bar, count, optional chevron. */
export const RankedListRow = ({
  rank,
  label,
  subtitle,
  count,
  onClick,
  selected,
  showBar = false,
  barWidth,
  className,
  countClassName,
}: RankedListRowProps) => {
  const interactive = onClick !== undefined;
  const gridCols = interactive
    ? "grid-cols-[1.5rem_minmax(0,1fr)_auto_auto]"
    : "grid-cols-[2rem_minmax(0,1fr)_auto]";

  const inner = (
    <>
      {rank === undefined ? (
        <span />
      ) : (
        <span className="font-mono text-xs font-semibold text-muted-foreground tabular-nums">
          {String(rank).padStart(2, "0")}
        </span>
      )}
      <span className="min-w-0">
        <span
          className={cn(
            "block truncate text-sm",
            interactive ? "font-medium" : "font-medium"
          )}
          title={label}
        >
          {label}
        </span>
        {subtitle !== undefined && subtitle.length > 0 ? (
          <span className="block truncate text-xs text-muted-foreground">
            {subtitle}
          </span>
        ) : null}
        {showBar && barWidth !== undefined ? (
          <span className="mt-2 block h-1 overflow-hidden rounded-full bg-muted">
            <span
              className="block h-full rounded-full bg-[var(--ring)]"
              style={{ width: barWidth }}
            />
          </span>
        ) : null}
      </span>
      <span
        className={cn(
          "font-mono text-xs font-semibold tabular-nums",
          countClassName
        )}
      >
        {numberFmt.format(count)}
      </span>
      {interactive ? (
        <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
      ) : null}
    </>
  );

  if (interactive) {
    return (
      <button
        type="button"
        className={cn(
          "grid w-full items-center gap-2 border-t border-border/50 px-4 py-2.5 text-left transition-colors hover:bg-muted/40",
          "focus-visible:shadow-[inset_0_0_0_2px_var(--ring)] focus-visible:outline-none",
          selected === true && "bg-muted",
          gridCols,
          className
        )}
        data-selected={selected === true}
        onClick={onClick}
      >
        {inner}
      </button>
    );
  }

  return (
    <div
      className={cn(
        "grid items-center gap-2 border-t border-border/70 px-4 py-3 first:border-t-0",
        gridCols,
        className
      )}
    >
      {inner}
    </div>
  );
};
