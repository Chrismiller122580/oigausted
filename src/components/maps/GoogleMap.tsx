'use client';

import { useEffect, useRef } from 'react';

interface GoogleMapProps {
  center: { lat: number; lng: number };
  zoom?: number;
  markers?: Array<{ lat: number; lng: number; title?: string }>;
  height?: string;
}

declare global {
  interface Window {
    google: any;
  }
}

export default function GoogleMap({ center, zoom = 14, markers = [], height = '400px' }: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google && mapRef.current) {
        initMap();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.onload = () => {
        if (mapRef.current) initMap();
      };
      document.head.appendChild(script);
    };

    const initMap = () => {
      if (!mapRef.current || !window.google) return;

      mapInstance.current = new window.google.maps.Map(mapRef.current, {
        center,
        zoom,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      // Add markers
      markers.forEach((marker) => {
        new window.google.maps.Marker({
          position: { lat: marker.lat, lng: marker.lng },
          map: mapInstance.current,
          title: marker.title,
        });
      });
    };

    loadGoogleMaps();
  }, [center, zoom, markers]);

  return (
    <div 
      ref={mapRef} 
      style={{ height, width: '100%', borderRadius: '12px' }} 
      className="bg-gray-100"
    />
  );
}
