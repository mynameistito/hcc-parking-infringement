"use client";

import type {
  Feature,
  FeatureCollection,
  GeoJsonProperties,
  Geometry,
  LineString,
  Point,
} from "geojson";
import { X, Minus, Plus, Locate, Maximize, Loader2 } from "lucide-react";

import "maplibre-gl/dist/maplibre-gl.css";
import MapLibreGL from "maplibre-gl";
import type { PopupOptions, MarkerOptions } from "maplibre-gl";
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { ReactNode, Ref } from "react";
import { createPortal } from "react-dom";

import {
  buildArcCoordinates,
  computeArcHitWidth,
  DEFAULT_ARC_CURVATURE,
  DEFAULT_ARC_LAYOUT,
  DEFAULT_ARC_PAINT,
  DEFAULT_ARC_SAMPLES,
  DEFAULT_CLUSTER_COLORS,
  DEFAULT_CLUSTER_THRESHOLDS,
  GEOJSON_DEFAULT_COLORS,
  getGeoJSONSource,
  getPointCoordinates,
  mergeHoverPaint,
  readNumberProperty,
  syncLayoutProperties,
  syncPaintProperties,
  toMapGeoJSONFeature,
} from "@/components/ui/map-geo";
import {
  noopEffectCleanup,
  runEffect,
  syncPopupLayout,
  useLatestRef,
  useMountValue,
  useStableEventHandler,
} from "@/components/ui/map-internals";
import type {
  MapArcDatum,
  MapArcEvent,
  MapGeoJSONEvent,
  MapGeoJSONFeature,
} from "@/components/ui/map-types";
import { cn } from "@/lib/utils";

const defaultStyles = {
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
};

// A tile-less, dependency-free style with a transparent background. Use it for
// data visualizations (choropleths, world arcs, dot maps) where you draw your
// own layers and don't need a street basemap. The easiest way to opt in is the
// `blank` prop:
//   <Map blank>...</Map>
// The transparent background lets the themed container show through.
const blankMapStyle: MapLibreGL.StyleSpecification = {
  layers: [
    {
      id: "background",
      paint: { "background-color": "rgba(0, 0, 0, 0)" },
      type: "background",
    },
  ],
  sources: {},
  version: 8,
};

type Theme = "light" | "dark";

// Check document class for theme (works with next-themes, etc.)
const getDocumentTheme = (): Theme | null => {
  if (typeof document === "undefined") {
    return null;
  }
  if (document.documentElement.classList.contains("dark")) {
    return "dark";
  }
  if (document.documentElement.classList.contains("light")) {
    return "light";
  }
  return null;
};

const getSystemTheme = (): Theme => {
  if (typeof window === "undefined") {
    return "light";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const subscribeToSystemTheme = (onStoreChange: () => void): (() => void) => {
  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.documentElement, {
    attributeFilter: ["class"],
    attributes: true,
  });

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  mediaQuery.addEventListener("change", onStoreChange);

  return () => {
    observer.disconnect();
    mediaQuery.removeEventListener("change", onStoreChange);
  };
};

const getSystemThemeSnapshot = (): Theme =>
  getDocumentTheme() ?? getSystemTheme();

const noopUnsubscribe = () => {
  void 0;
};

const useResolvedTheme = (themeProp?: "light" | "dark"): Theme => {
  const detectedTheme = useSyncExternalStore(
    themeProp === undefined ? subscribeToSystemTheme : () => noopUnsubscribe,
    getSystemThemeSnapshot,
    () => "light"
  );

  return themeProp ?? detectedTheme;
};

interface MapContextValue {
  map: MapLibreGL.Map | null;
  isLoaded: boolean;
  resolvedTheme: Theme;
}

const MapContext = createContext<MapContextValue | null>(null);

const useMap = () => {
  const context = use(MapContext);
  if (!context) {
    throw new Error("useMap must be used within a Map component");
  }
  return context;
};

/** Map viewport state */
interface MapViewport {
  /** Center coordinates [longitude, latitude] */
  center: [number, number];
  /** Zoom level */
  zoom: number;
  /** Bearing (rotation) in degrees */
  bearing: number;
  /** Pitch (tilt) in degrees */
  pitch: number;
}

type MapStyleOption = string | MapLibreGL.StyleSpecification;

type MapRef = MapLibreGL.Map;

type MapProps = {
  ref?: Ref<MapRef>;
  children?: ReactNode;
  /** Additional CSS classes for the map container */
  className?: string;
  /**
   * Theme for the map. If not provided, automatically detects system preference.
   * Pass your theme value here.
   */
  theme?: Theme;
  /** Custom map styles for light and dark themes. Overrides the default Carto styles. */
  styles?: {
    light?: MapStyleOption;
    dark?: MapStyleOption;
  };
  /**
   * Use a transparent, tile-less basemap instead of the default Carto street
   * basemap — a blank canvas. Used alone it renders nothing; add your own
   * layers on top (`<MapGeoJSON>`, `<MapArc>`, markers, etc.). Ideal for data
   * visualizations (choropleths, arcs, dot maps).
   * Ignored when an explicit `styles` prop is provided.
   */
  blank?: boolean;
  /** Map projection type. Use `{ type: "globe" }` for 3D globe view. */
  projection?: MapLibreGL.ProjectionSpecification;
  /**
   * Controlled viewport. When provided with onViewportChange,
   * the map becomes controlled and viewport is driven by this prop.
   */
  viewport?: Partial<MapViewport>;
  /**
   * Callback fired continuously as the viewport changes (pan, zoom, rotate, pitch).
   * Can be used standalone to observe changes, or with `viewport` prop
   * to enable controlled mode where the map viewport is driven by your state.
   */
  onViewportChange?: (viewport: MapViewport) => void;
  /** Show a loading indicator on the map */
  loading?: boolean;
} & Omit<MapLibreGL.MapOptions, "container" | "style">;

const DefaultLoader = () => (
  <div className="bg-background/50 absolute inset-0 z-10 flex items-center justify-center backdrop-blur-xs">
    <div className="flex gap-1">
      <span className="bg-muted-foreground/60 size-1.5 animate-pulse rounded-full" />
      <span className="bg-muted-foreground/60 size-1.5 animate-pulse rounded-full [animation-delay:150ms]" />
      <span className="bg-muted-foreground/60 size-1.5 animate-pulse rounded-full [animation-delay:300ms]" />
    </div>
  </div>
);

interface MapRuntimeState {
  isLoaded: boolean;
  loadedStyle: MapStyleOption | null;
  mapInstance: MapLibreGL.Map | null;
}

type MapRuntimeAction =
  | { type: "destroy" }
  | { type: "init"; map: MapLibreGL.Map }
  | { type: "mapLoaded" }
  | { type: "styleLoaded"; style: MapStyleOption };

const initialMapRuntimeState: MapRuntimeState = {
  isLoaded: false,
  loadedStyle: null,
  mapInstance: null,
};

const mapRuntimeReducer = (
  state: MapRuntimeState,
  action: MapRuntimeAction
): MapRuntimeState => {
  switch (action.type) {
    case "destroy": {
      return initialMapRuntimeState;
    }
    case "init": {
      return {
        isLoaded: false,
        loadedStyle: null,
        mapInstance: action.map,
      };
    }
    case "mapLoaded": {
      return state.mapInstance === null ? state : { ...state, isLoaded: true };
    }
    case "styleLoaded": {
      return state.mapInstance === null
        ? state
        : { ...state, loadedStyle: action.style };
    }
    default: {
      return state;
    }
  }
};

const getViewport = (map: MapLibreGL.Map): MapViewport => {
  const center = map.getCenter();
  return {
    bearing: map.getBearing(),
    center: [center.lng, center.lat],
    pitch: map.getPitch(),
    zoom: map.getZoom(),
  };
};

const Map = ({
  ref,
  children,
  className,
  theme: themeProp,
  styles,
  blank = false,
  projection,
  viewport,
  onViewportChange,
  loading = false,
  ...props
}: MapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mapRuntime, dispatchMapRuntime] = useReducer(
    mapRuntimeReducer,
    initialMapRuntimeState
  );
  const { isLoaded, loadedStyle, mapInstance } = mapRuntime;
  const currentStyleRef = useRef<MapStyleOption | null>(null);
  const styleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const internalUpdateRef = useRef(false);
  const resolvedTheme = useResolvedTheme(themeProp);

  const isControlled = viewport !== undefined && onViewportChange !== undefined;

  const onViewportChangeRef = useRef(onViewportChange);
  onViewportChangeRef.current = onViewportChange;

  const mapStyles = useMemo(() => {
    // Explicit styles win. Otherwise `blank` opts into the transparent
    // tile-less basemap; with neither, fall back to the Carto defaults.
    if (styles) {
      return {
        dark: styles.dark ?? defaultStyles.dark,
        light: styles.light ?? defaultStyles.light,
      };
    }
    if (blank) {
      return { dark: blankMapStyle, light: blankMapStyle };
    }
    return defaultStyles;
  }, [styles, blank]);

  const activeStyle =
    resolvedTheme === "dark" ? mapStyles.dark : mapStyles.light;
  const isStyleLoaded = loadedStyle === activeStyle;

  // Expose the map instance to the parent component
  useImperativeHandle(ref, () => {
    if (mapInstance === null) {
      throw new Error("Map is not initialized");
    }
    return mapInstance;
  }, [mapInstance]);

  const clearStyleTimeout = useCallback(() => {
    if (styleTimeoutRef.current) {
      clearTimeout(styleTimeoutRef.current);
      styleTimeoutRef.current = null;
    }
  }, []);

  const mapInitConfig = useMountValue({
    mapOptions: props,
    mapStyles,
    projection,
    resolvedTheme,
    viewport,
  });

  // Initialize the map
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    const container = containerRef.current;

    if (container !== null) {
      const config = mapInitConfig;
      const initialStyle =
        config.resolvedTheme === "dark"
          ? config.mapStyles.dark
          : config.mapStyles.light;
      currentStyleRef.current = initialStyle;

      const map = new MapLibreGL.Map({
        attributionControl: {
          compact: true,
        },
        container,
        renderWorldCopies: false,
        style: initialStyle,
        ...config.mapOptions,
        ...config.viewport,
      });

      const styleDataHandler = () => {
        clearStyleTimeout();
        styleTimeoutRef.current = setTimeout(() => {
          const style = currentStyleRef.current;
          if (style !== null) {
            dispatchMapRuntime({ style, type: "styleLoaded" });
          }
          if (config.projection) {
            map.setProjection(config.projection);
          }
        }, 100);
      };
      const loadHandler = () => {
        dispatchMapRuntime({ type: "mapLoaded" });
      };

      const handleMove = () => {
        if (internalUpdateRef.current) {
          return;
        }
        onViewportChangeRef.current?.(getViewport(map));
      };

      map.on("load", loadHandler);
      map.on("styledata", styleDataHandler);
      map.on("move", handleMove);
      dispatchMapRuntime({ map, type: "init" });

      cleanup = () => {
        clearStyleTimeout();
        map.off("load", loadHandler);
        map.off("styledata", styleDataHandler);
        map.off("move", handleMove);
        map.remove();
        dispatchMapRuntime({ type: "destroy" });
      };
    }

    return () => {
      cleanup?.();
    };
  }, [clearStyleTimeout, mapInitConfig]);

  // Sync controlled viewport to map
  useEffect(() => {
    if (mapInstance === null || !isControlled || viewport === undefined) {
      return;
    }
    if (mapInstance.isMoving()) {
      return;
    }

    const current = getViewport(mapInstance);
    const next = {
      bearing: viewport.bearing ?? current.bearing,
      center: viewport.center ?? current.center,
      pitch: viewport.pitch ?? current.pitch,
      zoom: viewport.zoom ?? current.zoom,
    };

    if (
      next.center[0] === current.center[0] &&
      next.center[1] === current.center[1] &&
      next.zoom === current.zoom &&
      next.bearing === current.bearing &&
      next.pitch === current.pitch
    ) {
      return;
    }

    internalUpdateRef.current = true;
    mapInstance.jumpTo(next);
    internalUpdateRef.current = false;
  }, [mapInstance, isControlled, viewport]);

  // Handle style change
  useEffect(() => {
    if (mapInstance === null) {
      return;
    }

    const newStyle =
      resolvedTheme === "dark" ? mapStyles.dark : mapStyles.light;

    if (currentStyleRef.current === newStyle) {
      return;
    }

    clearStyleTimeout();
    currentStyleRef.current = newStyle;

    mapInstance.setStyle(newStyle, { diff: true });
  }, [mapInstance, resolvedTheme, mapStyles, clearStyleTimeout]);

  // Sync projection when the prop changes after mount.
  useEffect(() => {
    if (mapInstance === null || !isStyleLoaded || projection === undefined) {
      return;
    }
    mapInstance.setProjection(projection);
  }, [mapInstance, isStyleLoaded, projection]);

  const contextValue = useMemo(
    () => ({
      isLoaded: isLoaded && isStyleLoaded,
      map: mapInstance,
      resolvedTheme,
    }),
    [mapInstance, isLoaded, isStyleLoaded, resolvedTheme]
  );

  return (
    <MapContext.Provider value={contextValue}>
      <div
        ref={containerRef}
        className={cn("relative h-full w-full", className)}
      >
        {(!isLoaded || loading) && <DefaultLoader />}
        {/* SSR-safe: children render only when map is loaded on client */}
        {mapInstance !== null && children}
      </div>
    </MapContext.Provider>
  );
};

