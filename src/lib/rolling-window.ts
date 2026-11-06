import { subDays } from "date-fns";

import { formatDateInAuckland } from "@/lib/auckland-time";

/**
 * Find the inclusive start of an Auckland calendar-day window.
 * @param now - Instant anchoring the calendar window.
 * @param days - Number of calendar days in the period.
 * @returns The formatted or resolved string value.
 */
export const rollingCalendarWindowStart = (now: Date, days: number): string => {
  if (days < 1) {
    throw new RangeError("days must be at least 1");
  }

  return formatDateInAuckland(subDays(now, days - 1));
};
