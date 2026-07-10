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
const REFRESH_CURSOR_FILE = "refresh-cursor.json";
export const SEED_REFRESH_CHUNK_PREFIX = "infringements-refresh-";
const RANK_LIMIT = 50;
const RECENT_LIMIT = 50;

interface ExistingSeedState {
  readonly bootstrapAfter: string | null;
  readonly manifest: SeedManifest | null;
  readonly prefix: string;
  readonly publishedInfringementNumbers: number[];
  readonly snapshotLive: PublicLiveStats | null;
}

export interface LiveSeedRefreshWindow {
  readonly end: string;
  readonly start: string;
}

export interface LiveSeedRefreshChunkSummary {
  readonly amountCents: number;
  readonly chartOffenceCategories: [string, number][];
  readonly chartOffences: [string, number][];
  readonly chartStreets: [string, number][];
  readonly chartSuburbs: [string, number][];
  readonly chartTowed: [string, number][];
  readonly chartVehicleMakes: [string, number][];
  readonly chartVehicleTypes: [string, number][];
  readonly chunk: string;
  readonly dailyTrend: DailyStatPoint[];
  readonly last24h: number;
  readonly last30d: number;
  readonly last365d: number;
  readonly last7d: number;
  readonly lastRecordAt: string | null;
  readonly infringementNumbers: number[];
  readonly newAmountCents: number;
  readonly newRecords: number;
  readonly recentInfringements: PublicInfringement[];
  readonly records: number;
  readonly skipped: number;
  readonly streetCounts: [string, number][];
  readonly suburbCounts: [string, number][];
  readonly thisMonth: number;
  readonly today: number;
  readonly topOffences: [string, number][];
  readonly towedToday: number;
  readonly vehicles: [string, number][];
}

export interface LiveSeedRefreshPlan {
  readonly bootstrapAfter: string | null;
  readonly existingLive: PublicLiveStats | null;
  readonly existingManifest: SeedManifest | null;
  readonly from: string;
  readonly prefix: string;
  readonly publishedInfringementNumbers: number[];
  readonly syncedAt: string;
  readonly to: string;
  readonly windows: LiveSeedRefreshWindow[];
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

const mapEntries = (counts: Map<string, number>): [string, number][] => [
  ...counts.entries(),
];

const topItemEntries = (items: readonly TopItem[]): [string, number][] =>
  items.map((item) => [item.label, item.count]);

const mergeEntryCounts = (
  target: Map<string, number>,
  entries: readonly (readonly [string, number])[]
): void => {
  for (const [key, count] of entries) {
    target.set(key, (target.get(key) ?? 0) + count);
  }
};

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

const vehiclesFromMap = (
  counts: Map<string, number>,
  limit: number
): VehicleRankItem[] =>
  [...counts.entries()]
    .toSorted((left, right) => right[1] - left[1])
    .slice(0, limit)
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

const latestInstant = (
  left: string | null,
  right: string | null
): string | null => {
  if (left === null) {
    return right;
  }
  if (right === null) {
    return left;
  }

  return Date.parse(right) > Date.parse(left) ? right : left;
};

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

const sortRecentPublicInfringements = (
  records: readonly PublicInfringement[]
): PublicInfringement[] =>
  [...records].toSorted(
    (left, right) => Date.parse(right.occurredAt) - Date.parse(left.occurredAt)
  );

const readRefreshCursor = async (
  env: Env,
  prefix: string
): Promise<number[] | null> => {
  const cursorRaw = await readSeedObjectText(
    env,
    seedObjectKey(prefix, REFRESH_CURSOR_FILE)
  );
  if (cursorRaw === null) {
    return null;
  }

  const parsed: unknown = JSON.parse(cursorRaw);
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("version" in parsed) ||
    parsed.version !== 2 ||
    !("publishedInfringementNumbers" in parsed)
  ) {
    return null;
  }

  const candidate: unknown = parsed.publishedInfringementNumbers;
  if (!Array.isArray(candidate)) {
    return null;
  }

  const values: unknown[] = candidate;
  if (
    !values.every(
      (value): value is number =>
        typeof value === "number" && Number.isSafeInteger(value)
    )
  ) {
    return null;
  }

  return values;
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
    const snapshot =
      snapshotRaw === null
        ? null
        : parsePublicDashboardSnapshotJson(snapshotRaw);
    const snapshotLive = snapshot?.live ?? null;
    let publishedInfringementNumbers: number[] = [];
    try {
      publishedInfringementNumbers =
        (await readRefreshCursor(env, prefix)) ?? [];
    } catch {
      // A malformed cursor must not discard the valid manifest or snapshot.
    }
    const bootstrapAfter =
      publishedInfringementNumbers.length === 0
        ? (snapshotLive?.lastRecordAt ?? null)
        : null;

