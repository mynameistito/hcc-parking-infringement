import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import type {
  InfiniteData,
  UseInfiniteQueryResult,
} from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type {
  BrowseResponse,
  LocationRankItem,
  VehicleRankItem,
} from "../client/api";
import {
  fetchBrowseStreets,
  fetchBrowseSuburbs,
  fetchBrowseVehicles,
  fetchExploreInfringements,
  fetchStreetsInSuburb,
} from "../client/api";
import {
  BrowseControls,
  EXPLORE_PAGE_SIZE,
  ExploreListRow,
  formatLocationSubtitle,
  formatStreetSuburb,
  InfringementCards,
  isExploreTab,
  LoadMore,
  useDebouncedValue,
} from "./explore-shared";
import type { ExploreTab, TicketFilter } from "./explore-shared";

const streetKey = (item: LocationRankItem): string =>
  `${item.street ?? item.label}|${item.suburb ?? ""}`;

type ModalScreen =
  | { kind: "list"; tab: ExploreTab }
  | { kind: "suburb-streets"; suburb: string }
  | { kind: "tickets"; title: string; filter: TicketFilter };

export interface ExploreOpenState {
  tab: ExploreTab;
  initialSearch?: string;
  suburb?: string;
  tickets?: TicketFilter & { title: string };
}

interface ExploreModalProps {
  initial: ExploreOpenState;
  onClose: () => void;
}

const buildInitialStack = (initial: ExploreOpenState): ModalScreen[] => {
  if (initial.tickets !== undefined) {
    const { title, ...filter } = initial.tickets;
    return [{ filter, kind: "tickets", title }];
  }
  if (initial.suburb !== undefined && initial.suburb.length > 0) {
    return [
      { kind: "list", tab: "suburbs" },
      { kind: "suburb-streets", suburb: initial.suburb },
    ];
  }
  return [{ kind: "list", tab: initial.tab }];
};

const getBrowsePlaceholder = (tab: ExploreTab): string => {
  if (tab === "suburbs") {
    return "Search suburbs…";
  }
  if (tab === "streets") {
    return "Search streets…";
  }
  return "Search vehicles…";
};

const getModalTitle = (screen: ModalScreen): string => {
  if (screen.kind === "tickets") {
    return screen.title;
  }
  if (screen.kind === "suburb-streets") {
    return screen.suburb;
  }
  return "Explore";
};

type LocationBrowseQuery = UseInfiniteQueryResult<
  BrowseResponse<LocationRankItem>
>;

type VehicleBrowseQuery = UseInfiniteQueryResult<
  BrowseResponse<VehicleRankItem>
>;

const flattenLocationPages = (
  data: InfiniteData<BrowseResponse<LocationRankItem>> | undefined
): LocationRankItem[] => data?.pages.flatMap((page) => page.items) ?? [];

const flattenVehiclePages = (
  data: InfiniteData<BrowseResponse<VehicleRankItem>> | undefined
): VehicleRankItem[] => data?.pages.flatMap((page) => page.items) ?? [];

const getLocationBrowseTotal = (
  data: InfiniteData<BrowseResponse<LocationRankItem>> | undefined
): number => data?.pages[0]?.total ?? 0;

const getVehicleBrowseTotal = (
  data: InfiniteData<BrowseResponse<VehicleRankItem>> | undefined
): number => data?.pages[0]?.total ?? 0;

const searchQueryParam = (search: string): string | undefined =>
  search.length > 0 ? search : undefined;

interface BrowseListStateBase {
  total: number;
  isLoading: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
}

type BrowseListState =
  | (BrowseListStateBase & { tab: "suburbs"; items: LocationRankItem[] })
  | (BrowseListStateBase & { tab: "streets"; items: LocationRankItem[] })
  | (BrowseListStateBase & { tab: "vehicles"; items: VehicleRankItem[] });