interface MarkerContextValue {
  marker: MapLibreGL.Marker;
  map: MapLibreGL.Map | null;
}

const MarkerContext = createContext<MarkerContextValue | null>(null);

const useMarkerContext = () => {
  const context = use(MarkerContext);
  if (!context) {
    throw new Error("Marker components must be used within MapMarker");
  }
  return context;
};

type MapMarkerProps = {
  /** Longitude coordinate for marker position */
  longitude: number;
  /** Latitude coordinate for marker position */
  latitude: number;
  /** Marker subcomponents (MarkerContent, MarkerPopup, MarkerTooltip, MarkerLabel) */
  children: ReactNode;
  /** Callback when marker is clicked */
  onClick?: (e: MouseEvent) => void;
  /** Callback when mouse enters marker */
  onMouseEnter?: (e: MouseEvent) => void;
  /** Callback when mouse leaves marker */
  onMouseLeave?: (e: MouseEvent) => void;
  /** Callback when marker drag starts (requires draggable: true) */
  onDragStart?: (lngLat: { lng: number; lat: number }) => void;
  /** Callback during marker drag (requires draggable: true) */
  onDrag?: (lngLat: { lng: number; lat: number }) => void;
  /** Callback when marker drag ends (requires draggable: true) */
  onDragEnd?: (lngLat: { lng: number; lat: number }) => void;
} & Omit<MarkerOptions, "element">;

const MapMarker = ({
  longitude,
  latitude,
  children,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onDragStart,
  onDrag,
  onDragEnd,
  draggable = false,
  ...markerOptions
}: MapMarkerProps) => {
  const { map: mapInstance } = useMap();

  const callbacksRef = useLatestRef({
    onClick,
    onDrag,
    onDragEnd,
    onDragStart,
    onMouseEnter,
    onMouseLeave,
  });

  const [marker] = useState(() => {
    const markerInstance = new MapLibreGL.Marker({
      ...markerOptions,
      draggable,
      element: document.createElement("div"),
    }).setLngLat([longitude, latitude]);

    const handleClick = (e: MouseEvent) => callbacksRef.current.onClick?.(e);
    const handleMouseEnter = (e: MouseEvent) =>
      callbacksRef.current.onMouseEnter?.(e);
    const handleMouseLeave = (e: MouseEvent) =>
      callbacksRef.current.onMouseLeave?.(e);

    markerInstance.getElement()?.addEventListener("click", handleClick);
    markerInstance
      .getElement()
      ?.addEventListener("mouseenter", handleMouseEnter);
    markerInstance
      .getElement()
      ?.addEventListener("mouseleave", handleMouseLeave);

    const handleDragStart = () => {
      const lngLat = markerInstance.getLngLat();
      callbacksRef.current.onDragStart?.({ lat: lngLat.lat, lng: lngLat.lng });
    };
    const handleDrag = () => {
      const lngLat = markerInstance.getLngLat();
      callbacksRef.current.onDrag?.({ lat: lngLat.lat, lng: lngLat.lng });
    };
    const handleDragEnd = () => {
      const lngLat = markerInstance.getLngLat();
      callbacksRef.current.onDragEnd?.({ lat: lngLat.lat, lng: lngLat.lng });
    };

    markerInstance.on("dragstart", handleDragStart);
    markerInstance.on("drag", handleDrag);
    markerInstance.on("dragend", handleDragEnd);

    return markerInstance;
  });

  useEffect(
    () =>
      runEffect(mapInstance, (map) => {
        marker.addTo(map);
        return () => {
          marker.remove();
        };
      }),
    [mapInstance, marker]
  );

  const { offset, rotation, rotationAlignment, pitchAlignment } = markerOptions;

  const currentLngLat = marker.getLngLat();
  if (currentLngLat.lng !== longitude || currentLngLat.lat !== latitude) {
    marker.setLngLat([longitude, latitude]);
  }

  if (marker.isDraggable() !== draggable) {
    marker.setDraggable(draggable);
  }

  const currentOffset = marker.getOffset();
  const newOffset = offset ?? [0, 0];
  const [newOffsetX, newOffsetY] = Array.isArray(newOffset)
    ? newOffset
    : [newOffset.x, newOffset.y];
  if (currentOffset.x !== newOffsetX || currentOffset.y !== newOffsetY) {
    marker.setOffset(newOffset);
  }

  if (marker.getRotation() !== (rotation ?? 0)) {
    marker.setRotation(rotation ?? 0);
  }
  if (marker.getRotationAlignment() !== (rotationAlignment ?? "auto")) {
    marker.setRotationAlignment(rotationAlignment ?? "auto");
  }
  if (marker.getPitchAlignment() !== (pitchAlignment ?? "auto")) {
    marker.setPitchAlignment(pitchAlignment ?? "auto");
  }

  const markerContextValue = useMemo(
    () => ({ map: mapInstance, marker }),
    [mapInstance, marker]
  );

  return (
    <MarkerContext.Provider value={markerContextValue}>
      {children}
    </MarkerContext.Provider>
  );
};

