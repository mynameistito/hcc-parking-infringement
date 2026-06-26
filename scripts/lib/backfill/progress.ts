/** Terminal formatting for backfill progress output. */

import type {
  BackfillHealth,
  BackfillProgress,
} from "@scripts/lib/backfill/schemas.ts";

const formatWindowLabel = (
  start: string | undefined,
  end: string | undefined
): string => {
  if (start === undefined || end === undefined) {
    return "waiting…";
  }
  if (start === end) {
    return start;
  }
  return `${start} → ${end}`;
};

const renderBar = (percent: number, width = 28): string => {
  const filled = Math.round((percent / 100) * width);
  return `[${"█".repeat(filled)}${"░".repeat(width - filled)}]`;
};

/** Format integers with NZ locale grouping. */
export const formatNumber = (value: number): string =>
  value.toLocaleString("en-NZ");

/** Single-line progress summary when `/sync/backfill/progress` is available. */
export const renderProgressLine = (progress: BackfillProgress): string => {
  const bar = renderBar(progress.percent);
  const windowLabel =
    progress.latestWindow === null
      ? "waiting…"
      : formatWindowLabel(
          progress.latestWindow.start,
          progress.latestWindow.end
        );

  return [
    bar,
    `${progress.percent.toFixed(1)}%`,
    `${formatNumber(progress.completed)}/${formatNumber(progress.total)} windows`,
    `${formatNumber(progress.totalRecords)} records`,
    `latest ${windowLabel}`,
  ].join("  ");
};

/** Single-line fallback summary when polling `/api/v1/status` instead. */
export const renderFallbackLine = (options: {
  baselineRecords: number;
  baselineWindows: number;
  expectedTotal: number;
  health: BackfillHealth;
}): string => {
  const records = options.health.cache?.totalRecords ?? 0;
  const windows = options.health.cache?.ingestWindows ?? 0;
  const { sync } = options.health;
  const windowLabel = formatWindowLabel(sync?.startDate, sync?.endDate);

  return [
    `${formatNumber(records)} records (+${formatNumber(records - options.baselineRecords)})`,
    `${formatNumber(windows)} windows (+${formatNumber(windows - options.baselineWindows)})`,
    `target ~${formatNumber(options.expectedTotal)} windows`,
    `latest ${windowLabel}`,
    sync?.runType ?? "",
  ]
    .filter((part) => part.length > 0)
    .join("  ");
};
