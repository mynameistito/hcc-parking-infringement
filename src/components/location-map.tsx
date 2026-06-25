import { MapPinned } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Map, MapControls, MapGeoJSON, useMap } from "@/components/ui/map";
import { cn } from "@/lib/utils";

import type { MapRouteItem } from "../client/api";
import { heatColor } from "./map-heat";
import {
  boundsFromRoutes,
  buildRoutesGeoJSON,
  hamiltonMapCenter,
  isRouteFeatureProperties,
} from "./map-routes";
import type { RouteFeatureProperties } from "./map-routes";

interface LocationMapProps {
  routes: MapRouteItem[];
  pendingGeocode: number;
}

const HEAT_LEGEND_STOPS = [0, 0.25, 0.5, 0.75, 1] as const;

const MapFitRoutes = ({ routes }: { routes: MapRouteItem[] }) => {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!isLoaded || map === null || map === undefined || routes.length === 0) {
      return;
    }

    const bounds = boundsFromRoutes(routes);
    if (bounds === null) {
      return;
    }

    map.fitBounds(bounds, { duration: 0, maxZoom: 14, padding: 48 });
  }, [isLoaded, map, routes]);

  return null;
};

const HeatLegend = ({ maxCount }: { maxCount: number }) => (
  <div
    className="pointer-events-none absolute right-3 bottom-3 z-10 rounded-[6px] border border-border bg-card/95 p-2.5 shadow-[0_1px_1px_rgba(0,0,0,0.02),0_4px_8px_-4px_rgba(0,0,0,0.04),0_16px_24px_-8px_rgba(0,0,0,0.06)] backdrop-blur-sm"
    aria-label="Ticket heat scale"
  >
    <p className="mb-1.5 text-[0.62rem] font-semibold text-muted-foreground uppercase">
      Tickets
    </p>
    <div className="grid h-[0.45rem] grid-cols-5 gap-0.5 overflow-hidden rounded">
      {HEAT_LEGEND_STOPS.map((stop) => (
        <span
          key={stop}
          className="block h-full"
          style={{ background: heatColor(stop) }}
        />
      ))}
    </div>
    <div className="mt-1 flex justify-between text-[0.62rem] text-muted-foreground">
      <span>Low</span>
      <span>{maxCount.toLocaleString("en-NZ")}</span>
    </div>
  </div>
);

export const LocationMap = ({ routes, pendingGeocode }: LocationMapProps) => {
  const [selected, setSelected] = useState<RouteFeatureProperties | null>(null);

  const maxCount = useMemo(
    () => Math.max(...routes.map((route) => route.count), 1),
    [routes]
  );

  const geojson = useMemo(
    () => buildRoutesGeoJSON(routes, maxCount),
    [routes, maxCount]
  );

  const hasRoutes = geojson.features.length > 0;

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardHeader className="border-b border-border bg-muted px-4 py-3.5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <MapPinned
                className="size-4 text-[var(--ring)]"
                aria-hidden="true"
              />
              Hotspots Map
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              OSM road lines coloured by ticket volume.
              {pendingGeocode > 0
                ? ` ${pendingGeocode} roads awaiting geometry...`
                : ""}
            </p>
          </div>
          {selected === null ? (
            <p className="text-sm text-muted-foreground">
              Select a route to inspect it.
            </p>
          ) : (
            <p className="rounded-[6px] border border-border bg-background px-3 py-2 text-sm text-foreground">
              <span className="font-medium">{selected.street}</span>
              {selected.suburb !== null && selected.suburb.length > 0
                ? `, ${selected.suburb}`
                : ""}
              <span className="ml-2 font-mono font-semibold tabular-nums">
                {selected.count.toLocaleString("en-NZ")}
              </span>{" "}
              tickets
            </p>
          )}
        </div>
      </CardHeader>

      <CardContent className="relative p-0">
        <Map
          center={hamiltonMapCenter()}
          zoom={13}
          theme="dark"
          className={cn(
            "h-[360px] w-full",
            hasRoutes ? undefined : "opacity-40"
          )}
        >
          <MapControls showZoom showCompass />
          {hasRoutes ? (
            <>
              <MapFitRoutes routes={routes} />
              <MapGeoJSON<RouteFeatureProperties>
                id="infringement-routes"
                data={geojson}
                promoteId="id"
                fillPaint={false}
                linePaint={{
                  "line-color": ["get", "color"],
                  "line-opacity": ["get", "opacity"],
                  "line-width": ["get", "width"],
                }}
                interactive
                onClick={(event) => {
                  const { properties } = event.feature;
                  if (isRouteFeatureProperties(properties)) {
                    setSelected(properties);
                  }
                }}
              />
            </>
          ) : null}
        </Map>

        {hasRoutes ? <HeatLegend maxCount={maxCount} /> : null}

        {hasRoutes ? null : (
          <div className="pointer-events-none absolute inset-0 grid place-content-center bg-background/70 p-4 text-center">
            <p className="text-sm text-foreground">
              Road routes appear after streets are geocoded from OpenStreetMap.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Run{" "}
              <code className="font-mono text-foreground">bun run geocode</code>{" "}
              or wait for the hourly background job.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