const DefaultMarkerIcon = () => (
  <div className="relative h-4 w-4 rounded-full border-2 border-white bg-blue-500 shadow-lg" />
);

interface MarkerContentProps {
  /** Custom marker content. Defaults to a blue dot if not provided */
  children?: ReactNode;
  /** Additional CSS classes for the marker container */
  className?: string;
}

const MarkerContent = ({ children, className }: MarkerContentProps) => {
  const { marker } = useMarkerContext();

  return createPortal(
    <div className={cn("relative cursor-pointer", className)}>
      {children ?? <DefaultMarkerIcon />}
    </div>,
    marker.getElement()
  );
};

const PopupCloseButton = ({ onClick }: { onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label="Close popup"
    className="focus-visible:ring-ring hover:bg-muted text-foreground absolute top-1 right-1 z-10 inline-flex size-5 cursor-pointer items-center justify-center rounded-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset"
  >
    <X className="size-3.5" />
  </button>
);

type MarkerPopupProps = {
  /** Popup content */
  children: ReactNode;
  /** Additional CSS classes for the popup container */
  className?: string;
  /** Show a close button in the popup (default: false) */
  closeButton?: boolean;
} & Omit<PopupOptions, "className" | "closeButton">;

const MarkerPopup = ({
  children,
  className,
  closeButton = false,
  ...popupOptions
}: MarkerPopupProps) => {
  const { marker, map: mapInstance } = useMarkerContext();
  const [container] = useState(() => document.createElement("div"));
  const { offset, maxWidth } = popupOptions;

  const [popup] = useState(() =>
    new MapLibreGL.Popup({
      offset: 16,
      ...popupOptions,
      closeButton: false,
    })
      .setMaxWidth("none")
      .setDOMContent(container)
  );

  syncPopupLayout(popup, offset, maxWidth);

  useEffect(
    () =>
      runEffect(mapInstance, (_map) => {
        popup.setDOMContent(container);
        marker.setPopup(popup);
        return () => {
          marker.setPopup(null);
        };
      }),
    [container, mapInstance, marker, popup]
  );

  const handleClose = () => {
    popup.remove();
  };

  return createPortal(
    <div
      className={cn(
        "bg-popover text-popover-foreground relative max-w-62 rounded-md border p-3 shadow-md",
        "animate-in fade-in-0 zoom-in-95 duration-200 ease-out",
        className
      )}
    >
      {closeButton && <PopupCloseButton onClick={handleClose} />}
      {children}
    </div>,
    container
  );
};

type MarkerTooltipProps = {
  /** Tooltip content */
  children: ReactNode;
  /** Additional CSS classes for the tooltip container */
  className?: string;
} & Omit<PopupOptions, "className" | "closeButton" | "closeOnClick">;

const MarkerTooltip = ({
  children,
  className,
  ...popupOptions
}: MarkerTooltipProps) => {
  const { marker, map: mapInstance } = useMarkerContext();
  const [container] = useState(() => document.createElement("div"));
  const { offset, maxWidth } = popupOptions;

  const [tooltip] = useState(() =>
    new MapLibreGL.Popup({
      closeButton: false,
      closeOnClick: true,
      offset: 16,
      ...popupOptions,
    }).setMaxWidth("none")
  );

  syncPopupLayout(tooltip, offset, maxWidth);

  useEffect(() => {
    if (mapInstance === null) {
      return () => {
        noopEffectCleanup();
      };
    }
    const map = mapInstance;
    tooltip.setDOMContent(container);

    const handleMouseEnter = () => {
      tooltip.setLngLat(marker.getLngLat()).addTo(map);
    };
    const handleMouseLeave = () => {
      tooltip.remove();
    };

    const markerElement = marker.getElement();
    if (markerElement !== null) {
      markerElement.addEventListener("mouseenter", handleMouseEnter);
      markerElement.addEventListener("mouseleave", handleMouseLeave);
    }

    return () => {
      if (markerElement !== null) {
        markerElement.removeEventListener("mouseenter", handleMouseEnter);
        markerElement.removeEventListener("mouseleave", handleMouseLeave);
      }
      tooltip.remove();
    };
  }, [container, mapInstance, marker, tooltip]);

  return createPortal(
    <div
      className={cn(
        "bg-foreground text-background pointer-events-none rounded-md px-2 py-1 text-xs text-balance shadow-md",
        "animate-in fade-in-0 zoom-in-95 duration-200 ease-out",
        className
      )}
    >
      {children}
    </div>,
    container
  );
};

const markerLabelPositionClasses = {
  bottom: "top-full mt-1",
  top: "bottom-full mb-1",
};

interface MarkerLabelProps {
  /** Label text content */
  children: ReactNode;
  /** Additional CSS classes for the label */
  className?: string;
  /** Position of the label relative to the marker (default: "top") */
  position?: "top" | "bottom";
}

const MarkerLabel = ({
  children,
  className,
  position = "top",
}: MarkerLabelProps) => (
  <div
    className={cn(
      "absolute left-1/2 -translate-x-1/2 whitespace-nowrap",
      "text-foreground text-[10px] font-medium",
      markerLabelPositionClasses[position],
      className
    )}
  >
    {children}
  </div>
);

type MapControlFeature = "zoom" | "compass" | "locate" | "fullscreen";

const DEFAULT_MAP_CONTROL_FEATURES: MapControlFeature[] = ["zoom"];

interface MapControlsProps {
  /** Position of the controls on the map (default: "bottom-right") */
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  /** Which control groups to render (default: ["zoom"]) */
  features?: MapControlFeature[];
  /** Additional CSS classes for the controls container */
  className?: string;
  /** Callback with user coordinates when located */
  onLocate?: (coords: { longitude: number; latitude: number }) => void;
}

const positionClasses = {
  "bottom-left": "bottom-2 left-2",
  "bottom-right": "bottom-10 right-2",
  "top-left": "top-2 left-2",
  "top-right": "top-2 right-2",
};

const ControlGroup = ({ children }: { children: React.ReactNode }) => (
  <div className="border-border bg-background [&>button:not(:last-child)]:border-border flex flex-col overflow-hidden rounded-md border shadow-sm [&>button:not(:last-child)]:border-b">
    {children}
  </div>
);

const ControlButton = ({
  onClick,
  label,
  children,
  disabled = false,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
  disabled?: boolean;
}) => (
  <button
    onClick={onClick}
    aria-label={label}
    type="button"
    className={cn(
      "flex size-8 items-center justify-center transition-all",
      "first:rounded-t-md last:rounded-b-md",
      "hover:bg-accent dark:hover:bg-accent/40",
      "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset",
      "disabled:pointer-events-none disabled:opacity-50"
    )}
    disabled={disabled}
  >
    {children}
  </button>
);

const CompassButton = ({ onClick }: { onClick: () => void }) => {
  const { map } = useMap();
  const compassRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (map === null) {
      return () => {
        noopEffectCleanup();
      };
    }
    const activeMap = map;
    const compass = compassRef.current;
    if (compass === null) {
      return () => {
        noopEffectCleanup();
      };
    }

    const updateRotation = () => {
      const bearing = activeMap.getBearing();
      const pitch = activeMap.getPitch();
      compass.style.transform = `rotateX(${pitch}deg) rotateZ(${-bearing}deg)`;
    };

    activeMap.on("rotate", updateRotation);
    activeMap.on("pitch", updateRotation);
    updateRotation();

    return () => {
      activeMap.off("rotate", updateRotation);
      activeMap.off("pitch", updateRotation);
    };
  }, [map]);

  return (
    <ControlButton onClick={onClick} label="Reset bearing to north">
      <svg
        ref={compassRef}
        viewBox="0 0 24 24"
        className="size-5 transition-transform duration-200"
        style={{ transformStyle: "preserve-3d" }}
      >
        <path d="M12 2L16 12H12V2Z" className="fill-red-500" />
        <path d="M12 2L8 12H12V2Z" className="fill-red-300" />
        <path d="M12 22L16 12H12V22Z" className="fill-muted-foreground/60" />
        <path d="M12 22L8 12H12V22Z" className="fill-muted-foreground/30" />
      </svg>
    </ControlButton>
  );
};

const getGeolocationPosition = async (): Promise<GeolocationPosition> => {
  const { promise, resolve, reject } =
    Promise.withResolvers<GeolocationPosition>();
  navigator.geolocation.getCurrentPosition(resolve, reject);
  return await promise;
};

