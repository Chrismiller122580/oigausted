/**
 * OigaGIG v2 design tokens — single source for homepage brand colors & constants.
 */

export const brand = {
  orange: '#F97316',
  orangeHover: '#EA580C',
  trustGreen: '#10B981',
  accentYellow: '#EAB308',
  slateLight: '#F8FAFC', // slate-50
  slateDark: '#020617', // slate-950
} as const;

export const colombianCities = [
  { id: 'bogota', label: 'Bogotá', slug: 'Bogotá' },
  { id: 'medellin', label: 'Medellín', slug: 'Medellín' },
  { id: 'cali', label: 'Cali', slug: 'Cali' },
  { id: 'bucaramanga', label: 'Bucaramanga', slug: 'Bucaramanga' },
  { id: 'barranquilla', label: 'Barranquilla', slug: 'Barranquilla' },
  { id: 'cartagena', label: 'Cartagena', slug: 'Cartagena' },
] as const;

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