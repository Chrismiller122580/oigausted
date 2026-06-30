'use client';

import {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import {
  GoogleMapsConfigError,
  GOOGLE_MAPS_ALLOWED_REFERRERS,
  importMapLibraries,
  onGoogleMapsAuthFailure,
  type GoogleMapLibraries,
} from '@/lib/googleMapsLoader';
import {
  COLOMBIA_MAP_CENTER,
  type CityCluster,
  type GigMapPin,
  jitterPinsInCity,
} from '@/lib/gig-map';

const ZOOM_THRESHOLD = 8;
const CITY_ZOOM = 10;

export type MapCenter = {
  lat: number;
  lng: number;
  zoom?: number;
};

export type GigMapExplorerHandle = {
  focusCity: (lat: number, lng: number) => void;
};

type GigMapExplorerProps = {
  pins: GigMapPin[];
  clusters: CityCluster[];
  className?: string;
  height?: string;
  userLocation?: { lat: number; lng: number } | null;
  initialCenter?: MapCenter;
  onPinClick?: (pin: GigMapPin) => void;
  emptyHref?: string;
  emptyLabel?: string;
};

const GigMapExplorer = forwardRef<GigMapExplorerHandle, GigMapExplorerProps>(
  function GigMapExplorer(
    {
      pins,
      clusters,
      className,
      height = '420px',
      userLocation,
      initialCenter,
      onPinClick,
      emptyHref = '/gigs',
      emptyLabel = 'Explorar todos los servicios',
    },
    ref,
  ) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<GoogleMapInstance | null>(null);
    const markersRef = useRef<GoogleMapsMarkerInstance[]>([]);
    const mapLibsRef = useRef<GoogleMapLibraries | null>(null);
    const pinsRef = useRef(pins);
    const clustersRef = useRef(clusters);
    const onPinClickRef = useRef(onPinClick);
    const userLocationRef = useRef(userLocation);

    const [loadError, setLoadError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    pinsRef.current = pins;
    clustersRef.current = clusters;
    onPinClickRef.current = onPinClick;
    userLocationRef.current = userLocation;

    const clearMarkers = useCallback(() => {
      for (const marker of markersRef.current) {
        marker.setMap?.(null);
      }
      markersRef.current = [];
    }, []);

    const renderMarkers = useCallback(
      (map: GoogleMapInstance) => {
        const { Marker } = mapLibsRef.current ?? {};
        if (!Marker) return;

        clearMarkers();
        const zoom = map.getZoom?.() ?? COLOMBIA_MAP_CENTER.zoom;

        const loc = userLocationRef.current;
        if (loc) {
          const userMarker = new Marker({
            position: { lat: loc.lat, lng: loc.lng },
            map,
            title: 'Tu ubicación',
            zIndex: 999,
          });
          markersRef.current.push(userMarker);
        }

        if (zoom < ZOOM_THRESHOLD) {
          for (const cluster of clustersRef.current) {
            const marker = new Marker({
              position: { lat: cluster.lat, lng: cluster.lng },
              map,
              title: `${cluster.city} — ${cluster.count} servicios`,
              label: {
                text: String(cluster.count),
                color: '#ffffff',
                fontWeight: '700',
              },
            });

            marker.addListener?.('click', () => {
              mapRef.current?.panTo?.({ lat: cluster.lat, lng: cluster.lng });
              mapRef.current?.setZoom?.(CITY_ZOOM);
            });

            markersRef.current.push(marker);
          }
          return;
        }

        for (const pin of jitterPinsInCity(pinsRef.current)) {
          const marker = new Marker({
            position: { lat: pin.lat, lng: pin.lng },
            map,
            title: pin.title,
            cursor: 'pointer',
          });

          marker.addListener?.('click', () => {
            onPinClickRef.current?.(pin);
          });

          markersRef.current.push(marker);
        }
      },
      [clearMarkers],
    );

    const focusCity = useCallback((lat: number, lng: number) => {
      if (!mapRef.current) return;
      mapRef.current.panTo?.({ lat, lng });
      mapRef.current.setZoom?.(CITY_ZOOM);
    }, []);

    useImperativeHandle(ref, () => ({ focusCity }), [focusCity]);

    useEffect(() => {
      if (!mapRef.current || loading) return;
      renderMarkers(mapRef.current);
    }, [pins, clusters, userLocation, loading, renderMarkers]);

    useEffect(() => {
      return onGoogleMapsAuthFailure((message) => {
        setLoadError(message);
        setLoading(false);
      });
    }, []);

    useEffect(() => {
      let cancelled = false;

      const init = async () => {
        const container = mapContainerRef.current;
        if (!container) return;

        try {
          setLoading(true);
          setLoadError(null);

          const libs = await importMapLibraries();
          if (cancelled) return;

          mapLibsRef.current = libs;
          const center = initialCenter ?? {
            lat: COLOMBIA_MAP_CENTER.lat,
            lng: COLOMBIA_MAP_CENTER.lng,
            zoom: COLOMBIA_MAP_CENTER.zoom,
          };

          const map = new libs.Map(container, {
            center: { lat: center.lat, lng: center.lng },
            zoom: center.zoom ?? COLOMBIA_MAP_CENTER.zoom,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
          });

          mapRef.current = map;

          map.addListener?.('zoom_changed', () => {
            if (mapRef.current) renderMarkers(mapRef.current);
          });

          requestAnimationFrame(() => {
            if (cancelled || !mapRef.current) return;
            window.google?.maps?.event?.trigger?.(mapRef.current, 'resize');
            mapRef.current.setCenter?.({ lat: center.lat, lng: center.lng });
            renderMarkers(mapRef.current);
            setLoading(false);
          });
        } catch (error) {
          console.error('GigMapExplorer init failed:', error);
          if (!cancelled) {
            const message =
              error instanceof GoogleMapsConfigError
                ? error.message
                : error instanceof Error
                  ? error.message
                  : 'No se pudo cargar el mapa';
            setLoadError(message);
            setLoading(false);
          }
        }
      };

      void init();

      return () => {
        cancelled = true;
        clearMarkers();
        mapRef.current = null;
        mapLibsRef.current = null;
      };
      // Map initializes once per mount — center updates handled separately
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      if (!mapRef.current || loading || !initialCenter) return;
      mapRef.current.panTo?.({ lat: initialCenter.lat, lng: initialCenter.lng });
      if (initialCenter.zoom != null) {
        mapRef.current.setZoom?.(initialCenter.zoom);
      }
    }, [initialCenter?.lat, initialCenter?.lng, initialCenter?.zoom, loading]);

    if (pins.length === 0) {
      return (
        <div
          style={{ height }}
          className={`flex w-full flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-900 ${className ?? ''}`}
        >
          <p className="mb-4 text-muted-foreground">
            No hay servicios con ubicación para mostrar en el mapa.
          </p>
          <Link
            href={emptyHref}
            className="font-medium text-orange-700 hover:text-orange-800 hover:underline"
          >
            {emptyLabel}
          </Link>
        </div>
      );
    }

    if (loadError) {
      const isReferrerError =
        loadError.includes('RefererNotAllowed') || loadError.includes('no autoriza este dominio');

      return (
        <div
          style={{ height }}
          className={`flex w-full flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-slate-100 p-6 text-center text-sm text-muted-foreground dark:border-slate-700 ${className ?? ''}`}
        >
          <p className="max-w-md text-foreground font-medium">
            {isReferrerError ? 'Mapa bloqueado por restricciones de la API key' : 'No se pudo cargar el mapa'}
          </p>
          <p className="max-w-lg text-xs leading-relaxed">{loadError}</p>
          {isReferrerError ? (
            <ul className="max-w-lg text-left text-xs font-mono bg-white/80 dark:bg-slate-900/80 rounded-lg p-3 space-y-1">
              {GOOGLE_MAPS_ALLOWED_REFERRERS.map((referrer) => (
                <li key={referrer}>{referrer}</li>
              ))}
            </ul>
          ) : null}
        </div>
      );
    }

    return (
      <div
        style={{ height }}
        className={`relative w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 ${className ?? ''}`}
      >
        {loading ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-100/90 dark:bg-slate-900/90">
            <Loader2 className="h-8 w-8 animate-spin text-orange-600" aria-hidden />
            <span className="sr-only">Cargando mapa...</span>
          </div>
        ) : null}
        <div ref={mapContainerRef} className="h-full w-full bg-slate-200" role="application" aria-label="Mapa de servicios" />
      </div>
    );
  },
);

export default GigMapExplorer;