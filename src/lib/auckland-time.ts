import { addDays as addDaysFns } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

/** IANA timezone for Hamilton parking infringement calendar boundaries. */
export const AUCKLAND_TZ = "Pacific/Auckland";

const ISO_WITH_OFFSET = "yyyy-MM-dd'T'HH:mm:ssXXX";
const ISO_WITH_MS_OFFSET = "yyyy-MM-dd'T'HH:mm:ss.SSSXXX";
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/u;

/** Inclusive start and end instants for an Auckland time window. */
interface AucklandBounds {
  readonly start: string;
  readonly end: string;
}

/** Pacific/Auckland ISO instant with numeric offset (not UTC Z). */
export const AUCKLAND_INSTANT =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?[+-]\d{2}:\d{2}$/u;

/**
 * Checks whether a string has the expected numeric-offset instant format.
 * @param value - The string to check.
 * @returns Whether the format matches.
 */
export const isAucklandInstant = (value: string): boolean =>
  AUCKLAND_INSTANT.test(value);

/**
 * Formats a date as an Auckland calendar date key.
 * @param date - The instant to format.
 * @returns The date in `YYYY-MM-DD` form.
 */
export const formatDateInAuckland = (date: Date): string =>
  formatInTimeZone(date, AUCKLAND_TZ, "yyyy-MM-dd");

/**
 * Gets the Auckland calendar date for an instant, defaulting to now.
 * @param now - The instant to use as the current time.
 * @returns The date in `YYYY-MM-DD` form.
 */
export const todayInAuckland = (now = new Date()): string =>
  formatDateInAuckland(now);

/**
 * Gets the Auckland calendar year for an instant, defaulting to now.
 * @param now - The instant to use as the current time.
 * @returns The Auckland calendar year.
 */
export const currentYearInAuckland = (now = new Date()): number =>
  Number(formatInTimeZone(now, AUCKLAND_TZ, "yyyy"));

/**
 * Formats an instant in Auckland with its applicable numeric offset.
 * @param date - The instant to format.
 * @returns An ISO instant with milliseconds and Auckland offset.
 */
export const instantInAucklandIso = (date: Date): string =>
  formatInTimeZone(date, AUCKLAND_TZ, ISO_WITH_MS_OFFSET);

/**
 * Formats the current instant with its applicable Auckland offset.
 * @returns The current ISO instant with milliseconds and numeric offset.
 */
export const nowInAucklandIso = (): string => instantInAucklandIso(new Date());

/**
 * Parses a stored instant with a numeric offset.
 * Throws a TypeError when the format or instant is invalid.
 * @param value - The stored ISO instant.
 * @returns The corresponding date.
 */
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

const isInstantString = (value: string | Date): value is string =>
  typeof value === "string";

/**
 * Formats a stored instant or date for display in Auckland.
 * @param value - The stored instant or date.
 * @param pattern - A date-fns formatting pattern.
 * @returns The formatted date and time.
 */
export const formatAucklandInstant = (
  value: string | Date,
  pattern: string
): string => {
  const date = isInstantString(value) ? parseAucklandInstant(value) : value;

  return formatInTimeZone(date, AUCKLAND_TZ, pattern);
};

/**
 * Formats an Auckland calendar date key for display.
 * @param dateKey - The `YYYY-MM-DD` date key.
 * @param pattern - A date-fns formatting pattern.
 * @returns The formatted date.
 */
export const formatAucklandDateKey = (
  dateKey: string,
  pattern: string
): string =>
  formatInTimeZone(
    fromZonedTime(`${dateKey}T12:00:00`, AUCKLAND_TZ),
    AUCKLAND_TZ,
    pattern
  );

/**
 * Shifts an Auckland calendar date by a number of days.
 * @param dateStr - The starting date key.
 * @param days - The number of days to add, which may be negative.
 * @returns The shifted date key.
 */
export const addDaysInAuckland = (dateStr: string, days: number): string => {
  const anchor = fromZonedTime(`${dateStr}T12:00:00`, AUCKLAND_TZ);

  return formatDateInAuckland(addDaysFns(anchor, days));
};

