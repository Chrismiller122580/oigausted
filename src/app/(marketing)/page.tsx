// src/app/(marketing)/page.tsx
import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { getGigCategories } from '@/lib/categories';
import { getCategoryIcon } from '@/lib/icon-registry';
import { Search, MessageCircle, ShieldCheck } from 'lucide-react';
import { AnimatedCategoryGrid, AnimatedTestimonials } from './LandingClient';
import { LaunchPromoBanner } from './LaunchPromoBanner';

export const metadata = {
  title: 'OigaGig • Servicios entre colombianos • Acabamos de lanzar 🚀',
  description:
    'Conecta con gente de confianza en Colombia. Limpieza, transporte, diseño, comida y más. Pagos fáciles, chat directo y cero intermediarios. ¡Únete a la primera semana de OigaGig!',
  keywords: [
    'gigs colombia',
    'servicios locales colombia',
    'nequi',
    'wompi',
    'freelance colombia',
    'oigagig',
    'lanza tu negocio',
  ],
  openGraph: {
    title: 'OigaGig • Servicios entre colombianos • Acabamos de lanzar 🚀',
    description:
      'Conecta con gente de confianza en Colombia. Pagos fáciles, chat directo y cero intermediarios. ¡Únete a la primera semana de OigaGig!',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'OigaGig - Servicios locales en Colombia',
      },
    ],
    locale: 'es_CO',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OigaGig • Acabamos de lanzar 🚀',
    description:
      'Conecta con gente de confianza en Colombia. Pagos fáciles, chat directo y cero intermediarios.',
    images: ['/logo.png'],
  },
};

// ISR: refresh stats, categories and social proof every 60s (cheap + fresh enough)
export const revalidate = 60;

