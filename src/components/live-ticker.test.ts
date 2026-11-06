// @vitest-environment happy-dom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";

import { LiveTicker } from "./live-ticker";

describe("live ticker pulse", () => {
  it("restarts the pulse when the total changes and clears its timer", () => {
    vi.useFakeTimers();

    const container = document.createElement("div");
    const root = createRoot(container);
    let unmounted = false;

    const render = (allTimeTotal: number) => {
      act(() => {
        root.render(
          createElement(LiveTicker, {
            dailyTrend: [],
            stats: {
              allTimeAmountCents: 0,
              allTimeTotal,
              last30d: 0,
              last365d: 0,
              last7d: 0,
            },
          })
        );
      });
    };

    try {
      render(100);
      expect(container.querySelector(".animate-ticker-pulse")).toBeNull();
      render(101);
      expect(container.querySelector(".animate-ticker-pulse")).not.toBeNull();
      act(() => {
        vi.advanceTimersByTime(400);
      });
      render(102);
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(container.querySelector(".animate-ticker-pulse")).not.toBeNull();
      act(() => {
        vi.advanceTimersByTime(350);
      });
      expect(container.querySelector(".animate-ticker-pulse")).toBeNull();
      render(103);
      act(() => {
        root.unmount();
      });
      unmounted = true;
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      if (!unmounted) {
        act(() => {
          root.unmount();
        });
      }

      vi.useRealTimers();
    }
  });
});
