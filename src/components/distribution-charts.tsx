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
  <Card className="gap-3 bg-background py-4">
    <CardHeader className="px-4">
      <CardTitle>
        <h3>{title}</h3>
      </CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent className="px-4">
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
    </CardContent>
  </Card>
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
        <Card className="gap-3 bg-muted/30 py-4">
          <CardHeader className="px-4">
            <CardTitle>
              <h3>All streets</h3>
            </CardTitle>
            <CardDescription>
              {numberFmt.format(streets.length)} locations ·{" "}
              {numberFmt.format(streetTotal)} tickets
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4">
            {loading ? (
              <ChartAreaSkeleton rows={10} variant="bars" />
            ) : (
              <Suspense
                fallback={<ChartAreaSkeleton rows={10} variant="bars" />}
              >
                <RankedBarChart items={streets} maxHeight={520} />
              </Suspense>
            )}
          </CardContent>
        </Card>

        <div
          className={cn(
            "grid gap-4 lg:grid-cols-2 xl:grid-cols-3",
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
