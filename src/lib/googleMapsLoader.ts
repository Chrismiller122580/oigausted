/**
 * Singleton loader for Google Maps JavaScript API.
 * Ensures the script is loaded only once across the entire application.
 */

declare global {
  interface Window {
    google: any;
    __googleMapsLoadingPromise?: Promise<void>;
  }
}

const GOOGLE_MAPS_URL = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`;

export function isGoogleMapsLoaded(): boolean {
  return !!(window.google && window.google.maps);
}

/**
 * Modern way to load the Places library using importLibrary (recommended).
 * Must be called after loadGoogleMaps() resolves.
 */
export async function getPlacesLibrary(): Promise<any> {
  if (!window.google?.maps) {
    throw new Error('Google Maps not loaded yet. Call loadGoogleMaps() first.');
  }
  if (typeof window.google.maps.importLibrary !== 'function') {
    throw new Error('importLibrary not available (async loading may still be bootstrapping)');
  }
  const { PlaceAutocomplete } = await window.google.maps.importLibrary("places");
  return { PlaceAutocomplete };
}

export function loadGoogleMaps(): Promise<void> {
  // If already loaded with importLibrary available (modern async)
  if (window.google?.maps?.importLibrary) {
    return Promise.resolve();
  }

  // Legacy check (for non-async loads)
  if (window.google && window.google.maps) {
    return Promise.resolve();
  }

  // If already loading
  if (window.__googleMapsLoadingPromise) {
    return window.__googleMapsLoadingPromise;
  }

  // Start loading
  window.__googleMapsLoadingPromise = new Promise((resolve, reject) => {
    // Check if script already exists in DOM (extra safety)
    if (document.querySelector(`script[src*="maps.googleapis.com"]`)) {
      // Wait for it to load, specifically for importLibrary with async loading
      const checkInterval = setInterval(() => {
        if (window.google?.maps?.importLibrary || (window.google && window.google.maps)) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 50);

      // Timeout after 15 seconds (longer for async)
      setTimeout(() => {
        clearInterval(checkInterval);
        if (window.google?.maps?.importLibrary || (window.google && window.google.maps)) {
          resolve();
        } else {
          reject(new Error('Google Maps failed to load (timeout)'));
        }
      }, 15000);

      return;
    }

    const script = document.createElement('script');
    script.src = GOOGLE_MAPS_URL;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      // Give the async loader a moment to attach importLibrary
      const waitForBootstrap = setInterval(() => {
        if (window.google?.maps?.importLibrary || (window.google && window.google.maps)) {
          clearInterval(waitForBootstrap);
          resolve();
        }
      }, 30);

      setTimeout(() => {
        clearInterval(waitForBootstrap);
        if (window.google?.maps?.importLibrary || (window.google && window.google.maps)) {
          resolve();
        } else {
          reject(new Error('Google Maps script loaded but bootstrap incomplete'));
        }
      }, 5000);
    };

    script.onerror = () => {
      reject(new Error('Failed to load Google Maps. Verifica que la API key sea válida y que tengas habilitadas Maps JavaScript API + Places API.'));
    };

    document.head.appendChild(script);
  });

  return window.__googleMapsLoadingPromise;
}
