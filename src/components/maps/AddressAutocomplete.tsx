'use client';

import { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '@/lib/googleMapsLoader';

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string, lat?: number, lng?: number) => void;
  placeholder?: string;
  className?: string;
}

export default function AddressAutocomplete({
  value,
  onChange,
  placeholder = "Buscar dirección...",
  className = "",
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const initAutocomplete = () => {
      if (!inputRef.current || !window.google || !isMounted) return;

      autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['address'],
        componentRestrictions: { country: 'co' },
      });

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current.getPlace();
        if (place.geometry && place.geometry.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          onChange(place.formatted_address || '', lat, lng);
        } else {
          onChange(place.formatted_address || value);
        }
      });
    };

    loadGoogleMaps()
      .then(() => {
        if (isMounted) initAutocomplete();
      })
      .catch((error) => {
        console.error('Failed to load Google Maps for autocomplete:', error);
        if (isMounted) setLoadError(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full border rounded-xl px-4 py-3 ${className}`}
      />
      {loadError && (
        <p className="text-xs text-muted-foreground mt-1">
          Autocompletado no disponible. Escribe la ciudad o dirección manualmente (la ubicación exacta no se detectará automáticamente).
        </p>
      )}
    </div>
  );
}
