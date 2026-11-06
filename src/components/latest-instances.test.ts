// @vitest-environment happy-dom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, test } from "vitest";

import type { PublicInfringement } from "@/contracts/public-api";

import { LatestInstances } from "./latest-instances";

const ticket = (
  infringementNumber: number,
  occurredAt: string,
  amountCents: number
): PublicInfringement => ({
  amountCents,
  infringementNumber,
  isTowed: false,
  occurredAt,
  offenceDescription: `Ticket ${infringementNumber}`,
  street: "Main Street",
  suburb: null,
  town: null,
  vehicleColour: null,
  vehicleMake: null,
  vehicleModel: null,
  vehicleType: null,
});

const rows = [
  ticket(1, "2025-01-01T00:00:00+13:00", 2000),
  ticket(2, "2025-03-01T00:00:00+13:00", 1000),
  ticket(3, "2025-02-01T00:00:00+13:00", 3000),
];

const mount = () => {
  const container = document.createElement("div");
  const root = createRoot(container);

  act(() => {
    root.render(createElement(LatestInstances, { recentInfringements: rows }));
  });

  return { container, root };
};

const renderedTickets = (container: HTMLElement) =>
  [...container.querySelectorAll("tbody tr")].map((row) => row.textContent);

const clickHeader = (container: HTMLElement, label: string) => {
  const button = [...container.querySelectorAll("button")].find((element) =>
    element.textContent?.includes(label)
  );

  if (button === undefined) {
    throw new Error(`Missing ${label} sort button`);
  }

  act(() => {
    button.click();
  });
};

describe("LatestInstances", () => {
  test("renders all columns and sorts dates in both directions", () => {
    const { container, root } = mount();

    try {
      expect(renderedTickets(container)).toStrictEqual([
        expect.stringContaining("Ticket 2"),
        expect.stringContaining("Ticket 3"),
        expect.stringContaining("Ticket 1"),
      ]);
      expect(container.querySelectorAll("thead th")).toHaveLength(5);
      expect(
        container.querySelectorAll("tbody tr:first-child td")
      ).toHaveLength(5);
      clickHeader(container, "Date");
      expect(renderedTickets(container)).toStrictEqual([
        expect.stringContaining("Ticket 1"),
        expect.stringContaining("Ticket 3"),
        expect.stringContaining("Ticket 2"),
      ]);
      clickHeader(container, "Date");
      expect(renderedTickets(container)).toStrictEqual([
        expect.stringContaining("Ticket 2"),
        expect.stringContaining("Ticket 3"),
        expect.stringContaining("Ticket 1"),
      ]);
    } finally {
      act(() => {
        root.unmount();
      });
    }
  });

  test("sorts fine amounts numerically in both directions", () => {
    const { container, root } = mount();

    try {
      clickHeader(container, "Fine");
      expect(renderedTickets(container)).toStrictEqual([
        expect.stringContaining("Ticket 3"),
        expect.stringContaining("Ticket 1"),
        expect.stringContaining("Ticket 2"),
      ]);
      clickHeader(container, "Fine");
      expect(renderedTickets(container)).toStrictEqual([
        expect.stringContaining("Ticket 2"),
        expect.stringContaining("Ticket 1"),
        expect.stringContaining("Ticket 3"),
      ]);
    } finally {
      act(() => {
        root.unmount();
      });
    }
  });
});
