"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import GigCard from "@/components/common/GigCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { categories, categoryEmojis } from "@/lib/categories";
import { getCurrentLocation, calculateDistance } from "@/lib/distance";
import LocationPermissionPrompt from "@/components/maps/LocationPermissionPrompt";

// Inner client component - this is where useSearchParams is safe
function GigsClient() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("categoria") || "Todas";

  const [gigs, setGigs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState("relevance");
  const [loading, setLoading] = useState(true);

  // Geo features (ported + improved from previous GigsContent)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showOnlyNearMe, setShowOnlyNearMe] = useState(false);
  const [showOnlyRemote, setShowOnlyRemote] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);

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

    // Restore previous location from localStorage
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
      try {
        const parsed = JSON.parse(savedLocation);
        if (parsed.lat && parsed.lng) {
          setUserLocation(parsed);
        }
      } catch {}
    }
  }, []);

  const fetchGigs = async () => {
    try {
      const res = await fetch("/api/gigs", { cache: "no-store" });
      const data = await res.json();
      const gigList = Array.isArray(data) ? data : data.gigs || [];
      setGigs(gigList);
    } catch (error) {
      console.error("Error fetching gigs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUseMyLocation = async () => {
    setLocationLoading(true);
    setLocationError(null);
    setShowPermissionPrompt(false);

    try {
      const location = await getCurrentLocation();
      setUserLocation(location);
      setShowOnlyNearMe(true);
      localStorage.setItem('userLocation', JSON.stringify(location));
    } catch (error: any) {
      let message = "No pudimos acceder a tu ubicación.";
      if (error.code === 1) message = "Permiso de ubicación denegado.";
      else if (error.code === 2) message = "No fue posible determinar tu ubicación.";
      else if (error.code === 3) message = "La solicitud tardó demasiado.";

      setLocationError(message);
      setShowPermissionPrompt(true);
    } finally {
      setLocationLoading(false);
    }
  };

  const dismissPermissionPrompt = () => {
    setShowPermissionPrompt(false);
    setLocationError(null);
  };

  // Memoized derived data to avoid re-render loops from unstable deps (was causing category filters etc to not work stably)
  const gigsWithDistance = useMemo(() => {
    return gigs.map(gig => {
      if (userLocation && gig.latitude && gig.longitude) {
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          gig.latitude,
          gig.longitude
        );
        return { ...gig, distanceKm: distance };
      }
      return gig;
    });
  }, [gigs, userLocation]);

  const filteredGigs = useMemo(() => {
    let result = [...gigsWithDistance];

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

    // Geo filters
    if (showOnlyNearMe && userLocation) {
      result = result.filter(gig => gig.distanceKm !== undefined);
      result.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
    }

    if (showOnlyRemote) {
      result = result.filter(gig => gig.isRemote === true);
    }

    // Sorting (only apply if not using near-me sort)
    if (!showOnlyNearMe) {
      if (sortBy === "rating") {
        result.sort((a, b) => (b.seller?.rating || 0) - (a.seller?.rating || 0));
      } else if (sortBy === "price-low") {
        result.sort((a, b) => (a.price || 0) - (b.price || 0));
      } else if (sortBy === "price-high") {
        result.sort((a, b) => (b.price || 0) - (a.price || 0));
      } else if (sortBy === "newest") {
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
    }

    return result;
  }, [gigsWithDistance, searchTerm, selectedCategory, sortBy, showOnlyNearMe, showOnlyRemote, userLocation]);

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
          {(searchTerm || selectedCategory !== "Todas" || sortBy !== "relevance" || showOnlyNearMe || showOnlyRemote) && (
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("Todas");
                setSortBy("relevance");
                setShowOnlyNearMe(false);
                setShowOnlyRemote(false);
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

        {/* Geo filters */}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={handleUseMyLocation}
            disabled={locationLoading}
            variant={showOnlyNearMe ? "default" : "outline"}
            size="sm"
          >
            {locationLoading ? "Obteniendo..." : "📍 Cerca de mí"}
          </Button>

          {userLocation && (
            <Button
              onClick={() => setShowOnlyNearMe(!showOnlyNearMe)}
              variant={showOnlyNearMe ? "default" : "outline"}
              size="sm"
            >
              {showOnlyNearMe ? "Mostrar todos" : "Solo cerca"}
            </Button>
          )}

          <Button
            onClick={() => setShowOnlyRemote(!showOnlyRemote)}
            variant={showOnlyRemote ? "default" : "outline"}
            size="sm"
          >
            {showOnlyRemote ? "Todos" : "Solo remotos"}
          </Button>

          {/* Category pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 flex-1 min-w-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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

        {/* Location permission prompt */}
        {showPermissionPrompt && (
          <div className="mt-2">
            <LocationPermissionPrompt
              onAllow={handleUseMyLocation}
              onDismiss={dismissPermissionPrompt}
              isLoading={locationLoading}
              error={locationError || undefined}
            />
          </div>
        )}
      </div>

      {/* Gigs Grid */}
      {filteredGigs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredGigs.map((gig) => (
            <GigCard 
              key={gig.id} 
              gig={gig} 
              distanceKm={gig.distanceKm} 
            />
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
              setShowOnlyNearMe(false);
              setShowOnlyRemote(false);
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

// Public page export with proper Suspense boundary for useSearchParams
// This prevents production page load / hydration errors on the category filters
export default function GigsPage() {
  return (
    <Suspense fallback={
      <div className="container py-20 text-center">
        <p className="text-xl text-gray-500">Cargando servicios...</p>
      </div>
    }>
      <GigsClient />
    </Suspense>
  );
}
