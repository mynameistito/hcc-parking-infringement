// @vitest-environment happy-dom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";

import { LiveTicker } from "./live-ticker";

const mountTicker = () => {
  vi.useFakeTimers();
  const container = document.createElement("div");
  const root = createRoot(container);
  let mounted = true;

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

  const unmount = () => {
    if (mounted) {
      act(() => {
        root.unmount();
      });
      mounted = false;
    }
  };

  const dispose = () => {
    unmount();
    vi.useRealTimers();
  };

  return { container, dispose, render, unmount };
};

describe("live ticker pulse", () => {
  it("pulses only after a total changes and keeps the live region stable", () => {
    const ticker = mountTicker();

    try {
      ticker.render(100);
      expect(
        ticker.container.querySelector(".animate-ticker-pulse")
      ).toBeNull();
      const liveRegion = ticker.container.querySelector('[aria-live="polite"]');
      ticker.render(101);
      expect(ticker.container.querySelector('[aria-live="polite"]')).toBe(
        liveRegion
      );
      expect(
        ticker.container.querySelector(".animate-ticker-pulse")
      ).not.toBeNull();
    } finally {
      ticker.dispose();
    }
  });

  it("restarts the pulse and its timeout when another total arrives", () => {
    const ticker = mountTicker();

    try {
      ticker.render(100);
      ticker.render(101);

      const firstPulse = ticker.container.querySelector(
        ".animate-ticker-pulse"
      );

      const liveRegion = ticker.container.querySelector('[aria-live="polite"]');
      act(() => {
        vi.advanceTimersByTime(400);
      });
      ticker.render(102);
      expect(ticker.container.querySelector('[aria-live="polite"]')).toBe(
        liveRegion
      );
      expect(ticker.container.querySelector(".animate-ticker-pulse")).not.toBe(
        firstPulse
      );
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(
        ticker.container.querySelector(".animate-ticker-pulse")
      ).not.toBeNull();
      act(() => {
        vi.advanceTimersByTime(350);
      });
      expect(
        ticker.container.querySelector(".animate-ticker-pulse")
      ).toBeNull();
    } finally {
      ticker.dispose();
    }
  });

  it("clears the pulse timer when unmounted", () => {
    const ticker = mountTicker();

    try {
      ticker.render(100);
      ticker.render(101);
      ticker.unmount();
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      ticker.dispose();
    }
  });
});