/**
 * Finds the inclusive start of an Auckland calendar day.
 * @param dateStr - The calendar date key.
 * @returns The start as an ISO instant with Auckland offset.
 */
export const startOfDayInAucklandIso = (dateStr: string): string => {
  const utc = fromZonedTime(`${dateStr}T00:00:00`, AUCKLAND_TZ);

  return formatInTimeZone(utc, AUCKLAND_TZ, ISO_WITH_OFFSET);
};

/**
 * Finds the inclusive end of an Auckland calendar day.
 * @param dateStr - The calendar date key.
 * @returns The end as an ISO instant with Auckland offset.
 */
export const endOfDayInAucklandIso = (dateStr: string): string => {
  const utc = fromZonedTime(`${dateStr}T23:59:59.999`, AUCKLAND_TZ);

  return formatInTimeZone(utc, AUCKLAND_TZ, ISO_WITH_MS_OFFSET);
};

/**
 * Converts an Auckland-local date and time to an ISO instant.
 * @param dateStr - The local calendar date key.
 * @param time - The local time, with optional seconds.
 * @returns The instant with the applicable Auckland offset.
 */
export const localDateTimeInAucklandIso = (
  dateStr: string,
  time: string
): string => {
  const normalizedTime = time.length === 5 ? `${time}:00` : time;
  const utc = fromZonedTime(`${dateStr}T${normalizedTime}`, AUCKLAND_TZ);

  return formatInTimeZone(utc, AUCKLAND_TZ, ISO_WITH_OFFSET);
};

/**
 * Normalizes an optional date key or existing instant to Auckland ISO form.
 * Throws a TypeError when a nonempty value has an unsupported format.
 * @param value - The date, instant, or absent value.
 * @returns The end-of-day instant for a date, the supplied instant, or null.
 */
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

/**
 * Finds inclusive ISO bounds for an Auckland calendar day.
 * @param dateStr - The calendar date key.
 * @returns The start and end instants of that day.
 */
export const dateBounds = (dateStr: string): AucklandBounds => ({
  end: endOfDayInAucklandIso(dateStr),
  start: startOfDayInAucklandIso(dateStr),
});

/**
 * Finds inclusive ISO bounds for the Auckland day containing an instant.
 * @param now - The instant used to select the day.
 * @returns The start and end instants of that day.
 */
export const todayBounds = (now: Date): AucklandBounds =>
  dateBounds(formatDateInAuckland(now));

/**
 * Finds rolling window bounds ending at an instant.
 * @param now - The end of the window.
 * @param hours - The number of hours before the end.
 * @returns Start and end instants with Auckland offsets.
 */
export const rollingHoursBoundsInAuckland = (
  now: Date,
  hours: number
): AucklandBounds => ({
  end: instantInAucklandIso(now),
  start: instantInAucklandIso(new Date(now.getTime() - hours * 60 * 60 * 1000)),
});

/**
 * Finds inclusive bounds for the Auckland month containing an instant.
 * @param now - The instant used to select the month.
 * @returns The start and end instants of that month.
 */
export const monthBoundsInAuckland = (now: Date): AucklandBounds => {
  const year = formatInTimeZone(now, AUCKLAND_TZ, "yyyy");
  const month = formatInTimeZone(now, AUCKLAND_TZ, "MM");
  const startDate = `${year}-${month}-01`;
  const monthNum = Number(month);

  const nextMonthStart =
    monthNum === 12
      ? `${Number(year) + 1}-01-01`
      : `${year}-${String(monthNum + 1).padStart(2, "0")}-01`;

  const endDate = addDaysInAuckland(nextMonthStart, -1);

  return {
    end: endOfDayInAucklandIso(endDate),
    start: startOfDayInAucklandIso(startDate),
  };
};

/**
 * Finds inclusive bounds for the Auckland year containing an instant.
 * @param now - The instant used to select the year.
 * @returns The start and end instants of that year.
 */
export const yearBoundsInAuckland = (now: Date): AucklandBounds => {
  const year = formatInTimeZone(now, AUCKLAND_TZ, "yyyy");

  return {
    end: endOfDayInAucklandIso(`${year}-12-31`),
    start: startOfDayInAucklandIso(`${year}-01-01`),
  };
};
