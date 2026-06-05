import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import NavbarWrapper from "@/components/layout/NavbarWrapper";
import SessionProviderWrapper from "@/components/providers/SessionProviderWrapper";
import MaintenanceBanner from "@/components/layout/MaintenanceBanner";
import { Toaster } from "sonner"; // 2027-grade beautiful toasts

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "OigaUsted - Gigs y Servicios Locales en Colombia",
    template: "%s | OigaUsted",
  },
  description: "Plataforma colombiana que conecta personas que necesitan servicios con freelancers y negocios locales confiables. Enfocado en Bucaramanga y Colombia.",
  applicationName: "OigaUsted",
  authors: [{ name: "OigaUsted" }],
  keywords: ["gigs", "servicios", "freelance", "Colombia", "Bucaramanga", "trabajos locales", "plataforma de servicios"],
  icons: {
    icon: [
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
      { url: "/icon.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "512x512", type: "image/png" },
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "OigaUsted",
    statusBarStyle: "default",
  },
  manifest: "/manifest.webmanifest",
  metadataBase: new URL("https://oigagig.com"),
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Global guard against the Google Maps legacy Places Autocomplete widget.
  // The legacy widget (from stale bundles or accidental 'places' lib load) injects
  // .pac-container DOM nodes that React does not own. React unmount/reconcile then throws
  // NotFoundError: removeChild + "more hooks than previous render" (#310).
  //
  // We ONLY nuke the JS constructor and places namespace (no DOM removal, which was
  // causing its own removeChild errors and breaking legit map loads).
  // We rely on:
  // - Never loading 'places' library (see googleMapsLoader.ts + GoogleMap.tsx)
  // - CSS to hide any stray .pac-container (see globals.css)
  // - Constructor override as last defense
  //
  // This runs early in <head> before any page components.
  const mapsGuardScript = `
    (function() {
      if (typeof window === 'undefined') return;
      try {
        function neutralizeGoogleMaps() {
          var g = window.google;
          if (!g || !g.maps) return false;
          
          // Block legacy Autocomplete constructor (prevents widget from ever attaching)
          if (g.maps.places && g.maps.places.Autocomplete) {
            try {
              g.maps.places.Autocomplete = function() {
                // console.warn suppressed in prod guard (dev only noise)
                return {};
              };
            } catch(e) {}
          }
          
          // Nuclear: completely nuke the places library if present from stale code.
          if (g.maps.places) {
            try {
              g.maps.places = {
                Autocomplete: function() { return {}; },
                AutocompleteService: function() {},
                PlacesService: function() {},
                PlacesServiceStatus: {},
                RankBy: {},
                PlaceAutocompleteElement: function() {}
              };
              // console.warn suppressed (prod guard noise)
            } catch(e) {}
          }
          return true;
        }
        
        // Run immediately
        neutralizeGoogleMaps();
        
        // Run again after DOM mutations (covers async script loads / late bundles)
        var mo = new MutationObserver(function() {
          neutralizeGoogleMaps();
        });
        mo.observe(document.documentElement || document.body, { childList: true, subtree: true });
        
        // Periodic nuke for first 10s (catches late injection from code chunks)
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
        }, 300);
        
        setTimeout(function() {
          clearInterval(cleanupInterval);
          try { mo.disconnect(); } catch(e) {}
        }, 10000);
        
        // console.debug suppressed for prod (guard still active)
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
