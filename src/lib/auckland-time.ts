import { formatInTimeZone, toZonedTime } from "date-fns-tz";

/** IANA timezone for Hamilton parking infringement calendar boundaries. */
export const AUCKLAND_TZ = "Pacific/Auckland";

/** Format a Date as `YYYY-MM-DD` in Auckland local time. */
export const formatDateInAuckland = (date: Date): string =>
  formatInTimeZone(date, AUCKLAND_TZ, "yyyy-MM-dd");

/** Today's date key (`YYYY-MM-DD`) in Auckland local time. */
export const todayInAuckland = (now = new Date()): string =>
  formatDateInAuckland(now);

/** Inclusive ISO bounds for a calendar day in Auckland (+12:00). */
export const dateBounds = (
  dateStr: string
): { readonly start: string; readonly end: string } => ({
  end: `${dateStr}T23:59:59.999+12:00`,
  start: `${dateStr}T00:00:00+12:00`,
});

/** Inclusive ISO bounds for today in Auckland. */
export const todayBounds = (
  now: Date
): { readonly start: string; readonly end: string } => {
  const today = formatDateInAuckland(now);
  return dateBounds(today);
};

/** Inclusive ISO bounds for the current calendar month in Auckland. */
export const monthBoundsInAuckland = (
  now: Date
): { readonly start: string; readonly end: string } => {
  const zoned = toZonedTime(now, AUCKLAND_TZ);
  const year = zoned.getFullYear();
  const month = zoned.getMonth() + 1;
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return {
    end: `${end}T23:59:59.999+12:00`,
    start: `${start}T00:00:00+12:00`,
  };
};

/** Inclusive ISO bounds for the current calendar year in Auckland. */
export const yearBoundsInAuckland = (
  now: Date
): { readonly start: string; readonly end: string } => {
  const year = toZonedTime(now, AUCKLAND_TZ).getFullYear();
  return {
    end: `${year}-12-31T23:59:59.999+12:00`,
    start: `${year}-01-01T00:00:00+12:00`,
  };
};
