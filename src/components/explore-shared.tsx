import { Car } from "lucide-react";
import { useEffect, useState } from "react";

import { InfringementCardsSkeleton } from "@/components/data-skeletons";
import { EmptyState } from "@/components/shared/empty-state";
import { RankedListRow } from "@/components/shared/ranked-list-row";
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
import { Skeleton } from "@/components/ui/skeleton";
import type { BrowseSort, PublicInfringement } from "@/contracts/public-api";
import {
  formatOccurrenceInstant,
  formatStreetSuburb,
  formatVehicle,
  moneyFmt,
  numberFmt,
} from "@/lib/format";

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
    return <InfringementCardsSkeleton />;
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
                  {formatStreetSuburb(
                    record.street,
                    record.suburb ?? undefined
                  )}
                </p>
                <p className="text-xs leading-relaxed">
                  {record.offenceDescription}
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs text-muted-foreground">
                  <time dateTime={record.occurredAt}>
                    {formatOccurrenceInstant(record.occurredAt)}
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
    if (loading) {
      return <Skeleton className="mx-4 my-3 h-9 w-[calc(100%-2rem)]" />;
    }

    return (
      <Button
        type="button"
        variant="outline"
        className="mx-4 my-3 w-[calc(100%-2rem)] border-dashed"
        onClick={onClick}
      >
        Load More
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
  <RankedListRow
    rank={rank}
    label={label}
    subtitle={subtitle}
    count={count}
    onClick={onClick}
    className={className}
  />
);

export { EmptyState };
