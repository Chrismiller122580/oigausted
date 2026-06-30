'use client';

import {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loadGoogleMaps } from '@/lib/googleMapsLoader';
import {
  COLOMBIA_MAP_CENTER,
  type CityCluster,
  type GigMapPin,
  jitterPinsInCity,
} from '@/lib/gig-map';

const ZOOM_THRESHOLD = 8;
const CITY_ZOOM = 10;

export type GigColombiaMapHandle = {
  focusCity: (lat: number, lng: number) => void;
};

type GigColombiaMapProps = {
  pins: GigMapPin[];
  clusters: CityCluster[];
  className?: string;
};

const GigColombiaMap = forwardRef<GigColombiaMapHandle, GigColombiaMapProps>(
  function GigColombiaMap({ pins, clusters, className }, ref) {
    const router = useRouter();
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<GoogleMapInstance | null>(null);
    const markersRef = useRef<GoogleMapsMarkerInstance[]>([]);
    const pinsRef = useRef(pins);
    const clustersRef = useRef(clusters);
    const [loadError, setLoadError] = useState(false);
    const [mapReady, setMapReady] = useState(false);

    pinsRef.current = pins;
    clustersRef.current = clusters;

    const clearMarkers = useCallback(() => {
      for (const marker of markersRef.current) {
        marker.setMap?.(null);
      }
      markersRef.current = [];
    }, []);

    const renderMarkers = useCallback(
      (map: GoogleMapInstance) => {
        clearMarkers();
        const zoom = map.getZoom?.() ?? COLOMBIA_MAP_CENTER.zoom;
        const MarkerCtor = window.google?.maps?.Marker;
        if (!MarkerCtor) return;

        const currentClusters = clustersRef.current;
        const jittered = jitterPinsInCity(pinsRef.current);

        if (zoom < ZOOM_THRESHOLD) {
          for (const cluster of currentClusters) {
            const marker = new MarkerCtor({
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

        for (const pin of jittered) {
          const marker = new MarkerCtor({
            position: { lat: pin.lat, lng: pin.lng },
            map,
            title: pin.title,
            cursor: 'pointer',
          });

          marker.addListener?.('click', () => {
            router.push(`/gigs/${pin.id}`);
          });

          markersRef.current.push(marker);
        }
      },
      [clearMarkers, router],
    );

    const focusCity = useCallback((lat: number, lng: number) => {
      if (!mapRef.current) return;
      mapRef.current.panTo?.({ lat, lng });
      mapRef.current.setZoom?.(CITY_ZOOM);
    }, []);

    useImperativeHandle(ref, () => ({ focusCity }), [focusCity]);

    useEffect(() => {
      if (!mapReady || !mapRef.current) return;
      renderMarkers(mapRef.current);
    }, [mapReady, pins, clusters, renderMarkers]);

    useEffect(() => {
      let isMounted = true;

      const initMap = async () => {
        const container = mapContainerRef.current;
        const MapCtor = window.google?.maps?.Map;
        if (!container || !MapCtor || !isMounted) return;

        const map = new MapCtor(container, {
          center: { lat: COLOMBIA_MAP_CENTER.lat, lng: COLOMBIA_MAP_CENTER.lng },
          zoom: COLOMBIA_MAP_CENTER.zoom,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });

        mapRef.current = map;

        map.addListener?.('zoom_changed', () => {
          if (mapRef.current) renderMarkers(mapRef.current);
        });

        // Google Maps needs an explicit resize when the container was hidden or zero-height during load
        requestAnimationFrame(() => {
          if (!isMounted || !mapRef.current) return;
          window.google?.maps?.event?.trigger?.(mapRef.current, 'resize');
          mapRef.current.setCenter?.({
            lat: COLOMBIA_MAP_CENTER.lat,
            lng: COLOMBIA_MAP_CENTER.lng,
          });
          renderMarkers(mapRef.current);
          setMapReady(true);
        });
      };

      loadGoogleMaps([])
        .then(() => {
          if (isMounted) void initMap();
        })
        .catch((error) => {
          console.error('Failed to load Colombia gig map:', error);
          if (isMounted) setLoadError(true);
        });

      return () => {
        isMounted = false;
        setMapReady(false);
        clearMarkers();
        mapRef.current = null;
      };
    }, [clearMarkers, renderMarkers]);

    if (pins.length === 0) {
      return (
        <div
          className={`flex h-full min-h-[320px] w-full flex-col items-center justify-center bg-slate-50 p-8 text-center dark:bg-slate-900 ${className ?? ''}`}
        >
          <p className="mb-4 text-muted-foreground">
            Aún no hay servicios con ubicación en el mapa.
          </p>
          <Link
            href="/gigs"
            className="font-medium text-orange-700 hover:text-orange-800 hover:underline"
          >
            Explorar todos los servicios
          </Link>
        </div>
      );
    }

    if (loadError) {
      return (
        <div
          className={`flex h-full min-h-[320px] w-full items-center justify-center bg-slate-100 p-6 text-center text-sm text-muted-foreground ${className ?? ''}`}
        >
          No se pudo cargar el mapa.
          <br />
          Verifica tu conexión o que Google Maps esté disponible.
        </div>
      );
    }

    return (
      <div
        ref={mapContainerRef}
        className={`h-full w-full bg-slate-200 ${className ?? ''}`}
        role="application"
        aria-label="Mapa de servicios en Colombia"
      />
    );
  },
);

export default GigColombiaMap;