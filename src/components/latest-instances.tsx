import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { Column, SortingState } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { fetchRecentInfringements } from "@/client/api";
import { TableRowsSkeleton } from "@/components/data-skeletons";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { PublicInfringement } from "@/contracts/public-api";
import { INFRINGEMENTS_DEFAULT_PAGE_SIZE } from "@/lib/dashboard-constants";
import {
  formatOccurrenceInstantShort,
  formatStreetSuburb,
  formatVehicle,
  moneyFmt,
  numberFmt,
} from "@/lib/format";
import { cn } from "@/lib/utils";

interface LatestInstancesProps {
  recentInfringements: PublicInfringement[];
  total?: number;
  isLoading?: boolean;
}

const EMPTY_CELL = "—";
const DEFAULT_SORTING: SortingState = [{ desc: true, id: "occurredAt" }];

const SORT_LABELS: Record<string, string> = {
  fine: "Fine",
  occurredAt: "Date",
  offence: "Offence",
  street: "Street",
  vehicle: "Vehicle",
};

const columnHelper = createColumnHelper<PublicInfringement>();

const sortDescFirst = (columnId: string): boolean =>
  columnId === "occurredAt" || columnId === "fine";

const mergeInfringements = (
  initial: PublicInfringement[],
  extra: PublicInfringement[]
): PublicInfringement[] => {
  const seen = new Set<number>();
  const merged: PublicInfringement[] = [];

  for (const row of [...initial, ...extra]) {
    if (seen.has(row.infringementNumber)) {
      continue;
    }
    seen.add(row.infringementNumber);
    merged.push(row);
  }

  return merged;
};

const SortDirectionIcon = ({ sorted }: { sorted: false | "asc" | "desc" }) => {
  if (sorted === "asc") {
    return <ArrowUp className="size-3 shrink-0" aria-hidden="true" />;
  }

  if (sorted === "desc") {
    return <ArrowDown className="size-3 shrink-0" aria-hidden="true" />;
  }

  return (
    <ArrowUpDown className="size-3 shrink-0 opacity-40" aria-hidden="true" />
  );
};

const SortableHeader = ({
  align = "left",
  column,
  label,
}: {
  align?: "left" | "right";
  column: Column<PublicInfringement>;
  label: string;
}) => {
  const sorted = column.getIsSorted();

  return (
    <button
      type="button"
      className={cn(
        "inline-flex w-full items-center gap-1 font-medium transition-colors hover:text-foreground",
        align === "right" ? "justify-end" : "justify-start"
      )}
      onClick={() => {
        if (sorted === false) {
          column.toggleSorting(sortDescFirst(column.id), false);
          return;
        }
        column.toggleSorting(sorted === "asc", false);
      }}
    >
      <span>{label}</span>
      <SortDirectionIcon sorted={sorted} />
    </button>
  );
};

const getCellClassName = (columnId: string): string => {
  if (columnId === "fine") {
    return "whitespace-nowrap px-3 py-2 text-right font-mono font-semibold tabular-nums";
  }
  if (columnId === "occurredAt") {
    return "whitespace-nowrap px-3 py-2 text-muted-foreground";
  }
  if (columnId === "offence") {
    return "min-w-[16rem] px-3 py-2 text-muted-foreground whitespace-normal leading-snug";
  }
  return "px-3 py-2 text-muted-foreground";
};

const getAriaSort = (
  column: Column<PublicInfringement>
): "ascending" | "descending" | "none" => {
  const sorted = column.getIsSorted();
  if (sorted === "asc") {
    return "ascending";
  }
  if (sorted === "desc") {
    return "descending";
  }
  return "none";
};

const columns = [
  columnHelper.accessor("occurredAt", {
    cell: (info) => (
      <time className="font-mono tabular-nums" dateTime={info.getValue()}>
        {formatOccurrenceInstantShort(info.getValue())}
      </time>
    ),
    header: ({ column }) => <SortableHeader column={column} label="Date" />,
    sortingFn: "datetime",
  }),
  columnHelper.accessor((row) => formatVehicle(row), {
    cell: (info) => info.getValue(),
    header: ({ column }) => <SortableHeader column={column} label="Vehicle" />,
    id: "vehicle",
    sortingFn: "alphanumeric",
  }),
  columnHelper.accessor(
    (row) => formatStreetSuburb(row.street, row.suburb ?? undefined),
    {
      cell: (info) => {
        const label = info.getValue();
        return label.length > 0 ? label : EMPTY_CELL;
      },
      header: ({ column }) => <SortableHeader column={column} label="Street" />,
      id: "street",
      sortingFn: "alphanumeric",
    }
  ),
  columnHelper.accessor("offenceDescription", {
    cell: (info) => {
      const offence = info.getValue();
      const { isTowed } = info.row.original;

      return (
        <div className="space-y-1">
          <p>{offence}</p>
          {isTowed ? (
            <Badge variant="destructive" className="text-[0.6rem]">
              Towed
            </Badge>
          ) : null}
        </div>
      );
    },
    header: ({ column }) => <SortableHeader column={column} label="Offence" />,
    id: "offence",
    sortingFn: "alphanumeric",
  }),
  columnHelper.accessor("amountCents", {
    cell: (info) => moneyFmt.format(info.getValue() / 100),
    header: ({ column }) => (
      <SortableHeader align="right" column={column} label="Fine" />
    ),
    id: "fine",
    sortingFn: "basic",
  }),
];