const MapControls = ({
  position = "bottom-right",
  features = DEFAULT_MAP_CONTROL_FEATURES,
  className,
  onLocate,
}: MapControlsProps) => {
  const { map } = useMap();
  const [waitingForLocation, setWaitingForLocation] = useState(false);
  const enabledFeatures = useMemo(() => new Set(features), [features]);

  const handleZoomIn = useCallback(() => {
    map?.zoomTo(map.getZoom() + 1, { duration: 300 });
  }, [map]);

  const handleZoomOut = useCallback(() => {
    map?.zoomTo(map.getZoom() - 1, { duration: 300 });
  }, [map]);

  const handleResetBearing = useCallback(() => {
    map?.resetNorthPitch({ duration: 300 });
  }, [map]);

  const handleLocate = useCallback(() => {
    void (async () => {
      setWaitingForLocation(true);
      try {
        if (!("geolocation" in navigator)) {
          return;
        }
        const pos = await getGeolocationPosition();
        const coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        map?.flyTo({
          center: [coords.longitude, coords.latitude],
          duration: 1500,
          zoom: 14,
        });
        onLocate?.(coords);
      } catch (error) {
        console.error("Error getting location:", error);
      } finally {
        setWaitingForLocation(false);
      }
    })();
  }, [map, onLocate]);

  const handleFullscreen = useCallback(() => {
    const container = map?.getContainer();
    if (container === undefined) {
      return;
    }
    if (document.fullscreenElement === null) {
      void container.requestFullscreen();
    } else {
      void document.exitFullscreen();
    }
  }, [map]);

  return (
    <div
      className={cn(
        "absolute z-10 flex flex-col gap-1.5",
        positionClasses[position],
        className
      )}
    >
      {enabledFeatures.has("zoom") && (
        <ControlGroup>
          <ControlButton onClick={handleZoomIn} label="Zoom in">
            <Plus className="size-4" />
          </ControlButton>
          <ControlButton onClick={handleZoomOut} label="Zoom out">
            <Minus className="size-4" />
          </ControlButton>
        </ControlGroup>
      )}
      {enabledFeatures.has("compass") && (
        <ControlGroup>
          <CompassButton onClick={handleResetBearing} />
        </ControlGroup>
      )}
      {enabledFeatures.has("locate") && (
        <ControlGroup>
          <ControlButton
            onClick={handleLocate}
            label="Find my location"
            disabled={waitingForLocation}
          >
            {waitingForLocation ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Locate className="size-4" />
            )}
          </ControlButton>
        </ControlGroup>
      )}
      {enabledFeatures.has("fullscreen") && (
        <ControlGroup>
          <ControlButton onClick={handleFullscreen} label="Toggle fullscreen">
            <Maximize className="size-4" />
          </ControlButton>
        </ControlGroup>
      )}
    </div>
  );
};

type MapPopupProps = {
  /** Longitude coordinate for popup position */
  longitude: number;
  /** Latitude coordinate for popup position */
  latitude: number;
  /** Callback when popup is closed */
  onClose?: () => void;
  /** Popup content */
  children: ReactNode;
  /** Additional CSS classes for the popup container */
  className?: string;
  /** Show a close button in the popup (default: false) */
  closeButton?: boolean;
} & Omit<PopupOptions, "className" | "closeButton">;

const MapPopup = ({
  longitude,
  latitude,
  onClose,
  children,
  className,
  closeButton = false,
  ...popupOptions
}: MapPopupProps) => {
  const { map: mapInstance } = useMap();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const [container] = useState(() => document.createElement("div"));
  const { offset, maxWidth } = popupOptions;

  const [popup] = useState(() =>
    new MapLibreGL.Popup({
      offset: 16,
      ...popupOptions,
      closeButton: false,
    })
      .setMaxWidth("none")
      .setLngLat([longitude, latitude])
  );

  const currentLngLat = popup.getLngLat();
  if (currentLngLat.lng !== longitude || currentLngLat.lat !== latitude) {
    popup.setLngLat([longitude, latitude]);
  }
  syncPopupLayout(popup, offset, maxWidth);

  useEffect(() => {
    if (mapInstance === null) {
      return () => {
        noopEffectCleanup();
      };
    }
    const map = mapInstance;
    const onCloseProp = () => onCloseRef.current?.();

    popup.on("close", onCloseProp);
    popup.setDOMContent(container);
    popup.addTo(map);

    return () => {
      popup.off("close", onCloseProp);
      if (popup.isOpen()) {
        popup.remove();
      }
    };
  }, [container, mapInstance, popup]);

  const handleClose = () => {
    popup.remove();
  };

  return createPortal(
    <div
      className={cn(
        "bg-popover text-popover-foreground relative max-w-62 rounded-md border p-3 shadow-md",
        "animate-in fade-in-0 zoom-in-95 duration-200 ease-out",
        className
      )}
    >
      {closeButton && <PopupCloseButton onClick={handleClose} />}
      {children}
    </div>,
    container
  );
};

interface MapRouteProps {
  /** Optional unique identifier for the route layer */
  id?: string;
  /** Array of [longitude, latitude] coordinate pairs defining the route */
  coordinates: [number, number][];
  /** Line color as CSS color value (default: "#4285F4") */
  color?: string;
  /** Line width in pixels (default: 3) */
  width?: number;
  /** Line opacity from 0 to 1 (default: 0.8) */
  opacity?: number;
  /** Dash pattern [dash length, gap length] for dashed lines */
  dashArray?: [number, number];
  /** Callback when the route line is clicked */
  onClick?: () => void;
  /** Callback when mouse enters the route line */
  onMouseEnter?: () => void;
  /** Callback when mouse leaves the route line */
  onMouseLeave?: () => void;
  /** Whether the route is interactive - shows pointer cursor on hover (default: true) */
  interactive?: boolean;
}

interface MapRouteLayerProps {
  mapInstance: MapLibreGL.Map | null;
  isLoaded: boolean;
  propId?: string;
  coordinates: [number, number][];
  color?: string;
  width?: number;
  opacity?: number;
  dashArray?: [number, number];
  interactive?: boolean;
  clickHandler?: () => void;
  mouseEnterHandler?: () => void;
  mouseLeaveHandler?: () => void;
}

const MapRouteLayer = ({
  mapInstance,
  isLoaded,
  propId,
  coordinates,
  color = "#4285F4",
  width = 3,
  opacity = 0.8,
  dashArray,
  interactive = true,
  clickHandler,
  mouseEnterHandler,
  mouseLeaveHandler,
}: MapRouteLayerProps) => {
  const autoId = useId();
  const id = propId ?? autoId;
  const sourceId = `route-source-${id}`;
  const layerId = `route-layer-${id}`;
  const routeSetup = useMountValue({
    color,
    dashArray,
    layerId,
    opacity,
    sourceId,
    width,
  });

  const routeCallbacksRef = useLatestRef({
    click: clickHandler,
    mouseEnter: mouseEnterHandler,
    mouseLeave: mouseLeaveHandler,
  });
  const mapRef = useLatestRef(mapInstance);
  const layerIdRef = useLatestRef(layerId);

  const handleRouteClick = useStableEventHandler(() => {
    routeCallbacksRef.current.click?.();
  });
  const handleRouteMouseEnter = useStableEventHandler(() => {
    const map = mapRef.current;
    if (map !== null && map !== undefined) {
      map.getCanvas().style.cursor = "pointer";
    }
    routeCallbacksRef.current.mouseEnter?.();
  });
  const handleRouteMouseLeave = useStableEventHandler(() => {
    if (mapRef.current !== null && mapRef.current !== undefined) {
      mapRef.current.getCanvas().style.cursor = "";
    }
    routeCallbacksRef.current.mouseLeave?.();
  });

  useEffect(() => {
    if (!isLoaded || mapInstance === null) {
      return () => {
        noopEffectCleanup();
      };
    }
    const map = mapInstance;
    const setup = routeSetup;
    map.addSource(setup.sourceId, {
      data: {
        geometry: { coordinates: [], type: "LineString" },
        properties: {},
        type: "Feature",
      },
      type: "geojson",
    });

    map.addLayer({
      id: setup.layerId,
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": setup.color,
        "line-opacity": setup.opacity,
        "line-width": setup.width,
        ...(setup.dashArray && { "line-dasharray": setup.dashArray }),
      },
      source: setup.sourceId,
      type: "line",
    });

    return () => {
      try {
        if (map.getLayer(setup.layerId)) {
          map.removeLayer(setup.layerId);
        }
        if (map.getSource(setup.sourceId)) {
          map.removeSource(setup.sourceId);
        }
      } catch {
        // ignore
      }
    };
  }, [isLoaded, mapInstance, routeSetup]);

  if (isLoaded && mapInstance !== null && coordinates.length >= 2) {
    getGeoJSONSource(mapInstance, sourceId)?.setData({
      geometry: { coordinates, type: "LineString" },
      properties: {},
      type: "Feature",
    });
  }

  if (
    isLoaded &&
    mapInstance !== null &&
    mapInstance.getLayer(layerId) !== undefined
  ) {
    mapInstance.setPaintProperty(layerId, "line-color", color);
    mapInstance.setPaintProperty(layerId, "line-width", width);
    mapInstance.setPaintProperty(layerId, "line-opacity", opacity);
    mapInstance.setPaintProperty(layerId, "line-dasharray", dashArray);
  }

  useEffect(() => {
    if (!isLoaded || !interactive || mapInstance === null) {
      return () => {
        noopEffectCleanup();
      };
    }
    const map = mapInstance;
    const activeLayerId = layerIdRef.current;

    map.on("click", activeLayerId, handleRouteClick);
    map.on("mouseenter", activeLayerId, handleRouteMouseEnter);
    map.on("mouseleave", activeLayerId, handleRouteMouseLeave);

    return () => {
      map.off("click", activeLayerId, handleRouteClick);
      map.off("mouseenter", activeLayerId, handleRouteMouseEnter);
      map.off("mouseleave", activeLayerId, handleRouteMouseLeave);
    };
  }, [
    isLoaded,
    mapInstance,
    interactive,
    layerIdRef,
    handleRouteClick,
    handleRouteMouseEnter,
    handleRouteMouseLeave,
  ]);

  return null;
};

