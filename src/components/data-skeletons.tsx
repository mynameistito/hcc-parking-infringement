import type { CSSProperties } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Reserve a labeled statistic while its value loads.
 * @returns The rendered interface for the supplied data.
 */
export const StatPillLoading = ({ label }: { label: string }) => (
  <div className="border-border bg-background min-w-0 rounded-lg border px-3 py-2">
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-muted-foreground text-xs">{label}</span>
      <Skeleton className="h-3 w-11" />
    </div>
    <Skeleton className="mt-0.5 block h-[30px] w-20" />
    <Skeleton className="mt-1.5 h-[40px] w-full" />
  </div>
);

/**
 * Reserve table cells while rows load.
 * @returns The rendered interface for the supplied data.
 */
export const TableRowsSkeleton = ({
  rows = 6,
  cols = 4,
}: {
  rows?: number;
  cols?: number;
}) => (
  <tbody
    className="bg-background"
    aria-busy="true"
    aria-label="Loading table rows"
  >
    {Array.from({ length: rows }, (_, rowIndex) => (
      <tr key={rowIndex} className="border-border/70 border-t">
        {Array.from({ length: cols }, (__, colIndex) => (
          <td key={colIndex} className="px-3 py-2.5">
            <Skeleton
              className={cn(
                "h-4",
                colIndex === cols - 1 ? "ml-auto w-14" : "w-full max-w-[7rem]"
              )}
            />
          </td>
        ))}
      </tr>
    ))}
  </tbody>
);

/**
 * Reserve chart space while its data or code loads.
 * @returns The rendered interface for the supplied data.
 */
export const ChartAreaSkeleton = ({
  rows = 5,
  variant = "bars",
}: {
  rows?: number;
  variant?: "bars" | "donut";
}) => {
  if (variant === "donut") {
    return (
      <section
        className="flex h-40 items-center justify-center"
        aria-busy="true"
        aria-label="Loading chart"
      >
        <Skeleton className="size-36" circular />
      </section>
    );
  }

  const chartStyle: CSSProperties & { "--chart-height": string } = {
    "--chart-height": `${rows * 28 + 8}px`,
  };

  return (
    <section
      className="chart-height flex flex-col justify-center gap-2.5 px-1"
      style={chartStyle}
      aria-busy="true"
      aria-label="Loading chart"
    >
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-3.5 w-full" />
      ))}
    </section>
  );
};
