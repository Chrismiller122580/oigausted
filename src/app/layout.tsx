import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import NavbarWrapper from "@/components/layout/NavbarWrapper";
import SessionProviderWrapper from "@/components/providers/SessionProviderWrapper";
import MaintenanceBanner from "@/components/layout/MaintenanceBanner";

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
        
        // Belt-and-suspenders: for the first 12 seconds, keep aggressively cleaning
        // any pac-containers and re-patching the constructor. This catches cases
        // where a stale chunk from an old dpl_ deployment loads the widget late.
        var cleanupInterval = setInterval(function() {
          var g = window.google;
          if (g && g.maps && g.maps.places && g.maps.places.Autocomplete && typeof g.maps.places.Autocomplete === 'function' && !g.maps.places.Autocomplete.toString().includes('Blocked legacy')) {
            try {
              g.maps.places.Autocomplete = function() { return {}; };
            } catch(e) {}
          }
          var containers = document.querySelectorAll('.pac-container');
          if (containers.length) {
            containers.forEach(function(c) {
              try { c.parentNode && c.parentNode.removeChild(c); } catch(e) {}
            });
          }
        }, 400);
        
        setTimeout(function() {
          clearInterval(cleanupInterval);
          try { mo.disconnect(); } catch(e) {}
        }, 12000);
        
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
      <body className={inter.className}>
        <SessionProviderWrapper>
          <MaintenanceBanner />
          <NavbarWrapper>
            {children}
          </NavbarWrapper>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
