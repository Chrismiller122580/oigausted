"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import GigCard from "@/components/common/GigCard";
import { Input } from "@/components/ui/input";
import { categories, categoryEmojis } from "@/lib/categories";

export default function GigsPage() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("categoria") || "Todas";

  const [gigs, setGigs] = useState<any[]>([]);
  const [filteredGigs, setFilteredGigs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState("relevance");
  const [loading, setLoading] = useState(true);

  // Update URL when category changes (for shareability)
  useEffect(() => {
    if (selectedCategory !== "Todas") {
      const url = new URL(window.location.href);
      url.searchParams.set("categoria", selectedCategory);
      window.history.replaceState({}, "", url.toString());
    } else {
      const url = new URL(window.location.href);
      url.searchParams.delete("categoria");
      window.history.replaceState({}, "", url.toString());
    }
  }, [selectedCategory]);

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

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(gig =>
        gig.title?.toLowerCase().includes(term) ||
        gig.description?.toLowerCase().includes(term) ||
        gig.seller?.businessName?.toLowerCase().includes(term)
      );
    }

    // Category filter
    if (selectedCategory !== "Todas") {
      result = result.filter(gig => gig.category === selectedCategory);
    }

    // Sorting
    if (sortBy === "rating") {
      result.sort((a, b) => (b.seller?.rating || 0) - (a.seller?.rating || 0));
    } else if (sortBy === "price-low") {
      result.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === "price-high") {
      result.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortBy === "newest") {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    // "relevance" = original order from API (newest first usually)

    setFilteredGigs(result);
  }, [gigs, searchTerm, selectedCategory, sortBy]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Cargando servicios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-5xl font-bold tracking-tight">Encuentra Servicios Locales</h1>
        <div className="flex items-center gap-3 mt-3">
          <p className="text-xl text-muted-foreground">
            {filteredGigs.length} gigs disponibles
            {selectedCategory !== "Todas" && ` en ${selectedCategory}`}
          </p>
          {(searchTerm || selectedCategory !== "Todas" || sortBy !== "relevance") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("Todas");
                setSortBy("relevance");
              }}
              className="text-sm text-orange-600 hover:underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Buscar gigs o vendedores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-12 text-base"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border rounded-2xl px-5 h-12 text-base w-full md:w-60"
          >
            <option value="relevance">Relevancia</option>
            <option value="rating">Mejor valorados</option>
            <option value="price-low">Precio: menor a mayor</option>
            <option value="price-high">Precio: mayor a menor</option>
            <option value="newest">Más recientes</option>
          </select>
        </div>

        {/* Category pills - high-impact discovery UX */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            onClick={() => setSelectedCategory("Todas")}
            className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap border transition ${
              selectedCategory === "Todas"
                ? "bg-orange-600 text-white border-orange-600"
                : "bg-background hover:bg-muted border-border text-foreground"
            }`}
          >
            Todas
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap border transition flex items-center gap-1.5 ${
                selectedCategory === cat
                  ? "bg-orange-600 text-white border-orange-600"
                  : "bg-background hover:bg-muted border-border text-foreground"
              }`}
            >
              <span>{categoryEmojis[cat] || ''}</span>
              <span>{cat}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Gigs Grid */}
      {filteredGigs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredGigs.map((gig) => (
            <GigCard key={gig.id} gig={gig} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border rounded-3xl bg-card">
          <p className="text-2xl text-gray-400 mb-2">No se encontraron gigs</p>
          <p className="text-muted-foreground mb-6">Prueba con otra búsqueda o categoría</p>
          <button
            onClick={() => {
              setSearchTerm("");
              setSelectedCategory("Todas");
              setSortBy("relevance");
            }}
            className="text-orange-600 hover:underline font-medium"
          >
            Ver todos los servicios
          </button>
        </div>
      )}
    </div>
  );
}
