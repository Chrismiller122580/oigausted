import Link from "next/link";
import Image from "next/image";
import { categories, categoryEmojis } from "@/lib/categories";
import GigCard from "@/components/common/GigCard";

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let gigs: any[] = [];

  try {
const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/gigs`, {
  cache: 'no-store'
});

    if (res.ok) {
      const data = await res.json();
      gigs = data || [];
    }
  } catch (error) {
    console.error("Failed to fetch gigs for homepage", error);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section - Colombian Pride */}
      <div className="bg-gradient-to-br from-[#FFCD00] via-orange-500 to-[#003087] text-white py-24 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="flex justify-center mb-8">
            <Image 
              src="/logo.png" 
              alt="Oiga Usted" 
              width={220} 
              height={220} 
              className="drop-shadow-2xl"
              priority
            />
          </div>

          <h1 className="text-6xl md:text-7xl font-bold tracking-tighter mb-6 leading-none">
            Encuentra el servicio<br />que necesitas
          </h1>

          <p className="text-2xl md:text-3xl max-w-3xl mx-auto mb-4">
            Conecta directamente con profesionales locales
          </p>

          <p className="text-lg font-medium opacity-90 flex items-center justify-center gap-2 mb-10">
            Gigs Colombia • Hecho en Colombia • Para Colombia 
            <span className="text-2xl">🇨🇴</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/gigs" 
              className="inline-block bg-white text-[#003087] font-semibold text-2xl px-12 py-6 rounded-3xl hover:bg-gray-100 transition shadow-2xl"
            >
              Explorar todos los gigs
            </Link>
            <Link 
              href="/create-gig" 
              className="inline-block border-2 border-white text-white font-semibold text-2xl px-12 py-6 rounded-3xl hover:bg-white/10 transition"
            >
              Publicar mi servicio
            </Link>
          </div>
        </div>
      </div>

      {/* Popular Categories */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">Categorías Populares</h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {categories.map((cat) => (
            <Link 
              key={cat} 
              href={`/gigs?category=${encodeURIComponent(cat)}`}
              className="group bg-white rounded-3xl p-8 text-center border hover:border-orange-500 hover:shadow-xl transition-all duration-300 flex flex-col items-center"
            >
              <div className="text-6xl mb-6 transition-transform group-hover:scale-110">
                {categoryEmojis[cat]}
              </div>
              <p className="font-semibold text-lg leading-tight group-hover:text-orange-600">
                {cat}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* Featured Gigs */}
      <div className="bg-white py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between items-end mb-10">
            <h2 className="text-4xl font-bold text-gray-900">Gigs Destacados</h2>
            <Link href="/gigs" className="text-orange-600 hover:underline font-medium text-lg">
              Ver todos →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {gigs.slice(0, 8).map((gig: any) => (
              <GigCard key={gig.id} gig={gig} />
            ))}
          </div>
        </div>
      </div>

      {/* Colombian Trust Banner */}
      <div className="bg-orange-50 py-12">
        <div className="max-w-4xl mx-auto text-center px-6">
          <p className="text-xl text-gray-700 font-medium">
            Hecho por colombianos • Para colombianos • Con confianza local
          </p>
        </div>
      </div>
    </div>
  );
}
