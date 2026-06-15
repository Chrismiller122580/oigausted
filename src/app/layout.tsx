import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import NavbarWrapper from "@/components/layout/NavbarWrapper";
import SessionProviderWrapper from "@/components/providers/SessionProviderWrapper";
import MaintenanceBanner from "@/components/layout/MaintenanceBanner";
import { Toaster } from "sonner"; // 2027-grade beautiful toasts
import { ensurePlatformConfig } from "@/lib/prisma"; // one-off ensure of PlatformConfig singleton (maintenanceMode etc.) on first boot/request
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import ConsentedGoogleAnalytics from "@/components/analytics/ConsentedGoogleAnalytics";
import CookieConsent from "@/components/common/CookieConsent";

const inter = Inter({ subsets: ["latin"] });

// Dynamic metadata powered by admin settings (branding)
export async function generateMetadata(): Promise<Metadata> {
  let siteName = "Oigagig";
  let siteTagline = "Conecta con profesionales locales en Colombia";
  let appUrl = "https://oigagig.com";

  // Proactively ensure the PlatformConfig singleton exists on the very first
  // request that needs metadata (covers "app boot" / first hit after deploy or DB reset).
  // This + the lazy ensure inside getPlatformConfig() + the seed makes maintenanceMode
  // (and other toggles) reliably persist from the first admin save.
  ensurePlatformConfig().catch(() => { /* non-fatal */ });

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/config`, {
      next: { revalidate: 300 }, // cache for 5 minutes
    });
    if (res.ok) {
      const cfg = await res.json();
      if (cfg.siteName) siteName = cfg.siteName;
      if (cfg.siteTagline) siteTagline = cfg.siteTagline;
      if (cfg._meta?.payment?.appUrl) appUrl = cfg._meta.payment.appUrl;
    }
  } catch (e) {
    // Log the error so it appears in Vercel logs with digest if this causes a render issue
    console.error('generateMetadata config fetch failed:', e);
  }

  const fullTitle = `${siteName} — ${siteTagline}`;
  const baseUrl = new URL(appUrl);

  return {
    title: {
      default: fullTitle,
      template: `%s | ${siteName}`,
    },
    description: siteTagline,
    applicationName: siteName,
    authors: [{ name: siteName }],
    keywords: ['servicios locales', 'gigs Colombia', 'freelancers', 'profesionales Colombia', 'Bucaramanga', 'Bogotá', 'Medellín', 'marketplace servicios'],
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
      title: siteName,
      statusBarStyle: "default",
    },
    manifest: "/manifest.webmanifest",
    metadataBase: baseUrl,
    openGraph: {
      title: fullTitle,
      description: siteTagline,
      url: baseUrl,
      siteName: siteName,
      images: [
        {
          url: '/logo.png',
          width: 1200,
          height: 630,
          alt: siteName,
        },
      ],
      locale: 'es_CO',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: siteTagline,
      images: ['/logo.png'],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

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
        {/* Set Wompi public key as early as possible in <head> so that the Wompi widget script (and its internal bundles like v1.js) can see it during their own initialization, preventing merchants/undefined and init 422 errors. */}
        {process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  try {
                    window.WOMPI_PUBLIC_KEY = '${process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY}';
                    if (window.$wompi) {
                      window.$wompi.publicKey = '${process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY}';
                    }
                  } catch(e) {}
                })();
              `
            }}
          />
        )}
      </head>
      <body className={`${inter.className} pb-safe-area-inset-bottom`}>
        <SessionProviderWrapper>
          <MaintenanceBanner />
          <NavbarWrapper>
            {children}
          </NavbarWrapper>
          <Toaster position="top-center" richColors closeButton />
          <CookieConsent />
          <Analytics />
          <SpeedInsights />
          <ConsentedGoogleAnalytics />
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
