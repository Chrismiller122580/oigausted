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
    orientation: 'portrait-primary',
    categories: ['business', 'lifestyle', 'productivity', 'shopping'],
    lang: 'es-CO',
    dir: 'ltr',
    scope: '/',
  }
}
