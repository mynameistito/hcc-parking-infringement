import type {
  ChartBreakdowns,
  FullDashboardMessage,
  TopItem,
  VehicleRankItem,
} from "@/contracts/public-api";
import { formatStreetSuburb } from "@/lib/format";
import { resolveOffenceDescription } from "@/lib/offence-catalog";

const toTopItems = (
  items: readonly { count: number; label: string }[]
): TopItem[] => items.map((item) => ({ count: item.count, label: item.label }));

const aggregateVehicleMakes = (
  vehicles: readonly VehicleRankItem[]
): TopItem[] => {
  const totals = new Map<string, number>();

  for (const vehicle of vehicles) {
    totals.set(vehicle.make, (totals.get(vehicle.make) ?? 0) + vehicle.count);
  }

  return [...totals.entries()]
    .toSorted((left, right) => right[1] - left[1])
    .map(([label, count]) => ({ count, label }));
};

const pickRicherTopItems = (
  primary: readonly TopItem[],
  secondary: readonly { count: number; label: string }[]
): TopItem[] => {
  if (secondary.length > primary.length) {
    return toTopItems(secondary);
  }

  return [...primary];
};

/**
 * Infringement fields used to aggregate chart categories.
 */
export interface InfringementChartRecord {
  isTowed: boolean;
  offenceCategory: string | null;
  offenceCode: string;
  offenceDescription: string;
  street: string;
  suburb: string | null;
  vehicleMake: string | null;
  vehicleType: string | null;
}

const incrementCount = (counts: Map<string, number>, key: string): void => {
  counts.set(key, (counts.get(key) ?? 0) + 1);
};

const mapToTopItems = (counts: Map<string, number>): TopItem[] =>
  [...counts.entries()]
    .toSorted((left, right) => right[1] - left[1])
    .map(([label, count]) => ({ count, label }));

/**
 * Combine category totals from two sets of breakdowns.
 * @param primary - First set of aggregated category counts.
 * @param secondary - Second set of aggregated category counts.
 * @returns The resulting `ChartBreakdowns` value.
 */
const mergeChartBreakdowns = (
  primary: ChartBreakdowns,
  secondary: ChartBreakdowns
): ChartBreakdowns => ({
  offenceCategories: pickRicherTopItems(
    primary.offenceCategories,
    secondary.offenceCategories
  ),
  offences: pickRicherTopItems(primary.offences, secondary.offences),
  suburbs: pickRicherTopItems(primary.suburbs, secondary.suburbs),
  towed: pickRicherTopItems(primary.towed, secondary.towed),
  vehicleMakes: pickRicherTopItems(
    primary.vehicleMakes,
    secondary.vehicleMakes
  ),
  vehicleTypes: pickRicherTopItems(
    primary.vehicleTypes,
    secondary.vehicleTypes
  ),
});

const chartCategoryLabel = (
  value: string | null,
  fallback = "Unknown"
): string => {
  const trimmed = value?.trim() ?? "";

  return trimmed.length === 0 ? fallback : trimmed;
};

interface ChartAggregation {
  breakdowns: ChartBreakdowns;
  streets: TopItem[];
}

/**
 * Aggregate infringement categories and street totals.
 * @param records - Source infringement records.
 * @returns The resulting `{ breakdowns: ChartBreakdowns; streets: TopItem[] }` value.
 */
