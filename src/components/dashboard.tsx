import { formatDistanceToNow } from "date-fns";
import {
  Activity,
  AlertCircle,
  Clock3,
  Database,
  Moon,
  Sun,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

import type {
  LocationRankItem,
  MapRouteItem,
  PublicInfringement,
  VehicleRankItem,
} from "../client/api";
import { ExplorePanel } from "./explore-panel";
import { LatestInstances } from "./latest-instances";
import { LiveTicker } from "./live-ticker";
import { LocationMap } from "./location-map";
import { TopLists } from "./top-lists";
import type { TopItem } from "./top-lists";

export interface DashboardLiveStats {
  allTimeTotal: number;
  allTimeAmountCents: number;
  today: number;
  last24h: number;
  last7d: number;
  last30d: number;
  thisMonth: number;
  towedToday: number;
  lastSyncedAt: string | null;
  lastRecordAt: string | null;
}

interface DashboardProps {
  live: DashboardLiveStats;
  streets: TopItem[];
  offences: TopItem[];
  topStreets: LocationRankItem[];
  topSuburbs: LocationRankItem[];
  topVehicles: VehicleRankItem[];
  recentInfringements: PublicInfringement[];
  mapRoutes: MapRouteItem[];
  pendingGeocode: number;
  isCached?: boolean;
  isLive?: boolean;
  isFetching?: boolean;
  error?: string | null;
}

const LastUpdated = ({ lastSyncedAt }: { lastSyncedAt: string | null }) => {
  const [, tick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      tick((n) => n + 1);
    }, 30_000);
    return () => {
      window.clearInterval(id);
    };
  }, []);

  if (lastSyncedAt === null || lastSyncedAt.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Waiting for first sync...</p>
    );
  }

  const ago = formatDistanceToNow(new Date(lastSyncedAt), { addSuffix: true });

  return (
    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <Clock3 className="size-4 text-muted-foreground" aria-hidden="true" />
      Last updated <span className="font-medium text-primary">{ago}</span>
    </p>
  );
};

type ThemeMode = "dark" | "light";

const getInitialTheme = (): ThemeMode => {
  if (typeof window === "undefined") {
    return "dark";
  }
  return window.localStorage.getItem("hcc-theme") === "light"
    ? "light"
    : "dark";
};

const ThemeToggle = () => {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("light", theme === "light");
    window.localStorage.setItem("hcc-theme", theme);
  }, [theme]);

  const isLight = theme === "light";

  return (
    <button
      type="button"
      className="inline-flex h-8 items-center gap-2 rounded-[6px] border border-border bg-background px-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:shadow-[0_0_0_2px_var(--background),0_0_0_4px_var(--ring)] focus-visible:outline-none"
      onClick={() => {
        setTheme(isLight ? "dark" : "light");
      }}
      aria-label={`Switch to ${isLight ? "dark" : "light"} mode`}
    >
      {isLight ? (
        <Moon className="size-4" aria-hidden="true" />
      ) : (
        <Sun className="size-4" aria-hidden="true" />
      )}
      {isLight ? "Dark" : "Light"}
    </button>
  );
};

const LiveStatusBadge = ({
  isCached,
  isLive,
}: {
  isCached?: boolean;
  isLive?: boolean;
}) => {
  if (isLive === true) {
    return (
      <Badge
        variant="secondary"
        className="gap-1.5 border-[color-mix(in_srgb,#00ca50_35%,transparent)] bg-[color-mix(in_srgb,#00ca50_12%,var(--background))] text-[#00ca50]"
      >
        <Activity className="size-3" aria-hidden="true" />
        WebSocket Live
      </Badge>
    );
  }

  if (isCached === true) {
    return (
      <Badge variant="outline" className="gap-1.5 bg-background">
        <Database className="size-3" aria-hidden="true" />
        Cached
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="gap-1.5 bg-background">
      <Database className="size-3" aria-hidden="true" />
      Connecting
    </Badge>
  );
};

export const Dashboard = ({
  live,
  streets,
  offences,
  topStreets,
  topSuburbs,
  topVehicles,
  recentInfringements,
  mapRoutes,
  pendingGeocode,
  isCached,
  isLive,
  isFetching,
  error,
}: DashboardProps) => (
  <div className="min-h-screen bg-background text-foreground">
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6 border-b border-border pb-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase">
              Hamilton City Council Open Data
            </p>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-primary sm:text-5xl">
              Parking Infringement Dashboard
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
              Live infringement totals, hotspot streets, vehicle trends, and
              ticket geography for Hamilton, New Zealand.
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 lg:items-end">
            <div className="flex flex-wrap items-center gap-2">
              <LiveStatusBadge isCached={isCached} isLive={isLive} />
              {isFetching === true ? (
                <Badge variant="outline" className="bg-background">
                  Updating...
                </Badge>
              ) : null}
              <ThemeToggle />
            </div>
            <LastUpdated lastSyncedAt={live.lastSyncedAt} />
          </div>
        </div>
      </header>

      {error !== null && error !== undefined && error.length > 0 ? (
        <Alert variant="destructive" className="mb-6 bg-background">
          <AlertCircle className="size-4" aria-hidden="true" />
          <AlertTitle>Dashboard update failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <main className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid gap-6 xl:col-span-2">
          <LiveTicker stats={live} />
          <LatestInstances recentInfringements={recentInfringements} />
        </div>
        <section className="min-w-0">
          <LocationMap routes={mapRoutes} pendingGeocode={pendingGeocode} />
        </section>
        <aside className="min-w-0">
          <TopLists streets={streets} offences={offences} layout="stack" />
        </aside>
        <div className="xl:col-span-2">
          <ExplorePanel
            suburbs={topSuburbs}
            streets={topStreets}
            vehicles={topVehicles}
          />
        </div>
      </main>

      <footer className="mt-8 flex flex-col gap-2 border-t border-border pt-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>Data source: Hamilton City Council Open Data API</span>
        <span>Map: OpenStreetMap / Overpass (Hamilton)</span>
      </footer>
    </div>
  </div>
);