const getBrowseListState = (
  tab: ExploreTab,
  suburbsQuery: LocationBrowseQuery,
  streetsQuery: LocationBrowseQuery,
  vehiclesQuery: VehicleBrowseQuery
): BrowseListState => {
  if (tab === "suburbs") {
    return {
      fetchNextPage: () => {
        void suburbsQuery.fetchNextPage();
      },
      hasNextPage: suburbsQuery.hasNextPage,
      isFetchingNextPage: suburbsQuery.isFetchingNextPage,
      isLoading: suburbsQuery.isLoading,
      items: flattenLocationPages(suburbsQuery.data),
      tab: "suburbs",
      total: getLocationBrowseTotal(suburbsQuery.data),
    };
  }

  if (tab === "streets") {
    return {
      fetchNextPage: () => {
        void streetsQuery.fetchNextPage();
      },
      hasNextPage: streetsQuery.hasNextPage,
      isFetchingNextPage: streetsQuery.isFetchingNextPage,
      isLoading: streetsQuery.isLoading,
      items: flattenLocationPages(streetsQuery.data),
      tab: "streets",
      total: getLocationBrowseTotal(streetsQuery.data),
    };
  }

  return {
    fetchNextPage: () => {
      void vehiclesQuery.fetchNextPage();
    },
    hasNextPage: vehiclesQuery.hasNextPage,
    isFetchingNextPage: vehiclesQuery.isFetchingNextPage,
    isLoading: vehiclesQuery.isLoading,
    items: flattenVehiclePages(vehiclesQuery.data),
    tab: "vehicles",
    total: getVehicleBrowseTotal(vehiclesQuery.data),
  };
};

const renderSuburbRows = (
  items: LocationRankItem[],
  sort: "count" | "name",
  onSelectSuburb: (suburb: string) => void
) =>
  items.map((item, index) => (
    <ExploreListRow
      key={item.label}
      rank={sort === "count" ? index + 1 : undefined}
      label={item.label}
      count={item.count}
      onClick={() => {
        onSelectSuburb(item.label);
      }}
    />
  ));

const renderStreetRows = (
  items: LocationRankItem[],
  sort: "count" | "name",
  onSelectStreet: (item: LocationRankItem) => void
) =>
  items.map((item, index) => (
    <ExploreListRow
      key={streetKey(item)}
      rank={sort === "count" ? index + 1 : undefined}
      label={item.street ?? item.label}
      subtitle={formatLocationSubtitle(item.suburb)}
      count={item.count}
      onClick={() => {
        onSelectStreet(item);
      }}
    />
  ));

const renderVehicleRows = (
  items: VehicleRankItem[],
  sort: "count" | "name",
  onSelectVehicle: (item: VehicleRankItem) => void
) =>
  items.map((item, index) => (
    <ExploreListRow
      key={`${item.make}|${item.model}`}
      rank={sort === "count" ? index + 1 : undefined}
      label={item.label}
      count={item.count}
      onClick={() => {
        onSelectVehicle(item);
      }}
    />
  ));

const renderBrowseContent = (
  state: BrowseListState,
  sort: "count" | "name",
  handlers: {
    onSelectSuburb: (suburb: string) => void;
    onSelectStreet: (item: LocationRankItem) => void;
    onSelectVehicle: (item: VehicleRankItem) => void;
  }
) => {
  if (state.isLoading) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
    );
  }

  if (state.items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No results match your search.
      </p>
    );
  }

  let listBody;
  if (state.tab === "suburbs") {
    listBody = renderSuburbRows(state.items, sort, handlers.onSelectSuburb);
  } else if (state.tab === "streets") {
    listBody = renderStreetRows(state.items, sort, handlers.onSelectStreet);
  } else {
    listBody = renderVehicleRows(state.items, sort, handlers.onSelectVehicle);
  }

  return (
    <div>
      {listBody}
      <LoadMore
        hasMore={state.hasNextPage}
        loading={state.isFetchingNextPage}
        onClick={state.fetchNextPage}
      />
    </div>
  );
};

