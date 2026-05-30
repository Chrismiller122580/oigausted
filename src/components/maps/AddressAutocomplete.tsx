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

      // Do NOT fall back to the deprecated legacy google.maps.places.Autocomplete.
      // It is not available for new API keys (as of 2025) and causes severe
      // removeChild DOM errors when React unmounts the input.
      // We simply show the manual text input fallback (the user can still type the address).
      console.warn('Legacy Places Autocomplete is deprecated/unavailable for this key. Using plain text fallback.');
      setLoadError(true);
    };

    loadGoogleMaps()
      .then(() => {
        if (isMounted) {
          initModernAutocomplete().catch((err) => {
            console.warn('Maps Autocomplete initialization failed (graceful fallback):', err);
            if (isMounted) setLoadError(true);
          });
        }
      })
      .catch((error) => {
        console.warn('Failed to load Google Maps (graceful fallback to manual address):', error);
        if (isMounted) setLoadError(true);
      });

    return () => {
      isMounted = false;

      // Run cleanup in a microtask to avoid race conditions with React unmount
      queueMicrotask(() => {
        const ac = autocompleteRef.current;
        if (ac) {
          try {
            if (typeof ac.remove === 'function') {
              ac.remove();
            }
            if (window.google?.maps?.event?.clearInstanceListeners) {
              window.google.maps.event.clearInstanceListeners(ac);
            }
          } catch (e) {
            // ignore
          }
          autocompleteRef.current = null;
        }

        // Aggressively remove any Google Autocomplete UI that might be left behind
        // (this is the #1 cause of the removeChild errors the user is seeing)
        try {
          document.querySelectorAll('.pac-container, .pac-logo, .pac-item').forEach((el) => {
            if (el && el.parentNode) {
              el.parentNode.removeChild(el);
            }
          });
        } catch (e) {
          // ignore
        }
      });
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