const MapRoute = (props: MapRouteProps) => {
  const { map: mapInstance, isLoaded } = useMap();
  return (
    <MapRouteLayer
      clickHandler={props.onClick}
      color={props.color}
      coordinates={props.coordinates}
      dashArray={props.dashArray}
      interactive={props.interactive}
      isLoaded={isLoaded}
      mapInstance={mapInstance}
      mouseEnterHandler={props.onMouseEnter}
      mouseLeaveHandler={props.onMouseLeave}
      opacity={props.opacity}
      propId={props.id}
      width={props.width}
    />
  );
};

type MapGeoJSONData<P extends GeoJsonProperties = GeoJsonProperties> =
  | FeatureCollection<Geometry, P>
  | Feature<Geometry, P>
  | Geometry
  | string;

type MapFillPaint = NonNullable<MapLibreGL.FillLayerSpecification["paint"]>;
type MapLinePaint = NonNullable<MapLibreGL.LineLayerSpecification["paint"]>;

interface MapGeoJSONProps<P extends GeoJsonProperties = GeoJsonProperties> {
  /** GeoJSON data (FeatureCollection, Feature, Geometry) or a URL to fetch it from. */
  data: MapGeoJSONData<P>;
  /** Optional unique identifier prefix for the source/layers. Auto-generated if not provided. */
  id?: string;
  /**
   * Feature property to promote to the feature `id`. Required for hover
   * feature-state (`fillHoverPaint`) and stable `onHover`/`onClick` payloads.
   */
  promoteId?: string;
  /**
   * Paint for the polygon fill layer. Merged on top of a theme-aware monochrome
   * surface tone (`fill-color`). Pass `false` to omit the fill layer entirely
   * (e.g. outlines only).
   */
  fillPaint?: MapFillPaint | false;
  /**
   * Paint for the outline layer. Merged on top of a theme-aware hairline
   * default (`line-color` = page background, `line-width` = 0.5). Pass `false`
   * to omit the outline layer.
   */
  linePaint?: MapLinePaint | false;
  /**
   * Paint merged onto the fill layer for the feature under the cursor, applied
   * as a `case` expression keyed on hover feature-state. Requires `promoteId`.
   */
  fillHoverPaint?: MapFillPaint;
  /** Callback when a feature is clicked. */
  onClick?: (e: MapGeoJSONEvent) => void;
  /** Callback fired when the hovered feature changes; `null` when the cursor leaves. */
  onHover?: (e: MapGeoJSONEvent | null) => void;
  /** Whether features respond to mouse events (default: false). */
  interactive?: boolean;
  /** Optional MapLibre layer id to insert the layers before (z-order control). */
  beforeId?: string;
}

type MapGeoJSONLayerProps<P extends GeoJsonProperties = GeoJsonProperties> =
  Omit<MapGeoJSONProps<P>, "onClick" | "onHover"> & {
    mapInstance: MapLibreGL.Map | null;
    isLoaded: boolean;
    resolvedTheme: Theme;
    propId?: string;
    clickHandler?: (e: MapGeoJSONEvent) => void;
    hoverHandler?: (e: MapGeoJSONEvent | null) => void;
  };

/**
 * Renders arbitrary GeoJSON as fill + outline layers on the map. Composes like
 * `MapRoute` / `MapArc` — drop it inside `<Map>` (typically with `blank`) for
 * choropleths and region/data maps. For full control over expressions and
 * multiple layers, manage layers directly via `useMap()` instead.
 */
const MapGeoJSONLayer = <P extends GeoJsonProperties = GeoJsonProperties>({
  mapInstance,
  isLoaded,
  resolvedTheme,
  data,
  propId,
  promoteId,
  fillPaint,
  linePaint,
  fillHoverPaint,
  clickHandler,
  hoverHandler,
  interactive = false,
  beforeId,
}: MapGeoJSONLayerProps<P>) => {
  const autoId = useId();
  const id = propId ?? autoId;
  const sourceId = `geojson-source-${id}`;
  const fillLayerId = `geojson-fill-${id}`;
  const lineLayerId = `geojson-line-${id}`;

  const defaults = GEOJSON_DEFAULT_COLORS[resolvedTheme];

  const showFill = fillPaint !== false;
  const showLine = linePaint !== false;

  const mergedFillPaint = useMemo(
    () =>
      mergeHoverPaint(
        { "fill-color": defaults.fill, ...fillPaint },
        fillHoverPaint
      ),
    [defaults.fill, fillPaint, fillHoverPaint]
  );
  const mergedLinePaint = useMemo(
    () => ({
      "line-color": defaults.line,
      "line-width": 0.5,
      ...linePaint,
    }),
    [defaults.line, linePaint]
  );
  const geoJsonCallbacksRef = useLatestRef({
    click: clickHandler,
    hover: hoverHandler,
  });
  const mapRef = useLatestRef(mapInstance);
  const sourceIdRef = useLatestRef(sourceId);
  const fillLayerIdRef = useLatestRef(fillLayerId);
  const hoveredFeatureIdRef = useRef<string | number | null>(null);

  const setFeatureHover = useStableEventHandler(
    (next: string | number | null) => {
      const map = mapRef.current;
      if (map === null || map === undefined) {
        return;
      }
      if (next === hoveredFeatureIdRef.current) {
        return;
      }
      const activeSourceId = sourceIdRef.current;
      const sourceExists = map.getSource(activeSourceId) !== undefined;
      if (hoveredFeatureIdRef.current !== null && sourceExists) {
        map.setFeatureState(
          { id: hoveredFeatureIdRef.current, source: activeSourceId },
          { hover: false }
        );
      }
      hoveredFeatureIdRef.current = next;
      if (next !== null && sourceExists) {
        map.setFeatureState(
          { id: next, source: activeSourceId },
          { hover: true }
        );
      }
    }
  );

  const handleGeoMouseMove = useStableEventHandler(
    (e: MapLibreGL.MapLayerMouseEvent) => {
      const map = mapRef.current;
      if (map === null || map === undefined) {
        return;
      }
      const [feature] = e.features ?? [];
      if (feature === undefined) {
        return;
      }
      map.getCanvas().style.cursor = "pointer";

      const featureId = feature.id;
      if (featureId === hoveredFeatureIdRef.current) {
        return;
      }
      setFeatureHover(featureId ?? null);
      geoJsonCallbacksRef.current.hover?.({
        feature: toMapGeoJSONFeature(feature),
        latitude: e.lngLat.lat,
        longitude: e.lngLat.lng,
        originalEvent: e,
      });
    }
  );

  const handleGeoMouseLeave = useStableEventHandler(() => {
    const map = mapRef.current;
    if (map === null || map === undefined) {
      return;
    }
    setFeatureHover(null);
    map.getCanvas().style.cursor = "";
    geoJsonCallbacksRef.current.hover?.(null);
  });

  const handleGeoClick = useStableEventHandler(
    (e: MapLibreGL.MapLayerMouseEvent) => {
      const [feature] = e.features ?? [];
      if (feature === undefined) {
        return;
      }
      geoJsonCallbacksRef.current.click?.({
        feature: toMapGeoJSONFeature(feature),
        latitude: e.lngLat.lat,
        longitude: e.lngLat.lng,
        originalEvent: e,
      });
    }
  );

  const geoJsonSourceSetup = useMountValue({
    data,
    fillLayerId,
    lineLayerId,
    promoteId,
    sourceId,
  });

  // Add source on mount.
  useEffect(() => {
    if (!isLoaded || mapInstance === null) {
      return () => {
        noopEffectCleanup();
      };
    }
    const map = mapInstance;
    const setup = geoJsonSourceSetup;
    map.addSource(setup.sourceId, {
      data: setup.data,
      type: "geojson",
      ...(setup.promoteId !== undefined && setup.promoteId !== ""
        ? { promoteId: setup.promoteId }
        : {}),
    });

    return () => {
      try {
        if (map.getLayer(setup.lineLayerId)) {
          map.removeLayer(setup.lineLayerId);
        }
        if (map.getLayer(setup.fillLayerId)) {
          map.removeLayer(setup.fillLayerId);
        }
        if (map.getSource(setup.sourceId)) {
          map.removeSource(setup.sourceId);
        }
      } catch {
        // style may be mid-reload
      }
    };
  }, [geoJsonSourceSetup, isLoaded, mapInstance]);

  if (isLoaded && mapInstance !== null) {
    getGeoJSONSource(mapInstance, sourceId)?.setData(data);
    const source = mapInstance.getSource(sourceId);
    if (source !== undefined) {
      if (showFill && !mapInstance.getLayer(fillLayerId)) {
        mapInstance.addLayer(
          {
            id: fillLayerId,
            paint: mergedFillPaint,
            source: sourceId,
            type: "fill",
          },
          beforeId
        );
      } else if (!showFill && mapInstance.getLayer(fillLayerId)) {
        mapInstance.removeLayer(fillLayerId);
      }

      if (showLine && !mapInstance.getLayer(lineLayerId)) {
        mapInstance.addLayer(
          {
            id: lineLayerId,
            paint: mergedLinePaint,
            source: sourceId,
            type: "line",
          },
          beforeId
        );
      } else if (!showLine && mapInstance.getLayer(lineLayerId)) {
        mapInstance.removeLayer(lineLayerId);
      }

      if (showFill && mapInstance.getLayer(fillLayerId) !== undefined) {
        syncPaintProperties(mapInstance, fillLayerId, mergedFillPaint);
      }
      if (showLine && mapInstance.getLayer(lineLayerId) !== undefined) {
        syncPaintProperties(mapInstance, lineLayerId, mergedLinePaint);
      }
    }
  }

  // Interaction handlers (bound to the fill layer).
  useEffect(() => {
    if (!isLoaded || !interactive || !showFill || mapInstance === null) {
      return () => {
        noopEffectCleanup();
      };
    }
    const map = mapInstance;
    const activeFillLayerId = fillLayerIdRef.current;

    map.on("mousemove", activeFillLayerId, handleGeoMouseMove);
    map.on("mouseleave", activeFillLayerId, handleGeoMouseLeave);
    map.on("click", activeFillLayerId, handleGeoClick);

    return () => {
      map.off("mousemove", activeFillLayerId, handleGeoMouseMove);
      map.off("mouseleave", activeFillLayerId, handleGeoMouseLeave);
      map.off("click", activeFillLayerId, handleGeoClick);
      setFeatureHover(null);
      map.getCanvas().style.cursor = "";
    };
  }, [
    isLoaded,
    mapInstance,
    interactive,
    showFill,
    fillLayerIdRef,
    handleGeoMouseMove,
    handleGeoMouseLeave,
    handleGeoClick,
    setFeatureHover,
  ]);

  return null;
};

