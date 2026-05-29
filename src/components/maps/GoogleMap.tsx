'use client';

import { useEffect, useRef } from 'react';
import { loadGoogleMaps } from '@/lib/googleMapsLoader';

interface GoogleMapProps {
  center: { lat: number; lng: number };
  zoom?: number;
  markers?: Array<{ lat: number; lng: number; title?: string }>;
  height?: string;
}

export default function GoogleMap({ center, zoom = 14, markers = [], height = '400px' }: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    const initMap = () => {
      if (!mapRef.current || !window.google || !isMounted) return;

      mapInstance.current = new window.google.maps.Map(mapRef.current, {
        center,
        zoom,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      markers.forEach((marker) => {
        new window.google.maps.Marker({
          position: { lat: marker.lat, lng: marker.lng },
          map: mapInstance.current,
          title: marker.title,
        });
      });
    };

    loadGoogleMaps()
      .then(() => {
        if (isMounted) initMap();
      })
      .catch((error) => {
        console.error('Failed to load Google Maps:', error);
      });

    return () => {
      isMounted = false;
    };
  }, [center, zoom, markers]);

  return (
    <div 
      ref={mapRef} 
      style={{ height, width: '100%', borderRadius: '12px' }} 
      className="bg-gray-100"
    />
  );
}
