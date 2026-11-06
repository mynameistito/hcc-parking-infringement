// @vitest-environment happy-dom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";

import { useAnimatedNumber } from "./use-animated-number";

const AnimatedTotal = () => {
  const value = useAnimatedNumber(100, { duration: 100, initialDuration: 100 });

  return <output>{value}</output>;
};

describe("animated total frame timestamps", () => {
  it("keeps totals nonnegative when the first frame predates effect setup", () => {
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.stubGlobal("requestAnimationFrame", (onFrame: FrameRequestCallback) =>
      frames.push(onFrame)
    );
    vi.stubGlobal("cancelAnimationFrame", () => {
      frames.length = 0;
    });
    const container = document.createElement("div");
    const root = createRoot(container);

    try {
      act(() => {
        root.render(createElement(AnimatedTotal));
      });
      const firstFrame = frames.shift();

      if (firstFrame === undefined) {
        throw new Error("Animation did not schedule a frame");
      }

      act(() => {
        firstFrame(-1);
      });
      expect(container.textContent).toBe("0");
      const lastFrame = frames.shift();

      if (lastFrame === undefined) {
        throw new Error("Animation did not continue");
      }

      act(() => {
        lastFrame(performance.now() + 100);
      });
      expect(container.textContent).toBe("100");
    } finally {
      act(() => {
        root.unmount();
      });
      vi.unstubAllGlobals();
    }
  });
});