const MapGeoJSON = <P extends GeoJsonProperties = GeoJsonProperties>(
  props: MapGeoJSONProps<P>
) => {
  const { map: mapInstance, isLoaded, resolvedTheme } = useMap();
  return (
    <MapGeoJSONLayer
      beforeId={props.beforeId}
      clickHandler={props.onClick}
      data={props.data}
      fillHoverPaint={props.fillHoverPaint}
      fillPaint={props.fillPaint}
      hoverHandler={props.onHover}
      interactive={props.interactive}
      isLoaded={isLoaded}
      linePaint={props.linePaint}
      mapInstance={mapInstance}
      promoteId={props.promoteId}
      propId={props.id}
      resolvedTheme={resolvedTheme}
    />
  );
};

type MapArcLinePaint = NonNullable<MapLibreGL.LineLayerSpecification["paint"]>;
type MapArcLineLayout = NonNullable<
  MapLibreGL.LineLayerSpecification["layout"]
>;

interface MapArcProps<T extends MapArcDatum = MapArcDatum> {
  /** Array of arcs to render. Each arc must have a unique `id`. */
  data: T[];
  /** Optional unique identifier prefix for the arc source/layers. Auto-generated if not provided. */
  id?: string;
  /**
   * How far each arc bows away from a straight line. `0` renders straight
   * lines; higher values bend further. Negative values bend to the opposite
   * side. Arcs are computed as a quadratic Bézier in lng/lat space; the
   * destination longitude is unwrapped relative to the origin so that arcs
   * cross the antimeridian via the shorter great-circle direction. (default: 0.2)
   */
  curvature?: number;
  /** Number of samples used to render each curve. Higher = smoother. (default: 64) */
  samples?: number;
  /**
   * MapLibre paint properties for the arc layer. Merged on top of sensible
   * defaults (`line-color: #4285F4`, `line-width: 2`, `line-opacity: 0.85`).
   * Any value can be a MapLibre expression for per-feature styling, every
   * field on each arc datum (besides `from`/`to`) is exposed via `["get", ...]`.
   */
  paint?: MapArcLinePaint;
  /** MapLibre layout properties for the arc layer. Defaults to rounded joins/caps. */
  layout?: MapArcLineLayout;
  /**
   * Paint properties applied to the arc currently under the cursor. Each key
   * is merged into `paint` as a `case` expression keyed on per-feature hover
   * state, so only the hovered arc changes appearance.
   */
  hoverPaint?: MapArcLinePaint;
  /** Callback when an arc is clicked. */
  onClick?: (e: MapArcEvent<T>) => void;
  /**
   * Callback fired when the hovered arc changes. Receives the cursor's
   * lng/lat at the moment of entry, and `null` when the cursor leaves the
   * last hovered arc.
   */
  onHover?: (e: MapArcEvent<T> | null) => void;
  /** Whether arcs respond to mouse events (default: true). */
  interactive?: boolean;
  /** Optional MapLibre layer id to insert the arc layers before (z-order control). */
  beforeId?: string;
}

type MapArcLayerProps<T extends MapArcDatum = MapArcDatum> = Omit<
  MapArcProps<T>,
  "onClick" | "onHover"
> & {
  mapInstance: MapLibreGL.Map | null;
  isLoaded: boolean;
  propId?: string;
  clickHandler?: (e: MapArcEvent<T>) => void;
  hoverHandler?: (e: MapArcEvent<T> | null) => void;
};

