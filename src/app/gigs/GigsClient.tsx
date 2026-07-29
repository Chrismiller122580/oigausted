"use client";

import { useEffect, useState, useMemo, useRef, useCallback, type ComponentProps } from "react";
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
import { colombianCities } from "@/lib/design-tokens";
import {
  cityMatchesFilter,
  compareByRelevance,
  gigMatchesSearch,
  isNearMeLocation,
} from "@/lib/search-text";

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

function readNearMeFromParams(ciudad: string | null, cerca: string | null): boolean {
  if (cerca === '1' || cerca === 'true') return true
  return isNearMeLocation(ciudad)
}

export default function GigsClient({ initialGigs }: GigsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialCategory = searchParams.get("categoria") || "Todas";
  const initialQ = searchParams.get("q") || "";
  const initialCiudad = searchParams.get("ciudad") || "";
  const initialCerca = searchParams.get("cerca");
  const wantNearMeOnLoad = readNearMeFromParams(
    initialCiudad || null,
    initialCerca,
  );

  const { categories: loadedCategories, loading: catLoading } = useGigCategories();

  const categoryList = loadedCategories.map((c) => c.name);

  const [gigs, setGigs] = useState<GigListItem[]>(initialGigs);
  const [searchTerm, setSearchTerm] = useState(initialQ);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedCity, setSelectedCity] = useState(
    wantNearMeOnLoad ? "" : initialCiudad,
  );
  const [sortBy, setSortBy] = useState("relevance");
  const [loading, setLoading] = useState(initialGigs.length === 0);

  // Geo features
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showOnlyNearMe, setShowOnlyNearMe] = useState(wantNearMeOnLoad);
  const [showOnlyRemote, setShowOnlyRemote] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  useEffect(() => {
    recordMeaningfulPwaAction();
  }, []);

  // Keep local filter state in sync when URL changes (back/forward, external links)
  useEffect(() => {
    const q = searchParams.get("q") || "";
    const categoria = searchParams.get("categoria") || "Todas";
    const ciudad = searchParams.get("ciudad") || "";
    const cerca = searchParams.get("cerca");
    const nearMe = readNearMeFromParams(ciudad || null, cerca);

    setSearchTerm(q);
    setSelectedCategory(categoria);
    if (nearMe) {
      setSelectedCity("");
      setShowOnlyNearMe(true);
    } else {
      setSelectedCity(ciudad);
    }
  }, [searchParams]);

  // Sync filters → URL for shareability
  useEffect(() => {
    const url = new URL(window.location.href);
    if (searchTerm.trim()) url.searchParams.set("q", searchTerm.trim());
    else url.searchParams.delete("q");

    if (selectedCategory !== "Todas") url.searchParams.set("categoria", selectedCategory);
    else url.searchParams.delete("categoria");

    if (showOnlyNearMe) {
      url.searchParams.set("cerca", "1");
      url.searchParams.delete("ciudad");
    } else {
      url.searchParams.delete("cerca");
      if (selectedCity.trim()) url.searchParams.set("ciudad", selectedCity.trim());
      else url.searchParams.delete("ciudad");
    }

    const next = url.pathname + (url.searchParams.toString() ? `?${url.searchParams.toString()}` : "");
    const current = window.location.pathname + window.location.search;
    if (next !== current) {
      window.history.replaceState({}, "", next);
    }
  }, [searchTerm, selectedCategory, selectedCity, showOnlyNearMe]);

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

  // If user arrived with cerca=1 but no coords yet, prompt for location once
  useEffect(() => {
    if (!showOnlyNearMe || userLocation || locationLoading) return;
    const saved = localStorage.getItem('userLocation');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.lat && parsed.lng) {
          setUserLocation(parsed);
          return;
        }
      } catch {}
    }
    setShowPermissionPrompt(true);
  }, [showOnlyNearMe, userLocation, locationLoading]);

  const fetchGigs = async () => {
    try {
      const res = await fetch("/api/gigs?limit=100");
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
      setSelectedCity("");
      localStorage.setItem('userLocation', JSON.stringify(location));
    } catch (error: unknown) {
      const geoError = error as { code?: number };
      let message = "No pudimos acceder a tu ubicación.";
      if (geoError.code === 1) message = "Permiso de ubicación denegado.";
      else if (geoError.code === 2) message = "No fue posible determinar tu ubicación.";
      else if (geoError.code === 3) message = "La solicitud tardó demasiado.";

      setLocationError(message);
      setShowPermissionPrompt(true);
      setShowOnlyNearMe(false);
    } finally {
      setLocationLoading(false);
    }
  };

  const dismissPermissionPrompt = () => {
    setShowPermissionPrompt(false);
    setLocationError(null);
  };

  const clearAllFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedCategory("Todas");
    setSelectedCity("");
    setSortBy("relevance");
    setShowOnlyNearMe(false);
    setShowOnlyRemote(false);
  }, []);

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

  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    gigs.forEach((gig) => {
      const cat = gig.category || "Sin categoría";
      map[cat] = (map[cat] || 0) + 1;
    });
    return map;
  }, [gigs]);

  const categoryCarouselRef = useRef<HTMLDivElement>(null);

  const filteredGigs = useMemo(() => {
    let result = [...gigsWithDistance];

    // Text search (title, description, category, city, seller…)
    if (searchTerm.trim()) {
      result = result.filter((gig) => gigMatchesSearch(gig, searchTerm));
    }

    // Category filter
    if (selectedCategory !== "Todas") {
      result = result.filter(gig => gig.category === selectedCategory);
    }

    // City filter (when not using near-me)
    if (!showOnlyNearMe && selectedCity.trim()) {
      result = result.filter((gig) => cityMatchesFilter(gig, selectedCity));
    }

    // Geo: near me — prefer gigs with distance; keep remotes at end when coords missing
    if (showOnlyNearMe && userLocation) {
      result = result.filter(
        (gig) => gig.distanceKm !== undefined || gig.isRemote === true,
      );
      result.sort((a, b) => {
        const da = a.distanceKm ?? (a.isRemote ? 500 : Infinity);
        const db = b.distanceKm ?? (b.isRemote ? 500 : Infinity);
        return da - db;
      });
    }

    if (showOnlyRemote) {
      result = result.filter(gig => gig.isRemote === true);
    }

    // Sorting (skip override when near-me already sorted by distance, unless relevance+query)
    const hasQuery = Boolean(searchTerm.trim());
    if (showOnlyNearMe && !hasQuery) {
      // distance order already applied
    } else if (sortBy === "relevance" && hasQuery) {
      result.sort((a, b) => compareByRelevance(a, b, searchTerm));
    } else if (sortBy === "rating") {
      result.sort((a, b) => (b.seller?.rating || 0) - (a.seller?.rating || 0));
    } else if (sortBy === "price-low") {
      result.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === "price-high") {
      result.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortBy === "newest") {
      result.sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());
    } else if (!showOnlyNearMe && sortBy === "relevance") {
      // Default browse: newest first
      result.sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());
    }

    return result;
  }, [gigsWithDistance, searchTerm, selectedCategory, selectedCity, sortBy, showOnlyNearMe, showOnlyRemote, userLocation]);

  const mapPins = useMemo(() => buildGigMapPins(filteredGigs), [filteredGigs]);
  const mapClusters = useMemo(() => groupGigsByCity(mapPins), [mapPins]);
  const mapCenter = useMemo(() => {
    if (userLocation && showOnlyNearMe) {
      return { lat: userLocation.lat, lng: userLocation.lng, zoom: 11 };
    }
    return undefined;
  }, [userLocation, showOnlyNearMe]);

  const hasActiveFilters =
    Boolean(searchTerm.trim()) ||
    selectedCategory !== "Todas" ||
    Boolean(selectedCity.trim()) ||
    sortBy !== "relevance" ||
    showOnlyNearMe ||
    showOnlyRemote;

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
            {filteredGigs.length} servicio{filteredGigs.length === 1 ? "" : "s"} disponible{filteredGigs.length === 1 ? "" : "s"}
            {selectedCategory !== "Todas" && ` en ${selectedCategory}`}
            {selectedCity.trim() && !showOnlyNearMe && ` · ${selectedCity.trim()}`}
            {showOnlyNearMe && " · cerca de ti"}
            {searchTerm.trim() && (
              <span className="block sm:inline sm:before:content-['·_'] text-base">
                “{searchTerm.trim()}”
              </span>
            )}
          </p>
          <ShareOigaGig variant="inline" className="md:hidden" />
        </div>
      </div>

      {/* Filters */}
      <div className="mb-8 space-y-5">
        {/* Search + City + Sort */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              type="search"
              placeholder="Buscar servicios, categorías o vendedores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-12 text-base"
              aria-label="Buscar servicios"
            />
          </div>

          <div className="relative sm:w-48">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              list="gigs-cities"
              type="text"
              placeholder="Ciudad"
              value={showOnlyNearMe ? "Cerca de mí" : selectedCity}
              onChange={(e) => {
                const v = e.target.value;
                if (isNearMeLocation(v)) {
                  setShowOnlyNearMe(true);
                  setSelectedCity("");
                  if (!userLocation) setShowPermissionPrompt(true);
                } else {
                  setShowOnlyNearMe(false);
                  setSelectedCity(v);
                }
              }}
              className="h-12 text-base pl-9"
              aria-label="Filtrar por ciudad"
            />
            <datalist id="gigs-cities">
              {colombianCities.map((c) => (
                <option key={c.id} value={c.label} />
              ))}
            </datalist>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border rounded-2xl px-5 h-12 text-base w-full sm:w-56 bg-background"
            aria-label="Ordenar resultados"
          >
            <option value="relevance">Relevancia</option>
            <option value="rating">Mejor valorados</option>
            <option value="price-low">Precio: menor a mayor</option>
            <option value="price-high">Precio: mayor a menor</option>
            <option value="newest">Más recientes</option>
          </select>
        </div>

        {/* Geo filters */}
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
              onClick={() => {
                setShowOnlyNearMe(!showOnlyNearMe);
                if (!showOnlyNearMe) setSelectedCity("");
              }}
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

          {hasActiveFilters && (
            <Button
              onClick={clearAllFilters}
              variant="outline"
              size="sm"
              className="text-orange-600 border-orange-200 hover:bg-orange-50 gap-1 ml-auto sm:ml-0"
            >
              <X className="h-4 w-4 shrink-0" /> Limpiar filtros
            </Button>
          )}
        </div>

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2" aria-label="Filtros activos">
            {searchTerm.trim() && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-medium text-orange-800 hover:bg-orange-100"
              >
                “{searchTerm.trim()}”
                <X className="h-3 w-3" />
              </button>
            )}
            {selectedCategory !== "Todas" && (
              <button
                type="button"
                onClick={() => setSelectedCategory("Todas")}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium hover:bg-muted/80"
              >
                {selectedCategory}
                <X className="h-3 w-3" />
              </button>
            )}
            {selectedCity.trim() && !showOnlyNearMe && (
              <button
                type="button"
                onClick={() => setSelectedCity("")}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium hover:bg-muted/80"
              >
                <MapPin className="h-3 w-3" />
                {selectedCity.trim()}
                <X className="h-3 w-3" />
              </button>
            )}
            {showOnlyNearMe && (
              <button
                type="button"
                onClick={() => setShowOnlyNearMe(false)}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium hover:bg-muted/80"
              >
                <MapPin className="h-3 w-3" />
                Cerca de mí
                <X className="h-3 w-3" />
              </button>
            )}
            {showOnlyRemote && (
              <button
                type="button"
                onClick={() => setShowOnlyRemote(false)}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium hover:bg-muted/80"
              >
                <Wifi className="h-3 w-3" />
                Remotos
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        )}

        {/* Category tiles */}
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

          <div className="relative">
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

      {/* Full results grid — mobile + desktop (all matches, not capped) */}
      {filteredGigs.length > 0 && viewMode === 'list' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {filteredGigs.map((gig) => (
            <GigCard
              key={gig.id}
              gig={gig as ComponentProps<typeof GigCard>['gig']}
              distanceKm={gig.distanceKm}
            />
          ))}
        </div>
      ) : null}

      {filteredGigs.length === 0 ? (
        <div className="text-center py-16 border rounded-3xl bg-card px-4">
          <p className="text-2xl text-gray-400 mb-2">No se encontraron servicios</p>
          <p className="text-muted-foreground mb-6">
            {searchTerm.trim()
              ? `No hay resultados para “${searchTerm.trim()}”. Prueba otra palabra, quita la ciudad o elige otra categoría.`
              : "Prueba con otra búsqueda, ciudad o categoría"}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <button
              onClick={clearAllFilters}
              className="text-orange-600 hover:underline font-medium"
            >
              Ver todos los servicios
            </button>
            {selectedCategory !== "Todas" && (
              <button
                onClick={() => setSelectedCategory("Todas")}
                className="text-sm text-muted-foreground hover:underline"
              >
                Quitar categoría
              </button>
            )}
            {(selectedCity.trim() || showOnlyNearMe) && (
              <button
                onClick={() => {
                  setSelectedCity("");
                  setShowOnlyNearMe(false);
                }}
                className="text-sm text-muted-foreground hover:underline"
              >
                Quitar ubicación
              </button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
