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
import { ensurePlatformConfig } from "@/lib/prisma";
import { BRAND_LOGO_PATH } from "@/lib/brand";
import { getPublicSiteInfo, getSiteUrl } from "@/lib/public-site";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import ConsentedGoogleAnalytics from "@/components/analytics/ConsentedGoogleAnalytics";
import ConsentedMetaPixel from "@/components/analytics/ConsentedMetaPixel";
import CookieConsent from "@/components/common/CookieConsent";
import PwaInstallPrompt from "@/components/common/PwaInstallPrompt";
import AppUpdateBanner from "@/components/common/AppUpdateBanner";

const inter = Inter({ subsets: ["latin"], display: "swap", preload: false });

export async function generateMetadata(): Promise<Metadata> {
  let siteName = "OigaGIG";
  const defaultDescription =
    "El profesional que necesitas, con gente de confianza a un Oiga de distancia. Servicios locales en Bogotá, Medellín, Cali y toda Colombia. Pagos seguros con Wompi.";
  let siteTagline = defaultDescription;
  let appUrl = "https://oigagig.com";

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
    other: {
      'facebook-domain-verification': '8ltfjntpu26azyajh055udr5tuxd70',
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
  let session = null;
  try {
    session = await getServerSession(authOptions);
  } catch (e) {
    console.error('getServerSession failed:', e);
  }
  const domGuardScript = `
    (function() {
      if (typeof Node !== 'function' || !Node.prototype) return;
      var origRemove = Node.prototype.removeChild;
      Node.prototype.removeChild = function(child) {
        if (child && child.parentNode !== this) return child;
        try { return origRemove.apply(this, arguments); } catch (e) { return child; }
      };
      var origInsert = Node.prototype.insertBefore;
      Node.prototype.insertBefore = function(newNode, refNode) {
        if (refNode && refNode.parentNode !== this) return newNode;
        try { return origInsert.apply(this, arguments); } catch (e) { return newNode; }
      };
    })();
  `;

  const mapsGuardScript = `
    (function() {
      if (typeof window === 'undefined') return;
      try {
        function neutralizeGoogleMaps() {
          var g = window.google;
          if (!g || !g.maps) return false;
          if (g.maps.places && g.maps.places.Autocomplete) {
            try {
              g.maps.places.Autocomplete = function() { return {}; };
            } catch(e) {}
          }
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
            } catch(e) {}
          }
          return true;
        }
        neutralizeGoogleMaps();
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
        setTimeout(function() { clearInterval(cleanupInterval); }, 3000);
      } catch (e) {}
    })();
  `;

  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <Script id="dom-reconcile-guard" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: domGuardScript }} />
        <Script id="maps-guard" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: mapsGuardScript }} />
        <SessionProviderWrapper session={session}>
          <MaintenanceBanner />
          <NavbarWrapper>
            {children}
          </NavbarWrapper>
          <AppToaster />
          <CookieConsent />
          <AppUpdateBanner />
          <PwaInstallPrompt />
          <Analytics />
          <SpeedInsights />
          <ConsentedGoogleAnalytics />
          <ConsentedMetaPixel />
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
