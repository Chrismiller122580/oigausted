'use client';

import { useState, useEffect } from 'react';
import GigCard from '@/components/common/GigCard';
import Link from 'next/link';

export default function HomePage() {
  const [gigs, setGigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGigs();
  }, []);

  const fetchGigs = async () => {
    try {
      const res = await fetch('/api/gigs', { 
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      const data = await res.json();
      setGigs(Array.isArray(data.gigs) ? data.gigs : []);
    } catch (error) {
      console.error("Failed to load featured gigs:", error);
      setGigs([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-600 to-amber-600 text-white py-20">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold mb-4">Oiga Usted</h1>
          <p className="text-2xl mb-8">Servicios locales confiables en Colombia</p>
          <div className="flex gap-4 justify-center">
            <Link href="/gigs" className="bg-white text-orange-600 px-8 py-4 rounded-full font-semibold text-lg hover:bg-orange-50">
              Explorar Gigs
            </Link>
            <Link href="/create-gig" className="border-2 border-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white/10">
              Publicar Servicio
            </Link>
          </div>
        </div>
      </div>

      {/* Featured Gigs */}
      <div className="container mx-auto py-16 px-6">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">Servicios Destacados</h2>
          <Link href="/gigs" className="text-orange-600 hover:underline font-medium">Ver todos →</Link>
        </div>

        {loading ? (
          <div className="text-center py-12">Cargando servicios destacados...</div>
        ) : gigs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {gigs.slice(0, 8).map((gig: any) => (
              <GigCard key={gig.id || Math.random()} gig={gig} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            No hay gigs disponibles aún.<br />
            ¡Sé el primero en publicar un servicio!
          </div>
        )}
      </div>
    </div>
  );
}
