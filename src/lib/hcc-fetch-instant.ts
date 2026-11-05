import { z } from "zod";

/** Parse optional persisted HCC fetch metadata without rejecting older data. */
export const optionalHccFetchInstantSchema = z
  .unknown()
  .transform((value) => {
    const parsed = z.iso.datetime({ offset: true }).safeParse(value);
    return parsed.success ? parsed.data : undefined;
  })
  .optional();