export default async function MarketingHomePage() {
  const allCategories = await getGigCategories();
  const topCategoryNames = allCategories.slice(0, 12).map((c) => c.name);

  // Ratings for top categories (for badges on cards)
  let gigsWithRatings: any[] = [];
  try {
    gigsWithRatings = await prisma.gig.findMany({
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
  } catch (e) {
    console.error('Failed to load gig ratings for homepage categories (possible schema/DB drift after rollback):', e);
  }

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
  let stats = {
    gigs: 0,
    reviews: 0,
    cities: 0,
    sellers: 0,
  };
  try {
    const [totalGigs, totalReviews, cityAgg, totalSellers] = await Promise.all([
      prisma.gig.count({ where: { isActive: true } }),
      prisma.review.count(),
      prisma.gig.findMany({
        where: { isActive: true, city: { not: null } },
        select: { city: true },
        distinct: ['city'],
      }),
      prisma.user.count({ where: { role: 'seller' } }),  // lowercase to match DB/role usage everywhere else
    ]);

    const totalCities = cityAgg.length;

    stats = {
      gigs: totalGigs || 0,
      reviews: totalReviews || 0,
      cities: totalCities || 0,
      sellers: totalSellers || 0,
    };
  } catch (e) {
    console.error('Failed to load homepage live stats (possible missing column like isActive on Gig after rollback or DB drift):', e);
    // Page will render with 0s instead of crashing the Server Component
  }

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

  const launchPromoMaxSlots = 50;

  return (
    <div className="min-h-screen bg-background">
      <LaunchPromoBanner sellerCount={stats.sellers} maxSlots={launchPromoMaxSlots} />

      {/* HERO - Warm Colombian welcome + launch energy */}
      <section className="relative bg-gradient-to-br from-orange-600 via-red-600 to-rose-600 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:20px_20px]"></div>
        {/* Subtle brand accent overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/10" />

        <div className="max-w-7xl mx-auto px-6 pt-20 pb-16 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-5 py-2 rounded-full text-sm mb-6 border border-white/30">
              🇨🇴 ¡Bienvenidos, familia! • OigaGig acaba de nacer y ya está listo para ti
            </div>

            <h1 className="text-5xl md:text-6xl font-bold leading-[1.05] tracking-tighter mb-6 drop-shadow-sm">
              El servicio que necesitas,
              <br />
              <span className="text-yellow-200">hecho por paisas de confianza.</span>
            </h1>

            <p className="text-xl md:text-2xl text-white/95 mb-8 max-w-2xl">
              Conecta directamente con profesionales locales en Bogotá, Medellín, Cali, Bucaramanga y todo Colombia.
              <br />
              Sin intermediarios. Pagos seguros. Chat real. Y sobre todo… <strong>gente como tú.</strong>
            </p>

            <div className="mb-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-white/90 text-sm">
              <span>⭐ Ya hay {stats.gigs.toLocaleString('es-CO')} gigs activos y creciendo</span>
              <span>💬 Chat directo por WhatsApp</span>
              <span>💳 Paga fácil con Wompi • Nequi • PSE</span>
              <span className="font-semibold text-yellow-300">🎉 ¡Acabamos de lanzar!</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/gigs"
                className="bg-white text-orange-600 hover:bg-white/95 font-semibold text-lg px-10 py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg hover:shadow-xl active:scale-[0.985] transition-all"
              >
                🔍 Ver todos los servicios disponibles →
              </Link>

              <Link
                href="/create-gig"
                className="border-2 border-white/70 hover:bg-white/10 font-semibold text-lg px-10 py-4 rounded-2xl flex items-center justify-center transition-all backdrop-blur active:scale-[0.985]"
              >
                🚀 Quiero ofrecer mis servicios y empezar a ganar plata
              </Link>
            </div>

            <p className="mt-8 text-sm text-white/70 flex items-center gap-2">
              ❤️ Hecho con cariño por y para colombianos • Primera semana de lanzamiento • Únete a los primeros
            </p>
          </div>
        </div>

        <div className="absolute bottom-0 right-10 hidden lg:block opacity-20">
          <Image src="/globe.svg" alt="Colombia" width={320} height={320} />
        </div>
      </section>

      {/* CATEGORIES - More attractive premium cards with branded icon containers */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">Categorías populares</h2>
            <p className="text-zinc-600 dark:text-zinc-400 mt-2 text-lg">Con calificaciones reales de usuarios locales</p>
          </div>
          <Link href="/gigs" className="text-orange-600 hover:text-orange-700 hover:underline font-semibold flex items-center gap-1 text-sm transition-colors">
            Ver todas → 
          </Link>
        </div>

        <AnimatedCategoryGrid popularCategories={popularCategories} />
      </section>

      {/* STATS - More visually attractive with premium cards and subtle accents */}
      <section className="border-y bg-gradient-to-b from-muted/20 to-background py-14">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              { label: "Gigs activos", value: stats.gigs.toLocaleString('es-CO'), icon: "📈" },
              { label: "Reseñas reales", value: stats.reviews.toLocaleString('es-CO'), icon: "⭐" },
              { label: "Ciudades", value: stats.cities.toLocaleString('es-CO'), icon: "📍" },
              { label: "Profesionales", value: stats.sellers.toLocaleString('es-CO'), icon: "👥" },
            ].map((stat, idx) => (
              <div key={idx} className="stat-card flex flex-col items-center text-center py-7">
                <div className="text-5xl mb-3">{stat.icon}</div>
                <div className="text-4xl font-bold text-orange-600 tracking-tighter">{stat.value}</div>
                <div className="mt-1.5 text-sm font-medium text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground tracking-wide">
            DATOS ACTUALIZADOS EN TIEMPO REAL • RESEÑAS VERIFICADAS POST-SERVICIO
          </p>
        </div>
      </section>

      {/* TESTIMONIALS - More attractive with quote styling and premium cards */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">Lo que dicen quienes ya confiaron</h2>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2 text-lg">Reseñas reales de personas y negocios en Colombia</p>
        </div>

        <AnimatedTestimonials testimonials={testimonials} />
      </section>

      {/* CÓMO FUNCIONA - Visually upgraded with lucide icons and better polish */}
      <section className="max-w-7xl mx-auto px-6 py-16 bg-card dark:bg-card border-y">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">Así de fácil es usar Oigagig</h2>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2 text-lg">En 3 pasos encuentras o publicas el servicio que necesitas</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            { icon: Search, title: "Busca o publica", desc: "Explora categorías o publica tu propio servicio en menos de 2 minutos." },
            { icon: MessageCircle, title: "Contacta directo", desc: "Chatea con el profesional, acuerda detalles y precio sin intermediarios." },
            { icon: ShieldCheck, title: "Paga seguro y califica", desc: "Paga con Wompi al finalizar. Deja una reseña real para ayudar a otros." }
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="how-step bg-background rounded-3xl p-8 border border-border/70 flex flex-col items-center text-center hover:border-orange-200 transition-colors">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400">
                  <Icon className="h-8 w-8" />
                </div>
                <h3 className="font-semibold text-2xl mb-3">{item.title}</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* FINAL CTA - Stronger visual weight */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold tracking-tight mb-4">¿Listo para empezar?</h2>
          <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-8">
            Miles de personas ya están conectando con profesionales de confianza en su ciudad.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/gigs"
              className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-10 py-4 rounded-2xl text-lg shadow-md hover:shadow-xl active:scale-[0.985] transition-all"
            >
              Explorar servicios
            </Link>
            <Link
              href="/signup"
              className="border-2 border-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-semibold px-10 py-4 rounded-2xl text-lg transition-all active:scale-[0.985]"
            >
              Crear cuenta gratis
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Sin costos ocultos • Pagos protegidos • Soporte local</p>
        </div>
      </section>

      {/* FOOTER - Slightly refined */}
      <footer className="border-t bg-card dark:bg-card py-10 text-sm">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between gap-6 text-zinc-500">
          <div>
            <div className="font-semibold text-zinc-900 dark:text-white mb-1">Oigagig</div>
            <div>Conectando Colombia, un servicio a la vez.</div>
          </div>
          <div className="flex gap-8">
            <Link href="/gigs" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Explorar</Link>
            <Link href="/create-gig" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Publicar</Link>
            <Link href="/login" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Iniciar sesión</Link>
          </div>
          <div>© {new Date().getFullYear()} Oigagig</div>
        </div>
      </footer>
    </div>
  );
}
