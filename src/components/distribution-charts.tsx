import { PieChart as PieChartIcon } from "lucide-react";
import { lazy, Suspense } from "react";

import { ChartAreaSkeleton } from "@/components/data-skeletons";
import { DonutChart } from "@/components/donut-chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ChartBreakdowns, TopItem } from "@/contracts/public-api";
import { numberFmt } from "@/lib/format";
import { cn } from "@/lib/utils";

const RankedBarChart = lazy(async () => {
  const module = await import("@/components/ranked-bar-chart");
  return { default: module.RankedBarChart };
});

interface DistributionChartsProps {
  breakdowns: ChartBreakdowns;
  streets: TopItem[];
  isLoading?: boolean;
}

interface PieCardProps {
  description: string;
  isLoading: boolean;
  items: TopItem[];
  title: string;
  collapseAfter?: number;
}

const PieCard = ({
  title,
  description,
  items,
  isLoading,
  collapseAfter,
}: PieCardProps) => (
  <article className="rounded-[6px] border border-border bg-background p-4">
    <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
    <div className="mt-3">
      {isLoading ? (
        <ChartAreaSkeleton variant="donut" />
      ) : (
        <DonutChart
          collapseAfter={collapseAfter}
          items={items}
          showLegend
          size="lg"
        />
      )}
    </div>
  </article>
);

export const DistributionCharts = ({
  breakdowns,
  streets,
  isLoading,
}: DistributionChartsProps) => {
  const loading = isLoading === true;
  const streetTotal = streets.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card className="overflow-hidden py-0" aria-label="Distribution charts">
      <CardHeader className="border-b border-border">
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon
            className="size-4 text-[var(--ring)]"
            aria-hidden="true"
          />
          Distributions
        </CardTitle>
        <CardDescription>
          Full breakdowns across suburbs, offences, vehicles, and enforcement
          outcomes. Every category is listed in the legend.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 p-4">
        <section className="rounded-[6px] border border-border bg-muted/30 p-4">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                All streets
              </h3>
              <p className="text-xs text-muted-foreground">
                {numberFmt.format(streets.length)} locations ·{" "}
                {numberFmt.format(streetTotal)} tickets
              </p>
            </div>
          </div>
          {loading ? (
            <ChartAreaSkeleton rows={10} variant="bars" />
          ) : (
            <Suspense fallback={<ChartAreaSkeleton rows={10} variant="bars" />}>
              <RankedBarChart items={streets} maxHeight={520} />
            </Suspense>
          )}
        </section>

        <div
          className={cn(
            "grid gap-4 sm:grid-cols-2 xl:grid-cols-3",
            "2xl:grid-cols-3"
          )}
        >
          <PieCard
            description="Share of tickets by suburb"
            isLoading={loading}
            items={breakdowns.suburbs}
            title="Suburbs"
          />
          <PieCard
            description="Every recorded offence type"
            isLoading={loading}
            items={breakdowns.offences}
            title="Offences"
          />
          <PieCard
            description="Council offence grouping"
            isLoading={loading}
            items={breakdowns.offenceCategories}
            title="Offence categories"
          />
          <PieCard
            description="Tickets by vehicle manufacturer"
            collapseAfter={12}
            isLoading={loading}
            items={breakdowns.vehicleMakes}
            title="Vehicle makes"
          />
          <PieCard
            description="Body type from the infringement feed"
            isLoading={loading}
            items={breakdowns.vehicleTypes}
            title="Vehicle types"
          />
          <PieCard
            description="Towed vs standard infringements"
            isLoading={loading}
            items={breakdowns.towed}
            title="Enforcement"
          />
        </div>
      </CardContent>
    </Card>
  );
};
