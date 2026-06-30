'use client';

import { useEffect, useRef, useState } from 'react';
import { importMapLibraries } from '@/lib/googleMapsLoader';

interface GoogleMapProps {
  center: { lat: number; lng: number };
  zoom?: number;
  markers?: Array<{ lat: number; lng: number; title?: string }>;
  height?: string;
}

export default function GoogleMap({ center, zoom = 14, markers = [], height = '400px' }: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<GoogleMapInstance | null>(null);

  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const initMap = async () => {
      if (!mapRef.current || !isMounted) return;

      const { Map: MapCtor, Marker: MarkerCtor } = await importMapLibraries();

      mapInstance.current = new MapCtor(mapRef.current, {
        center,
        zoom,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      markers.forEach((marker) => {
        new MarkerCtor({
          position: { lat: marker.lat, lng: marker.lng },
          map: mapInstance.current,
          title: marker.title,
        });
      });
    };

    importMapLibraries()
      .then(() => {
        if (isMounted) void initMap();
      })
      .catch((error) => {
        console.error('Failed to load Google Maps:', error);
        if (isMounted) setLoadError(true);
      });

    return () => {
      isMounted = false;
    };
  }, [center, zoom, markers]);

  if (loadError) {
    return (
      <div 
        style={{ height, width: '100%', borderRadius: '12px' }} 
        className="bg-gray-100 flex items-center justify-center text-center p-6 text-sm text-muted-foreground"
      >
        No se pudo cargar el mapa.<br />
        Verifica tu conexión o que Google Maps esté disponible.
      </div>
    );
  }

  return (
    <div 
      ref={mapRef} 
      style={{ height, width: '100%', borderRadius: '12px' }} 
      className="bg-gray-100"
    />
  );
}