const BrowseList = ({
  tab,
  initialSearch,
  onSelectSuburb,
  onSelectStreet,
  onSelectVehicle,
}: {
  tab: ExploreTab;
  initialSearch?: string;
  onSelectSuburb: (suburb: string) => void;
  onSelectStreet: (item: LocationRankItem) => void;
  onSelectVehicle: (item: VehicleRankItem) => void;
}) => {
  const [search, setSearch] = useState(initialSearch ?? "");
  const [sort, setSort] = useState<"count" | "name">("count");
  const debouncedSearch = useDebouncedValue(search);

  const suburbsQuery = useInfiniteQuery<
    BrowseResponse<LocationRankItem>,
    Error,
    InfiniteData<BrowseResponse<LocationRankItem>>
  >({
    enabled: tab === "suburbs",
    getNextPageParam: (last) =>
      last.page * last.limit < last.total ? last.page + 1 : undefined,
    initialPageParam: 1,
    queryFn: async ({ pageParam }) =>
      await fetchBrowseSuburbs({
        limit: EXPLORE_PAGE_SIZE,
        page: pageParam,
        q: searchQueryParam(debouncedSearch),
        sort,
      }),
    queryKey: ["browse", "suburbs", debouncedSearch, sort],
  });

  const streetsQuery = useInfiniteQuery<
    BrowseResponse<LocationRankItem>,
    Error,
    InfiniteData<BrowseResponse<LocationRankItem>>
  >({
    enabled: tab === "streets",
    getNextPageParam: (last) =>
      last.page * last.limit < last.total ? last.page + 1 : undefined,
    initialPageParam: 1,
    queryFn: async ({ pageParam }) =>
      await fetchBrowseStreets({
        limit: EXPLORE_PAGE_SIZE,
        page: pageParam,
        q: searchQueryParam(debouncedSearch),
        sort,
      }),
    queryKey: ["browse", "streets", debouncedSearch, sort],
  });

  const vehiclesQuery = useInfiniteQuery<
    BrowseResponse<VehicleRankItem>,
    Error,
    InfiniteData<BrowseResponse<VehicleRankItem>>
  >({
    enabled: tab === "vehicles",
    getNextPageParam: (last) =>
      last.page * last.limit < last.total ? last.page + 1 : undefined,
    initialPageParam: 1,
    queryFn: async ({ pageParam }) =>
      await fetchBrowseVehicles({
        limit: EXPLORE_PAGE_SIZE,
        page: pageParam,
        q: searchQueryParam(debouncedSearch),
        sort,
      }),
    queryKey: ["browse", "vehicles", debouncedSearch, sort],
  });

  const browseState = getBrowseListState(
    tab,
    suburbsQuery,
    streetsQuery,
    vehiclesQuery
  );

  return (
    <>
      <BrowseControls
        search={search}
        onSearchChange={setSearch}
        sort={sort}
        onSortChange={setSort}
        placeholder={getBrowsePlaceholder(tab)}
        total={browseState.total}
        shown={browseState.items.length}
      />
      {renderBrowseContent(browseState, sort, {
        onSelectStreet,
        onSelectSuburb,
        onSelectVehicle,
      })}
    </>
  );
};

const SuburbStreetsList = ({
  suburb,
  onSelectStreet,
}: {
  suburb: string;
  onSelectStreet: (item: LocationRankItem) => void;
}) => {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"count" | "name">("count");
  const debouncedSearch = useDebouncedValue(search);

  const streetsQuery = useInfiniteQuery<
    BrowseResponse<LocationRankItem>,
    Error,
    InfiniteData<BrowseResponse<LocationRankItem>>
  >({
    getNextPageParam: (last) =>
      last.page * last.limit < last.total ? last.page + 1 : undefined,
    initialPageParam: 1,
    queryFn: async ({ pageParam }) =>
      await fetchStreetsInSuburb(suburb, {
        limit: EXPLORE_PAGE_SIZE,
        page: pageParam,
        q: searchQueryParam(debouncedSearch),
        sort,
      }),
    queryKey: ["browse", "streets", "suburb", suburb, debouncedSearch, sort],
  });

  const items = flattenLocationPages(streetsQuery.data);
  const total = getLocationBrowseTotal(streetsQuery.data);

  const renderStreetsBody = () => {
    if (streetsQuery.isLoading) {
      return (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Loading streets…
        </p>
      );
    }

    if (items.length === 0) {
      return (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No streets match your search.
        </p>
      );
    }

    return (
      <div>
        {items.map((item) => (
          <ExploreListRow
            key={streetKey(item)}
            label={item.street ?? item.label}
            count={item.count}
            onClick={() => {
              onSelectStreet(item);
            }}
          />
        ))}
        <LoadMore
          hasMore={streetsQuery.hasNextPage}
          loading={streetsQuery.isFetchingNextPage}
          onClick={() => {
            void streetsQuery.fetchNextPage();
          }}
        />
      </div>
    );
  };

  return (
    <>
      <BrowseControls
        search={search}
        onSearchChange={setSearch}
        sort={sort}
        onSortChange={setSort}
        placeholder={`Search streets in ${suburb}…`}
        total={total}
        shown={items.length}
      />
      {renderStreetsBody()}
    </>
  );
};

