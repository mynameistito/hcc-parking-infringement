import { addDays as addDaysFns } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

/** IANA timezone for Hamilton parking infringement calendar boundaries. */
export const AUCKLAND_TZ = "Pacific/Auckland";

const ISO_WITH_OFFSET = "yyyy-MM-dd'T'HH:mm:ssXXX";
const ISO_WITH_MS_OFFSET = "yyyy-MM-dd'T'HH:mm:ss.SSSXXX";
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/u;

/** Pacific/Auckland ISO instant with numeric offset (not UTC Z). */
export const AUCKLAND_INSTANT =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?[+-]\d{2}:\d{2}$/u;

export const isAucklandInstant = (value: string): boolean =>
  AUCKLAND_INSTANT.test(value);

/** Format a Date as `YYYY-MM-DD` in Auckland local time. */
export const formatDateInAuckland = (date: Date): string =>
  formatInTimeZone(date, AUCKLAND_TZ, "yyyy-MM-dd");

/** Today's date key (`YYYY-MM-DD`) in Auckland local time. */
export const todayInAuckland = (now = new Date()): string =>
  formatDateInAuckland(now);

export const currentYearInAuckland = (now = new Date()): number =>
  Number.parseInt(formatInTimeZone(now, AUCKLAND_TZ, "yyyy"), 10);

/** Format an instant as ISO 8601 in Pacific/Auckland (correct DST offset). */
export const instantInAucklandIso = (date: Date): string =>
  formatInTimeZone(date, AUCKLAND_TZ, ISO_WITH_MS_OFFSET);

/** Current instant as ISO 8601 in Pacific/Auckland (correct DST offset). */
export const nowInAucklandIso = (): string => instantInAucklandIso(new Date());

/** Parse a stored Pacific/Auckland ISO instant. */
export const parseAucklandInstant = (value: string): Date => {
  if (!AUCKLAND_INSTANT.test(value)) {
    throw new TypeError(
      `Expected Pacific/Auckland ISO instant (±offset), got: ${value}`
    );
  }
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    throw new TypeError(`Invalid instant: ${value}`);
  }
  return new Date(parsed);
};

/** Format a stored instant or Date for display in Pacific/Auckland. */
export const formatAucklandInstant = (
  value: string | Date,
  pattern: string
): string => {
  const date = typeof value === "string" ? parseAucklandInstant(value) : value;
  return formatInTimeZone(date, AUCKLAND_TZ, pattern);
};

/** Format an Auckland calendar date key (`YYYY-MM-DD`) for display. */
export const formatAucklandDateKey = (
  dateKey: string,
  pattern: string
): string =>
  formatInTimeZone(
    fromZonedTime(`${dateKey}T12:00:00`, AUCKLAND_TZ),
    AUCKLAND_TZ,
    pattern
  );

/** Shift a calendar date by N days in Auckland local time. */
export const addDaysInAuckland = (dateStr: string, days: number): string => {
  const anchor = fromZonedTime(`${dateStr}T12:00:00`, AUCKLAND_TZ);
  return formatDateInAuckland(addDaysFns(anchor, days));
};

/** Inclusive start of a calendar day in Auckland as ISO 8601. */
export const startOfDayInAucklandIso = (dateStr: string): string => {
  const utc = fromZonedTime(`${dateStr}T00:00:00`, AUCKLAND_TZ);
  return formatInTimeZone(utc, AUCKLAND_TZ, ISO_WITH_OFFSET);
};

/** Inclusive end of a calendar day in Auckland as ISO 8601. */
export const endOfDayInAucklandIso = (dateStr: string): string => {
  const utc = fromZonedTime(`${dateStr}T23:59:59.999`, AUCKLAND_TZ);
  return formatInTimeZone(utc, AUCKLAND_TZ, ISO_WITH_MS_OFFSET);
};

/** Parse Auckland-local date + time to ISO with the correct offset for that day. */
export const localDateTimeInAucklandIso = (
  dateStr: string,
  time: string
): string => {
  const normalizedTime = time.length === 5 ? `${time}:00` : time;
  const utc = fromZonedTime(`${dateStr}T${normalizedTime}`, AUCKLAND_TZ);
  return formatInTimeZone(utc, AUCKLAND_TZ, ISO_WITH_OFFSET);
};

/** Convert optional `YYYY-MM-DD` (or existing instant) to Auckland ISO. */
export const normalizeOptionalAucklandInstant = (
  value: string | null | undefined
): string | null => {
  if (value === null || value === undefined) {
    return null;
  }
  const trimmed = value.trim();
  if (trimmed === "") {
    return null;
  }
  if (DATE_ONLY.test(trimmed)) {
    return endOfDayInAucklandIso(trimmed);
  }
  if (!AUCKLAND_INSTANT.test(trimmed)) {
    throw new TypeError(
      `Expected Pacific/Auckland ISO instant (±offset), got: ${trimmed}`
    );
  }
  return trimmed;
};

/** Inclusive ISO bounds for a calendar day in Auckland. */
export const dateBounds = (
  dateStr: string
): { readonly start: string; readonly end: string } => ({
  end: endOfDayInAucklandIso(dateStr),
  start: startOfDayInAucklandIso(dateStr),
});

/** Inclusive ISO bounds for today in Auckland. */
export const todayBounds = (
  now: Date
): { readonly start: string; readonly end: string } =>
  dateBounds(formatDateInAuckland(now));

/** Rolling window bounds ending at `now`, expressed in Auckland ISO offsets. */
export const rollingHoursBoundsInAuckland = (
  now: Date,
  hours: number
): { readonly start: string; readonly end: string } => ({
  end: instantInAucklandIso(now),
  start: instantInAucklandIso(new Date(now.getTime() - hours * 60 * 60 * 1000)),
});

/** Inclusive ISO bounds for the current calendar month in Auckland. */
export const monthBoundsInAuckland = (
  now: Date
): { readonly start: string; readonly end: string } => {
  const year = formatInTimeZone(now, AUCKLAND_TZ, "yyyy");
  const month = formatInTimeZone(now, AUCKLAND_TZ, "MM");
  const startDate = `${year}-${month}-01`;
  const monthNum = Number.parseInt(month, 10);
  const nextMonthStart =
    monthNum === 12
      ? `${Number.parseInt(year, 10) + 1}-01-01`
      : `${year}-${String(monthNum + 1).padStart(2, "0")}-01`;
  const endDate = addDaysInAuckland(nextMonthStart, -1);

  return {
    end: endOfDayInAucklandIso(endDate),
    start: startOfDayInAucklandIso(startDate),
  };
};

/** Inclusive ISO bounds for the current calendar year in Auckland. */
export const yearBoundsInAuckland = (
  now: Date
): { readonly start: string; readonly end: string } => {
  const year = formatInTimeZone(now, AUCKLAND_TZ, "yyyy");
  return {
    end: endOfDayInAucklandIso(`${year}-12-31`),
    start: startOfDayInAucklandIso(`${year}-01-01`),
  };
};
