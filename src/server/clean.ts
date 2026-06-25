import { z } from "zod";

const paddedString = z
  .union([z.string(), z.number()])
  .transform((value) => String(value).trim());

const rawInfringementSchema = z.object({
  Additional_Costs_Amount: z.number().optional().default(0),
  Additional_Costs_Balance: z.number().optional().default(0),
  Court_Serve_Method: paddedString.optional().default(""),
  Infringement_Amount: z.number(),
  Infringement_Closed_Date: paddedString.optional().default(""),
  Infringement_Date: paddedString,
  Infringement_Number: z.coerce.number(),
  Infringement_Time: paddedString,
  Infringement_Type: z.number().optional(),
  Is_Towed: z.boolean().optional().default(false),
  Occured_At_Post_Code: paddedString.optional().default(""),
  Occured_At_Street: paddedString.optional().default(""),
  Occured_At_Suburb: paddedString.optional().default(""),
  Occured_At_Town: paddedString.optional().default(""),
  Offence_Category: paddedString.optional().default(""),
  Offence_Code: paddedString.optional().default(""),
  Offence_Description: paddedString.optional().default(""),
  Vehicle_Colour: paddedString.optional().default(""),
  Vehicle_Make: paddedString.optional().default(""),
  Vehicle_Model: paddedString.optional().default(""),
  Vehicle_Type: paddedString.optional().default(""),
});

export type RawInfringement = z.infer<typeof rawInfringementSchema>;

export interface CleanInfringement {
  infringementNumber: number;
  occurredAt: string;
  closedAt: string | null;
  amountCents: number;
  additionalCostsCents: number;
  street: string;
  suburb: string | null;
  town: string;
  postCode: string | null;
  offenceCode: string;
  offenceDescription: string;
  offenceCategory: string | null;
  infringementType: number | null;
  courtServeMethod: string | null;
  vehicleColour: string | null;
  vehicleMake: string | null;
  vehicleModel: string | null;
  vehicleType: string | null;
  isTowed: boolean;
}

const STREET_SUFFIXES: Record<string, string> = {
  AVE: "Ave",
  CRES: "Cres",
  CT: "Ct",
  DR: "Dr",
  LN: "Ln",
  PL: "Pl",
  RD: "Rd",
  ST: "St",
  TCE: "Tce",
};

const dollarsToCents = (amount: number): number => Math.round(amount * 100);

const toIsoOccurredAt = (date: string, time: string): string => {
  const normalizedTime = time.length === 5 ? `${time}:00` : time;
  return `${date}T${normalizedTime}+12:00`;
};

const emptyToNull = (value: string): string | null =>
  value.length > 0 ? value : null;

const titleCaseWords = (value: string): string =>
  value
    .split(/\s+/u)
    .filter(Boolean)
    .map((word) => {
      if (/^\d+$/u.test(word)) {
        return word;
      }
      const upper = word.toUpperCase();
      if (STREET_SUFFIXES[upper] !== undefined) {
        return STREET_SUFFIXES[upper];
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");

const normalizeStreet = (raw: string): string => {
  const collapsed = raw.trim().replaceAll(/\s+/gu, " ");
  if (collapsed === "") {
    return "Unknown";
  }
  return titleCaseWords(collapsed);
};

const normalizeSuburb = (raw: string): string | null => {
  const value = titleCaseWords(raw.trim());
  return value.length > 0 ? value : null;
};

const normalizeVehicleMake = (raw: string): string | null => {
  const value = raw.trim();
  if (value === "") {
    return null;
  }
  if (value.length <= 4 && value === value.toUpperCase()) {
    return value.toUpperCase();
  }
  return titleCaseWords(value);
};

const sentenceCase = (value: string): string => {
  const lower = value.toLowerCase().trim();
  if (lower === "") {
    return "";
  }
  return lower.charAt(0).toUpperCase() + lower.slice(1);
};

const normalizeOffence = (
  description: string,
  offenceCode: string
): { code: string; label: string } => {
  const trimmed = description.trim();
  const prefixMatch = /^(?<code>[A-Z]\d{2,4})\s+(?<description>.+)$/iu.exec(
    trimmed
  );

  if (prefixMatch?.groups !== undefined) {
    return {
      code: prefixMatch.groups.code.toUpperCase(),
      label: sentenceCase(prefixMatch.groups.description.trim()),
    };
  }

  const code = offenceCode.trim() === "" ? "unknown" : offenceCode.trim();
  const label = trimmed === "" ? "Unknown offence" : sentenceCase(trimmed);
  return { code, label };
};

const normalizeCourtServeMethod = (raw: string): string | null => {
  const value = raw.trim().toUpperCase();
  if (value === "") {
    return null;
  }
  const labels: Record<string, string> = {
    P: "Posted",
  };
  return labels[value] ?? value;
};

const normalizeVehicleType = (raw: string): string | null => {
  const value = raw.trim();
  if (value === "") {
    return null;
  }
  if (value.toUpperCase() === "MOTOR VEHI") {
    return "Motor vehicle";
  }
  return titleCaseWords(value);
};

export const cleanInfringement = (raw: unknown): CleanInfringement => {
  const parsed = rawInfringementSchema.parse(raw);
  const offence = normalizeOffence(
    parsed.Offence_Description,
    parsed.Offence_Code
  );

  return {
    additionalCostsCents: dollarsToCents(parsed.Additional_Costs_Amount),
    amountCents: dollarsToCents(parsed.Infringement_Amount),
    closedAt: emptyToNull(parsed.Infringement_Closed_Date),
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
        : titleCaseWords(parsed.Offence_Category),
    offenceCode: offence.code,
    offenceDescription: offence.label,
    postCode: emptyToNull(parsed.Occured_At_Post_Code),
    street: normalizeStreet(parsed.Occured_At_Street),
    suburb: normalizeSuburb(parsed.Occured_At_Suburb),
    town: normalizeSuburb(parsed.Occured_At_Town) ?? "Hamilton",
    vehicleColour: emptyToNull(parsed.Vehicle_Colour),
    vehicleMake: normalizeVehicleMake(parsed.Vehicle_Make),
    vehicleModel:
      parsed.Vehicle_Model === "" ? null : titleCaseWords(parsed.Vehicle_Model),
    vehicleType: normalizeVehicleType(parsed.Vehicle_Type),
  };
};

export const cleanInfringements = (
  records: unknown[]
): {
  cleaned: CleanInfringement[];
  skipped: number;
} => {
  const cleaned: CleanInfringement[] = [];
  let skipped = 0;

  for (const record of records) {
    try {
      cleaned.push(cleanInfringement(record));
    } catch {
      skipped += 1;
    }
  }

  return { cleaned, skipped };
};

export { rawInfringementSchema };
