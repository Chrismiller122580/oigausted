// src/app/(marketing)/page.tsx
import Link from 'next/link';
import Image from 'next/image';
import GigCard from '@/components/common/GigCard';
import { categories } from '@/lib/categories';   // Change to '@/lib/gig-categories' if needed

export const metadata = {
  title: 'OigaUsted - Gigs Colombia | Encuentra el servicio que necesitas',
  description: 'Conecta directamente con profesionales locales en Colombia. Limpieza, reparaciones, belleza, marketing y más. ¡Oiga Usted!',
  openGraph: {
    title: 'OigaUsted - Gigs Colombia',
    description: 'El marketplace de servicios locales más directo de Colombia.',
    images: [{ url: '/logo.png' }],
  },
};

export default function MarketingHomePage() {
  const popularCategories = categories?.slice(0, 12) || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      {/* HERO SECTION */}
      <section className="relative bg-gradient-to-br from-orange-600 via-red-600 to-rose-600 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:20px_20px]"></div>
        
        <div className="max-w-7xl mx-auto px-6 pt-24 pb-20 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-sm mb-6">
              🇨🇴 Hecho en Colombia • Conecta local
            </div>

            <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
              Encuentra el servicio que necesitas
            </h1>

            <p className="text-xl md:text-2xl text-white/90 mb-10">
              Conecta directamente con profesionales locales en Bucaramanga, Bogotá, Medellín, Cali y todo Colombia. 
              Rápido, confiable y sin intermediarios.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/gigs"
                className="bg-white text-orange-600 hover:bg-orange-50 font-semibold text-lg px-10 py-4 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95"
              >
                Explorar todos los gigs
                <span aria-hidden="true">→</span>
              </Link>

              <Link
                href="/create-gig"
                className="border-2 border-white/80 hover:bg-white/10 font-semibold text-lg px-10 py-4 rounded-2xl flex items-center justify-center transition-all"
              >
                Publicar un gig gratis
              </Link>
            </div>

            <p className="mt-8 text-sm text-white/70 flex items-center gap-2">
              ✅ Miles de servicios • ⭐ Calificaciones reales • 💰 Pagos seguros con Wompi
            </p>
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
            <p className="text-zinc-600 dark:text-zinc-400 mt-2">Encuentra lo que necesitas cerca de ti</p>
          </div>
          <Link href="/gigs" className="text-orange-600 hover:underline font-medium flex items-center gap-1">
            Ver todas <span>→</span>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {popularCategories.map((cat: any) => (
            <Link
              key={cat.slug || cat.name}
              href={`/gigs?categoria=${cat.slug || encodeURIComponent(cat.name)}`}
              className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 hover:border-orange-500 hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center"
            >
              <div className="text-5xl mb-4 transition-transform group-hover:scale-110">
                {cat.emoji || '🛠️'}
              </div>
              <h3 className="font-semibold text-lg text-zinc-900 dark:text-white group-hover:text-orange-600">
                {cat.name}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                {cat.description || 'Profesionales locales disponibles'}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* QUICK CTA */}
      <section className="bg-white dark:bg-zinc-900 border-t border-b py-8">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            ¿No encuentras lo que buscas? Publica tu necesidad y recibe propuestas en minutos.
          </p>
          <Link
            href="/create-gig"
            className="inline-block bg-orange-600 text-white font-semibold px-8 py-3.5 rounded-2xl hover:bg-orange-700 transition"
          >
            Publicar un gig ahora
          </Link>
        </div>
      </section>
    </div>
  );
}