export const buildChartBreakdownFromInfringements = (
  records: readonly InfringementChartRecord[]
): ChartAggregation => {
  const suburbs = new Map<string, number>();
  const offences = new Map<string, number>();
  const offenceCategories = new Map<string, number>();
  const vehicleMakes = new Map<string, number>();
  const vehicleTypes = new Map<string, number>();
  const streets = new Map<string, number>();
  let towed = 0;
  let notTowed = 0;

  for (const record of records) {
    const suburb = chartCategoryLabel(record.suburb);

    incrementCount(suburbs, suburb);

    const offenceLabel = resolveOffenceDescription(
      record.offenceCode,
      record.offenceDescription
    );

    incrementCount(offences, offenceLabel);

    const category = chartCategoryLabel(
      record.offenceCategory,
      "Uncategorised"
    );

    incrementCount(offenceCategories, category);

    const make = chartCategoryLabel(record.vehicleMake);

    incrementCount(vehicleMakes, make);

    const type = chartCategoryLabel(record.vehicleType);

    incrementCount(vehicleTypes, type);

    if (record.street.trim().length > 0 && record.street !== "Unknown") {
      const streetLabel = formatStreetSuburb(
        record.street,
        suburb === "Unknown" ? undefined : suburb
      );

      incrementCount(streets, streetLabel);
    }

    if (record.isTowed) {
      towed += 1;
    } else {
      notTowed += 1;
    }
  }

  const towedItems: TopItem[] = [];

  if (towed > 0) {
    towedItems.push({ count: towed, label: "Towed" });
  }

  if (notTowed > 0) {
    towedItems.push({ count: notTowed, label: "Not towed" });
  }

  return {
    breakdowns: {
      offenceCategories: mapToTopItems(offenceCategories),
      offences: mapToTopItems(offences),
      suburbs: mapToTopItems(suburbs),
      towed: towedItems,
      vehicleMakes: mapToTopItems(vehicleMakes),
      vehicleTypes: mapToTopItems(vehicleTypes),
    },
    streets: mapToTopItems(streets),
  };
};

/**
 *  Whether a breakdown payload has at least one chartable series.
 * @param breakdowns - Breakdowns supplied to this operation.
 * @returns Whether the requested condition holds.
 */
export const chartBreakdownsHasData = (
  breakdowns: ChartBreakdowns | undefined
): boolean => {
  if (breakdowns === undefined) {
    return false;
  }

  return Object.values(breakdowns).some((items) => items.length > 0);
};

/**
 *  Whether chart slices that require full-record aggregation are present.
 * @param breakdowns - Breakdowns supplied to this operation.
 * @returns Whether the requested condition holds.
 */
export const chartBreakdownsFullyPopulated = (
  breakdowns: ChartBreakdowns | undefined
): boolean => {
  if (breakdowns === undefined) {
    return false;
  }

  return (
    breakdowns.offenceCategories.length > 0 &&
    breakdowns.vehicleTypes.length > 0 &&
    breakdowns.towed.length > 0
  );
};

/**
 * Fill chart breakdowns from legacy snapshot fields when older caches omit
 * `chartBreakdowns` (seed exports, IndexedDB, DO snapshot cache).
 * @param message - Validated dashboard snapshot.
 * @returns The resulting `ChartBreakdowns` value.
 */
export const resolveChartBreakdowns = (
  message: FullDashboardMessage
): ChartBreakdowns => {
  const existing = message.chartBreakdowns;

  const derived: ChartBreakdowns = {
    offenceCategories: existing?.offenceCategories ?? [],
    offences: pickRicherTopItems(message.topOffences, existing?.offences ?? []),
    suburbs: pickRicherTopItems(message.suburbs, existing?.suburbs ?? []),
    towed: existing?.towed ?? [],
    vehicleMakes:
      existing !== undefined && existing.vehicleMakes.length > 0
        ? existing.vehicleMakes
        : aggregateVehicleMakes(message.vehicles),
    vehicleTypes: existing?.vehicleTypes ?? [],
  };

  if (existing === undefined) {
    return derived;
  }

  return mergeChartBreakdowns(derived, existing);
};

/**
 *  Prefer the ranked street list with the most rows for bar charts.
 * @param message - Validated dashboard snapshot.
 * @returns The resulting `TopItem[]` value.
 */
export const resolveChartStreetItems = (
  message: FullDashboardMessage
): TopItem[] => {
  const fromRankedStreets = toTopItems(message.streets);
  const fromTopStreets = message.topStreets;

  if (fromRankedStreets.length > fromTopStreets.length) {
    return fromRankedStreets;
  }

  if (fromTopStreets.length > fromRankedStreets.length) {
    return fromTopStreets;
  }

  const rankedTotal = fromRankedStreets.reduce(
    (sum, item) => sum + item.count,
    0
  );

  const topTotal = fromTopStreets.reduce((sum, item) => sum + item.count, 0);

  return rankedTotal >= topTotal ? fromRankedStreets : fromTopStreets;
};
