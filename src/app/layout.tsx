import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import "./globals.css";
import NavbarWrapper from "@/components/layout/NavbarWrapper";
import SessionProviderWrapper from "@/components/providers/SessionProviderWrapper";
import MaintenanceBanner from "@/components/layout/MaintenanceBanner";
import AppToaster from "@/components/common/AppToaster";
import { ensurePlatformConfig } from "@/lib/prisma"; // one-off ensure of PlatformConfig singleton (maintenanceMode etc.) on first boot/request
import { BRAND_LOGO_PATH } from "@/lib/brand";
import { getPublicSiteInfo, getSiteUrl } from "@/lib/public-site";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import ConsentedGoogleAnalytics from "@/components/analytics/ConsentedGoogleAnalytics";
import CookieConsent from "@/components/common/CookieConsent";
import PwaInstallPrompt from "@/components/common/PwaInstallPrompt";

const inter = Inter({ subsets: ["latin"], display: "swap", preload: false });

// Dynamic metadata powered by admin settings (branding)
export async function generateMetadata(): Promise<Metadata> {
  let siteName = "OigaGIG";
  const defaultDescription =
    "El profesional que necesitas, con gente de confianza a un Oiga de distancia. Servicios locales en Bogotá, Medellín, Cali y toda Colombia. Pagos seguros con Wompi.";
  let siteTagline = defaultDescription;
  let appUrl = "https://oigagig.com";

  // Proactively ensure the PlatformConfig singleton exists on the very first
  // request that needs metadata (covers "app boot" / first hit after deploy or DB reset).
  // This + the lazy ensure inside getPlatformConfig() + the seed makes maintenanceMode
  // (and other toggles) reliably persist from the first admin save.
  ensurePlatformConfig().catch(() => { /* non-fatal */ });

  try {
    const info = await getPublicSiteInfo();
    siteName = info.siteName;
    if (info.siteTagline?.trim()) siteTagline = info.siteTagline.trim();
    appUrl = getSiteUrl();
  } catch (e) {
    console.error('generateMetadata config load failed:', e);
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
          url: BRAND_LOGO_PATH,
          width: 832,
          height: 1248,
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
      images: [BRAND_LOGO_PATH],
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
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
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
        
        // Periodic nuke for first 10s (catches late injection from code chunks).
        // Intentionally no MutationObserver on document — observing the full subtree
        // fired on every React update and contributed to DOM reconciliation errors.
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
        }, 1000);
        
        setTimeout(function() {
          clearInterval(cleanupInterval);
        }, 3000);
        
        // console.debug suppressed for prod (guard still active)
      } catch (e) {
        // Never break the page
      }
    })();
  `;

  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <Script
          id="maps-guard"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: mapsGuardScript }}
        />
        <SessionProviderWrapper session={session}>
          <MaintenanceBanner />
          <NavbarWrapper>
            {children}
          </NavbarWrapper>
          <AppToaster />
          <CookieConsent />
          <PwaInstallPrompt />
          <Analytics />
          <SpeedInsights />
          <ConsentedGoogleAnalytics />
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
