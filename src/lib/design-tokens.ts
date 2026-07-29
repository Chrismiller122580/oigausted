/**
 * OigaGIG v2 design tokens — single source for homepage brand colors & constants.
 */

import { colombianCitiesLegacy } from '@/lib/colombia-cities';

/** WCAG AA–safe orange (≥4.5:1 with white text). */
export const brand = {
  orange: '#C2410C',
  orangeHover: '#9A3412',
  trustGreen: '#10B981',
  accentYellow: '#EAB308',
  slateLight: '#F8FAFC', // slate-50
  slateDark: '#020617', // slate-950
} as const;

/** Shared Tailwind classes for primary CTAs (buttons with white label text). */
export const brandButtonClass =
  'bg-orange-800 hover:bg-orange-900 text-white dark:bg-orange-700 dark:hover:bg-orange-800';

export const colombianCities = colombianCitiesLegacy;

export const COLOMBIA_MAP_CENTER = { lat: 4.5709, lng: -74.2973, zoom: 5 } as const;

/** Vibrant card gradients for category grid — warm Colombian palette */
export const categoryGradients = [
  'from-orange-500 to-amber-400',
  'from-emerald-500 to-teal-400',
  'from-sky-500 to-blue-400',
  'from-violet-500 to-purple-400',
  'from-rose-500 to-pink-400',
  'from-yellow-500 to-orange-400',
  'from-cyan-500 to-emerald-400',
  'from-fuchsia-500 to-rose-400',
  'from-lime-500 to-green-400',
  'from-indigo-500 to-violet-400',
  'from-amber-500 to-yellow-400',
  'from-teal-500 to-cyan-400',
] as const;

/** Hero collage images — authentic Colombian service imagery */
export const heroCollageImages = [
  '/icons/limpieza-de-hogar-y-oficinas.jpg',
  '/icons/fotografia-y-video.jpg',
  '/icons/plomeria-y-fontaneria.jpg',
  '/icons/cocina-casera-y-catering.jpg',
  '/icons/diseno-grafico-y-logos.jpg',
  '/icons/transporte-y-mudanzas.jpg',
  '/world-cup-hero.jpg',
  '/icons/belleza-y-maquillaje-a-domicilio.jpg',
] as const;

export const trustBadges = [
  { icon: 'star', label: '4.9 promedio' },
  { icon: 'check', label: 'Verificados' },
  { icon: 'lock', label: 'Pago protegido' },
  { icon: 'shield', label: 'Garantía OigaGIG' },
] as const;