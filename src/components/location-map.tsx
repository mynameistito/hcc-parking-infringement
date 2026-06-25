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
} from "./map-routes";
import type { RouteFeatureProperties } from "./map-routes";

interface LocationMapProps {
  routes: MapRouteItem[];
  pendingGeocode: number;
}

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

const HeatLegend = ({ maxCount }: { maxCount: number }) => {
  const stops = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div
      className="pointer-events-none absolute right-3 bottom-3 z-10 rounded-lg border border-border bg-card/95 p-2.5 shadow-lg backdrop-blur-sm"
      aria-label="Ticket heat scale"
    >
      <p className="mb-1.5 text-[0.62rem] font-bold tracking-wider text-muted-foreground uppercase">
        Tickets
      </p>
      <div className="grid h-[0.45rem] grid-cols-5 gap-0.5 overflow-hidden rounded">
        {stops.map((stop) => (
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
};

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
    <Card className="mb-5 gap-0 overflow-hidden py-0">
      <CardHeader className="border-b border-border px-4 py-3.5">
        <CardTitle className="text-base font-semibold">Hotspots map</CardTitle>
        <p className="text-sm text-muted-foreground">
          OSM road lines coloured by ticket volume · mapcn · CARTO dark
          {pendingGeocode > 0
            ? ` · ${pendingGeocode} roads awaiting geometry…`
            : ""}
        </p>
        {selected === null ? null : (
          <p className="text-sm text-foreground">
            <span className="font-medium">{selected.street}</span>
            {selected.suburb !== null && selected.suburb.length > 0
              ? ` · ${selected.suburb}`
              : ""}
            {" — "}
            {selected.count.toLocaleString("en-NZ")} tickets
          </p>
        )}
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
                  "line-cap": "round",
                  "line-color": ["get", "color"],
                  "line-join": "round",
                  "line-opacity": ["get", "opacity"],
                  "line-width": ["get", "width"],
                }}
                interactive
                onClick={(event) => {
                  setSelected(event.feature.properties);
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
