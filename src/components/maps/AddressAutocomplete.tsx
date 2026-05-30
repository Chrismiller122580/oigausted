'use client';

import { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps, getPlacesLibrary } from '@/lib/googleMapsLoader';

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string, lat?: number, lng?: number) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Modern AddressAutocomplete using the recommended PlaceAutocomplete API.
 * Falls back gracefully to plain text input if the Places library is unavailable
 * (e.g. deprecated Autocomplete on new keys, or loading failure).
 */
export default function AddressAutocomplete({
  value,
  onChange,
  placeholder = "Buscar dirección...",
  className = "",
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [loadError, setLoadError] = useState(false);
  const [usingLegacy, setUsingLegacy] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const initModernAutocomplete = async () => {
      if (!inputRef.current || !isMounted) return;

      let placesLib;
      try {
        placesLib = await getPlacesLibrary();
      } catch (err) {
        console.warn('Could not load places library via importLibrary:', err);
      }

      // Try modern PlaceAutocomplete from the imported lib
      if (placesLib && placesLib.PlaceAutocomplete) {
        try {
          autocompleteRef.current = new placesLib.PlaceAutocomplete({
            inputElement: inputRef.current,
            componentRestrictions: { country: 'co' },
            types: ['address'],
          });

          autocompleteRef.current.addEventListener('gmp-select', async (event: any) => {
            const placePrediction = event.placePrediction;
            if (!placePrediction) return;

            const place = await placePrediction.toPlace();
            await place.fetchFields({ fields: ['displayName', 'formattedAddress', 'location'] });

            const address = place.formattedAddress || place.displayName || '';
            const lat = place.location?.lat?.();
            const lng = place.location?.lng?.();

            if (lat != null && lng != null) {
              onChange(address, lat, lng);
            } else {
              onChange(address);
            }
          });

          return; // Success
        } catch (modernErr) {
          console.warn('Modern PlaceAutocomplete instantiation failed, trying legacy:', modernErr);
        }
      }

      // Bootstrap legacy globals by importing places if not present
      if (placesLib && !window.google?.maps?.places?.Autocomplete) {
        // The import above should have populated the legacy namespace in most cases
      }

      // Fallback to legacy (with small retry)
      let legacyAttempts = 0;
      const tryLegacy = () => {
        if (window.google?.maps?.places?.Autocomplete) {
          setUsingLegacy(true);

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
          return true;
        }
        return false;
      };

      if (!tryLegacy()) {
        const legacyInterval = setInterval(() => {
          legacyAttempts++;
          if (tryLegacy() || legacyAttempts > 15) {
            clearInterval(legacyInterval);
            if (!autocompleteRef.current) {
              throw new Error('Could not initialize any Places Autocomplete (modern or legacy)');
            }
          }
        }, 80);
      }
    };

    loadGoogleMaps()
      .then(() => {
        if (isMounted) {
          initModernAutocomplete().catch((err) => {
            console.error('Failed to initialize any Maps Autocomplete:', err);
            if (isMounted) setLoadError(true);
          });
        }
      })
      .catch((error) => {
        console.error('Failed to load Google Maps for autocomplete:', error);
        if (isMounted) setLoadError(true);
      });

    return () => {
      isMounted = false;

      const cleanup = () => {
        const ac = autocompleteRef.current;
        if (ac) {
          try {
            // Modern web component
            if (typeof ac.remove === 'function') {
              ac.remove();
            }
            // Legacy Autocomplete
            if (window.google?.maps?.event) {
              window.google.maps.event.clearInstanceListeners(ac);
            }
          } catch (e) {
            // ignore
          }
          autocompleteRef.current = null;
        }

        // Remove any orphaned Google Autocomplete dropdowns (main cause of removeChild errors)
        try {
          document.querySelectorAll('.pac-container').forEach((el) => {
            if (el && el.parentNode) {
              el.parentNode.removeChild(el);
            }
          });
        } catch (e) {
          // ignore
        }
      };

      cleanup();
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

      {usingLegacy && !loadError && (
        <p className="text-[10px] text-amber-600 dark:text-amber-500 mt-1">
          Usando versión legacy de autocompletado (Google la está reemplazando).
        </p>
      )}
    </div>
  );
}
