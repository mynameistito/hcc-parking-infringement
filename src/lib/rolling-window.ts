import { subDays } from "date-fns";

import { formatDateInAuckland } from "@/lib/auckland-time";

export const rollingCalendarWindowStart = (now: Date, days: number): string => {
  if (days < 1) {
    throw new RangeError("days must be at least 1");
  }

  return formatDateInAuckland(subDays(now, days - 1));
};
