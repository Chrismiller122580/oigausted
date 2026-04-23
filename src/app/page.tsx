import Link from "next/link";
import Image from "next/image";
import { categories, categoryEmojis } from "@/lib/categories";

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let gigs: any[] = [];

  try {
    // Use relative URL on server — Next.js will handle the correct host
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/gigs`, {
      cache: 'no-store',
      headers: {
        // Optional: helps with Vercel caching
        'x-vercel-deployment-url': process.env.VERCEL_URL || '',
      },
    });

    if (res.ok) {
      const data = await res.json();
      gigs = data.gigs || data || [];
    }
  } catch (error) {
    console.error("Failed to fetch gigs for homepage", error);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 text-white py-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="flex justify-center mb-8">
            <Image 
              src="/logo.png" 
              alt="Oiga Usted" 
              width={180} 
              height={180} 
              className="drop-shadow-2xl"
              priority
            />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6">
            Encuentra el servicio<br />que necesitas
          </h1>
          <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto">
            Conecta directamente con profesionales locales en Colombia
          </p>
          <div className="mt-10">
            <Link 
              href="/gigs" 
              className="inline-block bg-white text-orange-600 font-semibold text-xl px-10 py-5 rounded-3xl hover:bg-gray-100 transition shadow-lg"
            >
              Explorar todos los gigs
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

      {/* All Gigs Section */}
      <div className="bg-white py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between items-end mb-10">
            <h2 className="text-4xl font-bold text-gray-900">Todos los Gigs Disponibles</h2>
            <Link href="/gigs" className="text-orange-600 hover:underline font-medium">
              Ver todos →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {gigs.length > 0 ? (
              gigs.map((gig: any) => (
                <Link 
                  key={gig.id} 
                  href={`/gigs/${gig.id}`}
                  className="group bg-white border rounded-3xl overflow-hidden hover:shadow-2xl transition-all"
                >
                  {gig.imageUrl && (
                    <div className="relative h-56">
                      <Image 
                        src={gig.imageUrl} 
                        alt={gig.title} 
                        fill 
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="font-semibold text-xl line-clamp-2 mb-3 group-hover:text-orange-600">
                      {gig.title}
                    </div>
                    <p className="text-3xl font-bold text-orange-600 mb-4">
                      ${gig.price.toLocaleString("es-CO")}
                    </p>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                      {gig.description}
                    </p>
                    <div className="text-xs text-gray-500">
                      Por {gig.seller?.businessName || gig.seller?.name}
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <p className="col-span-full text-center text-gray-500 py-20">No hay gigs disponibles aún.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}