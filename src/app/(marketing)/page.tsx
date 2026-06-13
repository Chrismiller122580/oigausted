// src/app/(marketing)/page.tsx
import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { getGigCategories, getCategoryIcon } from '@/lib/categories'; // getCategoryIcon from registry (now .jpg path for PR3 AI assets, emoji fallback)
import { motion, MotionConfig } from 'framer-motion';
import { Star, MessageCircle, ShieldCheck, Users, Award } from 'lucide-react';

// PR1/PR4/PR7: MotionConfig reducedMotion="user" (at marketing root, which covers anon landing via app/page.tsx)
// ensures framer initial/animate + whileHover respect user's OS prefers-reduced-motion setting everywhere in this tree.
// Non-framer CSS (Tailwind transition-all, group-hover:scale-110 on <img> icons, hover:scale on CTAs) are guarded in globals.css.
// Staggers use consistent short delays (capped) for perceived polish without feeling sluggish. Revalidate=60 keeps stats fresh (perf note).

export const metadata = {
  title: 'OigaUsted - Gigs Colombia | Encuentra el servicio que necesitas',
  description: 'Conecta directamente con profesionales locales en Colombia. Limpieza, reparaciones, belleza, marketing y más. ¡Oiga Usted!',
  openGraph: {
    title: 'OigaUsted - Gigs Colombia',
    description: 'El marketplace de servicios locales más directo de Colombia. Encuentra freelancers de confianza en Bucaramanga, Bogotá, Medellín y más.',
    images: [{ 
      url: '/logo.png', 
      width: 1200, 
      height: 630, 
      alt: 'OigaUsted - Servicios locales en Colombia' 
    }],
    locale: 'es_CO',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OigaUsted - Gigs Colombia',
    description: 'Conecta directamente con profesionales locales. Servicios confiables sin intermediarios.',
    images: ['/logo.png'],
  },
};

// ISR-friendly revalidation for live stats (per PR plan: 60s)
export const revalidate = 60;

// Short, friendly descriptions for the homepage category cards (fallback when DB description is empty/null)
// DB-backed Category.description (via getGigCategories) is source of truth and admin-editable.
const categoryDescriptions: Record<string, string> = {
  "Limpieza de Hogar y Oficinas": "Limpieza profesional para hogares y oficinas",
  "Música y DJ para Eventos": "Sonido, animación y DJ para fiestas y eventos",
  "Asesoría Legal y Tributaria": "Abogados y contadores locales de confianza",
  "Diseño Gráfico y Logos": "Logos, branding y diseño gráfico profesional",
  "Cocina Casera y Catering": "Comida casera y catering para eventos",
  "Fotografía y Video": "Fotógrafos y videógrafos en tu ciudad",
  "Transporte y Mudanzas": "Fletes, mudanzas y transporte local",
  "Belleza y Maquillaje a Domicilio": "Estilistas y maquillaje profesional a domicilio",
  "Clases Particulares": "Profesores particulares de todas las materias",
  "Artesanías y Productos Hechos a Mano": "Artesanos y productos únicos hechos a mano",
  "Cuidado Holístico y Bienestar": "Terapias, masajes y bienestar integral",
  "Marketing Digital y Redes Sociales": "Gestión de redes y marketing digital",
  "Plomería y Fontanería": "Reparaciones de tuberías, grifos, desagües e instalaciones hidráulicas",
  "Mensajería y Delivery": "Envíos, paquetes y domicilios rápidos en la ciudad",
  // Extended for full 22 (PR4 unification; DB overrides these when populated via admin)
  "Desarrollo Web y Tiendas Online": "Sitios web, tiendas online y desarrollo profesional",
  "Edición de Video y Contenido Audiovisual": "Edición profesional de video y contenido audiovisual",
  "Asistente Virtual y Soporte Administrativo": "Asistentes virtuales y soporte admin remoto",
  "Redacción de Contenidos y Copywriting": "Redactores y copywriters para tus textos",
  "Reparaciones y Mantenimiento del Hogar": "Reparaciones, mantenimiento y mano de obra calificada",
  "Clases de Idiomas y Tutorías Online": "Clases de idiomas y tutorías personalizadas online",
  "Diseño de Interiores y Arquitectura": "Diseño de interiores, planos y proyectos de arquitectura",
  "Gestión de Eventos y Organización de Fiestas": "Planificación y coordinación de eventos y fiestas",
};

