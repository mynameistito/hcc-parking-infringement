import { parsePublicDashboardSnapshotJson } from "@/contracts/dashboard-snapshot.ts";
import type {
  ChartBreakdowns,
  DailyStatPoint,
  FullDashboardMessage,
  LocationRankItem,
  PublicInfringement,
  PublicLiveStats,
  TopItem,
  VehicleRankItem,
} from "@/contracts/public-api.ts";
import {
  addDaysInAuckland,
  nowInAucklandIso,
  todayInAuckland,
} from "@/lib/auckland-time.ts";
import { buildChartBreakdownFromInfringements } from "@/lib/chart-breakdowns.ts";
import { PACE_DAILY_TREND_DAYS } from "@/lib/pace-constants.ts";
import { rollingCalendarWindowStart } from "@/lib/rolling-window.ts";
import { comparePeriods } from "@/lib/trend-window.ts";
import type { CleanInfringement } from "@/server/clean-schema.ts";
import { cleanInfringements } from "@/server/clean.ts";
import { fetchAllInWindow, formatHccFetchError } from "@/server/hcc-client.ts";
import { readSeedManifest } from "@/server/seed-import.ts";
import type { SeedManifest } from "@/server/seed-manifest.ts";
import {
  DASHBOARD_SNAPSHOT_FILE,
  MANIFEST_FILE,
  SEED_MANIFEST_VERSION,
  seedObjectKey,
} from "@/server/seed-manifest.ts";
import {
  readSeedObjectText,
  writeSeedObjectText,
} from "@/server/seed-r2-client.ts";

const DEFAULT_REFRESH_DAYS = 400;
const RECENT_SEED_CHUNK = "infringements-recent.ndjson";
const RANK_LIMIT = 50;
const RECENT_LIMIT = 50;

interface ExistingSeedState {
  readonly manifest: SeedManifest | null;
  readonly prefix: string;
  readonly snapshotLive: PublicLiveStats | null;
}

export interface RefreshLiveSeedResult {
  readonly from: string;
  readonly skipped: number;
  readonly to: string;
  readonly totalRecentRecords: number;
}

const parseRefreshDays = (value: string | undefined): number => {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return DEFAULT_REFRESH_DAYS;
  }

  return Math.min(parsed, PACE_DAILY_TREND_DAYS);
};

const toDateKey = (record: CleanInfringement): string =>
  record.occurredAt.slice(0, 10);

const incrementRank = <T extends string>(
  counts: Map<T, number>,
  key: T | null
): void => {
  if (key === null || key.trim().length === 0 || key === "Unknown") {
    return;
  }

  counts.set(key, (counts.get(key) ?? 0) + 1);
};

const topItemsFromMap = (
  counts: Map<string, number>,
  limit: number
): TopItem[] =>
  [...counts.entries()]
    .toSorted((left, right) => right[1] - left[1])
    .slice(0, limit)
    .map(([label, count]) => ({ count, label }));

const locationItemsFromMap = (
  counts: Map<string, number>,
  limit: number,
  toLocation: (label: string, count: number) => LocationRankItem
): LocationRankItem[] =>
  [...counts.entries()]
    .toSorted((left, right) => right[1] - left[1])
    .slice(0, limit)
    .map(([label, count]) => toLocation(label, count));

const vehicleKey = (record: CleanInfringement): string | null => {
  if (record.vehicleMake === null || record.vehicleMake.trim().length === 0) {
    return null;
  }

  return `${record.vehicleMake}\u0000${record.vehicleModel ?? "Unknown"}`;
};

const buildVehicles = (
  records: readonly CleanInfringement[]
): VehicleRankItem[] => {
  const counts = new Map<string, number>();
  for (const record of records) {
    incrementRank(counts, vehicleKey(record));
  }

  return [...counts.entries()]
    .toSorted((left, right) => right[1] - left[1])
    .slice(0, RANK_LIMIT)
    .map(([key, count]) => {
      const [make, model] = key.split("\u0000");
      const safeMake = make ?? "Unknown";
      const safeModel = model ?? "Unknown";
      return {
        count,
        label: `${safeMake} ${safeModel}`.trim(),
        make: safeMake,
        model: safeModel,
      };
    });
};

