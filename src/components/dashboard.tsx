import { formatDistanceToNow } from "date-fns";
import { useEffect, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

import type {
  LocationRankItem,
  MapRouteItem,
  VehicleRankItem,
} from "../client/api";
import { ExplorePanel } from "./explore-panel";
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
  mapRoutes: MapRouteItem[];
  pendingGeocode: number;
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
      <p className="text-sm text-muted-foreground">Waiting for first sync…</p>
    );
  }

  const ago = formatDistanceToNow(new Date(lastSyncedAt), { addSuffix: true });

  return (
    <p className="text-sm text-muted-foreground">
      Last updated <span className="font-medium text-primary">{ago}</span>
    </p>
  );
};

export const Dashboard = ({
  live,
  streets,
  offences,
  topStreets,
  topSuburbs,
  topVehicles,
  mapRoutes,
  pendingGeocode,
  isLive,
  isFetching,
  error,
}: DashboardProps) => (
  <div className="min-h-screen bg-background text-foreground">
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <header className="mb-8 text-center">
        <p className="mb-2 text-xs font-semibold tracking-[0.14em] text-primary uppercase">
          Hamilton City Council
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Parking Infringement Live Ticker
        </h1>
        <p className="mt-2 flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
          {isLive === true ? (
            <Badge
              variant="secondary"
              className="gap-1.5 border-green-500/30 bg-green-500/10 text-green-400"
            >
              <span className="size-1.5 animate-pulse rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
              Live
            </Badge>
          ) : (
            <Badge variant="outline">Polling</Badge>
          )}
          <span>full dashboard pushed over WebSocket</span>
          {isFetching === true ? <span>· updating…</span> : null}
        </p>
        <div className="mt-2">
          <LastUpdated lastSyncedAt={live.lastSyncedAt} />
        </div>
      </header>

      {error !== null && error !== undefined && error.length > 0 ? (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-6">
        <LiveTicker stats={live} />
        <TopLists streets={streets} offences={offences} />
        <ExplorePanel
          suburbs={topSuburbs}
          streets={topStreets}
          vehicles={topVehicles}
        />
        <LocationMap routes={mapRoutes} pendingGeocode={pendingGeocode} />
      </div>

      <footer className="mt-10 text-center text-xs text-muted-foreground">
        Data source: Hamilton City Council Open Data API · Map: OpenStreetMap /
        Overpass (Hamilton) · UI: shadcn + mapcn
      </footer>
    </div>
  </div>
);
