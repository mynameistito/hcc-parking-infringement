import { normalizeOptionalAucklandInstant } from "@/lib/auckland-time.ts";
import {
  dollarsToCents,
  emptyToNull,
  normalizeCourtServeMethod,
  normalizeOffence,
  normalizeStreet,
  normalizeSuburb,
  normalizeVehicleMake,
  normalizeVehicleModel,
  normalizeVehicleType,
  toIsoOccurredAt,
} from "@/server/clean-normalize.ts";
import type {
  CleanInfringement,
  RawInfringement,
} from "@/server/clean-schema.ts";
import { rawInfringementSchema } from "@/server/clean-schema.ts";

export type {
  CleanInfringement,
  RawInfringement,
} from "@/server/clean-schema.ts";

/**
 * Parse and normalize one source infringement.
 * @param parsed - Validated source infringement to normalize.
 * @returns The resulting `CleanInfringement` value.
 */
export const cleanInfringement = (
  parsed: RawInfringement
): CleanInfringement => {
  const offence = normalizeOffence(
    parsed.Offence_Description,
    parsed.Offence_Code
  );

  return {
    additionalCostsCents: dollarsToCents(parsed.Additional_Costs_Amount),
    amountCents: dollarsToCents(parsed.Infringement_Amount),
    closedAt: normalizeOptionalAucklandInstant(
      emptyToNull(parsed.Infringement_Closed_Date)
    ),
    courtServeMethod: normalizeCourtServeMethod(parsed.Court_Serve_Method),
    infringementNumber: parsed.Infringement_Number,
    infringementType: parsed.Infringement_Type ?? null,
    isTowed: parsed.Is_Towed,
    occurredAt: toIsoOccurredAt(
      parsed.Infringement_Date,
      parsed.Infringement_Time
    ),
    offenceCategory:
      parsed.Offence_Category === ""
        ? null
        : normalizeSuburb(parsed.Offence_Category),
    offenceCode: offence.code,
    offenceDescription: offence.label,
    postCode: emptyToNull(parsed.Occured_At_Post_Code),
    street: normalizeStreet(parsed.Occured_At_Street),
    suburb: normalizeSuburb(parsed.Occured_At_Suburb),
    town: normalizeSuburb(parsed.Occured_At_Town) ?? "Hamilton",
    vehicleColour: emptyToNull(parsed.Vehicle_Colour),
    vehicleMake: normalizeVehicleMake(parsed.Vehicle_Make),
    vehicleModel: normalizeVehicleModel(parsed.Vehicle_Model),
    vehicleType: normalizeVehicleType(parsed.Vehicle_Type),
  };
};

interface CleanBatch {
  cleaned: CleanInfringement[];
  skipped: number;
}

/**
 * Normalize source records and collect rejected entries.
 * @param records - Source infringement records.
 * @returns The resulting `{ cleaned: CleanInfringement[]; skipped: number; }` value.
 */
export const cleanInfringements = (records: unknown[]): CleanBatch => {
  const cleaned: CleanInfringement[] = [];
  let skipped = 0;

  for (const record of records) {
    try {
      cleaned.push(cleanInfringement(rawInfringementSchema.parse(record)));
    } catch {
      skipped += 1;
    }
  }

  return { cleaned, skipped };
};
