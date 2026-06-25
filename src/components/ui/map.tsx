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
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

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

const mergeHoverPaint = (
  paint: Record<string, unknown>,
  hoverPaint: Record<string, unknown> | undefined
): Record<string, unknown> => {
  if (hoverPaint === undefined) {
    return paint;
  }
  const merged: Record<string, unknown> = { ...paint };
  for (const [key, hoverValue] of Object.entries(hoverPaint)) {
    if (hoverValue === undefined) {
      continue;
    }
    const baseValue = merged[key];
    merged[key] =
      baseValue === undefined
        ? hoverValue
        : [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            hoverValue,
            baseValue,
          ];
  }
  return merged;
};

const isGeoJSONSource = (
  source: MapLibreGL.Source
): source is MapLibreGL.GeoJSONSource => source.type === "geojson";

const getGeoJSONSource = (
  map: MapLibreGL.Map,
  sourceId: string
): MapLibreGL.GeoJSONSource | undefined => {
  const source = map.getSource(sourceId);
  if (source === undefined || !isGeoJSONSource(source)) {
    return undefined;
  }
  return source;
};

const runEffect = <T,>(
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

const useLazyInstance = <T,>(factory: () => T): T => {
  const ref = useRef<T | null>(null);
  ref.current ??= factory();
  return ref.current;
};

const useFrozenValue = <T,>(value: T): T => {
  const ref = useRef<T | null>(null);
  ref.current ??= value;
  return ref.current;
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

const useResolvedTheme = (themeProp?: "light" | "dark"): Theme => {
  const [detectedTheme, setDetectedTheme] = useState<Theme>(
    () => getDocumentTheme() ?? getSystemTheme()
  );

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    if (themeProp === undefined) {
      const observer = new MutationObserver(() => {
        const docTheme = getDocumentTheme();
        if (docTheme) {
          setDetectedTheme(docTheme);
        }
      });
      observer.observe(document.documentElement, {
        attributeFilter: ["class"],
        attributes: true,
      });

      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleSystemChange = (e: MediaQueryListEvent) => {
        if (!getDocumentTheme()) {
          setDetectedTheme(e.matches ? "dark" : "light");
        }
      };
      mediaQuery.addEventListener("change", handleSystemChange);

      cleanup = () => {
        observer.disconnect();
        mediaQuery.removeEventListener("change", handleSystemChange);
      };
    }

    return () => {
      cleanup?.();
    };
  }, [themeProp]);

  return themeProp ?? detectedTheme;
};

interface MapContextValue {
  map: MapLibreGL.Map | null;
  isLoaded: boolean;
  resolvedTheme: Theme;
}

const MapContext = createContext<MapContextValue | null>(null);

