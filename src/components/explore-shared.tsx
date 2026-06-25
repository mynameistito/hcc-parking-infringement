import { format } from "date-fns";
import { Car, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import type { BrowseSort, PublicInfringement } from "../client/api";
import { formatVehicle, moneyFmt, numberFmt } from "./explore-utils";

export const useDebouncedValue = <T,>(value: T, delay = 300): T => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setDebounced(value);
    }, delay);
    return () => {
      window.clearTimeout(id);
    };
  }, [value, delay]);

  return debounced;
};

export const InfringementCards = ({
  records,
  loading,
  emptyLabel,
}: {
  records: PublicInfringement[];
  loading?: boolean;
  emptyLabel: string;
}) => {
  if (loading === true) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Loading tickets...
      </p>
    );
  }

  if (records.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {records.map((record) => (
        <li key={record.infringementNumber}>
          <Card size="sm" className="py-0">
            <CardContent className="grid grid-cols-[2rem_1fr] gap-3 py-3">
              <span className="flex size-8 items-center justify-center rounded-[6px] border border-border bg-muted">
                <Car className="size-4 text-muted-foreground" aria-hidden />
              </span>
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-semibold">{formatVehicle(record)}</p>
                {record.vehicleColour !== null &&
                record.vehicleColour.length > 0 ? (
                  <p className="text-xs text-muted-foreground capitalize">
                    {record.vehicleColour}
                  </p>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  {record.street}
                  {record.suburb !== null && record.suburb.length > 0
                    ? `, ${record.suburb}`
                    : ""}
                </p>
                <p className="text-xs leading-relaxed">
                  {record.offenceDescription}
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs text-muted-foreground">
                  <time dateTime={record.occurredAt}>
                    {format(new Date(record.occurredAt), "d MMM yyyy")}
                  </time>
                  <span className="font-mono font-semibold text-foreground">
                    {moneyFmt.format(record.amountCents / 100)}
                  </span>
                  {record.isTowed ? (
                    <Badge variant="destructive" className="text-[0.6rem]">
                      Towed
                    </Badge>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
};

const isBrowseSort = (value: string | null): value is BrowseSort =>
  value === "count" || value === "name";

export const BrowseControls = ({
  search,
  onSearchChange,
  sort,
  onSortChange,
  placeholder,
  total,
  shown,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  sort: BrowseSort;
  onSortChange: (value: BrowseSort) => void;
  placeholder: string;
  total?: number;
  shown: number;
}) => (
  <div className="sticky top-0 z-10 space-y-2 border-b border-border bg-popover px-4 py-3">
    <Input
      type="search"
      value={search}
      onChange={(event) => {
        onSearchChange(event.target.value);
      }}
      placeholder={placeholder}
      aria-label={placeholder}
    />
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Sort</span>
        <Select
          value={sort}
          onValueChange={(value) => {
            if (isBrowseSort(value)) {
              onSortChange(value);
            }
          }}
        >
          <SelectTrigger size="sm" className="h-7 w-[9rem] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="count">Most tickets</SelectItem>
            <SelectItem value="name">A-Z</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {total === undefined ? null : (
        <p className="text-xs text-muted-foreground">
          Showing {numberFmt.format(shown)} of {numberFmt.format(total)}
        </p>
      )}
    </div>
  </div>
);

export const LoadMore = ({
  hasMore,
  loading,
  onClick,
}: {
  hasMore: boolean;
  loading: boolean;
  onClick: () => void;
}) => {
  if (hasMore) {
    return (
      <Button
        type="button"
        variant="outline"
        className="mx-4 my-3 w-[calc(100%-2rem)] border-dashed"
        onClick={onClick}
        disabled={loading}
      >
        {loading ? "Loading..." : "Load More"}
      </Button>
    );
  }

  return null;
};

export const ExploreListRow = ({
  rank,
  label,
  subtitle,
  count,
  onClick,
  className,
}: {
  rank?: number;
  label: string;
  subtitle?: string;
  count: number;
  onClick: () => void;
  className?: string;
}) => (
  <button
    type="button"
    className={cn(
      "grid w-full grid-cols-[1.5rem_minmax(0,1fr)_auto_auto] items-center gap-2 border-t border-border/50 px-4 py-2.5 text-left transition-colors hover:bg-muted/40",
      "focus-visible:shadow-[inset_0_0_0_2px_var(--ring)] focus-visible:outline-none",
      className
    )}
    onClick={onClick}
  >
    {rank === undefined ? (
      <span />
    ) : (
      <span className="font-mono text-xs font-semibold text-muted-foreground tabular-nums">
        {String(rank).padStart(2, "0")}
      </span>
    )}
    <span className="min-w-0">
      <span className="block truncate text-sm" title={label}>
        {label}
      </span>
      {subtitle !== undefined && subtitle.length > 0 ? (
        <span className="block truncate text-xs text-muted-foreground">
          {subtitle}
        </span>
      ) : null}
    </span>
    <span className="font-mono text-xs font-semibold tabular-nums">
      {numberFmt.format(count)}
    </span>
    <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
  </button>
);
