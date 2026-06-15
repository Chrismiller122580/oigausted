/**
 * Singleton loader for Google Maps JavaScript API.
 * Ensures the script is loaded only once across the entire application.
 */

declare global {
  interface Window {
    __googleMapsLoadingPromise?: Promise<void>;
  }
}

// Note: We intentionally do NOT load "places" by default anymore.
// The legacy Autocomplete widget + pac-container DOM injection was causing
// React removeChild explosions and hook-count errors (#310) on seller/buyer pages.
// Only load places if you explicitly pass ["places"] (we no longer do this anywhere).
const GOOGLE_MAPS_URL = (libraries: string[] = []) => {
  const libs = libraries.length > 0 ? `&libraries=${libraries.join(',')}` : '';
  return `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}${libs}&loading=async`;
};

export function isGoogleMapsLoaded(): boolean {
  return !!(window.google && window.google.maps);
}

/**
 * Modern way to load the Places library using importLibrary (recommended).
 * Must be called after loadGoogleMaps() resolves.
 */
export async function getPlacesLibrary(): Promise<unknown> {
  if (!window.google?.maps) {
    throw new Error('Google Maps not loaded yet. Call loadGoogleMaps() first.');
  }

  // Ensure importLibrary is available (for loading=async)
  if (typeof window.google.maps.importLibrary !== 'function') {
    // Small wait in case of race
    await new Promise(r => setTimeout(r, 100));
    if (typeof window.google.maps.importLibrary !== 'function') {
      throw new Error('importLibrary not available after waiting');
    }
  }

  const placesLib = await window.google.maps.importLibrary("places");
  return placesLib;  // contains PlaceAutocomplete, etc.
}

export function loadGoogleMaps(libraries: string[] = []): Promise<void> {
  // If already loaded, we're good (even if it was loaded with fewer libs)
  if (window.google && window.google.maps) {
    return Promise.resolve();
  }

  // If already loading (we keep the first promise; later calls with different libs are ignored for simplicity)
  if (window.__googleMapsLoadingPromise) {
    return window.__googleMapsLoadingPromise;
  }

  // Start loading
  window.__googleMapsLoadingPromise = new Promise((resolve, reject) => {
    // Check if script already exists in DOM (extra safety)
    if (document.querySelector(`script[src*="maps.googleapis.com"]`)) {
      // Wait for it to load
      const checkInterval = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 50);

      setTimeout(() => {
        clearInterval(checkInterval);
        if (window.google && window.google.maps) {
          resolve();
        } else {
          reject(new Error('Google Maps failed to load (timeout)'));
        }
      }, 15000);

      return;
    }

    const script = document.createElement('script');
    script.src = GOOGLE_MAPS_URL(libraries);
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