const useMap = () => {
  const context = useContext(MapContext);
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

const getViewport = (map: MapLibreGL.Map): MapViewport => {
  const center = map.getCenter();
  return {
    bearing: map.getBearing(),
    center: [center.lng, center.lat],
    pitch: map.getPitch(),
    zoom: map.getZoom(),
  };
};

const Map = forwardRef<MapRef, MapProps>(
  (
    {
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
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [mapInstance, setMapInstance] = useState<MapLibreGL.Map | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isStyleLoaded, setIsStyleLoaded] = useState(false);
    const currentStyleRef = useRef<MapStyleOption | null>(null);
    const styleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const internalUpdateRef = useRef(false);
    const resolvedTheme = useResolvedTheme(themeProp);

    const isControlled =
      viewport !== undefined && onViewportChange !== undefined;

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

    const mapInitConfig = useFrozenValue({
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
            setIsStyleLoaded(true);
            if (config.projection) {
              map.setProjection(config.projection);
            }
          }, 100);
        };
        const loadHandler = () => {
          setIsLoaded(true);
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
        setMapInstance(map);

        cleanup = () => {
          clearStyleTimeout();
          map.off("load", loadHandler);
          map.off("styledata", styleDataHandler);
          map.off("move", handleMove);
          map.remove();
          setIsLoaded(false);
          setIsStyleLoaded(false);
          setMapInstance(null);
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
      setIsStyleLoaded(false);

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
  }
);

interface MarkerContextValue {
  marker: MapLibreGL.Marker;
  map: MapLibreGL.Map | null;
}

const MarkerContext = createContext<MarkerContextValue | null>(null);

const useMarkerContext = () => {
  const context = useContext(MarkerContext);
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

  const callbacksRef = useRef({
    onClick,
    onDrag,
    onDragEnd,
    onDragStart,
    onMouseEnter,
    onMouseLeave,
  });
  callbacksRef.current = {
    onClick,
    onDrag,
    onDragEnd,
    onDragStart,
    onMouseEnter,
    onMouseLeave,
  };

  const marker = useLazyInstance(() => {
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

  useEffect(() => {
    const current = marker.getLngLat();
    if (current.lng !== longitude || current.lat !== latitude) {
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
  }, [
    marker,
    longitude,
    latitude,
    draggable,
    offset,
    rotation,
    rotationAlignment,
    pitchAlignment,
  ]);

  return (
    <MarkerContext.Provider value={{ map: mapInstance, marker }}>
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
  const container = useLazyInstance(() => document.createElement("div"));
  const { offset, maxWidth } = popupOptions;

  const popup = useLazyInstance(() =>
    new MapLibreGL.Popup({
      offset: 16,
      ...popupOptions,
      closeButton: false,
    })
      .setMaxWidth("none")
      .setDOMContent(container)
  );

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

  // Sync popup options when they change.
  useEffect(() => {
    popup.setOffset(offset ?? 16);
    if (maxWidth !== undefined && maxWidth !== null && maxWidth !== "") {
      popup.setMaxWidth(maxWidth);
    }
  }, [popup, offset, maxWidth]);

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
  const container = useLazyInstance(() => document.createElement("div"));
  const { offset, maxWidth } = popupOptions;

  const tooltip = useLazyInstance(() =>
    new MapLibreGL.Popup({
      closeButton: false,
      closeOnClick: true,
      offset: 16,
      ...popupOptions,
    }).setMaxWidth("none")
  );

  useEffect(
    () =>
      runEffect(mapInstance, (map) => {
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
      }),
    [container, mapInstance, marker, tooltip]
  );

  // Sync tooltip options when they change.
  useEffect(() => {
    tooltip.setOffset(offset ?? 16);
    if (maxWidth !== undefined && maxWidth !== null && maxWidth !== "") {
      tooltip.setMaxWidth(maxWidth);
    }
  }, [tooltip, offset, maxWidth]);

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
}: MarkerLabelProps) => {
  const positionClasses = {
    bottom: "top-full mt-1",
    top: "bottom-full mb-1",
  };

  return (
    <div
      className={cn(
        "absolute left-1/2 -translate-x-1/2 whitespace-nowrap",
        "text-foreground text-[10px] font-medium",
        positionClasses[position],
        className
      )}
    >
      {children}
    </div>
  );
};

interface MapControlsProps {
  /** Position of the controls on the map (default: "bottom-right") */
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  /** Show zoom in/out buttons (default: true) */
  showZoom?: boolean;
  /** Show compass button to reset bearing (default: false) */
  showCompass?: boolean;
  /** Show locate button to find user's location (default: false) */
  showLocate?: boolean;
  /** Show fullscreen toggle button (default: false) */
  showFullscreen?: boolean;
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

  useEffect(
    () =>
      runEffect(map, (activeMap) => {
        const compass = compassRef.current;
        if (compass === null) {
          return () => {
            void 0;
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
      }),
    [map]
  );

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
  showZoom = true,
  showCompass = false,
  showLocate = false,
  showFullscreen = false,
  className,
  onLocate,
}: MapControlsProps) => {
  const { map } = useMap();
  const [waitingForLocation, setWaitingForLocation] = useState(false);

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
      {showZoom && (
        <ControlGroup>
          <ControlButton onClick={handleZoomIn} label="Zoom in">
            <Plus className="size-4" />
          </ControlButton>
          <ControlButton onClick={handleZoomOut} label="Zoom out">
            <Minus className="size-4" />
          </ControlButton>
        </ControlGroup>
      )}
      {showCompass && (
        <ControlGroup>
          <CompassButton onClick={handleResetBearing} />
        </ControlGroup>
      )}
      {showLocate && (
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
      {showFullscreen && (
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
  const container = useLazyInstance(() => document.createElement("div"));
  const { offset, maxWidth } = popupOptions;

  const popup = useLazyInstance(() =>
    new MapLibreGL.Popup({
      offset: 16,
      ...popupOptions,
      closeButton: false,
    })
      .setMaxWidth("none")
      .setLngLat([longitude, latitude])
  );

  useEffect(
    () =>
      runEffect(mapInstance, (map) => {
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
      }),
    [container, mapInstance, popup]
  );

  // Sync popup position and options when they change.
  useEffect(() => {
    const current = popup.getLngLat();
    if (current.lng !== longitude || current.lat !== latitude) {
      popup.setLngLat([longitude, latitude]);
    }
    popup.setOffset(offset ?? 16);
    if (maxWidth !== undefined && maxWidth !== null && maxWidth !== "") {
      popup.setMaxWidth(maxWidth);
    }
  }, [popup, longitude, latitude, offset, maxWidth]);

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

const MapRoute = ({
  id: propId,
  coordinates,
  color = "#4285F4",
  width = 3,
  opacity = 0.8,
  dashArray,
  onClick,
  onMouseEnter,
  onMouseLeave,
  interactive = true,
}: MapRouteProps) => {
  const { map: mapInstance, isLoaded } = useMap();
  const autoId = useId();
  const id = propId ?? autoId;
  const sourceId = `route-source-${id}`;
  const layerId = `route-layer-${id}`;
  const routeSetup = useFrozenValue({
    color,
    dashArray,
    layerId,
    opacity,
    sourceId,
    width,
  });

  // Add source and layer on mount
  useEffect(
    () =>
      runEffect(isLoaded ? mapInstance : null, (map) => {
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
      }),
    [isLoaded, mapInstance, routeSetup]
  );

  // When coordinates change, update the source data
  useEffect(() => {
    if (!isLoaded || mapInstance === null || coordinates.length < 2) {
      return;
    }

    const source = getGeoJSONSource(mapInstance, sourceId);
    if (source !== undefined) {
      source.setData({
        geometry: { coordinates, type: "LineString" },
        properties: {},
        type: "Feature",
      });
    }
  }, [isLoaded, mapInstance, coordinates, sourceId]);

  useEffect(() => {
    if (
      !isLoaded ||
      mapInstance === null ||
      mapInstance.getLayer(layerId) === undefined
    ) {
      return;
    }

    mapInstance.setPaintProperty(layerId, "line-color", color);
    mapInstance.setPaintProperty(layerId, "line-width", width);
    mapInstance.setPaintProperty(layerId, "line-opacity", opacity);
    mapInstance.setPaintProperty(layerId, "line-dasharray", dashArray);
  }, [isLoaded, mapInstance, layerId, color, width, opacity, dashArray]);

  // Handle click and hover events
  useEffect(
    () =>
      runEffect(isLoaded && interactive ? mapInstance : null, (map) => {
        const handleClick = () => {
          onClick?.();
        };
        const handleMouseEnter = () => {
          map.getCanvas().style.cursor = "pointer";
          onMouseEnter?.();
        };
        const handleMouseLeave = () => {
          map.getCanvas().style.cursor = "";
          onMouseLeave?.();
        };

        map.on("click", layerId, handleClick);
        map.on("mouseenter", layerId, handleMouseEnter);
        map.on("mouseleave", layerId, handleMouseLeave);

        return () => {
          map.off("click", layerId, handleClick);
          map.off("mouseenter", layerId, handleMouseEnter);
          map.off("mouseleave", layerId, handleMouseLeave);
        };
      }),
    [
      isLoaded,
      mapInstance,
      layerId,
      onClick,
      onMouseEnter,
      onMouseLeave,
      interactive,
    ]
  );

  return null;
};

type MapGeoJSONData<P extends GeoJsonProperties = GeoJsonProperties> =
  | FeatureCollection<Geometry, P>
  | Feature<Geometry, P>
  | Geometry
  | string;

type MapFillPaint = NonNullable<MapLibreGL.FillLayerSpecification["paint"]>;
type MapLinePaint = NonNullable<MapLibreGL.LineLayerSpecification["paint"]>;

/** A rendered feature with strongly-typed `properties`. */
interface MapGeoJSONFeature {
  geometry: Geometry;
  id?: string | number;
  layer: MapLibreGL.MapGeoJSONFeature["layer"];
  properties: GeoJsonProperties;
  source: string;
  state: Record<string, unknown>;
  type: "Feature";
}

const toMapGeoJSONFeature = (
  feature: MapLibreGL.MapGeoJSONFeature
): MapGeoJSONFeature => ({
  geometry: feature.geometry,
  id: feature.id,
  layer: feature.layer,
  properties: feature.properties,
  source: feature.source,
  state: feature.state,
  type: feature.type,
});

const syncPaintProperties = (
  map: MapLibreGL.Map,
  layerId: string,
  paint: Record<string, unknown>
): void => {
  for (const [key, value] of Object.entries(paint)) {
    map.setPaintProperty(layerId, key, value);
  }
};

const syncLayoutProperties = (
  map: MapLibreGL.Map,
  layerId: string,
  layout: Record<string, unknown>
): void => {
  for (const [key, value] of Object.entries(layout)) {
    map.setLayoutProperty(layerId, key, value);
  }
};

const isPointGeometry = (geometry: Geometry): geometry is Point =>
  geometry.type === "Point";

const getPointCoordinates = (
  geometry: Geometry
): [number, number] | undefined => {
  if (!isPointGeometry(geometry)) {
    return undefined;
  }
  const [lng, lat] = geometry.coordinates;
  if (typeof lng !== "number" || typeof lat !== "number") {
    return undefined;
  }
  return [lng, lat];
};

const readNumberProperty = (
  properties: GeoJsonProperties,
  key: string
): number | undefined => {
  if (properties === null) {
    return undefined;
  }
  const value: unknown = properties[key];
  return typeof value === "number" ? value : undefined;
};

/** Event payload passed to MapGeoJSON interaction callbacks. */
interface MapGeoJSONEvent {
  /** The feature under the cursor, with its typed GeoJSON properties. */
  feature: MapGeoJSONFeature;
  /** Longitude of the cursor at the time of the event. */
  longitude: number;
  /** Latitude of the cursor at the time of the event. */
  latitude: number;
  /** The underlying MapLibre mouse event for advanced use cases. */
  originalEvent: MapLibreGL.MapLayerMouseEvent;
}

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

// Theme-aware monochrome defaults so MapGeoJSON reads
// clearly on the light/dark surface out of the box: a visible neutral-gray fill
// with page-background separators between shapes. Override either via
// `fillPaint` / `linePaint`.
const GEOJSON_DEFAULT_COLORS = {
  dark: { fill: "#404040", line: "#0a0a0a" },
  light: { fill: "#d4d4d4", line: "#fafafa" },
} satisfies Record<Theme, { fill: string; line: string }>;

/**
 * Renders arbitrary GeoJSON as fill + outline layers on the map. Composes like
 * `MapRoute` / `MapArc` — drop it inside `<Map>` (typically with `blank`) for
 * choropleths and region/data maps. For full control over expressions and
 * multiple layers, manage layers directly via `useMap()` instead.
 */
const MapGeoJSON = <P extends GeoJsonProperties = GeoJsonProperties>({
  data,
  id: propId,
  promoteId,
  fillPaint,
  linePaint,
  fillHoverPaint,
  onClick,
  onHover,
  interactive = false,
  beforeId,
}: MapGeoJSONProps<P>) => {
  const { map: mapInstance, isLoaded, resolvedTheme } = useMap();
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
  const latestRef = useRef({ onClick, onHover });
  latestRef.current = { onClick, onHover };

  const geoJsonSourceSetup = useFrozenValue({
    data,
    fillLayerId,
    lineLayerId,
    promoteId,
    sourceId,
  });

  // Add source on mount.
  useEffect(
    () =>
      runEffect(isLoaded ? mapInstance : null, (map) => {
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
      }),
    [geoJsonSourceSetup, isLoaded, mapInstance]
  );

  // Sync data when it changes.
  useEffect(() => {
    if (!isLoaded || mapInstance === null) {
      return;
    }
    const source = getGeoJSONSource(mapInstance, sourceId);
    source?.setData(data);
  }, [isLoaded, mapInstance, data, sourceId]);

  // Sync layers and paint when visibility or styling changes.
  useEffect(() => {
    if (!isLoaded || mapInstance === null) {
      return;
    }

    const source = mapInstance.getSource(sourceId);
    if (source === undefined) {
      return;
    }

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
  }, [
    isLoaded,
    mapInstance,
    sourceId,
    fillLayerId,
    lineLayerId,
    showFill,
    showLine,
    mergedFillPaint,
    mergedLinePaint,
    beforeId,
  ]);

  // Interaction handlers (bound to the fill layer).
  useEffect(
    () =>
      runEffect(
        isLoaded && interactive && showFill ? mapInstance : null,
        (map) => {
          let hoveredId: string | number | null = null;

          const setHover = (next: string | number | null) => {
            if (next === hoveredId) {
              return;
            }
            const sourceExists = map.getSource(sourceId) !== undefined;
            if (hoveredId !== null && sourceExists) {
              map.setFeatureState(
                { id: hoveredId, source: sourceId },
                { hover: false }
              );
            }
            hoveredId = next;
            if (next !== null && sourceExists) {
              map.setFeatureState(
                { id: next, source: sourceId },
                { hover: true }
              );
            }
          };

          const handleMouseMove = (e: MapLibreGL.MapLayerMouseEvent) => {
            const [feature] = e.features ?? [];
            if (feature === undefined) {
              return;
            }
            map.getCanvas().style.cursor = "pointer";

            const featureId = feature.id;
            if (featureId === hoveredId) {
              return;
            }
            setHover(featureId ?? null);
            latestRef.current.onHover?.({
              feature: toMapGeoJSONFeature(feature),
              latitude: e.lngLat.lat,
              longitude: e.lngLat.lng,
              originalEvent: e,
            });
          };

          const handleMouseLeave = () => {
            setHover(null);
            map.getCanvas().style.cursor = "";
            latestRef.current.onHover?.(null);
          };

          const handleClick = (e: MapLibreGL.MapLayerMouseEvent) => {
            const [feature] = e.features ?? [];
            if (feature === undefined) {
              return;
            }
            latestRef.current.onClick?.({
              feature: toMapGeoJSONFeature(feature),
              latitude: e.lngLat.lat,
              longitude: e.lngLat.lng,
              originalEvent: e,
            });
          };

          map.on("mousemove", fillLayerId, handleMouseMove);
          map.on("mouseleave", fillLayerId, handleMouseLeave);
          map.on("click", fillLayerId, handleClick);

          return () => {
            map.off("mousemove", fillLayerId, handleMouseMove);
            map.off("mouseleave", fillLayerId, handleMouseLeave);
            map.off("click", fillLayerId, handleClick);
            setHover(null);
            map.getCanvas().style.cursor = "";
          };
        }
      ),
    [isLoaded, mapInstance, fillLayerId, sourceId, interactive, showFill]
  );

  return null;
};

/** A single arc to render inside <MapArc data={...}>. */
interface MapArcDatum {
  /** Unique identifier for this arc. Required for hover state tracking and event payloads. */
  id: string | number;
  /** Start coordinate as [longitude, latitude]. */
  from: [number, number];
  /** End coordinate as [longitude, latitude]. */
  to: [number, number];
}

/** Event payload passed to MapArc interaction callbacks. */
interface MapArcEvent<T extends MapArcDatum = MapArcDatum> {
  /** The arc datum that was hovered or clicked. */
  arc: T;
  /** Longitude of the cursor at the time of the event. */
  longitude: number;
  /** Latitude of the cursor at the time of the event. */
  latitude: number;
  /** The underlying MapLibre mouse event for advanced use cases. */
  originalEvent: MapLibreGL.MapMouseEvent;
}

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

const DEFAULT_ARC_CURVATURE = 0.2;
const DEFAULT_ARC_SAMPLES = 64;
const ARC_HIT_MIN_WIDTH = 12;
const ARC_HIT_PADDING = 6;

const DEFAULT_ARC_PAINT: MapArcLinePaint = {
  "line-color": "#4285F4",
  "line-opacity": 0.85,
  "line-width": 2,
};

const DEFAULT_ARC_LAYOUT: MapArcLineLayout = {
  "line-cap": "round",
  "line-join": "round",
};

const buildArcCoordinates = (
  from: [number, number],
  to: [number, number],
  curvature: number,
  samples: number
): [number, number][] => {
  const [x0, y0] = from;
  const [xTo, y2] = to;
  // Unwrap the destination longitude so |dx| <= 180. This makes arcs that
  // straddle the antimeridian (e.g. Tokyo -> San Francisco) bow the short way
  // across the Pacific instead of the long way around the globe. Resulting
  // longitudes may fall outside [-180, 180]; MapLibre renders them correctly
  // on the globe projection, and on mercator when world copies are enabled.
  const rawDx = xTo - x0;
  let x2 = xTo;
  if (rawDx > 180) {
    x2 = xTo - 360;
  } else if (rawDx < -180) {
    x2 = xTo + 360;
  }
  const dx = x2 - x0;
  const dy = y2 - y0;
  const distance = Math.hypot(dx, dy);

  if (distance === 0 || curvature === 0) {
    return [from, [x2, y2]];
  }

  const mx = (x0 + x2) / 2;
  const my = (y0 + y2) / 2;
  const nx = -dy / distance;
  const ny = dx / distance;
  const offset = distance * curvature;
  const cx = mx + nx * offset;
  const cy = my + ny * offset;

  const points: [number, number][] = [];
  const segments = Math.max(2, Math.floor(samples));
  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    const inv = 1 - t;
    const x = inv * inv * x0 + 2 * inv * t * cx + t * t * x2;
    const y = inv * inv * y0 + 2 * inv * t * cy + t * t * y2;
    points.push([x, y]);
  }
  return points;
};

const MapArc = <T extends MapArcDatum = MapArcDatum>({
  data,
  id: propId,
  curvature = DEFAULT_ARC_CURVATURE,
  samples = DEFAULT_ARC_SAMPLES,
  paint,
  layout,
  hoverPaint,
  onClick,
  onHover,
  interactive = true,
  beforeId,
}: MapArcProps<T>) => {
  const { map: mapInstance, isLoaded } = useMap();
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

  const hitWidth = useMemo(() => {
    const w = paint?.["line-width"] ?? DEFAULT_ARC_PAINT["line-width"];
    const base = typeof w === "number" ? w : ARC_HIT_MIN_WIDTH;
    return Math.max(base + ARC_HIT_PADDING, ARC_HIT_MIN_WIDTH);
  }, [paint]);

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

  const latestRef = useRef({ data, onClick, onHover });
  latestRef.current = { data, onClick, onHover };

  const arcSetup = useFrozenValue({
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
  useEffect(
    () =>
      runEffect(isLoaded ? mapInstance : null, (map) => {
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
      }),
    [arcSetup, isLoaded, mapInstance]
  );

  // Sync features when data / curvature / samples change.
  useEffect(() => {
    if (!isLoaded || mapInstance === null) {
      return;
    }
    const source = getGeoJSONSource(mapInstance, sourceId);
    source?.setData(geoJSON);
  }, [isLoaded, mapInstance, geoJSON, sourceId]);

  // Sync paint/layout when they change.
  useEffect(() => {
    if (
      !isLoaded ||
      mapInstance === null ||
      mapInstance.getLayer(layerId) === undefined
    ) {
      return;
    }
    syncPaintProperties(mapInstance, layerId, mergedPaint);
    syncLayoutProperties(mapInstance, layerId, mergedLayout);
    if (mapInstance.getLayer(hitLayerId) !== undefined) {
      mapInstance.setPaintProperty(hitLayerId, "line-width", hitWidth);
    }
  }, [
    isLoaded,
    mapInstance,
    layerId,
    hitLayerId,
    mergedPaint,
    mergedLayout,
    hitWidth,
  ]);

  // Interaction handlers
  useEffect(
    () =>
      runEffect(isLoaded && interactive ? mapInstance : null, (map) => {
        let hoveredId: string | number | null = null;

        const setHover = (next: string | number | null) => {
          if (next === hoveredId) {
            return;
          }
          const sourceExists = map.getSource(sourceId) !== undefined;
          if (hoveredId !== null && sourceExists) {
            map.setFeatureState(
              { id: hoveredId, source: sourceId },
              { hover: false }
            );
          }
          hoveredId = next;
          if (next !== null && sourceExists) {
            map.setFeatureState(
              { id: next, source: sourceId },
              { hover: true }
            );
          }
        };

        const findArc = (
          featureId: string | number | undefined
        ): T | undefined => {
          if (featureId === undefined || featureId === null) {
            return undefined;
          }
          return latestRef.current.data.find(
            (arc) => String(arc.id) === String(featureId)
          );
        };

        const handleMouseMove = (e: MapLibreGL.MapLayerMouseEvent) => {
          const featureId = e.features?.[0]?.id;
          if (
            featureId === undefined ||
            featureId === null ||
            featureId === hoveredId
          ) {
            return;
          }

          setHover(featureId);
          map.getCanvas().style.cursor = "pointer";

          const arc = findArc(featureId);
          if (arc !== undefined) {
            latestRef.current.onHover?.({
              arc,
              latitude: e.lngLat.lat,
              longitude: e.lngLat.lng,
              originalEvent: e,
            });
          }
        };

        const handleMouseLeave = () => {
          setHover(null);
          map.getCanvas().style.cursor = "";
          latestRef.current.onHover?.(null);
        };

        const handleClick = (e: MapLibreGL.MapLayerMouseEvent) => {
          const arc = findArc(e.features?.[0]?.id);
          if (arc === undefined) {
            return;
          }
          latestRef.current.onClick?.({
            arc,
            latitude: e.lngLat.lat,
            longitude: e.lngLat.lng,
            originalEvent: e,
          });
        };

        map.on("mousemove", hitLayerId, handleMouseMove);
        map.on("mouseleave", hitLayerId, handleMouseLeave);
        map.on("click", hitLayerId, handleClick);

        return () => {
          map.off("mousemove", hitLayerId, handleMouseMove);
          map.off("mouseleave", hitLayerId, handleMouseLeave);
          map.off("click", hitLayerId, handleClick);
          setHover(null);
          map.getCanvas().style.cursor = "";
        };
      }),
    [isLoaded, mapInstance, hitLayerId, sourceId, interactive]
  );

  return null;
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

const DEFAULT_CLUSTER_COLORS: [string, string, string] = [
  "#22c55e",
  "#eab308",
  "#ef4444",
];
const DEFAULT_CLUSTER_THRESHOLDS: [number, number] = [100, 750];

const MapClusterLayer = <P extends GeoJsonProperties = GeoJsonProperties>({
  data,
  clusterMaxZoom = 14,
  clusterRadius = 50,
  clusterColors = DEFAULT_CLUSTER_COLORS,
  clusterThresholds = DEFAULT_CLUSTER_THRESHOLDS,
  pointColor = "#3b82f6",
  onPointClick,
  onClusterClick,
}: MapClusterLayerProps<P>) => {
  const { map: mapInstance, isLoaded } = useMap();
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

  const clusterSetup = useFrozenValue({
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

  useEffect(
    () =>
      runEffect(isLoaded ? mapInstance : null, (map) => {
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
      }),
    [clusterSetup, isLoaded, mapInstance]
  );

  // Update source data when data prop changes (only for non-URL data)
  useEffect(() => {
    if (!isLoaded || mapInstance === null || typeof data === "string") {
      return;
    }

    const source = getGeoJSONSource(mapInstance, sourceId);
    if (source !== undefined) {
      source.setData(data);
    }
  }, [isLoaded, mapInstance, data, sourceId]);

  // Update layer styles when props change
  useEffect(() => {
    if (!isLoaded || mapInstance === null) {
      return;
    }

    const prev = stylePropsRef.current;
    const colorsChanged =
      prev.clusterColors !== clusterColors ||
      prev.clusterThresholds !== clusterThresholds;

    // Update cluster layer colors and sizes
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

    // Update unclustered point layer color
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
  }, [
    isLoaded,
    mapInstance,
    clusterLayerId,
    unclusteredLayerId,
    clusterColors,
    clusterThresholds,
    pointColor,
  ]);

  useEffect(
    () =>
      runEffect(isLoaded ? mapInstance : null, (map) => {
        const handleClusterClick = (
          e: MapLibreGL.MapMouseEvent & {
            features?: MapLibreGL.MapGeoJSONFeature[];
          }
        ) => {
          void (async () => {
            const features = map.queryRenderedFeatures(e.point, {
              layers: [clusterLayerId],
            });
            if (features.length === 0) {
              return;
            }

            const [feature] = features;
            const clusterId = readNumberProperty(
              feature.properties,
              "cluster_id"
            );
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

            if (onClusterClick !== undefined) {
              onClusterClick(clusterId, coordinates, pointCount);
              return;
            }

            const source = getGeoJSONSource(map, sourceId);
            if (source === undefined) {
              return;
            }
            const zoom = await source.getClusterExpansionZoom(clusterId);
            map.easeTo({
              center: coordinates,
              zoom,
            });
          })();
        };

        const handlePointClick = (
          e: MapLibreGL.MapMouseEvent & {
            features?: MapLibreGL.MapGeoJSONFeature[];
          }
        ) => {
          if (
            onPointClick === undefined ||
            e.features === undefined ||
            e.features.length === 0
          ) {
            return;
          }

          const [feature] = e.features;
          const baseCoordinates = getPointCoordinates(feature.geometry);
          if (baseCoordinates === undefined) {
            return;
          }
          const coordinates: [number, number] = [...baseCoordinates];

          while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
          }

          onPointClick(toMapGeoJSONFeature(feature), coordinates);
        };

        const handleMouseEnterCluster = () => {
          map.getCanvas().style.cursor = "pointer";
        };
        const handleMouseLeaveCluster = () => {
          map.getCanvas().style.cursor = "";
        };
        const handleMouseEnterPoint = () => {
          if (onPointClick !== undefined) {
            map.getCanvas().style.cursor = "pointer";
          }
        };
        const handleMouseLeavePoint = () => {
          map.getCanvas().style.cursor = "";
        };

        map.on("click", clusterLayerId, handleClusterClick);
        map.on("click", unclusteredLayerId, handlePointClick);
        map.on("mouseenter", clusterLayerId, handleMouseEnterCluster);
        map.on("mouseleave", clusterLayerId, handleMouseLeaveCluster);
        map.on("mouseenter", unclusteredLayerId, handleMouseEnterPoint);
        map.on("mouseleave", unclusteredLayerId, handleMouseLeavePoint);

        return () => {
          map.off("click", clusterLayerId, handleClusterClick);
          map.off("click", unclusteredLayerId, handlePointClick);
          map.off("mouseenter", clusterLayerId, handleMouseEnterCluster);
          map.off("mouseleave", clusterLayerId, handleMouseLeaveCluster);
          map.off("mouseenter", unclusteredLayerId, handleMouseEnterPoint);
          map.off("mouseleave", unclusteredLayerId, handleMouseLeavePoint);
        };
      }),
    [
      isLoaded,
      mapInstance,
      clusterLayerId,
      unclusteredLayerId,
      sourceId,
      onClusterClick,
      onPointClick,
    ]
  );

  return null;
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

export type { MapRef, MapViewport, MapArcDatum, MapArcEvent, MapGeoJSONEvent };