const buildDailyTrend = (
  records: readonly CleanInfringement[],
  from: string,
  to: string
): DailyStatPoint[] => {
  const counts = new Map<string, { count: number; totalCents: number }>();
  for (const record of records) {
    const date = toDateKey(record);
    const current = counts.get(date) ?? { count: 0, totalCents: 0 };
    counts.set(date, {
      count: current.count + 1,
      totalCents: current.totalCents + record.amountCents,
    });
  }

  const trend: DailyStatPoint[] = [];
  let cursor = from;
  while (cursor <= to) {
    const point = counts.get(cursor) ?? { count: 0, totalCents: 0 };
    trend.push({
      count: point.count,
      date: cursor,
      totalCents: point.totalCents,
    });
    cursor = addDaysInAuckland(cursor, 1);
  }

  return trend;
};

const countSinceDate = (
  records: readonly CleanInfringement[],
  startDate: string
): number => records.filter((record) => toDateKey(record) >= startDate).length;

const countSinceInstant = (
  records: readonly CleanInfringement[],
  since: number
): number =>
  records.filter((record) => Date.parse(record.occurredAt) >= since).length;

const projectPublicInfringement = (
  record: CleanInfringement
): PublicInfringement => ({
  amountCents: record.amountCents,
  infringementNumber: record.infringementNumber,
  isTowed: record.isTowed,
  occurredAt: record.occurredAt,
  offenceDescription: record.offenceDescription,
  street: record.street,
  suburb: record.suburb,
  town: record.town,
  vehicleColour: record.vehicleColour,
  vehicleMake: record.vehicleMake,
  vehicleModel: record.vehicleModel,
  vehicleType: record.vehicleType,
});

const uniqueByInfringementNumber = (
  records: readonly CleanInfringement[]
): CleanInfringement[] => {
  const byNumber = new Map<number, CleanInfringement>();
  for (const record of records) {
    byNumber.set(record.infringementNumber, record);
  }

  return [...byNumber.values()].toSorted(
    (left, right) => Date.parse(right.occurredAt) - Date.parse(left.occurredAt)
  );
};

const buildLiveStats = (options: {
  readonly existing: PublicLiveStats | null;
  readonly records: readonly CleanInfringement[];
  readonly today: string;
  readonly syncedAt: string;
}): PublicLiveStats => {
  const recentAmountCents = options.records.reduce(
    (sum, record) => sum + record.amountCents,
    0
  );
  const [lastRecord] = options.records;
  const last24hStart = Date.now() - 24 * 60 * 60 * 1000;
  const last7dStart = rollingCalendarWindowStart(new Date(), 7);
  const last30dStart = rollingCalendarWindowStart(new Date(), 30);
  const last365dStart = rollingCalendarWindowStart(new Date(), 365);
  const thisMonthStart = `${options.today.slice(0, 7)}-01`;
  const todayRecords = options.records.filter(
    (record) => toDateKey(record) === options.today
  );

  return {
    allTimeAmountCents: Math.max(
      options.existing?.allTimeAmountCents ?? 0,
      recentAmountCents
    ),
    allTimeTotal: Math.max(
      options.existing?.allTimeTotal ?? 0,
      options.records.length
    ),
    last24h: countSinceInstant(options.records, last24hStart),
    last30d: countSinceDate(options.records, last30dStart),
    last365d: countSinceDate(options.records, last365dStart),
    last7d: countSinceDate(options.records, last7dStart),
    lastRecordAt:
      lastRecord?.occurredAt ?? options.existing?.lastRecordAt ?? null,
    lastSyncedAt: options.syncedAt,
    thisMonth: countSinceDate(options.records, thisMonthStart),
    today: todayRecords.length,
    towedToday: todayRecords.filter((record) => record.isTowed).length,
  };
};

export const buildLiveSeedSnapshot = (options: {
  readonly existingLive: PublicLiveStats | null;
  readonly from: string;
  readonly records: readonly CleanInfringement[];
  readonly syncedAt: string;
  readonly to: string;
}): FullDashboardMessage => {
  const records = uniqueByInfringementNumber(options.records);
  const dailyTrend = buildDailyTrend(records, options.from, options.to);
  const streetCounts = new Map<string, number>();
  const suburbCounts = new Map<string, number>();
  const offenceCounts = new Map<string, number>();

  for (const record of records) {
    incrementRank(streetCounts, record.street);
    incrementRank(suburbCounts, record.suburb);
    incrementRank(offenceCounts, record.offenceDescription);
  }

  const chart = buildChartBreakdownFromInfringements(records);
  const topStreets = chart.streets.slice(0, RANK_LIMIT);
  const topOffences = topItemsFromMap(offenceCounts, RANK_LIMIT);
  const chartBreakdowns: ChartBreakdowns = {
    ...chart.breakdowns,
    offences: chart.breakdowns.offences.slice(0, RANK_LIMIT),
    suburbs: chart.breakdowns.suburbs.slice(0, RANK_LIMIT),
  };

  return {
    at: options.syncedAt,
    chartBreakdowns,
    dailyTrend,
    live: buildLiveStats({
      existing: options.existingLive,
      records,
      syncedAt: options.syncedAt,
      today: options.to,
    }),
    map: { pendingGeocode: 0, routes: [] },
    paceTrends: {
      last30d: comparePeriods(dailyTrend, 30),
      last365d: comparePeriods(dailyTrend, 365),
      last7d: comparePeriods(dailyTrend, 7),
    },
    recentInfringements: records
      .slice(0, RECENT_LIMIT)
      .map(projectPublicInfringement),
    streets: locationItemsFromMap(streetCounts, RANK_LIMIT, (label, count) => ({
      count,
      label,
      street: label,
    })),
    suburbs: locationItemsFromMap(suburbCounts, RANK_LIMIT, (label, count) => ({
      count,
      label,
      suburb: label,
    })),
    topOffences,
    topStreets,
    type: "full",
    vehicles: buildVehicles(records),
  };
};