const formatSortSummary = (sorting: SortingState): string => {
  const [active] = sorting;
  if (active === undefined) {
    return "Newest first";
  }

  const label = SORT_LABELS[active.id] ?? active.id;

  if (active.id === "occurredAt") {
    return active.desc ? "Newest first" : "Oldest first";
  }

  if (active.id === "fine") {
    return active.desc ? "Highest fine first" : "Lowest fine first";
  }

  return active.desc ? `${label} Z–A` : `${label} A–Z`;
};

const MobileRowsSkeleton = () => (
  <div className="grid gap-2 md:hidden" aria-label="Loading ticket cards">
    {Array.from({ length: 4 }, (_, index) => (
      <div
        className="rounded-[6px] border border-border bg-background p-3"
        key={index}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-full max-w-[13rem]" />
            <Skeleton className="h-3 w-full max-w-[9rem]" />
          </div>
          <Skeleton className="h-4 w-14" />
        </div>
        <Skeleton className="mt-3 h-3 w-full" />
      </div>
    ))}
  </div>
);

const MobileInfringementCard = ({
  infringement,
}: {
  infringement: PublicInfringement;
}) => {
  const location = formatStreetSuburb(
    infringement.street,
    infringement.suburb ?? undefined
  );

  return (
    <article className="rounded-[6px] border border-border bg-background p-3 text-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <time
            className="font-mono text-muted-foreground tabular-nums"
            dateTime={infringement.occurredAt}
          >
            {formatOccurrenceInstantShort(infringement.occurredAt)}
          </time>
          <p className="mt-1 break-words font-medium text-foreground">
            {location.length > 0 ? location : EMPTY_CELL}
          </p>
        </div>
        <strong className="shrink-0 font-mono font-semibold text-foreground tabular-nums">
          {moneyFmt.format(infringement.amountCents / 100)}
        </strong>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-muted-foreground">
        <span>{formatVehicle(infringement)}</span>
        {infringement.isTowed ? (
          <Badge variant="destructive" className="text-[0.6rem]">
            Towed
          </Badge>
        ) : null}
      </div>
      <p className="mt-2 break-words leading-snug text-muted-foreground">
        {infringement.offenceDescription}
      </p>
    </article>
  );
};

const getNextInfringementsPage = (loadedCount: number): number =>
  loadedCount < INFRINGEMENTS_DEFAULT_PAGE_SIZE
    ? 1
    : Math.floor(loadedCount / INFRINGEMENTS_DEFAULT_PAGE_SIZE) + 1;

