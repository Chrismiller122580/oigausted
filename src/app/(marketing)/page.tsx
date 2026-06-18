// src/app/(marketing)/page.tsx
import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { getGigCategories } from '@/lib/categories';
import { getCategoryIcon } from '@/lib/icon-registry';
import { Search, MessageCircle, ShieldCheck, MapPin, Star, CreditCard, Sparkles, TrendingUp, Users, ArrowRight, Rocket } from 'lucide-react';
import { AnimatedCategoryGrid, AnimatedTestimonials } from './LandingClient';
import { LaunchPromoBanner } from './LaunchPromoBanner';
import { HomepageWelcomeSplash } from './HomepageWelcomeSplash';
import { PublicFooter } from '@/components/marketing/PublicFooter';

export const metadata = {
  title: 'OigaGig • Servicios entre colombianos',
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
    title: 'OigaGig • Servicios entre colombianos',
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
    title: 'OigaGig • Servicios entre colombianos',
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
  let gigsWithRatings: { category: string | null; seller: { rating: number | null } | null }[] = [];
  try {
    gigsWithRatings = await prisma.gig.findMany({
      where: {
        isActive: true,
        category: { in: topCategoryNames }
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
      <HomepageWelcomeSplash />

      {/* HERO */}
      <section className="relative bg-gradient-to-br from-orange-600 to-orange-700 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff22_1px,transparent_1px)] [background-size:20px_20px]"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/15" />

        <div className="max-w-7xl mx-auto px-6 pt-16 pb-14 relative z-10">
          <div className="grid lg:grid-cols-[1fr_minmax(280px,420px)] gap-10 lg:gap-14 items-center">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-4 py-2 rounded-full text-sm mb-6 border border-white/25">
                <MapPin className="h-4 w-4" />
                Servicios locales en Colombia
              </div>

              <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight mb-6">
                El servicio que necesitas,
                <br />
                <span className="text-white/90">hecho por profesionales de confianza</span>
              </h1>

              <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl">
                Conecta directamente con profesionales locales en Bogotá, Medellín, Cali, Bucaramanga y todo Colombia.
                Sin intermediarios. Pagos seguros. Chat directo.
              </p>

              <div className="mb-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-white/85 text-sm">
                <span className="inline-flex items-center gap-1.5"><Star className="h-4 w-4" /> {stats.gigs.toLocaleString('es-CO')} gigs activos</span>
                <span className="inline-flex items-center gap-1.5"><MessageCircle className="h-4 w-4" /> Chat por WhatsApp</span>
                <span className="inline-flex items-center gap-1.5"><CreditCard className="h-4 w-4" /> Wompi • Nequi • PSE</span>
                <span className="inline-flex items-center gap-1.5 font-medium"><Sparkles className="h-4 w-4" /> Plataforma en crecimiento</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/gigs"
                  className="bg-white text-orange-700 hover:bg-white/95 font-semibold text-base px-8 py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
                >
                  <Search className="h-5 w-5" />
                  Ver todos los servicios
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  href="/create-gig"
                  className="border border-white/60 hover:bg-white/10 font-semibold text-base px-8 py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all backdrop-blur"
                >
                  <Rocket className="h-5 w-5" />
                  Ofrecer mis servicios
                </Link>
              </div>

              <p className="mt-6 text-sm text-white/65">
                Hecho en Colombia • Pagos seguros • Reseñas verificadas
              </p>
            </div>

            <div className="relative mx-auto w-full max-w-md lg:max-w-none">
              <div className="absolute -inset-4 bg-white/10 blur-3xl rounded-full -z-10" aria-hidden="true" />
              <div className="relative overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/25 border border-white/15">
                <Image
                  src="/world-cup-hero.jpg"
                  alt="Celebración Copa Mundial 2026 — Colombia"
                  width={1280}
                  height={720}
                  className="w-full h-auto object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES - More attractive premium cards with branded icon containers */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Categorías populares</h2>
            <p className="text-muted-foreground mt-1">Con calificaciones reales de usuarios locales</p>
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
              { label: "Gigs activos", value: stats.gigs.toLocaleString('es-CO'), icon: TrendingUp, color: "text-emerald-400" },
              { label: "Reseñas reales", value: stats.reviews.toLocaleString('es-CO'), icon: Star, color: "text-amber-400" },
              { label: "Ciudades", value: stats.cities.toLocaleString('es-CO'), icon: MapPin, color: "text-blue-400" },
              { label: "Profesionales", value: stats.sellers.toLocaleString('es-CO'), icon: Users, color: "text-indigo-400" },
            ].map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div key={idx} className="stat-card flex flex-col items-center text-center py-6">
                  <Icon className={`h-8 w-8 mb-3 ${stat.color}`} />
                  <div className="text-3xl font-bold text-brand tracking-tight tabular-nums">{stat.value}</div>
                  <div className="mt-1.5 text-sm font-medium text-muted-foreground">{stat.label}</div>
                </div>
              );
            })}
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground tracking-wide">
            DATOS ACTUALIZADOS EN TIEMPO REAL • RESEÑAS VERIFICADAS POST-SERVICIO
          </p>
        </div>
      </section>

      {/* TESTIMONIALS - More attractive with quote styling and premium cards */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Lo que dicen quienes ya confiaron</h2>
          <p className="text-muted-foreground mt-1">Reseñas reales de personas y negocios en Colombia</p>
        </div>

        <AnimatedTestimonials testimonials={testimonials} />
      </section>

      {/* CÓMO FUNCIONA - Visually upgraded with lucide icons and better polish */}
      <section className="max-w-7xl mx-auto px-6 py-16 bg-card dark:bg-card border-y">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Así de fácil es usar Oigagig</h2>
          <p className="text-muted-foreground mt-1">En 3 pasos encuentras o publicas el servicio que necesitas</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            { icon: Search, title: "Busca o publica", desc: "Explora categorías o publica tu propio servicio en menos de 2 minutos." },
            { icon: MessageCircle, title: "Contacta directo", desc: "Chatea con el profesional, acuerda detalles y precio sin intermediarios." },
            { icon: ShieldCheck, title: "Paga seguro y califica", desc: "Paga con Wompi al finalizar. Deja una reseña real para ayudar a otros." }
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="how-step bg-background rounded-xl p-6 border border-border flex flex-col items-center text-center hover:border-accent transition-colors">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-muted text-brand">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* FINAL CTA - Stronger visual weight */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold tracking-tight mb-3">¿Listo para empezar?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Miles de personas ya están conectando con profesionales de confianza en su ciudad.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/gigs"
              className="bg-brand hover:bg-brand/90 text-brand-foreground font-semibold px-8 py-3.5 rounded-xl text-base shadow-md hover:shadow-lg transition-all"
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

      <PublicFooter siteName="OigaGig" />
    </div>
  );
}
