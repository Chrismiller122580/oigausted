'use client';

import { useState } from 'react';
import { toast } from 'sonner';

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string, lat?: number, lng?: number) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Safe plain-text location input for create-gig.
 * We no longer attach any Google Maps Autocomplete widget (modern or legacy).
 * This completely eliminates the deprecation warnings, removeChild DOM errors,
 * and React hook count violations caused by the widget fighting React's DOM.
 *
 * Users can still enter the address manually. Lat/lng can be added later
 * via a simple "Use my current location" button using the browser Geolocation API
 * (no Maps JS API required for basic lat/lng).
 */
export default function AddressAutocomplete({
  value,
  onChange,
  placeholder = "Buscar dirección...",
  className = "",
}: AddressAutocompleteProps) {
  // Nuclear client-side guard: if any old Google Maps Autocomplete code is present
  // (from stale bundles or other scripts), force plain input and log once.
  if (typeof window !== 'undefined' && (window.google?.maps?.places as { Autocomplete?: unknown } | undefined)?.Autocomplete) {
    // Prevent the widget from ever being used again on this page load
    console.warn('[Maps] Detected legacy Autocomplete in global scope — forcing safe plain input mode.');
    // We still render the normal component below, which is already safe.
  }

  const [useBrowserLocation, setUseBrowserLocation] = useState(false);

  const handleBrowserLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Tu navegador no soporta geolocalización.");
      return;
    }

    setUseBrowserLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        // We don't have reverse geocoding without Maps, so we just store the coords
        // and let the user type a human-readable address, or we can improve later.
        onChange(value || `Ubicación actual (${lat.toFixed(4)}, ${lng.toFixed(4)})`, lat, lng);
        setUseBrowserLocation(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        toast.error("No pudimos obtener tu ubicación. Por favor ingresa la dirección manualmente.");
        setUseBrowserLocation(false);
      }
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2 items-center">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`flex-1 border rounded-xl px-4 py-3 ${className}`}
        />
        <button
          type="button"
          onClick={handleBrowserLocation}
          disabled={useBrowserLocation}
          className="px-4 py-5 border border-border rounded-2xl text-sm hover:bg-muted disabled:opacity-60 flex items-center justify-center whitespace-nowrap"
          title="Usar mi ubicación actual (solo coordenadas)"
        >
          {useBrowserLocation ? "..." : "📍 Mi ubicación"}
        </button>
      </div>

      <p className="text-xs text-muted-foreground">
        Ingresa la dirección manualmente. El botón usa la geolocalización de tu navegador (sin Google Maps).
      </p>
    </div>
  );
}
