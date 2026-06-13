// src/app/(marketing)/page.tsx
import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { getGigCategories, categoryEmojis } from '@/lib/categories';
import { motion, MotionConfig } from 'framer-motion';

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

// Short, friendly descriptions for the homepage category cards
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
};

export default async function MarketingHomePage() {
  // Fetch gigs for top categories and compute averages in JS (the groupBy above was removed because it was invalid)

  const allCategories = await getGigCategories();
  const topCategoryNames = allCategories.slice(0, 12).map((c) => c.name);
  const gigsWithRatings = await prisma.gig.findMany({
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
  });

  const ratingMap: Record<string, { total: number; count: number }> = {};
  for (const g of gigsWithRatings) {
    if (g.category && g.seller?.rating) {
      if (!ratingMap[g.category]) ratingMap[g.category] = { total: 0, count: 0 };
      ratingMap[g.category].total += g.seller.rating;
      ratingMap[g.category].count += 1;
    }
  }

  const popularCategories = topCategoryNames.map((name) => {
    const stat = ratingMap[name];
    const avg = stat && stat.count > 0 ? Math.round((stat.total / stat.count) * 10) / 10 : null;

    return {
      name,
      emoji: categoryEmojis[name] || '🛠️',
      description: categoryDescriptions[name] || 'Profesionales locales disponibles',
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
                  className="bg-card text-orange-600 hover:bg-muted font-semibold text-lg px-10 py-4 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95"
                >
                  Ver todos los servicios
                  <span aria-hidden="true">→</span>
                </Link>

                <Link
                  href="/create-gig"
                  className="border-2 border-border/80 hover:bg-muted/10 font-semibold text-lg px-10 py-4 rounded-2xl flex items-center justify-center transition-all"
                >
                  Quiero ofrecer mis servicios
                </Link>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25 }}
                className="mt-8 text-sm text-white/70 flex items-center gap-2"
              >
                ⭐ Calificaciones reales • 💬 Chat directo • 💰 Pagos con Wompi
              </motion.p>
            </div>
          </div>

          <div className="absolute bottom-0 right-10 hidden lg:block opacity-30">
            <Image src="/globe.svg" alt="Colombia" width={280} height={280} />
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
          {/* index for entrance stagger timing; list items are static server data, no reordering risk */}
          {popularCategories.map((cat, i) => (
            <Link
              key={cat.name}
              href={`/gigs?categoria=${encodeURIComponent(cat.name)}`}
              className="group block bg-card dark:bg-card border border-border rounded-3xl p-6 hover:border-orange-500 hover:shadow-xl transition-all duration-300"
            >
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: Math.min(i * 0.02, 0.2), ease: [0.21, 0.92, 0.26, 1] }}
                whileHover={{ scale: 1.015 }}
                className="flex flex-col items-center text-center min-h-[220px] w-full"
              >
                <div className="text-5xl mb-4 transition-transform group-hover:scale-110">
                  {cat.emoji}
                </div>
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

      {/* CÓMO FUNCIONA */}
      <section className="max-w-7xl mx-auto px-6 py-16 bg-card dark:bg-card">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-zinc-900 dark:text-white">Así de fácil es usar OigaUsted</h2>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">En 3 pasos encuentras o publicas el servicio que necesitas</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            { step: "1", title: "Busca o publica", desc: "Explora categorías o publica tu propio servicio en menos de 2 minutos." },
            { step: "2", title: "Contacta directo", desc: "Chatea con el profesional, acuerda detalles y precio sin intermediarios." },
            { step: "3", title: "Paga seguro y califica", desc: "Paga con Wompi al finalizar. Deja una reseña real para ayudar a otros." }
          {/* index for entrance stagger timing; static array, no reordering risk */}
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }}
              whileHover={{ scale: 1.01, y: -2 }}
              className="text-center"
            >
              <div className="mx-auto w-14 h-14 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center text-2xl font-bold mb-4">
                {item.step}
              </div>
              <h3 className="font-semibold text-xl mb-2">{item.title}</h3>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
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
              className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-10 py-4 rounded-2xl text-lg transition"
            >
              Explorar servicios
            </Link>
            <Link
              href="/signup"
              className="border-2 border-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-semibold px-10 py-4 rounded-2xl text-lg transition"
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
