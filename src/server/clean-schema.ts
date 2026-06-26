import { z } from "zod";

const paddedString = z
  .union([z.string(), z.number()])
  .transform((value) => String(value).trim());

export const rawInfringementSchema = z.object({
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
