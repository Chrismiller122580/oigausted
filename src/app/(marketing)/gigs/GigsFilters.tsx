'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { categories, categoryEmojis } from '@/lib/categories';

export default function GigsFilters({ 
  initialCategoria = '', 
  initialCiudad = '' 
}: { 
  initialCategoria?: string; 
  initialCiudad?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [categoria, setCategoria] = useState(initialCategoria);
  const [ciudad, setCiudad] = useState(initialCiudad);

  const updateFilters = () => {
    const params = new URLSearchParams();
    if (categoria) params.set('categoria', categoria);
    if (ciudad) params.set('ciudad', ciudad);
    
    router.push(`/gigs?${params.toString()}`);
  };

  // Update local state when URL changes
  useEffect(() => {
    setCategoria(searchParams.get('categoria') || '');
    setCiudad(searchParams.get('ciudad') || '');
  }, [searchParams]);

  return (
    <div className="flex flex-wrap gap-4 mb-10">
      <div className="flex-1 min-w-[200px]">
        <select
          value={categoria}
          onChange={(e) => {
            setCategoria(e.target.value);
            // Auto update on change
            const params = new URLSearchParams();
            if (e.target.value) params.set('categoria', e.target.value);
            if (ciudad) params.set('ciudad', ciudad);
            router.push(`/gigs?${params.toString()}`);
          }}
          className="w-full px-4 py-3 border rounded-2xl focus:border-orange-500 bg-white dark:bg-zinc-900"
        >
          <option value="">Todas las categorías</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {categoryEmojis[cat] || ''} {cat}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 min-w-[200px]">
        <input
          type="text"
          placeholder="Ciudad (Bucaramanga, Bogotá, Medellín...)"
          value={ciudad}
          onChange={(e) => setCiudad(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const params = new URLSearchParams();
              if (categoria) params.set('categoria', categoria);
              if (e.currentTarget.value) params.set('ciudad', e.currentTarget.value);
              router.push(`/gigs?${params.toString()}`);
            }
          }}
          className="w-full px-4 py-3 border rounded-2xl focus:border-orange-500 bg-white dark:bg-zinc-900"
        />
      </div>
    </div>
  );
}
