import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import NavbarWrapper from "@/components/layout/NavbarWrapper";
import SessionProviderWrapper from "@/components/providers/SessionProviderWrapper";
import MaintenanceBanner from "@/components/layout/MaintenanceBanner";
import { Toaster } from "sonner"; // 2027-grade beautiful toasts

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OigaUsted - Gigs Colombia",
  description: "Plataforma de gigs y servicios locales en Colombia",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Nuclear global guard against the Google Maps legacy Places Autocomplete widget.
  // This widget (even when loaded from stale CDN bundles) injects .pac-container DOM
  // that React does not own. When React later unmounts/reconciles, it throws
  // "removeChild" + "Rendered more hooks than during the previous render" (#310).
  // We neutralize it as early as possible, before any page component runs.
  const mapsGuardScript = `
    (function() {
      if (typeof window === 'undefined') return;
      try {
        // 1. Prevent the dangerous constructor from ever being called
        var originalDefine = Object.getOwnPropertyDescriptor(window, 'google');
        
        // Install a trap that neuters places.Autocomplete if google ever appears
        function neutralizeGoogleMaps() {
          // Try to kill any maps scripts that old bundles may have injected
          try {
            document.querySelectorAll('script[src*="maps.googleapis.com"]').forEach(function(s) {
              try { s.parentNode && s.parentNode.removeChild(s); } catch(e) {}
            });
          } catch(e) {}

          var g = window.google;
          if (!g || !g.maps) return false;
          
          // Block legacy Autocomplete constructor
          if (g.maps.places && g.maps.places.Autocomplete) {
            try {
              g.maps.places.Autocomplete = function() {
                console.warn('[MapsGuard] Blocked legacy google.maps.places.Autocomplete (causes React DOM conflicts). Use plain input instead.');
                return {};
              };
            } catch(e) {}
          }
          
          // Nuclear: completely nuke the places library if it exists from a previous page load.
          // This is the main source of the removeChild + React #310 crashes.
          if (g.maps.places) {
            try {
              // Replace the entire places namespace with a safe empty object
              g.maps.places = {
                Autocomplete: function() { return {}; },
                AutocompleteService: function() {},
                PlacesService: function() {},
                PlacesServiceStatus: {},
                RankBy: {},
                PlaceAutocompleteElement: function() {}
              };
              console.warn('[MapsGuard] Nuked google.maps.places to prevent DOM conflicts');
            } catch(e) {}
          }
          
          // Aggressively clean any pac-containers that the widget may have injected
          var containers = document.querySelectorAll('.pac-container');
          if (containers.length) {
            containers.forEach(function(c) {
              try { c.parentNode && c.parentNode.removeChild(c); } catch(e) {}
            });
            console.warn('[MapsGuard] Removed ' + containers.length + ' orphaned .pac-container node(s)');
          }
          return true;
        }
        
        // Run immediately
        neutralizeGoogleMaps();
        
        // Run again after DOM mutations (covers async script loads from stale bundles)
        var mo = new MutationObserver(function() {
          neutralizeGoogleMaps();
        });
        mo.observe(document.documentElement || document.body, { childList: true, subtree: true });
        
        // Solid but not overly aggressive cleanup for the first 10 seconds.
        // Catches late injection from stale chunks without interfering with initial hydration.
        var cleanupInterval = setInterval(function() {
          var g = window.google;
          if (g && g.maps && g.maps.places) {
            try {
              g.maps.places = {
                Autocomplete: function() { return {}; },
                AutocompleteService: function() {},
                PlacesService: function() {},
                PlacesServiceStatus: {},
                RankBy: {},
                PlaceAutocompleteElement: function() {}
              };
            } catch(e) {}
          }
          var containers = document.querySelectorAll('.pac-container');
          if (containers.length) {
            containers.forEach(function(c) {
              try { c.parentNode && c.parentNode.removeChild(c); } catch(e) {}
            });
          }
        }, 300);
        
        setTimeout(function() {
          clearInterval(cleanupInterval);
          try { mo.disconnect(); } catch(e) {}
        }, 10000);  // 10 seconds of protection
        
        console.log('[MapsGuard] Installed early + aggressive neutralization for legacy Google Places Autocomplete');
      } catch (e) {
        // Never break the page
      }
    })();
  `;

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: mapsGuardScript }} />
      </head>
      <body className={`${inter.className} pb-safe-area-inset-bottom`}>
        <SessionProviderWrapper>
          <MaintenanceBanner />
          <NavbarWrapper>
            {children}
          </NavbarWrapper>
          <Toaster position="top-center" richColors closeButton />
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