const MapArcLayer = <T extends MapArcDatum = MapArcDatum>({
  mapInstance,
  isLoaded,
  propId,
  data,
  curvature = DEFAULT_ARC_CURVATURE,
  samples = DEFAULT_ARC_SAMPLES,
  paint,
  layout,
  hoverPaint,
  clickHandler,
  hoverHandler,
  interactive = true,
  beforeId,
}: MapArcLayerProps<T>) => {
  const autoId = useId();
  const id = propId ?? autoId;
  const sourceId = `arc-source-${id}`;
  const layerId = `arc-layer-${id}`;
  const hitLayerId = `arc-hit-layer-${id}`;

  const mergedPaint = useMemo(
    () => mergeHoverPaint({ ...DEFAULT_ARC_PAINT, ...paint }, hoverPaint),
    [paint, hoverPaint]
  );
  const mergedLayout = useMemo(
    () => ({ ...DEFAULT_ARC_LAYOUT, ...layout }),
    [layout]
  );

  const hitWidth = useMemo(() => computeArcHitWidth(paint), [paint]);

  const geoJSON = useMemo<FeatureCollection<LineString>>(
    () => ({
      features: data.map((arc) => {
        const { from, to, ...properties } = arc;
        return {
          geometry: {
            coordinates: buildArcCoordinates(from, to, curvature, samples),
            type: "LineString",
          },
          properties,
          type: "Feature",
        };
      }),
      type: "FeatureCollection",
    }),
    [data, curvature, samples]
  );

  const arcCallbacksRef = useLatestRef({
    click: clickHandler,
    data,
    hover: hoverHandler,
  });
  const arcMapRef = useLatestRef(mapInstance);
  const arcSourceIdRef = useLatestRef(sourceId);
  const hitLayerIdRef = useLatestRef(hitLayerId);
  const hoveredArcIdRef = useRef<string | number | null>(null);

  const setArcHover = useStableEventHandler((next: string | number | null) => {
    const map = arcMapRef.current;
    if (map === null || map === undefined) {
      return;
    }
    if (next === hoveredArcIdRef.current) {
      return;
    }
    const activeSourceId = arcSourceIdRef.current;
    const sourceExists = map.getSource(activeSourceId) !== undefined;
    if (hoveredArcIdRef.current !== null && sourceExists) {
      map.setFeatureState(
        { id: hoveredArcIdRef.current, source: activeSourceId },
        { hover: false }
      );
    }
    hoveredArcIdRef.current = next;
    if (next !== null && sourceExists) {
      map.setFeatureState(
        { id: next, source: activeSourceId },
        { hover: true }
      );
    }
  });

  const findArcById = (
    featureId: string | number | undefined
  ): T | undefined => {
    if (featureId === undefined || featureId === null) {
      return undefined;
    }
    return arcCallbacksRef.current.data.find(
      (arc) => String(arc.id) === String(featureId)
    );
  };

  const handleArcMouseMove = useStableEventHandler(
    (e: MapLibreGL.MapLayerMouseEvent) => {
      const map = arcMapRef.current;
      if (map === null || map === undefined) {
        return;
      }
      const featureId = e.features?.[0]?.id;
      if (
        featureId === undefined ||
        featureId === null ||
        featureId === hoveredArcIdRef.current
      ) {
        return;
      }

      setArcHover(featureId);
      map.getCanvas().style.cursor = "pointer";

      const arc = findArcById(featureId);
      if (arc !== undefined) {
        arcCallbacksRef.current.hover?.({
          arc,
          latitude: e.lngLat.lat,
          longitude: e.lngLat.lng,
          originalEvent: e,
        });
      }
    }
  );

  const handleArcMouseLeave = useStableEventHandler(() => {
    const map = arcMapRef.current;
    if (map === null || map === undefined) {
      return;
    }
    setArcHover(null);
    map.getCanvas().style.cursor = "";
    arcCallbacksRef.current.hover?.(null);
  });

  const handleArcClick = useStableEventHandler(
    (e: MapLibreGL.MapLayerMouseEvent) => {
      const arc = findArcById(e.features?.[0]?.id);
      if (arc === undefined) {
        return;
      }
      arcCallbacksRef.current.click?.({
        arc,
        latitude: e.lngLat.lat,
        longitude: e.lngLat.lng,
        originalEvent: e,
      });
    }
  );

  const arcSetup = useMountValue({
    beforeId,
    geoJSON,
    hitLayerId,
    hitWidth,
    layerId,
    mergedLayout,
    mergedPaint,
    sourceId,
  });

  // Add source and layers on mount.
  useEffect(() => {
    if (!isLoaded || mapInstance === null) {
      return () => {
        noopEffectCleanup();
      };
    }
    const map = mapInstance;
    const setup = arcSetup;
    map.addSource(setup.sourceId, {
      data: setup.geoJSON,
      promoteId: "id",
      type: "geojson",
    });

    map.addLayer(
      {
        id: setup.hitLayerId,
        layout: DEFAULT_ARC_LAYOUT,
        paint: {
          "line-color": "rgba(0, 0, 0, 0)",
          "line-opacity": 1,
          "line-width": setup.hitWidth,
        },
        source: setup.sourceId,
        type: "line",
      },
      setup.beforeId
    );

    map.addLayer(
      {
        id: setup.layerId,
        layout: setup.mergedLayout,
        paint: setup.mergedPaint,
        source: setup.sourceId,
        type: "line",
      },
      setup.beforeId
    );

    return () => {
      try {
        if (map.getLayer(setup.layerId)) {
          map.removeLayer(setup.layerId);
        }
        if (map.getLayer(setup.hitLayerId)) {
          map.removeLayer(setup.hitLayerId);
        }
        if (map.getSource(setup.sourceId)) {
          map.removeSource(setup.sourceId);
        }
      } catch {
        // ignore
      }
    };
  }, [arcSetup, isLoaded, mapInstance]);

  if (isLoaded && mapInstance !== null) {
    getGeoJSONSource(mapInstance, sourceId)?.setData(geoJSON);
  }

  if (
    isLoaded &&
    mapInstance !== null &&
    mapInstance.getLayer(layerId) !== undefined
  ) {
    syncPaintProperties(mapInstance, layerId, mergedPaint);
    syncLayoutProperties(mapInstance, layerId, mergedLayout);
    if (mapInstance.getLayer(hitLayerId) !== undefined) {
      mapInstance.setPaintProperty(hitLayerId, "line-width", hitWidth);
    }
  }

  // Interaction handlers
  useEffect(() => {
    if (!isLoaded || !interactive || mapInstance === null) {
      return () => {
        noopEffectCleanup();
      };
    }
    const map = mapInstance;
    const activeHitLayerId = hitLayerIdRef.current;

    map.on("mousemove", activeHitLayerId, handleArcMouseMove);
    map.on("mouseleave", activeHitLayerId, handleArcMouseLeave);
    map.on("click", activeHitLayerId, handleArcClick);

    return () => {
      map.off("mousemove", activeHitLayerId, handleArcMouseMove);
      map.off("mouseleave", activeHitLayerId, handleArcMouseLeave);
      map.off("click", activeHitLayerId, handleArcClick);
      setArcHover(null);
      map.getCanvas().style.cursor = "";
    };
  }, [
    isLoaded,
    mapInstance,
    interactive,
    hitLayerIdRef,
    handleArcMouseMove,
    handleArcMouseLeave,
    handleArcClick,
    setArcHover,
  ]);

  return null;
};

const MapArc = <T extends MapArcDatum = MapArcDatum>(props: MapArcProps<T>) => {
  const { map: mapInstance, isLoaded } = useMap();
  return (
    <MapArcLayer
      beforeId={props.beforeId}
      clickHandler={props.onClick}
      curvature={props.curvature}
      data={props.data}
      hoverHandler={props.onHover}
      hoverPaint={props.hoverPaint}
      interactive={props.interactive}
      isLoaded={isLoaded}
      layout={props.layout}
      mapInstance={mapInstance}
      paint={props.paint}
      propId={props.id}
      samples={props.samples}
    />
  );
};

interface MapClusterLayerProps<
  P extends GeoJsonProperties = GeoJsonProperties,
> {
  /** GeoJSON FeatureCollection data or URL to fetch GeoJSON from */
  data: string | FeatureCollection<Point, P>;
  /** Maximum zoom level to cluster points on (default: 14) */
  clusterMaxZoom?: number;
  /** Radius of each cluster when clustering points in pixels (default: 50) */
  clusterRadius?: number;
  /** Colors for cluster circles: [small, medium, large] based on point count (default: ["#22c55e", "#eab308", "#ef4444"]) */
  clusterColors?: [string, string, string];
  /** Point count thresholds for color/size steps: [medium, large] (default: [100, 750]) */
  clusterThresholds?: [number, number];
  /** Color for unclustered individual points (default: "#3b82f6") */
  pointColor?: string;
  /** Callback when an unclustered point is clicked */
  onPointClick?: (
    feature: MapGeoJSONFeature,
    coordinates: [number, number]
  ) => void;
  /** Callback when a cluster is clicked. If not provided, zooms into the cluster */
  onClusterClick?: (
    clusterId: number,
    coordinates: [number, number],
    pointCount: number
  ) => void;
}

type MapClusterLayerInternalProps<
  P extends GeoJsonProperties = GeoJsonProperties,
> = Omit<MapClusterLayerProps<P>, "onPointClick" | "onClusterClick"> & {
  mapInstance: MapLibreGL.Map | null;
  isLoaded: boolean;
  clusterClickHandler?: (
    clusterId: number,
    coordinates: [number, number],
    pointCount: number
  ) => void;
  pointClickHandler?: (
    feature: MapGeoJSONFeature,
    coordinates: [number, number]
  ) => void;
};

const MapClusterLayerInternal = <
  P extends GeoJsonProperties = GeoJsonProperties,
