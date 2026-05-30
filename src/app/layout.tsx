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
          if (neutralizeGoogleMaps()) {
            // Once we saw google, we can stop watching
            mo.disconnect();
          }
        });
        mo.observe(document.documentElement || document.body, { childList: true, subtree: true });
        
        // Also nuke on any postMessage (some of the noise in the console)
        // This is mostly from extensions, but we keep the guard light.
        
        console.log('[MapsGuard] Installed early neutralization for legacy Google Places Autocomplete');
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
