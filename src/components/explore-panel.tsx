import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type { LocationRankItem, VehicleRankItem } from "../client/api";
import { ExploreModal } from "./explore-modal";
import type { ExploreOpenState } from "./explore-modal";
import { formatLocationSubtitle, numberFmt } from "./explore-shared";

const PREVIEW_LIMIT = 10;

const isVehicleRankItem = (
  item: LocationRankItem | VehicleRankItem
): item is VehicleRankItem => "make" in item && "model" in item;

const PreviewTable = ({
  title,
  hint,
  items,
  emptyLabel,
  onBrowseAll,
  onSelect,
  renderRow,
}: {
  title: string;
  hint: string;
  items: LocationRankItem[] | VehicleRankItem[];
  emptyLabel: string;
  onBrowseAll: () => void;
  onSelect: (item: LocationRankItem | VehicleRankItem) => void;
  renderRow: (item: LocationRankItem | VehicleRankItem) => {
    key: string;
    label: string;
    subtitle?: string;
  };
}) => {
  const preview = items.slice(0, PREVIEW_LIMIT);

  return (
    <section aria-label={title} className="flex flex-col">
      <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
        <Button variant="outline" size="sm" onClick={onBrowseAll}>
          Browse all
        </Button>
      </div>
      {preview.length === 0 ? (
        <p className="px-4 py-4 text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        <ol>
          {preview.map((item, index) => {
            const row = renderRow(item);
            return (
              <li key={row.key}>
                <button
                  type="button"
                  className="grid w-full grid-cols-[1.5rem_minmax(0,1fr)_auto] items-center gap-2 border-t border-border/50 px-4 py-2.5 text-left transition-colors hover:bg-muted/40"
                  onClick={() => {
                    onSelect(item);
                  }}
                >
                  <span className="font-mono text-xs font-bold text-primary/80">
                    {index + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm" title={row.label}>
                      {row.label}
                    </span>
                    {row.subtitle !== undefined && row.subtitle.length > 0 ? (
                      <span className="block truncate text-xs text-muted-foreground">
                        {row.subtitle}
                      </span>
                    ) : null}
                  </span>
                  <span className="font-mono text-xs font-bold tabular-nums">
                    {numberFmt.format(item.count)}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
};

interface ExplorePanelProps {
  suburbs: LocationRankItem[];
  streets: LocationRankItem[];
  vehicles: VehicleRankItem[];
}

export const ExplorePanel = ({
  suburbs,
  streets,
  vehicles,
}: ExplorePanelProps) => {
  const [modal, setModal] = useState<ExploreOpenState | null>(null);

  return (
    <>
      <Card className="overflow-hidden py-0" aria-label="Explore">
        <CardHeader className="border-b border-border">
          <CardTitle>Explore</CardTitle>
          <CardDescription>
            Top locations and vehicles — open any row or browse all to search
            the full dataset
          </CardDescription>
        </CardHeader>
        <CardContent className="grid p-0 lg:grid-cols-3 lg:divide-x lg:divide-border">
          <PreviewTable
            title="Suburbs"
            hint="Top 10 by ticket count"
            items={suburbs}
            emptyLabel="No suburb data yet."
            onBrowseAll={() => {
              setModal({ tab: "suburbs" });
            }}
            onSelect={(item) => {
              setModal({ suburb: item.label, tab: "suburbs" });
            }}
            renderRow={(item) => ({
              key: item.label,
              label: item.label,
            })}
          />
          <PreviewTable
            title="Streets"
            hint="Top 10 by ticket count"
            items={streets}
            emptyLabel="No street data yet."
            onBrowseAll={() => {
              setModal({ tab: "streets" });
            }}
            onSelect={(item) => {
              if (isVehicleRankItem(item)) {
                return;
              }
              const street =
                item.street !== undefined && item.street.length > 0
                  ? item.street
                  : item.label;
              setModal({
                tab: "streets",
                tickets: {
                  street,
                  suburb: item.suburb,
                  title: street,
                },
              });
            }}
            renderRow={(item) => {
              if (isVehicleRankItem(item)) {
                return { key: item.label, label: item.label };
              }
              const label =
                item.street !== undefined && item.street.length > 0
                  ? item.street
                  : item.label;
              return {
                key: label,
                label,
                subtitle: formatLocationSubtitle(item.suburb),
              };
            }}
          />
          <PreviewTable
            title="Vehicles"
            hint="Top 10 makes & models"
            items={vehicles}
            emptyLabel="No vehicle data yet."
            onBrowseAll={() => {
              setModal({ tab: "vehicles" });
            }}
            onSelect={(item) => {
              if (!isVehicleRankItem(item)) {
                return;
              }
              setModal({
                tab: "vehicles",
                tickets: {
                  title: item.label,
                  vehicleMake: item.make,
                  vehicleModel: item.model,
                },
              });
            }}
            renderRow={(item) => {
              if (!isVehicleRankItem(item)) {
                return { key: item.label, label: item.label };
              }
              return {
                key: `${item.make}|${item.model}`,
                label: item.label,
              };
            }}
          />
        </CardContent>
      </Card>

      {modal === null ? null : (
        <ExploreModal
          initial={modal}
          onClose={() => {
            setModal(null);
          }}
        />
      )}
    </>
  );
};
