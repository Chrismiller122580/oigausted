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

const GOOGLE_MAPS_URL = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;

export function loadGoogleMaps(): Promise<void> {
  // If already loaded
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
      // Wait for it to load
      const checkInterval = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error('Google Maps failed to load (timeout)'));
      }, 10000);

      return;
    }

    const script = document.createElement('script');
    script.src = GOOGLE_MAPS_URL;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (window.google && window.google.maps) {
        resolve();
      } else {
        reject(new Error('Google Maps script loaded but google object not available'));
      }
    };

    script.onerror = () => {
      reject(new Error('Failed to load Google Maps script. Check your API key and enabled APIs.'));
    };

    document.head.appendChild(script);
  });

  return window.__googleMapsLoadingPromise;
}
