"use client";

import { useEffect, useState, useMemo, Suspense, useRef, type ComponentProps } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import GigCard from "@/components/common/GigCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useGigCategories } from "@/lib/useGigCategories";
import { getCurrentLocation, calculateDistance } from "@/lib/distance";
import LocationPermissionPrompt from "@/components/maps/LocationPermissionPrompt";
import { MapPin, Wifi, X, ChevronLeft, ChevronRight, LayoutGrid } from "lucide-react";
import { CategoryIcon } from "@/lib/icon-registry";
import { recordMeaningfulPwaAction } from "@/lib/pwa-install";
import { ShareOigaGig } from "@/components/marketing/ShareOigaGig";

import type { PublicGigListItem } from '@/lib/gig-queries'
import { buildGigMapPins, groupGigsByCity } from '@/lib/gig-map';
import { ListMapToggle, type ViewMode } from '@/components/maps/ListMapToggle';

const GigMapExplorer = dynamic(() => import('@/components/maps/GigMapExplorer'), {
  ssr: false,
  loading: () => (
    <div className="h-[50dvh] md:h-[420px] rounded-2xl border border-border bg-muted animate-pulse" />
  ),
});

type GigListItem = PublicGigListItem & {
  distanceKm?: number;
};

type GigsClientProps = {
  initialGigs: PublicGigListItem[]
}

