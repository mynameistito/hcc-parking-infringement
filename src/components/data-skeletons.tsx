import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const StatPillLoading = ({ label }: { label: string }) => (
  <div className="min-w-0 rounded-[6px] border border-border bg-background px-3 py-2">
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <Skeleton className="h-3 w-11" />
    </div>
    <Skeleton className="mt-0.5 block h-[30px] w-20" />
    <Skeleton className="mt-1.5 h-[40px] w-full" />
  </div>
);

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
      <tr key={rowIndex} className="border-t border-border/70">
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

export const ChartAreaSkeleton = ({
  rows = 5,
  variant = "bars",
}: {
  rows?: number;
  variant?: "bars" | "donut";
}) => {
  if (variant === "donut") {
    return (
      <div
        className="flex h-40 items-center justify-center"
        aria-busy="true"
        aria-label="Loading chart"
      >
        <Skeleton className="size-36 rounded-full" />
      </div>
    );
  }

  return (
    <div
      className="flex flex-col justify-center gap-2.5 px-1"
      style={{ height: rows * 28 + 8 }}
      aria-busy="true"
      aria-label="Loading chart"
    >
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-3.5 w-full rounded" />
      ))}
    </div>
  );
};
