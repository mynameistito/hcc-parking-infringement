import { Car, MapPinned, Search, SignalHigh } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type { LocationRankItem, VehicleRankItem } from "../client/api";
import { ExploreListSkeleton, InspectorSkeleton } from "./data-skeletons";
import { formatLocationSubtitle, numberFmt } from "./explore-utils";
import type { ExploreTab } from "./explore-utils";

const TABS = ["suburbs", "streets", "vehicles"] as const;

type ExploreItem = LocationRankItem | VehicleRankItem;

const isExploreTab = (value: string): value is ExploreTab =>
  TABS.some((tab) => tab === value);

interface SelectedItem {
  item: ExploreItem;
  rank: number;
  tab: ExploreTab;
}

interface ExplorePanelProps {
  suburbs: LocationRankItem[];
  streets: LocationRankItem[];
  vehicles: VehicleRankItem[];
  isLoading?: boolean;
}

const isVehicleRankItem = (item: ExploreItem): item is VehicleRankItem =>
  "make" in item && "model" in item;

const getItemLabel = (item: ExploreItem): string => {
  if (isVehicleRankItem(item)) {
    return item.label;
  }
  return item.street !== undefined && item.street.length > 0
    ? item.street
    : item.label;
};

const getItemSubtitle = (item: ExploreItem): string | undefined => {
  if (isVehicleRankItem(item)) {
    return `${item.make} / ${item.model || "Unknown model"}`;
  }
  return formatLocationSubtitle(item.suburb);
};

const getItemKey = (item: ExploreItem, tab: ExploreTab): string => {
  if (isVehicleRankItem(item)) {
    return `${tab}-${item.make}-${item.model}`;
  }
  const street = item.street ?? item.label;
  const suburb = item.suburb ?? "";
  return `${tab}-${street}-${suburb}`;
};

const getTabIcon = (tab: ExploreTab) => {
  if (tab === "vehicles") {
    return <Car aria-hidden="true" />;
  }
  return <MapPinned aria-hidden="true" />;
};

