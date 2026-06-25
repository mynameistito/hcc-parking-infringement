import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const LoadingStatus = ({ label }: { label: string }) => (
  <span className="sr-only">{label}</span>
);

export const StatPillSkeleton = () => (
  <div className="rounded-[6px] border border-border bg-background px-3 py-3">
    <Skeleton className="h-6 w-16" />
    <Skeleton className="mt-2 h-3 w-20" />
  </div>
);

export const LiveTickerSkeleton = () => (
  <Card
    className="bg-card"
    aria-busy="true"
    aria-label="Loading all-time parking infringement total"
  >
    <CardContent className="p-0">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="flex min-h-[260px] flex-col justify-between p-5 sm:p-6 lg:p-8">
          <Skeleton className="h-4 w-40" />
          <div className="space-y-3">
            <Skeleton className="h-16 w-48 sm:h-20 sm:w-64" />
            <Skeleton className="h-4 w-full max-w-md" />
          </div>
          <Skeleton className="mt-5 h-10 w-56 rounded-[6px]" />
        </section>
        <aside className="border-t border-border bg-muted p-4 sm:p-5 lg:border-t-0 lg:border-l">
          <div className="mb-3 flex items-center justify-between gap-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
          <div className="flex flex-col gap-2">
            {Array.from({ length: 6 }, (_, index) => (
              <StatPillSkeleton key={index} />
            ))}
          </div>
        </aside>
      </div>
    </CardContent>
  </Card>
);

export const TopListSkeleton = ({
  rows = 5,
  className,
}: {
  rows?: number;
  className?: string;
}) => (
  <ol
    className={cn("p-0", className)}
    aria-busy="true"
    aria-label="Loading list"
  >
    <LoadingStatus label="Loading list" />
    {Array.from({ length: rows }, (_, index) => (
      <li
        key={index}
        className="border-t border-border/70 px-4 py-3 first:border-t-0"
      >
        <div className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-2">
          <Skeleton className="h-4 w-5" />
          <Skeleton className="h-4 w-full max-w-[12rem]" />
          <Skeleton className="h-4 w-10" />
        </div>
        <Skeleton className="mt-2 h-1 w-full rounded-full" />
      </li>
    ))}
  </ol>
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
    <LoadingStatus label="Loading table rows" />
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

export const ExploreListSkeleton = ({ rows = 8 }: { rows?: number }) => (
  <ol
    className="max-h-[440px] overflow-hidden"
    aria-busy="true"
    aria-label="Loading explore list"
  >
    <LoadingStatus label="Loading explore list" />
    {Array.from({ length: rows }, (_, index) => (
      <li
        key={index}
        className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 border-t border-border/70 px-4 py-3 first:border-t-0"
      >
        <Skeleton className="h-4 w-5" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full max-w-[10rem]" />
          <Skeleton className="h-3 w-full max-w-[7rem]" />
          <Skeleton className="h-1 w-full rounded-full" />
        </div>
        <Skeleton className="h-4 w-10" />
      </li>
    ))}
  </ol>
);

export const InfringementCardSkeleton = () => (
  <Card size="sm" className="py-0">
    <CardContent className="grid grid-cols-[2rem_1fr] gap-3 py-3">
      <Skeleton className="size-8 rounded-[6px]" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-full max-w-[14rem]" />
        <Skeleton className="h-3 w-full max-w-[18rem]" />
        <div className="flex gap-2 pt-0.5">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export const InfringementCardsSkeleton = ({
  count = 4,
}: {
  count?: number;
}) => (
  <ul className="space-y-2" aria-busy="true" aria-label="Loading tickets">
    <LoadingStatus label="Loading tickets" />
    {Array.from({ length: count }, (_, index) => (
      <li key={index}>
        <InfringementCardSkeleton />
      </li>
    ))}
  </ul>
);

export const MapAreaSkeleton = ({ className }: { className?: string }) => (
  <div
    className={cn("relative bg-muted", className)}
    aria-busy="true"
    aria-label="Loading map"
  >
    <LoadingStatus label="Loading map" />
    <Skeleton className="absolute inset-0 rounded-none" />
  </div>
);

export const InspectorSkeleton = () => (
  <aside
    className="bg-muted p-4"
    aria-busy="true"
    aria-label="Loading inspector"
  >
    <LoadingStatus label="Loading inspector" />
    <div className="flex items-center justify-between gap-3">
      <Skeleton className="h-5 w-16 rounded-full" />
      <Skeleton className="h-3 w-14" />
    </div>
    <Skeleton className="mt-4 h-7 w-3/4" />
    <Skeleton className="mt-2 h-4 w-1/2" />
    <div className="mt-5 grid grid-cols-2 gap-2">
      <Skeleton className="h-[4.5rem] rounded-[6px]" />
      <Skeleton className="h-[4.5rem] rounded-[6px]" />
    </div>
    <Skeleton className="mt-5 h-20 rounded-[6px]" />
    <Skeleton className="mt-4 h-4 w-full" />
    <Skeleton className="mt-2 h-4 w-5/6" />
  </aside>
);