>({
  mapInstance,
  isLoaded,
  data,
  clusterMaxZoom = 14,
  clusterRadius = 50,
  clusterColors = DEFAULT_CLUSTER_COLORS,
  clusterThresholds = DEFAULT_CLUSTER_THRESHOLDS,
  pointColor = "#3b82f6",
  clusterClickHandler,
  pointClickHandler,
}: MapClusterLayerInternalProps<P>) => {
  const id = useId();
  const sourceId = `cluster-source-${id}`;
  const clusterLayerId = `clusters-${id}`;
  const clusterCountLayerId = `cluster-count-${id}`;
  const unclusteredLayerId = `unclustered-point-${id}`;

  const stylePropsRef = useRef({
    clusterColors,
    clusterThresholds,
    pointColor,
  });

  const clusterCallbacksRef = useLatestRef({
    clusterClick: clusterClickHandler,
    pointClick: pointClickHandler,
  });
  const clusterMapRef = useLatestRef(mapInstance);
  const clusterLayerIdRef = useLatestRef(clusterLayerId);
  const unclusteredLayerIdRef = useLatestRef(unclusteredLayerId);
  const clusterSourceIdRef = useLatestRef(sourceId);

  const handleClusterClick = useStableEventHandler(
    (
      event: MapLibreGL.MapMouseEvent & {
        features?: MapLibreGL.MapGeoJSONFeature[];
      }
    ) => {
      void (async () => {
        const map = clusterMapRef.current;
        if (map === null || map === undefined) {
          return;
        }
        const activeClusterLayerId = clusterLayerIdRef.current;
        const features = map.queryRenderedFeatures(event.point, {
          layers: [activeClusterLayerId],
        });
        if (features.length === 0) {
          return;
        }

        const [feature] = features;
        const clusterId = readNumberProperty(feature.properties, "cluster_id");
        const pointCount = readNumberProperty(
          feature.properties,
          "point_count"
        );
        const coordinates = getPointCoordinates(feature.geometry);
        if (
          clusterId === undefined ||
          pointCount === undefined ||
          coordinates === undefined
        ) {
          return;
        }

        if (clusterCallbacksRef.current.clusterClick !== undefined) {
          clusterCallbacksRef.current.clusterClick(
            clusterId,
            coordinates,
            pointCount
          );
          return;
        }

        const source = getGeoJSONSource(map, clusterSourceIdRef.current);
        if (source === undefined) {
          return;
        }
        const zoom = await source.getClusterExpansionZoom(clusterId);
        map.easeTo({
          center: coordinates,
          zoom,
        });
      })();
    }
  );

  const handleClusterPointClick = useStableEventHandler(
    (
      event: MapLibreGL.MapMouseEvent & {
        features?: MapLibreGL.MapGeoJSONFeature[];
      }
    ) => {
      if (
        clusterCallbacksRef.current.pointClick === undefined ||
        event.features === undefined ||
        event.features.length === 0
      ) {
        return;
      }

      const [feature] = event.features;
      const baseCoordinates = getPointCoordinates(feature.geometry);
      if (baseCoordinates === undefined) {
        return;
      }
      const coordinates: [number, number] = [...baseCoordinates];

      while (Math.abs(event.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += event.lngLat.lng > coordinates[0] ? 360 : -360;
      }

      clusterCallbacksRef.current.pointClick(
        toMapGeoJSONFeature(feature),
        coordinates
      );
    }
  );

  const handleClusterMouseEnter = useStableEventHandler(() => {
    const map = clusterMapRef.current;
    if (map !== null && map !== undefined) {
      map.getCanvas().style.cursor = "pointer";
    }
  });

  const handleClusterMouseLeave = useStableEventHandler(() => {
    const map = clusterMapRef.current;
    if (map !== null && map !== undefined) {
      map.getCanvas().style.cursor = "";
    }
  });

  const handleClusterPointMouseEnter = useStableEventHandler(() => {
    if (clusterCallbacksRef.current.pointClick !== undefined) {
      const map = clusterMapRef.current;
      if (map !== null && map !== undefined) {
        map.getCanvas().style.cursor = "pointer";
      }
    }
  });

  const handleClusterPointMouseLeave = useStableEventHandler(() => {
    const map = clusterMapRef.current;
    if (map !== null && map !== undefined) {
      map.getCanvas().style.cursor = "";
    }
  });

  const clusterSetup = useMountValue({
    clusterColors,
    clusterCountLayerId,
    clusterLayerId,
    clusterMaxZoom,
    clusterRadius,
    clusterThresholds,
    data,
    pointColor,
    sourceId,
    unclusteredLayerId,
  });

  useEffect(() => {
    if (!isLoaded || mapInstance === null) {
      return () => {
        noopEffectCleanup();
      };
    }
    const map = mapInstance;
    const setup = clusterSetup;
    map.addSource(setup.sourceId, {
      cluster: true,
      clusterMaxZoom: setup.clusterMaxZoom,
      clusterRadius: setup.clusterRadius,
      data: setup.data,
      type: "geojson",
    });

    map.addLayer({
      filter: ["has", "point_count"],
      id: setup.clusterLayerId,
      paint: {
        "circle-color": [
          "step",
          ["get", "point_count"],
          setup.clusterColors[0],
          setup.clusterThresholds[0],
          setup.clusterColors[1],
          setup.clusterThresholds[1],
          setup.clusterColors[2],
        ],
        "circle-opacity": 0.85,
        "circle-radius": [
          "step",
          ["get", "point_count"],
          20,
          setup.clusterThresholds[0],
          30,
          setup.clusterThresholds[1],
          40,
        ],
        "circle-stroke-color": "#fff",
        "circle-stroke-width": 1,
      },
      source: setup.sourceId,
      type: "circle",
    });

    map.addLayer({
      filter: ["has", "point_count"],
      id: setup.clusterCountLayerId,
      layout: {
        "text-field": "{point_count_abbreviated}",
        "text-font": ["Open Sans"],
        "text-size": 12,
      },
      paint: {
        "text-color": "#fff",
      },
      source: setup.sourceId,
      type: "symbol",
    });

    map.addLayer({
      filter: ["!", ["has", "point_count"]],
      id: setup.unclusteredLayerId,
      paint: {
        "circle-color": setup.pointColor,
        "circle-radius": 5,
        "circle-stroke-color": "#fff",
        "circle-stroke-width": 2,
      },
      source: setup.sourceId,
      type: "circle",
    });

    return () => {
      try {
        if (map.getLayer(setup.clusterCountLayerId)) {
          map.removeLayer(setup.clusterCountLayerId);
        }
        if (map.getLayer(setup.unclusteredLayerId)) {
          map.removeLayer(setup.unclusteredLayerId);
        }
        if (map.getLayer(setup.clusterLayerId)) {
          map.removeLayer(setup.clusterLayerId);
        }
        if (map.getSource(setup.sourceId)) {
          map.removeSource(setup.sourceId);
        }
      } catch {
        // ignore
      }
    };
  }, [clusterSetup, isLoaded, mapInstance]);

  if (isLoaded && mapInstance !== null) {
    if (typeof data !== "string") {
      getGeoJSONSource(mapInstance, sourceId)?.setData(data);
    }
    const prev = stylePropsRef.current;
    const colorsChanged =
      prev.clusterColors !== clusterColors ||
      prev.clusterThresholds !== clusterThresholds;

    if (mapInstance.getLayer(clusterLayerId) && colorsChanged) {
      mapInstance.setPaintProperty(clusterLayerId, "circle-color", [
        "step",
        ["get", "point_count"],
        clusterColors[0],
        clusterThresholds[0],
        clusterColors[1],
        clusterThresholds[1],
        clusterColors[2],
      ]);
      mapInstance.setPaintProperty(clusterLayerId, "circle-radius", [
        "step",
        ["get", "point_count"],
        20,
        clusterThresholds[0],
        30,
        clusterThresholds[1],
        40,
      ]);
    }

    if (
      mapInstance.getLayer(unclusteredLayerId) &&
      prev.pointColor !== pointColor
    ) {
      mapInstance.setPaintProperty(
        unclusteredLayerId,
        "circle-color",
        pointColor
      );
    }

    stylePropsRef.current = { clusterColors, clusterThresholds, pointColor };
  }

  useEffect(() => {
    if (!isLoaded || mapInstance === null) {
      return () => {
        noopEffectCleanup();
      };
    }
    const map = mapInstance;
    const activeClusterLayerId = clusterLayerIdRef.current;
    const activeUnclusteredLayerId = unclusteredLayerIdRef.current;

    map.on("click", activeClusterLayerId, handleClusterClick);
    map.on("click", activeUnclusteredLayerId, handleClusterPointClick);
    map.on("mouseenter", activeClusterLayerId, handleClusterMouseEnter);
    map.on("mouseleave", activeClusterLayerId, handleClusterMouseLeave);
    map.on(
      "mouseenter",
      activeUnclusteredLayerId,
      handleClusterPointMouseEnter
    );
    map.on(
      "mouseleave",
      activeUnclusteredLayerId,
      handleClusterPointMouseLeave
    );

    return () => {
      map.off("click", activeClusterLayerId, handleClusterClick);
      map.off("click", activeUnclusteredLayerId, handleClusterPointClick);
      map.off("mouseenter", activeClusterLayerId, handleClusterMouseEnter);
      map.off("mouseleave", activeClusterLayerId, handleClusterMouseLeave);
      map.off(
        "mouseenter",
        activeUnclusteredLayerId,
        handleClusterPointMouseEnter
      );
      map.off(
        "mouseleave",
        activeUnclusteredLayerId,
        handleClusterPointMouseLeave
      );
    };
  }, [
    isLoaded,
    mapInstance,
    clusterLayerIdRef,
    unclusteredLayerIdRef,
    handleClusterClick,
    handleClusterPointClick,
    handleClusterMouseEnter,
    handleClusterMouseLeave,
    handleClusterPointMouseEnter,
    handleClusterPointMouseLeave,
  ]);

  return null;
};

const MapClusterLayer = <P extends GeoJsonProperties = GeoJsonProperties>(
  props: MapClusterLayerProps<P>
) => {
  const { map: mapInstance, isLoaded } = useMap();
  return (
    <MapClusterLayerInternal
      clusterClickHandler={props.onClusterClick}
      clusterColors={props.clusterColors}
      clusterMaxZoom={props.clusterMaxZoom}
      clusterRadius={props.clusterRadius}
      clusterThresholds={props.clusterThresholds}
      data={props.data}
      isLoaded={isLoaded}
      mapInstance={mapInstance}
      pointClickHandler={props.onPointClick}
      pointColor={props.pointColor}
    />
  );
};

export {
  Map,
  useMap,
  MapMarker,
  MarkerContent,
  MarkerPopup,
  MarkerTooltip,
  MarkerLabel,
  MapPopup,
  MapControls,
  MapRoute,
  MapArc,
  MapGeoJSON,
  MapClusterLayer,
};

export type {
  MapRef,
  MapViewport,
  MapArcDatum,
  MapArcEvent,
  MapGeoJSONEvent,
  MapGeoJSONFeature,
  MapControlFeature,
};
