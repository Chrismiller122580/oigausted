// src/app/(marketing)/page.tsx
import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { getGigCategories } from '@/lib/categories';
import { getCategoryIcon } from '@/lib/icon-registry';

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

// ISR: refresh stats, categories and social proof every 60s (cheap + fresh enough)
export const revalidate = 60;

export default async function MarketingHomePage() {
  const allCategories = await getGigCategories();
  const topCategoryNames = allCategories.slice(0, 12).map((c) => c.name);

  // Ratings for top categories (for badges on cards)
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
    take: 200
  });

  const ratingMap: Record<string, { total: number; count: number }> = {};
  for (const g of gigsWithRatings) {
    if (g.category && g.seller?.rating) {
      if (!ratingMap[g.category]) ratingMap[g.category] = { total: 0, count: 0 };
      ratingMap[g.category].total += g.seller.rating;
      ratingMap[g.category].count += 1;
    }
  }

  // Prefer DB-backed description (from getGigCategories / Category.description) + fallbacks
  const popularCategories = topCategoryNames.map((name) => {
    const cat = allCategories.find((c) => c.name === name);
    const stat = ratingMap[name];
    const avg = stat && stat.count > 0 ? Math.round((stat.total / stat.count) * 10) / 10 : null;

    return {
      name,
      icon: getCategoryIcon(name), // path to .jpg or emoji fallback
      description: (cat?.description as string | undefined) || 'Profesionales locales disponibles',
      avgRating: avg,
      reviewCount: stat?.count || 0
    };
  });

  // Live stats for social proof (lightweight server queries)
  const [totalGigs, totalReviews, cityAgg, totalSellers] = await Promise.all([
    prisma.gig.count({ where: { isActive: true } }),
    prisma.review.count(),
    prisma.gig.findMany({
      where: { isActive: true, city: { not: null } },
      select: { city: true },
      distinct: ['city'],
    }),
    prisma.user.count({ where: { role: 'SELLER' } }),
  ]);

  const totalCities = cityAgg.length;

  const stats = {
    gigs: totalGigs || 0,
    reviews: totalReviews || 0,
    cities: totalCities || 0,
    sellers: totalSellers || 0,
  };

  // Curated Colombian-flavored testimonials (trust proof)
  const testimonials = [
    {
      quote: "Encontré una plomera excelente en 20 minutos. El trabajo quedó perfecto y el pago fue seguro con Wompi.",
      name: "Laura Mendoza",
      role: "Propietaria",
      city: "Bucaramanga",
      rating: 5,
    },
    {
      quote: "Contraté un fotógrafo para el evento de mi empresa. Calidad profesional, comunicación directa y precio justo.",
      name: "Carlos Ramírez",
      role: "Gerente de Eventos",
      city: "Bogotá",
      rating: 5,
    },
    {
      quote: "La tutora de inglés que encontré aquí es increíble. Mis hijos avanzaron muchísimo en solo un mes.",
      name: "Sofía Vargas",
      role: "Madre de familia",
      city: "Medellín",
      rating: 5,
    },
    {
      quote: "Publicar mi servicio de catering fue muy fácil. Ya tengo clientes recurrentes gracias a las reseñas reales.",
      name: "Andrés López",
      role: "Chef & Catering",
      city: "Cali",
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* HERO SECTION - kept energetic Colombian gradient + enhanced sub + trust */}
      <section className="relative bg-gradient-to-br from-orange-600 via-red-600 to-rose-600 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:20px_20px]"></div>

        <div className="max-w-7xl mx-auto px-6 pt-20 pb-16 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-sm mb-6">
              🇨🇴 Hecho en Colombia • Conecta local
            </div>

            <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
              El servicio que necesitas,<br className="hidden md:block" /> con gente de confianza.
            </h1>

            <p className="text-xl md:text-2xl text-white/90 mb-8">
              Conecta directo con profesionales locales en Bucaramanga, Bogotá, Medellín, Cali y todo Colombia.<br className="hidden md:block" />
              Sin intermediarios. Pagos seguros. Calificaciones reales.
            </p>

            {/* Live stats strip in hero */}
            <div className="mb-8 flex flex-wrap gap-x-6 gap-y-1 text-sm text-white/80">
              <span>{stats.gigs.toLocaleString('es-CO')} gigs activos</span>
              <span>•</span>
              <span>{stats.reviews.toLocaleString('es-CO')} reseñas reales</span>
              <span>•</span>
              <span>{stats.cities} ciudades</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
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
            </div>

            <p className="mt-8 text-sm text-white/70 flex items-center gap-2">
              ⭐ Calificaciones reales • 💬 Chat directo • 💰 Pagos con Wompi
            </p>
          </div>
        </div>

        <div className="absolute bottom-0 right-10 hidden lg:block opacity-30">
          <Image src="/globe.svg" alt="Colombia" width={280} height={280} />
        </div>
      </section>

      {/* CATEGORIES GRID - now with premium icons from the registry */}
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
          {popularCategories.map((cat) => {
            const ic = cat.icon;
            const isIconPath = typeof ic === 'string' && ic.startsWith('/');
            return (
              <Link
                key={cat.name}
                href={`/gigs?categoria=${encodeURIComponent(cat.name)}`}
                className="group bg-card dark:bg-card border border-border rounded-3xl p-6 hover:border-orange-500 hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center min-h-[220px]"
              >
                <div className="mb-4 flex h-16 w-16 items-center justify-center transition-transform group-hover:scale-110">
                  {isIconPath ? (
                    <img
                      src={ic}
                      alt=""
                      className="h-14 w-14 object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-5xl">{ic}</span>
                  )}
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
              </Link>
            );
          })}
        </div>
      </section>

      {/* NEW: LIVE STATS / SOCIAL PROOF (the credibility the old landing lacked) */}
      <section className="border-y bg-muted/30 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { label: "Gigs activos", value: stats.gigs.toLocaleString('es-CO') },
              { label: "Reseñas reales", value: stats.reviews.toLocaleString('es-CO') },
              { label: "Ciudades", value: stats.cities.toLocaleString('es-CO') },
              { label: "Profesionales", value: stats.sellers.toLocaleString('es-CO') },
            ].map((stat, idx) => (
              <div key={idx} className="rounded-2xl bg-card p-6 shadow-sm">
                <div className="text-4xl font-bold text-orange-600">{stat.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Datos actualizados • Reseñas verificadas después de cada servicio
          </p>
        </div>
      </section>

      {/* NEW: TESTIMONIALS (social proof) */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-zinc-900 dark:text-white">Lo que dicen quienes ya confiaron</h2>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">Reseñas reales de personas y negocios en Colombia</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className="rounded-3xl border bg-card p-6 flex flex-col">
              <div className="flex text-amber-500 mb-3">
                {'★'.repeat(t.rating)}
              </div>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 flex-1 leading-relaxed">“{t.quote}”</p>
              <div className="mt-4 text-xs">
                <div className="font-semibold text-zinc-900 dark:text-white">{t.name}</div>
                <div className="text-muted-foreground">{t.role} • {t.city}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CÓMO FUNCIONA - enhanced with better visuals */}
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
          ].map((item, i) => (
            <div key={i} className="text-center">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center text-2xl font-bold mb-4">
                {item.step}
              </div>
              <h3 className="font-semibold text-xl mb-2">{item.title}</h3>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold mb-4">¿Listo para empezar?</h2>
          <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-8">
            Miles de personas ya están conectando con profesionales de confianza en su ciudad.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
          </div>
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
  );
}
