import { describe, expect, it } from "vitest";

import { cleanInfringement, cleanInfringements } from "@/server/clean";

describe("cleanInfringement", () => {
  it("normalizes a raw HCC infringement row", () => {
    const cleaned = cleanInfringement({
      Additional_Costs_Amount: 0,
      Infringement_Amount: 40,
      Infringement_Date: "2024-06-01",
      Infringement_Number: 12_345,
      Infringement_Time: "09:30:00",
      Is_Towed: false,
      Occured_At_Street: "Victoria Street",
      Occured_At_Suburb: "Hamilton Central",
      Occured_At_Town: "Hamilton",
      Offence_Code: "P546",
      Offence_Description: "Failed to correctly activate the",
      Vehicle_Make: "Toyota",
      Vehicle_Model: "Corolla",
    });

    expect(cleaned.infringementNumber).toBe(12_345);
    expect(cleaned.amountCents).toBe(4000);
    expect(cleaned.street).toBe("Victoria Street");
    expect(cleaned.occurredAt).toContain("2024-06-01");
  });
});

describe("cleanInfringements", () => {
  it("skips invalid rows and returns cleaned records", () => {
    const { cleaned, skipped } = cleanInfringements([
      { Infringement_Number: "bad" },
      {
        Infringement_Amount: 12,
        Infringement_Date: "2024-06-02",
        Infringement_Number: 99,
        Infringement_Time: "10:00:00",
        Occured_At_Street: "Anglesea St",
        Occured_At_Town: "Hamilton",
        Offence_Description: "No valid WOF",
      },
    ]);

    expect(skipped).toBe(1);
    expect(cleaned).toHaveLength(1);
    expect(cleaned[0]?.infringementNumber).toBe(99);
  });
});
