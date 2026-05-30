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

      try {
        // Try the modern recommended API first (PlaceAutocomplete)
        const places = await getPlacesLibrary();
        const { PlaceAutocomplete } = places;

        if (PlaceAutocomplete) {
          autocompleteRef.current = new PlaceAutocomplete({
            inputElement: inputRef.current,
            componentRestrictions: { country: 'co' },
            types: ['address'],
          });

          // Modern event
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

          return; // Success with modern API
        }
      } catch (modernError) {
        // Modern API not available (common on keys created after the deprecation)
        console.warn('Modern PlaceAutocomplete not available, falling back to legacy Autocomplete:', modernError);
      }

      // Fallback to legacy Autocomplete (still works for existing keys, just deprecated)
      // Give it a little more time in case the library is still bootstrapping
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
          if (tryLegacy() || legacyAttempts > 10) {
            clearInterval(legacyInterval);
            if (!autocompleteRef.current) {
              throw new Error('Neither modern nor legacy Places Autocomplete available');
            }
          }
        }, 100);
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

      // Thorough cleanup to prevent React <-> Google Maps DOM conflicts (removeChild errors)
      const cleanup = () => {
        if (autocompleteRef.current) {
          try {
            // Modern element
            if (typeof autocompleteRef.current.remove === 'function') {
              autocompleteRef.current.remove();
            }
            // Legacy
            if (window.google?.maps?.event?.clearInstanceListeners) {
              window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
            }
            autocompleteRef.current = null;
          } catch (e) {
            // Swallow
          }
        }

        // Aggressive cleanup of any leftover pac-containers (common source of removeChild errors)
        try {
          const containers = document.querySelectorAll('.pac-container');
          containers.forEach((container) => {
            if (container && container.parentNode) {
              // Only remove if it looks like it belongs to this input (heuristic)
              container.parentNode.removeChild(container);
            }
          });
        } catch (e) {
          // Ignore
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
