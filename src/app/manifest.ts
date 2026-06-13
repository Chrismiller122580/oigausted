import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'OigaUsted - Gigs y Servicios Locales en Colombia',
    short_name: 'OigaUsted',
    description: 'Conecta con freelancers y negocios locales en Colombia. Gigs de servicios confiables en Bucaramanga y más.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0a0a0a',
    icons: [
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    // PR3: category premium icons integrated at /icons/<slug>.jpg (AI JPEG rasters 1024x1024; see icon-registry.ts for MIME fix + 256-base note).
    // Note: committed assets are JPEG rasters (named .jpg after review fix for correct MIME) despite 'PNG primary' + '256 base' in prompt; relaxed per practicality (no converter); object-contain scales.
    // App launcher uses existing /icon.png (refined variants possible in future; no new hero/refined app icon generated in this PR).
    orientation: 'portrait-primary',
    categories: ['business', 'lifestyle', 'productivity', 'shopping'],
    lang: 'es-CO',
    dir: 'ltr',
    scope: '/',
  }
}