export default async function MarketingHomePage() {
  // Fetch gigs for top categories and compute averages in JS (the groupBy above was removed because it was invalid)
  // + lightweight live stats for hero strip + new Stats section (direct prisma; ISR revalidate 60s)
  const allCategories = await getGigCategories();
  const topCategoryNames = allCategories.slice(0, 12).map((c) => c.name);

  const [gigsWithRatings, activeGigsCount, citiesRows, reviewAgg] = await Promise.all([
    prisma.gig.findMany({
      where: {
        isActive: true,
        category: { in: topCategoryNames as any }
      },
      select: {
        category: true,
        seller: {
          select: { rating: true }
        }
      },
      take: 200 // enough sample per category
    }),
    prisma.gig.count({ where: { isActive: true } }),
    prisma.gig.findMany({
      where: { isActive: true, city: { not: null } },
      select: { city: true },
      distinct: ['city'],
    }),
    prisma.review.aggregate({ _avg: { rating: true }, _count: true }),
  ]);

  const ratingMap: Record<string, { total: number; count: number }> = {};
  for (const g of gigsWithRatings) {
    if (g.category && g.seller?.rating) {
      if (!ratingMap[g.category]) ratingMap[g.category] = { total: 0, count: 0 };
      ratingMap[g.category].total += g.seller.rating;
      ratingMap[g.category].count += 1;
    }
  }

  const citiesCount = citiesRows.length;
  // Derive reviewsTotal from aggregate._count (removed redundant separate prisma.review.count() per review nit; _count shape uses ._all in Prisma aggregate)
  const reviewsTotal = (reviewAgg as any)._count?._all ?? 0;
  const avgReviewRating = reviewAgg._avg.rating ? Math.round(reviewAgg._avg.rating * 10) / 10 : null;

  const popularCategories = topCategoryNames.map((name) => {
    const stat = ratingMap[name];
    const avg = stat && stat.count > 0 ? Math.round((stat.total / stat.count) * 10) / 10 : null;
    const catData = allCategories.find((c) => c.name === name); // for reliable DB description surfacing (prep for PR4 unification)

    return {
      name,
      icon: getCategoryIcon(name), // registry (PR3: /icons/slug.png or emoji fallback; zero breakage)
      description: catData?.description || categoryDescriptions[name] || 'Profesionales locales disponibles',
      avgRating: avg,
      reviewCount: stat?.count || 0
    };
  });

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-background">
        {/* HERO SECTION */}
        <section className="relative bg-gradient-to-br from-orange-600 via-red-600 to-rose-600 text-white overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:20px_20px]"></div>
          
          <div className="max-w-7xl mx-auto px-6 pt-20 pb-16 relative z-10">
            <div className="max-w-3xl">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.21, 0.92, 0.26, 1] }}
                className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-sm mb-6"
              >
                🇨🇴 Hecho en Colombia • Conecta local
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.21, 0.92, 0.26, 1], delay: 0.05 }}
                className="text-5xl md:text-6xl font-bold leading-tight mb-6"
              >
                El servicio que necesitas,<br className="hidden md:block" /> con gente de confianza.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.21, 0.92, 0.26, 1], delay: 0.1 }}
                className="text-xl md:text-2xl text-white/90 mb-10"
              >
                Conecta directo con profesionales locales en Bucaramanga, Bogotá, Medellín, Cali y todo Colombia.<br className="hidden md:block" />
                Sin intermediarios. Pagos seguros. Calificaciones reales.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.21, 0.92, 0.26, 1], delay: 0.15 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Link
                  href="/gigs"
                  className="bg-card text-orange-600 hover:bg-muted font-semibold text-lg px-10 py-4 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 hover:scale-[1.02] hover:shadow-xl"
                >
                  Ver todos los servicios
                  <span aria-hidden="true">→</span>
                </Link>

                <Link
                  href="/create-gig"
                  className="border-2 border-border/80 hover:bg-muted/10 font-semibold text-lg px-10 py-4 rounded-2xl flex items-center justify-center transition-all hover:scale-[1.02] hover:shadow-lg active:scale-95"
                >
                  Quiero ofrecer mis servicios
                </Link>
              </motion.div>

              {/* Live stats strip (lightweight prisma aggregates; shows real counts from DB) */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.22 }}
                className="mt-5 text-xs sm:text-sm text-white/70 flex flex-wrap items-center gap-x-4 gap-y-1"
              >
                <span>{activeGigsCount.toLocaleString()} gigs publicados</span>
                <span className="hidden sm:inline">•</span>
                <span>{reviewsTotal.toLocaleString()} reseñas reales</span>
                <span className="hidden sm:inline">•</span>
                <span>{citiesCount.toLocaleString()} ciudades</span>
              </motion.div>

              {/* Upgraded trust line with lucide icons (premium polish) */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25 }}
                className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/80"
              >
                <span className="flex items-center gap-1.5"><Star className="w-4 h-4" /> Calificaciones reales</span>
                <span className="flex items-center gap-1.5"><MessageCircle className="w-4 h-4" /> Chat directo</span>
                <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4" /> Pagos con Wompi</span>
              </motion.div>
            </div>
          </div>

          {/* Subtle motion on decorative premium visual (globe) - keeps/enhances existing */}
          <div className="absolute bottom-0 right-10 hidden lg:block opacity-30">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3, ease: [0.21, 0.92, 0.26, 1] }}
            >
              <Image src="/globe.svg" alt="Colombia" width={280} height={280} />
            </motion.div>
          </div>
      </section>

      {/* CATEGORIES GRID */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-4xl font-bold text-zinc-900 dark:text-white">Categorías populares</h2>
            <p className="text-zinc-600 dark:text-zinc-400 mt-2">Con calificaciones reales de usuarios locales</p>
          </div>
          <Link href="/gigs" className="text-orange-600 hover:underline font-medium flex items-center gap-1">
            Ver todas <span>→</span>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {/* index for entrance stagger timing (PR7: consistent 0.03 step, capped); static server data, no reordering risk */}
          {popularCategories.map((cat, i) => (
            <Link
              key={cat.name}
              href={`/gigs?categoria=${encodeURIComponent(cat.name)}`}
              className="group block bg-card dark:bg-card border border-border rounded-3xl p-6 hover:border-orange-500 hover:shadow-xl transition-all duration-300"
            >
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: Math.min(i * 0.03, 0.18), ease: [0.21, 0.92, 0.26, 1] }}
                whileHover={{ scale: 1.015 }}
                className="flex flex-col items-center text-center min-h-[220px] w-full"
              >
                {typeof cat.icon === 'string' && cat.icon.startsWith('/') ? (
                  <img src={cat.icon} alt="" aria-hidden="true" loading="lazy" className="w-12 h-12 mb-4 object-contain transition-transform group-hover:scale-110 category-icon-img" />
                ) : (
                  <div className="text-5xl mb-4 transition-transform group-hover:scale-110">
                    {cat.icon}
                  </div>
                )}
                <h3 className="font-semibold text-lg text-zinc-900 dark:text-white group-hover:text-orange-600">
                  {cat.name}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2 flex-1">
                  {cat.description}
                </p>

                {cat.avgRating ? (
                  <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-0.5 text-xs text-amber-700 font-medium">
                    ⭐ {cat.avgRating} <span className="text-amber-500">({cat.reviewCount})</span>
                  </div>
                ) : (
                  <div className="mt-3 text-xs text-zinc-400">Disponible ahora</div>
                )}
              </motion.div>
            </Link>
          ))}
        </div>
      </section>

      {/* STATS SECTION - real aggregates from Prisma (gigs / reviews / cities) for credibility */}
      <section className="max-w-7xl mx-auto px-6 py-14 border-y bg-muted/30 dark:bg-muted/10">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-white">Confianza en números</h2>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">Datos reales de la plataforma, actualizados frecuentemente</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {[
            { label: "Gigs activos", value: activeGigsCount.toLocaleString(), sub: "publicados y disponibles", icon: Users },
            { label: "Reseñas reales", value: reviewsTotal.toLocaleString(), sub: avgReviewRating ? `promedio ${avgReviewRating} ★` : "de usuarios verificados", icon: Award },
            { label: "Ciudades activas", value: citiesCount.toString(), sub: "en toda Colombia", icon: Star },
            // "Profesionales" is a lightweight proxy (active gigs count) to avoid extra distinct-seller query; now shows 0 consistently in clean DB (zero-state matches other stats)
            { label: "Profesionales", value: activeGigsCount.toLocaleString(), sub: "conectados localmente", icon: ShieldCheck },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.05 + i * 0.04 }}
                whileHover={{ scale: 1.015, y: -2 }}
                className="bg-card border border-border rounded-3xl p-6 text-center"
              >
                <Icon className="w-6 h-6 mx-auto mb-3 text-orange-600" />
                <div className="text-3xl font-bold text-zinc-900 dark:text-white tabular-nums">{stat.value}</div>
                <div className="text-sm font-medium mt-1 text-zinc-900 dark:text-white/90">{stat.label}</div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{stat.sub}</div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* TESTIMONIALS - static curated quotes (local trust-focused; future: dynamic 5-star from reviews) */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-white">Historias reales de colombianos</h2>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">Cerrando la brecha de confianza en un marketplace de dos lados</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* PR7: consistent stagger step (0.03) + whileHover across sections for polish; MotionConfig ensures a11y reduced-motion */}
          {[
            { quote: "Contraté limpieza para mi apartamento y quedó impecable. La profesional fue puntual y muy amable. ¡Volveré a usarlo!", name: "Laura M.", city: "Bucaramanga", role: "Compradora" },
            { quote: "Necesitaba un DJ para mi boda en Medellín. Encontré uno excelente, chat directo y pago con Wompi. Todo salió perfecto.", name: "Carlos y Andrea", city: "Medellín", role: "Compradores" },
            { quote: "Ofrezco clases de inglés y he conseguido varios estudiantes gracias a la plataforma. Las reseñas reales ayudan a generar confianza.", name: "Prof. Elena V.", city: "Bogotá", role: "Vendedora" },
            { quote: "Mudanza express en Cali sin complicaciones. El transportador recomendado, pago seguro y excelente comunicación.", name: "Jorge P.", city: "Cali", role: "Comprador" },
          ].map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: Math.min(i * 0.03, 0.18) }}
              whileHover={{ scale: 1.015, y: -1 }}
              className="bg-card border border-border rounded-3xl p-6 flex flex-col"
            >
              <p className="text-sm text-zinc-700 dark:text-zinc-300 italic flex-1">“{t.quote}”</p>
              <div className="mt-4 pt-4 border-t text-sm">
                <div className="font-semibold text-zinc-900 dark:text-white">{t.name}</div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">{t.city} • {t.role}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section className="max-w-7xl mx-auto px-6 py-16 bg-card dark:bg-card">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-zinc-900 dark:text-white">Así de fácil es usar OigaUsted</h2>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">En 3 pasos encuentras o publicas el servicio que necesitas</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            { step: "1", title: "Busca o publica", desc: "Explora categorías o publica tu propio servicio en menos de 2 minutos.", iconCat: "Limpieza de Hogar y Oficinas" },
            { step: "2", title: "Contacta directo", desc: "Chatea con el profesional, acuerda detalles y precio sin intermediarios.", iconCat: "Mensajería y Delivery" },
            { step: "3", title: "Paga seguro y califica", desc: "Paga con Wompi al finalizar. Deja una reseña real para ayudar a otros.", iconCat: "Cuidado Holístico y Bienestar" }
          /* index for entrance stagger timing; static array, no reordering risk */
          ].map((item, i) => {
            const icon = getCategoryIcon(item.iconCat); // PR3 registry .jpg icons in steps (builds on PR1 motion)
            /* staggered entrance + whileHover; delay uses consistent 0.06 step (polish PR7); reduced-motion via MotionConfig */
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 + i * 0.06 }}
                whileHover={{ scale: 1.015, y: -2 }}
                className="text-center"
              >
                <div className="mx-auto w-14 h-14 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 flex items-center justify-center mb-4 overflow-hidden ring-1 ring-orange-200/60 relative">
                  {typeof icon === 'string' && icon.startsWith('/') ? (
                    <img src={icon} alt="" aria-hidden="true" className="w-8 h-8 object-contain category-icon-img" loading="lazy" />
                  ) : (
                    <span className="text-3xl">{icon}</span>
                  )}
                  {/* Small step number badge restored for visual "3 steps" scannability (uses item.step data; minimal overlay on enhanced icon containers per reviewer suggestion) */}
                  <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-[10px] leading-none w-4 h-4 rounded-full flex items-center justify-center font-bold ring-1 ring-white/60 dark:ring-black/30 tabular-nums">
                    {item.step}
                  </span>
                </div>
                <h3 className="font-semibold text-xl mb-2">{item.title}</h3>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <div className="max-w-2xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-4xl font-bold mb-4"
          >
            ¿Listo para empezar?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="text-xl text-zinc-600 dark:text-zinc-400 mb-8"
          >
            Miles de personas ya están conectando con profesionales de confianza en su ciudad.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              href="/gigs"
              className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-10 py-4 rounded-2xl text-lg transition-all duration-200 hover:scale-[1.02] active:scale-95 shadow-md hover:shadow-xl"
            >
              Explorar servicios
            </Link>
            <Link
              href="/signup"
              className="border-2 border-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-semibold px-10 py-4 rounded-2xl text-lg transition-all duration-200 hover:scale-[1.02] active:scale-95 hover:shadow-lg"
            >
              Crear cuenta gratis
            </Link>
          </motion.div>
        </div>
      </section>

      {/* SIMPLE FOOTER */}
      <footer className="border-t bg-card dark:bg-card py-10 text-sm">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between gap-6 text-zinc-500">
          <div>
            <div className="font-semibold text-zinc-900 dark:text-white mb-1">OigaUsted</div>
            <div>Conectando Colombia, un servicio a la vez.</div>
          </div>
          <div className="flex gap-8">
            <Link href="/gigs" className="hover:text-zinc-900 dark:hover:text-white">Explorar</Link>
            <Link href="/create-gig" className="hover:text-zinc-900 dark:hover:text-white">Publicar</Link>
            <Link href="/login" className="hover:text-zinc-900 dark:hover:text-white">Iniciar sesión</Link>
          </div>
          <div>© {new Date().getFullYear()} OigaUsted</div>
        </div>
      </footer>
      </div>
    </MotionConfig>
  );
}