const loadExistingSeedState = async (env: Env): Promise<ExistingSeedState> => {
  try {
    const { manifest, prefix } = await readSeedManifest(env);
    const snapshotKey =
      manifest.dashboardSnapshotKey ?? DASHBOARD_SNAPSHOT_FILE;
    const snapshotRaw = await readSeedObjectText(
      env,
      seedObjectKey(prefix, snapshotKey)
    );
    const snapshotLive =
      snapshotRaw === null
        ? null
        : (parsePublicDashboardSnapshotJson(snapshotRaw)?.live ?? null);

    return { manifest, prefix, snapshotLive };
  } catch {
    const prefix = env.PARKING_STORE_SEED_PREFIX;
    return {
      manifest: null,
      prefix:
        typeof prefix === "string" && prefix.length > 0
          ? prefix
          : "parking-store/v1/",
      snapshotLive: null,
    };
  }
};

const buildManifest = (options: {
  readonly existing: SeedManifest | null;
  readonly exportedAt: string;
  readonly recordCount: number;
}): SeedManifest => {
  const historicalChunks =
    options.existing?.infringementChunks.filter(
      (chunk) => chunk !== RECENT_SEED_CHUNK
    ) ?? [];

  return {
    dashboardSnapshotKey: DASHBOARD_SNAPSHOT_FILE,
    exportedAt: options.exportedAt,
    infringementChunks: [...historicalChunks, RECENT_SEED_CHUNK],
    source: "hcc-open-data-worker-refresh",
    totalInfringements: Math.max(
      options.existing?.totalInfringements ?? 0,
      options.recordCount
    ),
    version: SEED_MANIFEST_VERSION,
    watermarksKey: options.existing?.watermarksKey,
  };
};

const toNdjson = (records: readonly CleanInfringement[]): string =>
  `${records.map((record) => JSON.stringify(record)).join("\n")}\n`;

export const refreshLiveSeedFromHcc = async (
  env: Env
): Promise<RefreshLiveSeedResult> => {
  const days = parseRefreshDays(env.PARKING_AUTO_REFRESH_DAYS);
  const to = todayInAuckland();
  const from = rollingCalendarWindowStart(new Date(), days);
  const fetched = await fetchAllInWindow(env, from, to);
  if (!fetched.ok) {
    throw new Error(formatHccFetchError(fetched.error));
  }

  const { cleaned, skipped } = cleanInfringements(fetched.value.records);
  const records = uniqueByInfringementNumber(cleaned);
  const existing = await loadExistingSeedState(env);
  const syncedAt = nowInAucklandIso();
  const snapshot = buildLiveSeedSnapshot({
    existingLive: existing.snapshotLive,
    from,
    records,
    syncedAt,
    to,
  });
  const manifest = buildManifest({
    existing: existing.manifest,
    exportedAt: syncedAt,
    recordCount: records.length,
  });

  await writeSeedObjectText(
    env,
    seedObjectKey(existing.prefix, RECENT_SEED_CHUNK),
    toNdjson(records),
    "application/x-ndjson; charset=utf-8"
  );
  await writeSeedObjectText(
    env,
    seedObjectKey(existing.prefix, DASHBOARD_SNAPSHOT_FILE),
    `${JSON.stringify(snapshot)}\n`
  );
  await writeSeedObjectText(
    env,
    seedObjectKey(existing.prefix, MANIFEST_FILE),
    `${JSON.stringify(manifest, null, 2)}\n`
  );

  return {
    from,
    skipped,
    to,
    totalRecentRecords: records.length,
  };
};