export default function GigsClient({ initialGigs }: GigsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("categoria") || "Todas";

  const { categories: loadedCategories, loading: catLoading } = useGigCategories();

  const categoryList = loadedCategories.map((c) => c.name);

  const [gigs, setGigs] = useState<GigListItem[]>(initialGigs);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState("relevance");
  const [loading, setLoading] = useState(initialGigs.length === 0);

  // Geo features (ported + improved from previous GigsContent)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showOnlyNearMe, setShowOnlyNearMe] = useState(false);
  const [showOnlyRemote, setShowOnlyRemote] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  useEffect(() => {
    recordMeaningfulPwaAction();
  }, []);

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
    if (initialGigs.length === 0) {
      fetchGigs();
    }

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
      const res = await fetch("/api/gigs");
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
    } catch (error: unknown) {
      const geoError = error as { code?: number };
      let message = "No pudimos acceder a tu ubicación.";
      if (geoError.code === 1) message = "Permiso de ubicación denegado.";
      else if (geoError.code === 2) message = "No fue posible determinar tu ubicación.";
      else if (geoError.code === 3) message = "La solicitud tardó demasiado.";

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

  // Category counts for visual tiles
  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    gigs.forEach((gig) => {
      const cat = gig.category || "Sin categoría";
      map[cat] = (map[cat] || 0) + 1;
    });
    return map;
  }, [gigs]);

  // Ref for category carousel scrolling
  const categoryCarouselRef = useRef<HTMLDivElement>(null);

  // Ref for mobile gig tiles carousel
  const gigCarouselRef = useRef<HTMLDivElement>(null);

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
        result.sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());
      }
    }

    return result;
  }, [gigsWithDistance, searchTerm, selectedCategory, sortBy, showOnlyNearMe, showOnlyRemote, userLocation]);

  const mapPins = useMemo(() => buildGigMapPins(filteredGigs), [filteredGigs]);
  const mapClusters = useMemo(() => groupGigsByCity(mapPins), [mapPins]);
  const mapCenter = useMemo(() => {
    if (userLocation && showOnlyNearMe) {
      return { lat: userLocation.lat, lng: userLocation.lng, zoom: 11 };
    }
    return undefined;
  }, [userLocation, showOnlyNearMe]);

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
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-5xl font-bold tracking-tight">Encuentra Servicios Locales</h1>
        <div className="flex flex-col gap-3 mt-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xl text-muted-foreground">
            {filteredGigs.length} servicios disponibles
            {selectedCategory !== "Todas" && ` en ${selectedCategory}`}
          </p>
          <ShareOigaGig variant="inline" className="md:hidden" />
        </div>
      </div>

      {/* Filters - Cleaned up */}
      <div className="mb-8 space-y-5">
        {/* Search + Sort */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Buscar servicios o vendedores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-12 text-base"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border rounded-2xl px-5 h-12 text-base w-full sm:w-56 bg-background"
          >
            <option value="relevance">Relevancia</option>
            <option value="rating">Mejor valorados</option>
            <option value="price-low">Precio: menor a mayor</option>
            <option value="price-high">Precio: mayor a menor</option>
            <option value="newest">Más recientes</option>
          </select>
        </div>

        {/* Geo filters - cleaned, fewer emojis, consistent icons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={handleUseMyLocation}
            disabled={locationLoading}
            variant={showOnlyNearMe ? "default" : "outline"}
            size="sm"
            className="gap-1.5"
          >
            <MapPin className="h-5 w-5 shrink-0" />
            {locationLoading ? "Ubicando..." : "Cerca de mí"}
          </Button>

          {userLocation && (
            <Button
              onClick={() => setShowOnlyNearMe(!showOnlyNearMe)}
              variant={showOnlyNearMe ? "default" : "outline"}
              size="sm"
            >
              {showOnlyNearMe ? "Ver todos" : "Solo cerca"}
            </Button>
          )}

          <Button
            onClick={() => setShowOnlyRemote(!showOnlyRemote)}
            variant={showOnlyRemote ? "default" : "outline"}
            size="sm"
            className="gap-1.5"
          >
            <Wifi className="h-5 w-5 shrink-0" />
            {showOnlyRemote ? "Todos" : "Solo remotos"}
          </Button>

          <ListMapToggle
            storageKey="gigs-view"
            value={viewMode}
            onChange={setViewMode}
            className="ml-auto sm:ml-0"
          />

          {/* Clear all filters chip - prominent */}
          {(searchTerm || selectedCategory !== "Todas" || sortBy !== "relevance" || showOnlyNearMe || showOnlyRemote) && (
            <Button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("Todas");
                setSortBy("relevance");
                setShowOnlyNearMe(false);
                setShowOnlyRemote(false);
              }}
              variant="outline"
              size="sm"
              className="text-orange-600 border-orange-200 hover:bg-orange-50 gap-1 ml-auto sm:ml-0"
            >
              <X className="h-4 w-4 shrink-0" /> Limpiar filtros
            </Button>
          )}
        </div>

        {/* Category Tiles Carousel - Clean horizontal carousel for mobile + desktop */}
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="text-sm font-semibold text-foreground">Explora por categoría</div>
            {selectedCategory !== "Todas" && (
              <button 
                onClick={() => setSelectedCategory("Todas")}
                className="text-xs text-orange-600 hover:underline"
              >
                Ver todas
              </button>
            )}
          </div>

          {/* Carousel container with snap scrolling - perfect for mobile tiles */}
          <div className="relative">
            {/* Optional scroll arrows (desktop friendly) */}
            <button
              onClick={() => categoryCarouselRef.current?.scrollBy({ left: -260, behavior: "smooth" })}
              className="hidden md:flex absolute -left-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 items-center justify-center rounded-full bg-background/90 border shadow-sm hover:bg-muted"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div
              ref={categoryCarouselRef}
              className="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-3 -mx-1 px-1 md:mx-0 md:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {/* Todas tile */}
              <button
                onClick={() => setSelectedCategory("Todas")}
                className={`snap-start flex-shrink-0 w-[92px] md:w-[108px] flex flex-col items-center justify-center p-3 rounded-2xl border transition-all active:scale-[0.985] ${
                  selectedCategory === "Todas"
                    ? "border-orange-600 bg-orange-600 text-white shadow-sm"
                    : "border-border bg-card hover:border-orange-300 hover:bg-muted"
                }`}
              >
                <div
                  className={`mb-1.5 flex h-12 w-12 items-center justify-center rounded-xl ring-1 ${
                    selectedCategory === "Todas"
                      ? "bg-white/95 ring-white/40 shadow-md"
                      : "bg-white shadow-sm ring-black/5 dark:bg-white/95 dark:ring-white/20 dark:shadow-md"
                  }`}
                >
                  <LayoutGrid
                    className={`h-8 w-8 ${
                      selectedCategory === "Todas" ? "text-orange-600" : "text-orange-500 dark:text-orange-400"
                    }`}
                  />
                </div>
                <div className="text-xs font-medium text-center leading-tight">Todas</div>
                <div className={`text-[11px] mt-0.5 ${selectedCategory === "Todas" ? "text-orange-200" : "text-muted-foreground"}`}>
                  {gigs.length}
                </div>
              </button>

              {(catLoading ? [] : categoryList).map((cat) => {
                const count = categoryCounts[cat] || 0;
                const isActive = selectedCategory === cat;

                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`snap-start flex-shrink-0 w-[92px] md:w-[108px] flex flex-col items-center justify-center p-3 rounded-2xl border transition-all active:scale-[0.985] ${
                      isActive
                        ? "border-orange-600 bg-orange-600 text-white shadow-sm"
                        : "border-border bg-card hover:border-orange-300 hover:bg-muted"
                    }`}
                    title={cat}
                  >
                    <div className="mb-1.5">
                      <CategoryIcon name={cat} variant="tile" active={isActive} />
                    </div>
                    <div className="text-[11px] font-medium text-center leading-tight line-clamp-2">
                      {cat}
                    </div>
                    <div className={`text-[11px] mt-0.5 ${isActive ? "text-orange-200" : "text-muted-foreground"}`}>
                      {count}
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => categoryCarouselRef.current?.scrollBy({ left: 260, behavior: "smooth" })}
              className="hidden md:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 items-center justify-center rounded-full bg-background/90 border shadow-sm hover:bg-muted"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <p className="text-[10px] text-muted-foreground mt-1 px-1 md:hidden">
            Desliza horizontalmente para ver más categorías
          </p>
        </div>

        {/* Location permission prompt */}
        {showPermissionPrompt && (
          <div className="mt-1">
            <LocationPermissionPrompt
              onAllow={handleUseMyLocation}
              onDismiss={dismissPermissionPrompt}
              isLoading={locationLoading}
              error={locationError || undefined}
            />
          </div>
        )}
      </div>

      {/* Map view */}
      {viewMode === 'map' && filteredGigs.length > 0 ? (
        <div className="mb-8 space-y-3">
          <GigMapExplorer
            pins={mapPins}
            clusters={mapClusters}
            userLocation={userLocation}
            initialCenter={mapCenter}
            height="min(50dvh, 420px)"
            onPinClick={(pin) => router.push(`/gigs/${pin.id}`)}
          />
          <p className="text-center text-xs text-muted-foreground">
            {mapPins.length} en el mapa ·{' '}
            <Link href="/mapa" className="text-orange-700 hover:underline">
              Ver mapa completo de Colombia
            </Link>
          </p>
        </div>
      ) : null}

      {/* Gigs Results - Enhanced for mobile with carousel for tiles */}
      {filteredGigs.length > 0 && viewMode === 'list' ? (
        <>
          {/* Mobile-only horizontal carousel for gig tiles (swipeable discovery) */}
          <div className="md:hidden mb-8">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-sm font-semibold">Desliza para explorar</span>
              <span className="text-xs text-muted-foreground">{filteredGigs.length} resultados</span>
            </div>

            <div className="relative">
              {/* Scroll arrows for the gig carousel */}
              <button
                onClick={() => gigCarouselRef.current?.scrollBy({ left: -280, behavior: "smooth" })}
                className="hidden sm:flex absolute -left-1 top-1/2 -translate-y-1/2 z-10 h-7 w-7 items-center justify-center rounded-full bg-background/95 border shadow hover:bg-muted"
                aria-label="Anterior"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>

              <div
                ref={gigCarouselRef}
                className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 -mx-6 px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {filteredGigs.slice(0, 12).map((gig) => (
                  <div key={gig.id} className="snap-start w-[85%] max-w-[310px] flex-shrink-0">
                    <GigCard 
                      gig={gig as ComponentProps<typeof GigCard>['gig']} 
                      distanceKm={gig.distanceKm} 
                      compact={true} 
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={() => gigCarouselRef.current?.scrollBy({ left: 280, behavior: "smooth" })}
                className="hidden sm:flex absolute -right-1 top-1/2 -translate-y-1/2 z-10 h-7 w-7 items-center justify-center rounded-full bg-background/95 border shadow hover:bg-muted"
                aria-label="Siguiente"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="text-[10px] text-center text-muted-foreground -mt-1">Desliza horizontalmente para ver más servicios</p>
          </div>

          {/* Main grid - shown on tablet/desktop. On mobile the carousel above is the primary tile browsing experience */}
          <div className="hidden md:block grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {filteredGigs.map((gig) => (
              <GigCard 
                key={gig.id} 
                gig={gig as ComponentProps<typeof GigCard>['gig']} 
                distanceKm={gig.distanceKm} 
              />
            ))}
          </div>

          {/* On mobile, show a note + link to encourage using filters if needed */}
          <div className="md:hidden mt-2 text-center">
            <p className="text-xs text-muted-foreground">
              Desliza en el carrusel de arriba. Usa los filtros para refinar.
            </p>
          </div>
        </>
      ) : null}

      {filteredGigs.length === 0 ? (
        <div className="text-center py-16 border rounded-3xl bg-card">
          <p className="text-2xl text-gray-400 mb-2">No se encontraron servicios</p>
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
      ) : null}
    </div>
  );
}


