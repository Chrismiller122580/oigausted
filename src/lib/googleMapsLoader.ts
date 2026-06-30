/**
 * Singleton loader for Google Maps JavaScript API.
 * Ensures the script is loaded only once across the entire application.
 */

declare global {
  interface Window {
    __googleMapsLoadingPromise?: Promise<void>;
  }
}

export class GoogleMapsConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GoogleMapsConfigError';
  }
}

function getApiKey(): string {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
  if (!key) {
    throw new GoogleMapsConfigError(
      'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY no está configurada. Agrégala en Vercel y en .env.local.',
    );
  }
  return key;
}

const GOOGLE_MAPS_URL = (libraries: string[] = []) => {
  const key = getApiKey();
  const libs = libraries.length > 0 ? `&libraries=${libraries.join(',')}` : '';
  return `https://maps.googleapis.com/maps/api/js?key=${key}&v=weekly${libs}&loading=async`;
};

export function isGoogleMapsLoaded(): boolean {
  return !!(window.google?.maps?.importLibrary || window.google?.maps?.Map);
}

export type GoogleMapLibraries = {
  Map: GoogleMapsMapConstructor
  Marker: GoogleMapsMarkerConstructor
}

export function loadGoogleMaps(libraries: string[] = []): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new GoogleMapsConfigError('Google Maps solo está disponible en el navegador.'));
  }

  try {
    getApiKey();
  } catch (error) {
    return Promise.reject(error);
  }

  if (isGoogleMapsLoaded()) {
    return Promise.resolve();
  }

  if (window.__googleMapsLoadingPromise) {
    return window.__googleMapsLoadingPromise;
  }

  window.__googleMapsLoadingPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existing) {
      const checkInterval = setInterval(() => {
        if (isGoogleMapsLoaded()) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 50);

      setTimeout(() => {
        clearInterval(checkInterval);
        if (isGoogleMapsLoaded()) resolve();
        else reject(new Error('Google Maps failed to load (timeout)'));
      }, 15000);
      return;
    }

    const script = document.createElement('script');
    script.src = GOOGLE_MAPS_URL(libraries);
    script.async = true;
    script.defer = true;

    script.onload = () => {
      const waitForBootstrap = setInterval(() => {
        if (isGoogleMapsLoaded()) {
          clearInterval(waitForBootstrap);
          resolve();
        }
      }, 30);

      setTimeout(() => {
        clearInterval(waitForBootstrap);
        if (isGoogleMapsLoaded()) resolve();
        else reject(new Error('Google Maps script loaded but bootstrap incomplete'));
      }, 8000);
    };

    script.onerror = () => {
      reject(
        new Error(
          'No se pudo cargar Google Maps. Verifica la API key, Maps JavaScript API habilitada, y restricciones de dominio.',
        ),
      );
    };

    document.head.appendChild(script);
  });

  return window.__googleMapsLoadingPromise;
}

/** Required when using loading=async — legacy google.maps.Map may be unavailable until importLibrary runs. */
export async function importMapLibraries(): Promise<GoogleMapLibraries> {
  await loadGoogleMaps();
  const maps = window.google?.maps;
  if (!maps) {
    throw new Error('Google Maps namespace missing after load');
  }

  if (typeof maps.importLibrary === 'function') {
    const mapsLib = (await maps.importLibrary('maps')) as { Map: GoogleMapsMapConstructor };
    try {
      const markerLib = (await maps.importLibrary('marker')) as { Marker: GoogleMapsMarkerConstructor };
      return { Map: mapsLib.Map, Marker: markerLib.Marker };
    } catch {
      if (maps.Marker) {
        return { Map: mapsLib.Map, Marker: maps.Marker };
      }
      throw new Error('Marker library unavailable');
    }
  }

  if (maps.Map && maps.Marker) {
    return { Map: maps.Map, Marker: maps.Marker };
  }

  throw new Error('Google Maps importLibrary not available');
}

export async function getPlacesLibrary(): Promise<unknown> {
  await loadGoogleMaps();
  if (!window.google?.maps?.importLibrary) {
    throw new Error('importLibrary not available');
  }
  return window.google.maps.importLibrary('places');
}