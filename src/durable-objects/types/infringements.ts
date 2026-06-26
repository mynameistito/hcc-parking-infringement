export interface InfringementRow {
  infringementNumber: number;
  occurredAt: string;
  amountCents: number;
  street: string;
  suburb: string | null;
  town: string | null;
  postCode: string | null;
  offenceCode: string | null;
  offenceDescription: string;
  offenceCategory: string | null;
  vehicleMake: string | null;
  vehicleModel: string | null;
  vehicleColour: string | null;
  vehicleType: string | null;
  isTowed: boolean;
  firstSeenAt: string;
  updatedAt: string;
}

export interface InfringementQuery {
  page: number;
  limit: number;
  from?: string;
  to?: string;
  street?: string;
  suburb?: string;
  vehicleMake?: string;
  vehicleModel?: string;
}

export interface InfringementListResult {
  data: InfringementRow[];
  page: number;
  limit: number;
  total: number;
}