export const LatestInstances = ({
  recentInfringements,
  total,
  isLoading,
}: LatestInstancesProps) => {
  const [sorting, setSorting] = useState<SortingState>(DEFAULT_SORTING);
  const [extraRows, setExtraRows] = useState<PublicInfringement[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const initialSignatureRef = useRef("");

  const totalCount = total ?? recentInfringements.length;
  const rows = useMemo(
    () => mergeInfringements(recentInfringements, extraRows),
    [extraRows, recentInfringements]
  );
  const hasMore = rows.length < totalCount;

  useEffect(() => {
    const signature = recentInfringements
      .map((row) => row.infringementNumber)
      .join(",");
    if (signature === initialSignatureRef.current) {
      return;
    }
    initialSignatureRef.current = signature;
    setExtraRows([]);
  }, [recentInfringements]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) {
      return;
    }

    setLoadingMore(true);
    try {
      const nextPage = getNextInfringementsPage(rows.length);
      const result = await fetchRecentInfringements({
        limit: INFRINGEMENTS_DEFAULT_PAGE_SIZE,
        page: nextPage,
      });
      if (result.data.length === 0) {
        return;
      }
      setExtraRows((current) => [...current, ...result.data]);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, rows.length]);

  useEffect(() => {
    const root = scrollRef.current;
    if (root === null || isLoading === true || loadingMore || !hasMore) {
      return;
    }

    if (root.getClientRects().length === 0) {
      return;
    }

    if (root.scrollHeight <= root.clientHeight + 8) {
      void loadMore();
    }
  }, [hasMore, isLoading, loadMore, loadingMore, rows.length]);

  useEffect(() => {
    const root = scrollRef.current;
    const sentinel = sentinelRef.current;
    let observer: IntersectionObserver | undefined;

    if (
      root !== null &&
      sentinel !== null &&
      hasMore &&
      isLoading !== true &&
      root.getClientRects().length > 0
    ) {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            void loadMore();
          }
        },
        { root, rootMargin: "240px" }
      );
      observer.observe(sentinel);
    }

    return () => {
      observer?.disconnect();
    };
  }, [hasMore, isLoading, loadMore]);

  const table = useReactTable({
    columns,
    data: rows,
    enableSortingRemoval: false,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
  });

  const rowCountLabel = useMemo(() => {
    if (rows.length === 0) {
      return "No rows yet";
    }
    if (totalCount > rows.length) {
      return `${numberFmt.format(rows.length)} of ${numberFmt.format(totalCount)} loaded`;
    }
    return `${numberFmt.format(rows.length)} shown`;
  }, [rows.length, totalCount]);

  const sortSummary = useMemo(() => formatSortSummary(sorting), [sorting]);

  return (
    <Card
      className="min-w-0 overflow-visible bg-card"
      aria-label="Latest parking infringements"
    >
      <CardContent className="p-4 sm:p-5 lg:p-6">
        <div className="mb-3 flex items-start justify-between gap-3 sm:items-center">
          <h2 className="text-sm font-semibold text-primary">
            Latest recorded tickets
          </h2>
          <span className="text-right text-xs text-muted-foreground">
            {sortSummary} · {rowCountLabel}
          </span>
        </div>

        {isLoading === true ? (
          <MobileRowsSkeleton />
        ) : (
          <div className="grid gap-2 md:hidden">
            {table.getRowModel().rows.length === 0 ? (
              <div className="rounded-[6px] border border-border bg-background px-3 py-6 text-center text-xs text-muted-foreground">
                Waiting for infringement rows...
              </div>
            ) : (
              table
                .getRowModel()
                .rows.map((row) => (
                  <MobileInfringementCard
                    infringement={row.original}
                    key={row.original.infringementNumber}
                  />
                ))
            )}
            {hasMore ? (
              <button
                className="inline-flex min-h-10 items-center justify-center rounded-[6px] border border-border bg-background px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                disabled={loadingMore}
                onClick={() => {
                  void loadMore();
                }}
                type="button"
              >
                {loadingMore ? "Loading more tickets..." : "Load more tickets"}
              </button>
            ) : null}
          </div>
        )}

        <div
          ref={scrollRef}
          className="hidden h-[70vh] min-h-64 overflow-x-auto overflow-y-auto overscroll-y-contain rounded-[6px] border border-border md:block"
        >
          <table className="w-full min-w-[56rem] border-collapse text-left text-xs">
            <colgroup>
              <col className="w-[7.5rem]" />
              <col className="w-[8.5rem]" />
              <col className="w-[11rem]" />
              <col />
              <col className="w-[5rem]" />
            </colgroup>
            <thead className="sticky top-0 z-10 bg-muted text-muted-foreground shadow-[0_1px_0_0_var(--border)]">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      aria-sort={getAriaSort(header.column)}
                      className={
                        header.column.id === "fine"
                          ? "px-3 py-2 text-right"
                          : "px-3 py-2"
                      }
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            {isLoading === true ? (
              <TableRowsSkeleton cols={columns.length} />
            ) : (
              <tbody className="bg-background">
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td
                      className="px-3 py-6 text-center text-muted-foreground"
                      colSpan={columns.length}
                    >
                      Waiting for infringement rows...
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.original.infringementNumber}
                      className="border-t border-border/70"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className={getCellClassName(cell.column.id)}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            )}
          </table>
          {hasMore ? (
            <div
              ref={sentinelRef}
              className="flex items-center justify-center gap-2 border-t border-border/70 px-3 py-3 text-xs text-muted-foreground"
            >
              {loadingMore ? (
                <>
                  <Loader2
                    className="size-3.5 animate-spin"
                    aria-hidden="true"
                  />
                  Loading more tickets...
                </>
              ) : (
                "Scroll for more tickets"
              )}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
};
