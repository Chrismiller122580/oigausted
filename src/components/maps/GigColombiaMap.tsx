'use client';

import { useEffect, useRef, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
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
  height?: string;
};

const GigColombiaMap = forwardRef<GigColombiaMapHandle, GigColombiaMapProps>(
  function GigColombiaMap({ pins, clusters, height = 'min(70vh, 560px)' }, ref) {
    const router = useRouter();
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<GoogleMapInstance | null>(null);
    const markersRef = useRef<unknown[]>([]);
    const jitteredPins = useRef(jitterPinsInCity(pins));
    const [loadError, setLoadError] = useState(false);

    const clearMarkers = useCallback(() => {
      for (const marker of markersRef.current) {
        const m = marker as { setMap?: (map: null) => void };
        m.setMap?.(null);
      }
      markersRef.current = [];
    }, []);

    const renderMarkers = useCallback(
      (map: GoogleMapInstance) => {
        clearMarkers();
        const zoom = (map as { getZoom?: () => number }).getZoom?.() ?? COLOMBIA_MAP_CENTER.zoom;
        const MarkerCtor = window.google?.maps?.Marker;
        if (!MarkerCtor) return;

        if (zoom < ZOOM_THRESHOLD) {
          for (const cluster of clusters) {
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

        for (const pin of jitteredPins.current) {
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
      [clearMarkers, clusters, router],
    );

    const focusCity = useCallback((lat: number, lng: number) => {
      if (!mapRef.current) return;
      mapRef.current.panTo?.({ lat, lng });
      mapRef.current.setZoom?.(CITY_ZOOM);
    }, []);

    useImperativeHandle(ref, () => ({ focusCity }), [focusCity]);

    useEffect(() => {
      jitteredPins.current = jitterPinsInCity(pins);
      if (mapRef.current) {
        renderMarkers(mapRef.current);
      }
    }, [pins, renderMarkers]);

    useEffect(() => {
      let isMounted = true;

      const initMap = () => {
        const MapCtor = window.google?.maps?.Map;
        if (!mapContainerRef.current || !MapCtor || !isMounted) return;

        const map = new MapCtor(mapContainerRef.current, {
          center: { lat: COLOMBIA_MAP_CENTER.lat, lng: COLOMBIA_MAP_CENTER.lng },
          zoom: COLOMBIA_MAP_CENTER.zoom,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });

        mapRef.current = map;
        renderMarkers(map);

        map.addListener?.('zoom_changed', () => {
          if (mapRef.current) renderMarkers(mapRef.current);
        });
      };

      loadGoogleMaps([])
        .then(() => {
          if (isMounted) initMap();
        })
        .catch((error) => {
          console.error('Failed to load Colombia gig map:', error);
          if (isMounted) setLoadError(true);
        });

      return () => {
        isMounted = false;
        clearMarkers();
        mapRef.current = null;
      };
    }, [clearMarkers, renderMarkers]);

    if (pins.length === 0) {
      return (
        <div
          style={{ height, width: '100%' }}
          className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center text-center p-8"
        >
          <p className="text-muted-foreground mb-4">
            Aún no hay servicios con ubicación en el mapa.
          </p>
          <Link href="/gigs" className="text-orange-700 hover:text-orange-800 font-medium hover:underline">
            Explorar todos los servicios
          </Link>
        </div>
      );
    }

    if (loadError) {
      return (
        <div
          style={{ height, width: '100%' }}
          className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-100 flex items-center justify-center text-center p-6 text-sm text-muted-foreground"
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
        style={{ height, width: '100%' }}
        className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-100 overflow-hidden"
        role="application"
        aria-label="Mapa de servicios en Colombia"
      />
    );
  },
);

export default GigColombiaMap;