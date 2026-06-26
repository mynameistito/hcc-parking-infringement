import { useEffect, useRef, useState } from "react";

interface UseAnimatedNumberOptions {
  duration?: number;
  /** Duration for the first count-up after mount (defaults to 1.4× duration). */
  initialDuration?: number;
}

export const useAnimatedNumber = (
  value: number,
  options: UseAnimatedNumberOptions = {}
): number => {
  const { duration = 600, initialDuration = duration * 1.4 } = options;
  const [display, setDisplay] = useState(0);
  const frameRef = useRef<number | null>(null);
  const displayRef = useRef(0);
  const isInitialRef = useRef(true);

  useEffect(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
    }

    const from = displayRef.current;
    const to = value;
    if (from === to) {
      return () => {
        if (frameRef.current !== null) {
          cancelAnimationFrame(frameRef.current);
        }
      };
    }

    const animDuration = isInitialRef.current ? initialDuration : duration;
    isInitialRef.current = false;
    const startedAt = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / animDuration, 1);
      const eased = 1 - (1 - progress) ** 3;
      const next = Math.round(from + (to - from) * eased);
      setDisplay(next);
      displayRef.current = next;

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [value, duration, initialDuration]);

  return display;
};
