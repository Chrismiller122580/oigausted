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
    // Gentle but effective cleanup on mount.
    // Run a few times quickly to catch async injection from stale chunks.
    const nuke = () => {
      try {
        const containers = document.querySelectorAll('.pac-container');
        containers.forEach((c) => {
          try { c.parentNode?.removeChild(c); } catch {}
        });

        const g = (window as any).google;
        if (g?.maps?.places) {
          g.maps.places = {
            Autocomplete: function () { return {} as any; },
            AutocompleteService: function () {},
            PlacesService: function () {},
            PlacesServiceStatus: {},
            RankBy: {},
            PlaceAutocompleteElement: function () {},
          } as any;
        }
      } catch {}
    };

    nuke();
    const t1 = setTimeout(nuke, 0);
    const t2 = setTimeout(nuke, 80);
    const t3 = setTimeout(nuke, 300);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return null;
}
