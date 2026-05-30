'use client';

import { useLayoutEffect } from 'react';

/**
 * Nuclear client component to kill any lingering Google Maps legacy Places
 * pollution from stale bundles or previous page loads in the same tab.
 *
 * This is the only reliable way we've found to stop the
 * "removeChild" + React #310 (more hooks than previous render) errors
 * caused by the widget injecting .pac-container nodes that React then
 * tries to manage.
 *
 * Drop this at the top of any 'use client' page that sellers or buyers visit.
 */
export default function MapsPollutionNuke() {
  useLayoutEffect(() => {
    let attempts = 0;
    const maxAttempts = 25; // ~5 seconds of aggressive cleanup

    const nuke = () => {
      attempts++;
      try {
        // 1. Remove any pac-containers the widget injected
        const containers = document.querySelectorAll('.pac-container');
        containers.forEach((c) => {
          try {
            if (c.parentNode) c.parentNode.removeChild(c);
          } catch {}
        });

        // 2. Completely replace the places namespace so any code from
        //    stale chunks that does `new google.maps.places.Autocomplete(...)`
        //    or similar will do nothing harmful.
        const g = (window as any).google;
        if (g?.maps?.places) {
          try {
            g.maps.places = {
              Autocomplete: function () {
                return {} as any;
              },
              AutocompleteService: function () {},
              PlacesService: function () {},
              PlacesServiceStatus: {},
              RankBy: {},
              PlaceAutocompleteElement: function () {},
            } as any;

            if (attempts < 5) {
              console.warn('[MapsNuke] Nuked google.maps.places (attempt ' + attempts + ')');
            }
          } catch {}
        }

        // 3. Also try to neuter any Autocomplete constructor that might still exist
        if (g?.maps?.places?.Autocomplete && typeof g.maps.places.Autocomplete === 'function') {
          const fnStr = g.maps.places.Autocomplete.toString();
          if (!fnStr.includes('Nuked') && !fnStr.includes('Blocked legacy')) {
            try {
              g.maps.places.Autocomplete = function () {
                return {} as any;
              };
            } catch {}
          }
        }
      } catch {}
    };

    // Run immediately (before paint)
    nuke();

    // Very aggressive early cleanup
    const interval = setInterval(() => {
      nuke();
      if (attempts >= maxAttempts) {
        clearInterval(interval);
      }
    }, 200);

    // Also run on any DOM change for a while
    const mo = new MutationObserver(() => {
      nuke();
    });
    if (document.documentElement) {
      mo.observe(document.documentElement, { childList: true, subtree: true });
    }

    // Cleanup after ~6 seconds
    const timeout = setTimeout(() => {
      clearInterval(interval);
      try { mo.disconnect(); } catch {}
    }, 6000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
      try { mo.disconnect(); } catch {}
    };
  }, []);

  return null;
}
