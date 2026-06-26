import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { Column, SortingState } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useMemo, useState } from "react";

import { TableRowsSkeleton } from "@/components/data-skeletons";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { PublicInfringement } from "@/contracts/public-api";
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

export const LatestInstances = ({
  recentInfringements,
  isLoading,
}: LatestInstancesProps) => {
  const [sorting, setSorting] = useState<SortingState>(DEFAULT_SORTING);

  const table = useReactTable({
    columns,
    data: recentInfringements,
    enableSortingRemoval: false,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
  });

  const rowCountLabel = useMemo(() => {
    if (recentInfringements.length === 0) {
      return "No rows yet";
    }
    return `${numberFmt.format(recentInfringements.length)} shown`;
  }, [recentInfringements.length]);

  const sortSummary = useMemo(() => formatSortSummary(sorting), [sorting]);

  return (
    <Card className="bg-card" aria-label="Latest parking infringements">
      <CardContent className="p-4 sm:p-5 lg:p-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-primary">
            Latest Instances
          </h2>
          <span className="text-xs text-muted-foreground">
            {sortSummary} · {rowCountLabel}
          </span>
        </div>
        <div className="max-h-[min(28rem,60vh)] overflow-auto rounded-[6px] border border-border">
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
        </div>
      </CardContent>
    </Card>
  );
};
