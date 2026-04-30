"use client";

import { useEffect, useState } from "react";
import GigCard from "@/components/common/GigCard";
import { Input } from "@/components/ui/input";
import { categories, categoryEmojis } from "@/lib/categories";

export default function GigsPage() {
  const [gigs, setGigs] = useState<any[]>([]);
  const [filteredGigs, setFilteredGigs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGigs();
  }, []);

  const fetchGigs = async () => {
    try {
      const res = await fetch("/api/gigs", { cache: "no-store" });
      const data = await res.json();
      const gigList = Array.isArray(data) ? data : data.gigs || [];
      setGigs(gigList);
      setFilteredGigs(gigList);
    } catch (error) {
      console.error("Error fetching gigs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = [...gigs];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(gig =>
        gig.title?.toLowerCase().includes(term) ||
        gig.description?.toLowerCase().includes(term) ||
        gig.seller?.businessName?.toLowerCase().includes(term)
      );
    }

    if (selectedCategory !== "Todas") {
      result = result.filter(gig => gig.category === selectedCategory);
    }

    setFilteredGigs(result);
  }, [gigs, searchTerm, selectedCategory]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando servicios...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-12">
        <h1 className="text-5xl font-bold tracking-tight">Encuentra Servicios Locales</h1>
        <p className="text-xl text-gray-600 mt-3">{filteredGigs.length} gigs disponibles en Colombia</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-10">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Buscar gigs, categorías o vendedores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="py-6 text-base"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="border rounded-2xl px-6 py-6 text-base"
        >
          <option value="Todas">Todas las categorías</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {categoryEmojis[cat] || ''} {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Gigs Grid */}
      {filteredGigs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredGigs.map((gig) => (
            <GigCard key={gig.id} gig={gig} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-2xl text-gray-400">No se encontraron gigs</p>
          <p className="text-gray-500 mt-2">Intenta cambiar los filtros</p>
        </div>
      )}
    </div>
  );
}
