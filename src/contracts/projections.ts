import type { PublicInfringement } from "@/contracts/public-api";
import type { InfringementRow } from "@/durable-objects/types";
import { resolveOffenceDescription } from "@/lib/offence-catalog";

/** Strip internal sync fields from a stored infringement row for public API. */
export const toPublicInfringement = (
  row: InfringementRow
): PublicInfringement => ({
  amountCents: row.amountCents,
  infringementNumber: row.infringementNumber,
  isTowed: row.isTowed,
  occurredAt: row.occurredAt,
  offenceDescription: resolveOffenceDescription(
    row.offenceCode,
    row.offenceDescription
  ),
  street: row.street,
  suburb: row.suburb,
  town: row.town,
  vehicleColour: row.vehicleColour,
  vehicleMake: row.vehicleMake,
  vehicleModel: row.vehicleModel,
  vehicleType: row.vehicleType,
});

/** Map infringement list results to public API shape. */
export const toPublicInfringementList = (
  rows: InfringementRow[]
): PublicInfringement[] => rows.map(toPublicInfringement);