const TicketsView = ({
  title,
  filter,
}: {
  title: string;
  filter: TicketFilter;
}) => {
  const ticketsQuery = useQuery({
    queryFn: async () =>
      await fetchExploreInfringements({
        limit: 20,
        street: filter.street,
        suburb: filter.suburb,
        vehicleMake: filter.vehicleMake,
        vehicleModel: filter.vehicleModel,
      }),
    queryKey: ["explore", "tickets", filter],
  });

  return (
    <div className="px-4 py-3">
      <p className="mb-3 text-xs text-muted-foreground">{title}</p>
      <InfringementCards
        records={ticketsQuery.data?.data ?? []}
        loading={ticketsQuery.isLoading}
        emptyLabel="No tickets found."
      />
    </div>
  );
};

export const ExploreModal = ({ initial, onClose }: ExploreModalProps) => {
  const [stack, setStack] = useState<ModalScreen[]>(() =>
    buildInitialStack(initial)
  );
  const [activeTab, setActiveTab] = useState<ExploreTab>(initial.tab);

  const current = stack.at(-1);
  if (current === undefined) {
    return null;
  }

  const showTabs = current.kind === "list";
  const title = getModalTitle(current);

  const goBack = () => {
    setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  };

  const openSuburb = (suburb: string) => {
    setStack((prev) => [...prev, { kind: "suburb-streets", suburb }]);
  };

  const openStreetTickets = (item: LocationRankItem) => {
    const street = item.street ?? item.label;
    const ticketTitle = formatStreetSuburb(street, item.suburb);
    setStack((prev) => [
      ...prev,
      {
        filter: { street, suburb: item.suburb },
        kind: "tickets",
        title: ticketTitle,
      },
    ]);
  };

  const openVehicleTickets = (item: VehicleRankItem) => {
    setStack((prev) => [
      ...prev,
      {
        filter: { vehicleMake: item.make, vehicleModel: item.model },
        kind: "tickets",
        title: item.label,
      },
    ]);
  };

  const switchTab = (tab: ExploreTab) => {
    setActiveTab(tab);
    setStack([{ kind: "list", tab }]);
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="flex max-h-[min(88vh,720px)] max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="flex-row items-center gap-2 space-y-0 border-b border-border px-4 py-3">
          {stack.length > 1 ? (
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={goBack}
              aria-label="Go back"
            >
              <ArrowLeft />
            </Button>
          ) : null}
          <DialogTitle className="min-w-0 flex-1 truncate">{title}</DialogTitle>
        </DialogHeader>

        {showTabs ? (
          <Tabs
            value={activeTab}
            onValueChange={(value: string) => {
              if (isExploreTab(value)) {
                switchTab(value);
              }
            }}
            className="gap-0"
          >
            <TabsList variant="line" className="h-10 w-full rounded-none px-4">
              {(["suburbs", "streets", "vehicles"] as const).map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="flex-1 capitalize"
                >
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        ) : null}

        <ScrollArea className="min-h-0 flex-1">
          <div className="pb-2">
            {current.kind === "list" ? (
              <BrowseList
                tab={activeTab}
                initialSearch={initial.initialSearch}
                onSelectSuburb={openSuburb}
                onSelectStreet={openStreetTickets}
                onSelectVehicle={openVehicleTickets}
              />
            ) : null}
            {current.kind === "suburb-streets" ? (
              <SuburbStreetsList
                suburb={current.suburb}
                onSelectStreet={openStreetTickets}
              />
            ) : null}
            {current.kind === "tickets" ? (
              <TicketsView title={current.title} filter={current.filter} />
            ) : null}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
