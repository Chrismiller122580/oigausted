import { categoryEmojis } from './categories';

/**
 * Central registry for Oiga GiG 1.0 premium custom category icons (AI-generated).
 * 22 icons in public/icons/ as optimized .jpg (reliable for Next.js / PWA / img tags).
 *
 * Keys are stable kebab-case filenames (de-accented) matching the committed assets.
 * This is the single source of truth for rendering across landing, /gigs, GigCard, admin.
 *
 * Fallbacks preserve full backward compat with emoji (Category.icon) and '🛠️'.
 *
 * Usage:
 *   const ic = getCategoryIcon("Limpieza de Hogar y Oficinas");
 *   {typeof ic === 'string' && ic.startsWith('/') ? (
 *     <img src={ic} alt="" className="w-8 h-8 object-contain" />
 *   ) : (
 *     <span className="text-2xl">{ic}</span>
 *   )}
 */

export const categoryIconKeys: Record<string, string> = {
  "Limpieza de Hogar y Oficinas": "limpieza-de-hogar-y-oficinas",
  "Música y DJ para Eventos": "musica-y-dj-para-eventos",
  "Asesoría Legal y Tributaria": "asesoria-legal-y-tributaria",
  "Diseño Gráfico y Logos": "diseno-grafico-y-logos",
  "Cocina Casera y Catering": "cocina-casera-y-catering",
  "Fotografía y Video": "fotografia-y-video",
  "Transporte y Mudanzas": "transporte-y-mudanzas",
  "Belleza y Maquillaje a Domicilio": "belleza-y-maquillaje-a-domicilio",
  "Clases Particulares": "clases-particulares",
  "Artesanías y Productos Hechos a Mano": "artesanias-y-productos-hechos-a-mano",
  "Cuidado Holístico y Bienestar": "cuidado-holistico-y-bienestar",
  "Marketing Digital y Redes Sociales": "marketing-digital-y-redes-sociales",
  "Plomería y Fontanería": "plomeria-y-fontaneria",
  "Mensajería y Delivery": "mensajeria-y-delivery",
  "Asistente Virtual y Soporte Administrativo": "asistente-virtual-y-soporte-administrativo",
  "Redacción de Contenidos y Copywriting": "redaccion-de-contenidos-y-copywriting",
  "Reparaciones y Mantenimiento del Hogar": "reparaciones-y-mantenimiento-del-hogar",
  "Desarrollo Web y Tiendas Online": "desarrollo-web-y-tiendas-online",
  "Edición de Video y Contenido Audiovisual": "edicion-de-video-y-contenido-audiovisual",
  "Diseño de Interiores y Arquitectura": "diseno-de-interiores-y-arquitectura",
  "Clases de Idiomas y Tutorías Online": "clases-de-idiomas-y-tutorias-online",
  "Gestión de Eventos y Organización de Fiestas": "gestion-de-eventos-y-organizacion-de-fiestas",
};

export function getCategoryIconKey(name: string): string | null {
  return categoryIconKeys[name] || null;
}

/**
 * Returns either a public path string ("/icons/xxx.jpg") for the premium icon,
 * or a fallback emoji string for legacy/unknown categories.
 * Consumers decide how to render (img for paths, span/text for emojis).
 */
export function getCategoryIcon(name: string): string {
  const key = categoryIconKeys[name];
  if (key) {
    return `/icons/${key}.jpg`;
  }
  return categoryEmojis[name] || '🛠️';
}

/**
 * Optional tiny icon component for convenience in client components.
 * Handles the img vs emoji decision + basic sizing/class for badges/cards.
 * Use when you want <CategoryIcon name={cat.name} className="w-4 h-4 mr-1" />
 */
export function CategoryIcon({
  name,
  className = "w-4 h-4 mr-1 object-contain inline align-middle",
  fallbackClassName = "inline text-[1em]",
}: {
  name: string;
  className?: string;
  fallbackClassName?: string;
}) {
  const ic = getCategoryIcon(name);
  if (ic.startsWith('/')) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={ic} alt="" className={className} />;
  }
  return <span className={fallbackClassName}>{ic}</span>;
}

// Re-export for convenience in places that still import emojis
export { categoryEmojis } from './categories';
