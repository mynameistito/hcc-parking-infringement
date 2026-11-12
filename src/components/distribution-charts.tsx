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
  collapseAfter = 7,
}: PieCardProps) => (
  <Card variant="plain">
    <CardHeader>
      <CardTitle>
        <h3>{title}</h3>
      </CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent>
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

/**
 * Display the street ranking and category distributions.
 * @returns The rendered interface for the supplied data.
 */
export const DistributionCharts = ({
  breakdowns,
  streets,
  isLoading,
}: DistributionChartsProps) => {
  const loading = isLoading === true;
  const streetTotal = streets.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card
      variant="panel"
      className="overflow-hidden"
      aria-label="Distribution charts"
    >
      <CardHeader variant="panel">
        <CardTitle icon>
          <PieChartIcon className="text-ring size-4" aria-hidden="true" />
          <h2 className="text-lg">Street and vehicle breakdowns</h2>
        </CardTitle>
        <CardDescription>
          Full breakdowns across suburbs, offences, vehicles, and enforcement
          outcomes. Smaller categories are grouped as Other.
        </CardDescription>
      </CardHeader>
      <CardContent variant="grid">
        <Card variant="inset">
          <CardHeader>
            <CardTitle>
              <h3>All streets</h3>
            </CardTitle>
            <CardDescription>
              {numberFmt.format(streets.length)} locations ·{" "}
              {numberFmt.format(streetTotal)} tickets
            </CardDescription>
          </CardHeader>
          <CardContent>
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

        <div className={cn("grid gap-4 xl:grid-cols-2", "2xl:grid-cols-2")}>
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
            collapseAfter={7}
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