const matchesSearch = (item: ExploreItem, search: string): boolean => {
  if (search.length === 0) {
    return true;
  }
  const haystack = [
    getItemLabel(item),
    getItemSubtitle(item),
    isVehicleRankItem(item) ? item.make : item.suburb,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(search.toLowerCase());
};

const EmptyWorkbench = ({ label }: { label: string }) => (
  <div className="grid min-h-56 place-items-center border-t border-border px-4 py-8 text-center">
    <div>
      <p className="text-sm font-medium text-foreground">No rows yet</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  </div>
);

const Inspector = ({
  selected,
  maxCount,
}: {
  selected: SelectedItem | null;
  maxCount: number;
}) => {
  if (selected === null) {
    return (
      <aside className="flex min-h-full flex-col justify-between bg-muted p-4">
        <div>
          <Badge variant="outline" className="bg-background">
            Inspector
          </Badge>
          <h3 className="mt-4 text-base font-semibold text-foreground">
            Select a row
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Pick a suburb, street, or vehicle to pin it here while the rest of
            the dashboard stays visible.
          </p>
        </div>
        <div className="mt-6 rounded-[6px] border border-border bg-background p-3">
          <p className="text-xs font-medium text-muted-foreground uppercase">
            Workbench Mode
          </p>
          <p className="mt-2 text-sm text-foreground">
            Inline drill-down keeps context on the same screen.
          </p>
        </div>
      </aside>
    );
  }

  const label = getItemLabel(selected.item);
  const subtitle = getItemSubtitle(selected.item);
  const share = Math.round((selected.item.count / Math.max(maxCount, 1)) * 100);

  return (
    <aside className="bg-muted p-4">
      <div className="flex items-center justify-between gap-3">
        <Badge variant="outline" className="bg-background capitalize">
          {selected.tab}
        </Badge>
        <span className="font-mono text-xs text-muted-foreground tabular-nums">
          Rank {String(selected.rank).padStart(2, "0")}
        </span>
      </div>
      <h3 className="mt-4 text-xl font-semibold tracking-[-0.03em] text-foreground">
        {label}
      </h3>
      {subtitle === undefined ? null : (
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      )}

      <div className="mt-5 grid grid-cols-2 gap-2">
        <div className="rounded-[6px] border border-border bg-background p-3">
          <p className="text-xs text-muted-foreground">Tickets</p>
          <p className="mt-1 font-mono text-xl font-semibold tabular-nums">
            {numberFmt.format(selected.item.count)}
          </p>
        </div>
        <div className="rounded-[6px] border border-border bg-background p-3">
          <p className="text-xs text-muted-foreground">Peak Share</p>
          <p className="mt-1 font-mono text-xl font-semibold tabular-nums">
            {share}%
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-[6px] border border-border bg-background p-3">
        <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase">
          <SignalHigh
            className="size-4 text-[var(--ring)]"
            aria-hidden="true"
          />
          Relative Volume
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <span
            className="block h-full rounded-full bg-[var(--ring)]"
            style={{ width: `${Math.max(share, 4)}%` }}
          />
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-muted-foreground">
        This item is pinned for comparison while you scan the ranking table and
        hotspot map.
      </p>
    </aside>
  );
};

const ExploreListBody = ({
  isLoading,
  visibleItems,
  activeTab,
  maxCount,
  search,
  selected,
  onSelect,
}: {
  isLoading?: boolean;
  visibleItems: ExploreItem[];
  activeTab: ExploreTab;
  maxCount: number;
  search: string;
  selected: SelectedItem | null;
  onSelect: (item: SelectedItem) => void;
}) => {
  if (isLoading === true) {
    return <ExploreListSkeleton />;
  }

  if (visibleItems.length === 0) {
    return (
      <EmptyWorkbench
        label={
          search.length > 0
            ? "No rows match that filter."
            : "Data will appear after the next sync."
        }
      />
    );
  }

  return (
    <ol className="max-h-[440px] overflow-auto">
      {visibleItems.map((item, index) => {
        const rank = index + 1;
        const width = `${Math.max((item.count / maxCount) * 100, 4)}%`;
        const label = getItemLabel(item);
        const subtitle = getItemSubtitle(item);
        const isSelected =
          selected?.tab === activeTab && getItemLabel(selected.item) === label;

        return (
          <li key={getItemKey(item, activeTab)}>
            <button
              type="button"
              className="grid w-full grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 border-t border-border/70 px-4 py-3 text-left transition-colors first:border-t-0 hover:bg-muted focus-visible:shadow-[inset_0_0_0_2px_var(--ring)] focus-visible:outline-none data-[selected=true]:bg-muted"
              data-selected={isSelected}
              onClick={() => {
                onSelect({ item, rank, tab: activeTab });
              }}
            >
              <span className="font-mono text-xs font-semibold text-muted-foreground tabular-nums">
                {String(rank).padStart(2, "0")}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">
                  {label}
                </span>
                {subtitle === undefined ? null : (
                  <span className="block truncate text-xs text-muted-foreground">
                    {subtitle}
                  </span>
                )}
                <span className="mt-2 block h-1 overflow-hidden rounded-full bg-muted">
                  <span
                    className="block h-full rounded-full bg-[var(--ring)]"
                    style={{ width }}
                  />
                </span>
              </span>
              <span className="font-mono text-sm font-semibold tabular-nums">
                {numberFmt.format(item.count)}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
};

export const ExplorePanel = ({
  suburbs,
  streets,
  vehicles,
  isLoading,
}: ExplorePanelProps) => {
  const [activeTab, setActiveTab] = useState<ExploreTab>("suburbs");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<SelectedItem | null>(null);

  const items = useMemo(() => {
    if (activeTab === "suburbs") {
      return suburbs;
    }
    if (activeTab === "streets") {
      return streets;
    }
    return vehicles;
  }, [activeTab, streets, suburbs, vehicles]);

  const visibleItems = useMemo(
    () => items.filter((item) => matchesSearch(item, search)),
    [items, search]
  );

  const maxCount = Math.max(...items.map((item) => item.count), 1);

  return (
    <Card className="overflow-hidden py-0" aria-label="Explore">
      <CardHeader className="border-b border-border">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardTitle>Explore Workbench</CardTitle>
            <CardDescription>
              Search, pin, and compare top infringement dimensions in place.
            </CardDescription>
          </div>
          <div className="relative min-w-0 lg:w-80">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
              }}
              placeholder={`Search ${activeTab}`}
              className="pl-9"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="grid p-0 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="min-w-0">
          <div className="border-b border-border bg-muted px-4 py-3">
            <Tabs
              value={activeTab}
              onValueChange={(value: string) => {
                if (isExploreTab(value)) {
                  setActiveTab(value);
                  setSelected(null);
                }
              }}
            >
              <TabsList className="w-full">
                {TABS.map((tab) => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    className="gap-2 capitalize"
                  >
                    {getTabIcon(tab)}
                    {tab}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <ExploreListBody
            isLoading={isLoading}
            visibleItems={visibleItems}
            activeTab={activeTab}
            maxCount={maxCount}
            search={search}
            selected={selected}
            onSelect={setSelected}
          />
        </section>
        {isLoading === true ? (
          <InspectorSkeleton />
        ) : (
          <Inspector selected={selected} maxCount={maxCount} />
        )}
      </CardContent>
    </Card>
  );
};
