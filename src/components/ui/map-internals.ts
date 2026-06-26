import type { Popup, PopupOptions } from "maplibre-gl";
import { useRef } from "react";

export const runEffect = <T>(
  value: T | null | false | undefined,
  effect: (value: NonNullable<T>) => (() => void) | undefined
): (() => void) => {
  if (value === null || value === undefined || value === false) {
    return () => {
      void 0;
    };
  }
  const cleanup = effect(value);
  return () => {
    if (typeof cleanup === "function") {
      cleanup();
    }
  };
};

export const noopEffectCleanup = (): void => {
  void 0;
};

export const useLatestRef = <T>(value: T) => {
  const ref = useRef(value);
  ref.current = value;
  return ref;
};

export const useStableEventHandler = <TArgs extends unknown[]>(
  handler: (...args: TArgs) => void
) => {
  const handlerRef = useLatestRef(handler);
  const stableRef = useRef<((...args: TArgs) => void) | null>(null);
  stableRef.current ??= (...args: TArgs) => {
    handlerRef.current(...args);
  };
  return stableRef.current;
};

/** Captures a value once for mount-only effects (stable identity across renders). */
export const useMountValue = <T>(value: T): T => {
  const ref = useRef<T | null>(null);
  ref.current ??= value;
  return ref.current;
};

export const syncPopupLayout = (
  popup: Popup,
  offset: PopupOptions["offset"],
  maxWidth: PopupOptions["maxWidth"]
): void => {
  popup.setOffset(offset ?? 16);
  if (maxWidth !== undefined && maxWidth !== null && maxWidth !== "") {
    popup.setMaxWidth(maxWidth);
  }
};