    return {
      bootstrapAfter,
      manifest,
      prefix,
      publishedInfringementNumbers,
      snapshotLive,
    };
  } catch {
    const prefix = env.PARKING_STORE_SEED_PREFIX;
    return {
      bootstrapAfter: null,
      manifest: null,
      prefix:
        typeof prefix === "string" && prefix.length > 0
          ? prefix
          : "parking-store/v1/",
      publishedInfringementNumbers: [],
      snapshotLive: null,
    };
  }
};

const buildManifest = (options: {
  readonly existing: SeedManifest | null;
  readonly exportedAt: string;
  readonly infringementChunks?: readonly string[];
  readonly recordCount: number;
}): SeedManifest => {
  const historicalChunks =
    options.existing?.infringementChunks.filter(
      (chunk) =>
        chunk !== RECENT_SEED_CHUNK &&
        !chunk.startsWith(SEED_REFRESH_CHUNK_PREFIX)
    ) ?? [];

  return {
    dashboardSnapshotKey: DASHBOARD_SNAPSHOT_FILE,
    exportedAt: options.exportedAt,
    infringementChunks: [
      ...historicalChunks,
      ...(options.infringementChunks ?? [RECENT_SEED_CHUNK]),
    ],
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

export const planLiveSeedRefresh = async (
  env: Env,
  chunkDays = 7
): Promise<LiveSeedRefreshPlan> => {
  const days = parseRefreshDays(env.PARKING_AUTO_REFRESH_DAYS);
  const to = todayInAuckland();
  const from = rollingCalendarWindowStart(new Date(), days);
  const existing = await loadExistingSeedState(env);
  const windows: LiveSeedRefreshWindow[] = [];
  const span = Math.max(1, Math.floor(chunkDays));
  let cursor = from;

  while (cursor <= to) {
    const end = addDaysInAuckland(cursor, span - 1);
    const windowEnd = end > to ? to : end;
    windows.push({ end: windowEnd, start: cursor });
    cursor = addDaysInAuckland(windowEnd, 1);
  }

  return {
    bootstrapAfter: existing.bootstrapAfter,
    existingLive: existing.snapshotLive,
    existingManifest: existing.manifest,
    from,
    prefix: existing.prefix,
    publishedInfringementNumbers: existing.publishedInfringementNumbers,
    syncedAt: nowInAucklandIso(),
    to,
    windows,
  };
};

export const refreshLiveSeedChunkFromHcc = async (
  env: Env,
  options: {
    readonly bootstrapAfter: string | null;
    readonly chunk: string;
    readonly prefix: string;
    readonly publishedInfringementNumbers: readonly number[];
    readonly syncedAt: string;
    readonly to: string;
    readonly window: LiveSeedRefreshWindow;
  }
): Promise<LiveSeedRefreshChunkSummary> => {
  const fetched = await fetchAllInWindow(
    env,
    options.window.start,
    options.window.end
  );
  if (!fetched.ok) {
    throw new Error(formatHccFetchError(fetched.error));
  }

  const { cleaned, skipped } = cleanInfringements(fetched.value.records);
  const records = uniqueByInfringementNumber(cleaned);
  const published = new Set(options.publishedInfringementNumbers);
  const newRecords = records.filter(
    (record) =>
      !published.has(record.infringementNumber) &&
      (options.bootstrapAfter === null ||
        record.occurredAt > options.bootstrapAfter)
  );
  const todayRecords = records.filter(
    (record) => toDateKey(record) === options.to
  );
  const last24hStart = Date.now() - 24 * 60 * 60 * 1000;
  const last7dStart = rollingCalendarWindowStart(new Date(), 7);
  const last30dStart = rollingCalendarWindowStart(new Date(), 30);
  const last365dStart = rollingCalendarWindowStart(new Date(), 365);
  const thisMonthStart = `${options.to.slice(0, 7)}-01`;
  const streetCounts = new Map<string, number>();
  const suburbCounts = new Map<string, number>();
  const offenceCounts = new Map<string, number>();
  const vehicleCounts = new Map<string, number>();

  for (const record of records) {
    incrementRank(streetCounts, record.street);
    incrementRank(suburbCounts, record.suburb);
    incrementRank(offenceCounts, record.offenceDescription);
    incrementRank(vehicleCounts, vehicleKey(record));
  }

  const chart = buildChartBreakdownFromInfringements(records);
  await writeSeedObjectText(
    env,
    seedObjectKey(options.prefix, options.chunk),
    toNdjson(records),
    "application/x-ndjson; charset=utf-8"
  );

  return {
    amountCents: records.reduce((sum, record) => sum + record.amountCents, 0),
    chartOffenceCategories: topItemEntries(chart.breakdowns.offenceCategories),
    chartOffences: topItemEntries(chart.breakdowns.offences),
    chartStreets: topItemEntries(chart.streets),
    chartSuburbs: topItemEntries(chart.breakdowns.suburbs),
    chartTowed: topItemEntries(chart.breakdowns.towed),
    chartVehicleMakes: topItemEntries(chart.breakdowns.vehicleMakes),
    chartVehicleTypes: topItemEntries(chart.breakdowns.vehicleTypes),
    chunk: options.chunk,
    dailyTrend: buildDailyTrend(
      records,
      options.window.start,
      options.window.end
    ),
    infringementNumbers: records.map((record) => record.infringementNumber),
    last24h: countSinceInstant(records, last24hStart),
    last30d: countSinceDate(records, last30dStart),
    last365d: countSinceDate(records, last365dStart),
    last7d: countSinceDate(records, last7dStart),
    lastRecordAt: records[0]?.occurredAt ?? null,
    newAmountCents: newRecords.reduce(
      (sum, record) => sum + record.amountCents,
      0
    ),
    newRecords: newRecords.length,
    recentInfringements: records
      .slice(0, RECENT_LIMIT)
      .map(projectPublicInfringement),
    records: records.length,
    skipped,
    streetCounts: mapEntries(streetCounts),
    suburbCounts: mapEntries(suburbCounts),
    thisMonth: countSinceDate(records, thisMonthStart),
    today: todayRecords.length,
    topOffences: mapEntries(offenceCounts),
    towedToday: todayRecords.filter((record) => record.isTowed).length,
    vehicles: mapEntries(vehicleCounts),
  };
};

export const finalizeLiveSeedRefresh = async (
  env: Env,
  options: {
    readonly existingLive: PublicLiveStats | null;
    readonly existingManifest: SeedManifest | null;
    readonly from: string;
    readonly prefix: string;
    readonly publishedInfringementNumbers: readonly number[];
    readonly summaries: readonly LiveSeedRefreshChunkSummary[];
    readonly syncedAt: string;
    readonly to: string;
  }
): Promise<RefreshLiveSeedResult> => {
  const dailyCounts = new Map<string, { count: number; totalCents: number }>();
  const streetCounts = new Map<string, number>();
  const suburbCounts = new Map<string, number>();
  const offenceCounts = new Map<string, number>();
  const vehicleCounts = new Map<string, number>();
  const chartOffenceCategories = new Map<string, number>();
  const chartOffences = new Map<string, number>();
  const chartStreets = new Map<string, number>();
  const chartSuburbs = new Map<string, number>();
  const chartTowed = new Map<string, number>();
  const chartVehicleMakes = new Map<string, number>();
  const chartVehicleTypes = new Map<string, number>();
  const recent: PublicInfringement[] = [];
  let amountCents = 0;
  let last24h = 0;
  let last30d = 0;
  let last365d = 0;
  let last7d = 0;
  let lastRecordAt: string | null = null;
  let records = 0;
  let newAmountCents = 0;
  let newRecords = 0;
  const publishedInfringementNumbers = new Set(
    options.publishedInfringementNumbers
  );
  let skipped = 0;
  let thisMonth = 0;
  let today = 0;
  let towedToday = 0;

  for (const summary of options.summaries) {
    amountCents += summary.amountCents;
    last24h += summary.last24h;
    last30d += summary.last30d;
    last365d += summary.last365d;
    last7d += summary.last7d;
    lastRecordAt = latestInstant(lastRecordAt, summary.lastRecordAt);
    records += summary.records;
    newAmountCents += summary.newAmountCents;
    newRecords += summary.newRecords;
    for (const infringementNumber of summary.infringementNumbers) {
      publishedInfringementNumbers.add(infringementNumber);
    }
    skipped += summary.skipped;
    thisMonth += summary.thisMonth;
    today += summary.today;
    towedToday += summary.towedToday;
    recent.push(...summary.recentInfringements);
    mergeEntryCounts(streetCounts, summary.streetCounts);
    mergeEntryCounts(suburbCounts, summary.suburbCounts);
    mergeEntryCounts(offenceCounts, summary.topOffences);
    mergeEntryCounts(vehicleCounts, summary.vehicles);
    mergeEntryCounts(chartOffenceCategories, summary.chartOffenceCategories);
    mergeEntryCounts(chartOffences, summary.chartOffences);
    mergeEntryCounts(chartStreets, summary.chartStreets);
    mergeEntryCounts(chartSuburbs, summary.chartSuburbs);
    mergeEntryCounts(chartTowed, summary.chartTowed);
    mergeEntryCounts(chartVehicleMakes, summary.chartVehicleMakes);
    mergeEntryCounts(chartVehicleTypes, summary.chartVehicleTypes);

    for (const point of summary.dailyTrend) {
      const current = dailyCounts.get(point.date) ?? {
        count: 0,
        totalCents: 0,
      };
      dailyCounts.set(point.date, {
        count: current.count + point.count,
        totalCents: current.totalCents + point.totalCents,
      });
    }
  }

  const dailyTrend: DailyStatPoint[] = [];
  let cursor = options.from;
  while (cursor <= options.to) {
    const point = dailyCounts.get(cursor) ?? { count: 0, totalCents: 0 };
    dailyTrend.push({
      count: point.count,
      date: cursor,
      totalCents: point.totalCents,
    });
    cursor = addDaysInAuckland(cursor, 1);
  }

  const snapshot: FullDashboardMessage = {
    at: options.syncedAt,
    chartBreakdowns: {
      offenceCategories: topItemsFromMap(chartOffenceCategories, RANK_LIMIT),
      offences: topItemsFromMap(chartOffences, RANK_LIMIT),
      suburbs: topItemsFromMap(chartSuburbs, RANK_LIMIT),
      towed: topItemsFromMap(chartTowed, RANK_LIMIT),
      vehicleMakes: topItemsFromMap(chartVehicleMakes, RANK_LIMIT),
      vehicleTypes: topItemsFromMap(chartVehicleTypes, RANK_LIMIT),
    },
    dailyTrend,
    live: {
      allTimeAmountCents:
        options.existingLive === null
          ? amountCents
          : options.existingLive.allTimeAmountCents + newAmountCents,
      allTimeTotal:
        options.existingLive === null
          ? records
          : options.existingLive.allTimeTotal + newRecords,
      last24h,
      last30d,
      last365d,
      last7d,
      lastRecordAt: lastRecordAt ?? options.existingLive?.lastRecordAt ?? null,
      lastSyncedAt: options.syncedAt,
      thisMonth,
      today,
      towedToday,
    },
    map: { pendingGeocode: 0, routes: [] },
    paceTrends: {
      last30d: comparePeriods(dailyTrend, 30),
      last365d: comparePeriods(dailyTrend, 365),
      last7d: comparePeriods(dailyTrend, 7),
    },
    recentInfringements: sortRecentPublicInfringements(recent).slice(
      0,
      RECENT_LIMIT
    ),
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
    topOffences: topItemsFromMap(offenceCounts, RANK_LIMIT),
    topStreets: topItemsFromMap(chartStreets, RANK_LIMIT),
    type: "full",
    vehicles: vehiclesFromMap(vehicleCounts, RANK_LIMIT),
  };
  const refreshedChunks = options.summaries.map((summary) => summary.chunk);
  const historicalChunks =
    options.existingManifest?.infringementChunks.filter(
      (chunk) =>
        chunk !== RECENT_SEED_CHUNK &&
        !chunk.startsWith(SEED_REFRESH_CHUNK_PREFIX)
    ) ?? [];
  const manifest = buildManifest({
    existing: {
      dashboardSnapshotKey: DASHBOARD_SNAPSHOT_FILE,
      exportedAt: options.syncedAt,
      infringementChunks: historicalChunks,
      source:
        options.existingManifest?.source ?? "hcc-open-data-worker-refresh",
      totalInfringements:
        options.existingManifest === null
          ? records
          : options.existingManifest.totalInfringements + newRecords,
      version: SEED_MANIFEST_VERSION,
      watermarksKey: options.existingManifest?.watermarksKey,
    },
    exportedAt: options.syncedAt,
    infringementChunks: refreshedChunks,
    recordCount: records,
  });

  await writeSeedObjectText(
    env,
    seedObjectKey(options.prefix, DASHBOARD_SNAPSHOT_FILE),
    `${JSON.stringify(snapshot)}\n`
  );
  await writeSeedObjectText(
    env,
    seedObjectKey(options.prefix, MANIFEST_FILE),
    `${JSON.stringify(manifest, null, 2)}\n`
  );
  await writeSeedObjectText(
    env,
    seedObjectKey(options.prefix, REFRESH_CURSOR_FILE),
    `${JSON.stringify({
      publishedInfringementNumbers: [...publishedInfringementNumbers],
      updatedAt: options.syncedAt,
      version: 2,
    })}\n`
  );

  return {
    from: options.from,
    skipped,
    to: options.to,
    totalRecentRecords: records,
  };
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
