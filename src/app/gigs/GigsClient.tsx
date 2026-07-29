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
import { cn } from "@/lib/utils";

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
      <div className="relative min-h-screen flex items-center justify-center">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-orange-50/90 via-amber-50/50 to-slate-50 dark:from-orange-950/40 dark:via-slate-950 dark:to-slate-950"
        />
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-orange-400/80 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Cargando servicios...</p>
        </div>
      </div>
    );
  }

  const chipBase =
    "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ring-1";
  // Chips sit on the dark orange filter tray — light surfaces for contrast
  const chipSoft =
    `${chipBase} border-0 bg-white/20 text-orange-50 ring-white/25 hover:bg-white/30`;
  const chipAccent =
    `${chipBase} border-0 bg-white/95 text-orange-900 ring-white/40 hover:bg-white`;

  return (
    <div className="relative min-h-screen">
      {/* Soft full-bleed wash */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-50/90 via-amber-50/40 to-slate-50 dark:from-orange-950/35 dark:via-slate-950 dark:to-slate-950" />
        <div className="absolute -top-24 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-orange-200/30 blur-3xl dark:bg-orange-900/20" />
        <div className="absolute top-40 -right-16 h-56 w-56 rounded-full bg-amber-100/50 blur-3xl dark:bg-amber-900/15" />
        <div className="absolute bottom-20 -left-10 h-64 w-64 rounded-full bg-sky-100/40 blur-3xl dark:bg-sky-950/20" />
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
            Encuentra Servicios Locales
          </h1>
          <div className="flex flex-col gap-3 mt-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-lg sm:text-xl text-muted-foreground">
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

        {/* Dark orange search & filter tray */}
        <div
          className={cn(
            "mb-8 space-y-5 rounded-3xl p-4 sm:p-5",
            "bg-gradient-to-br from-orange-800 via-orange-700 to-amber-800",
            "dark:from-orange-950 dark:via-orange-900 dark:to-amber-950",
            "backdrop-blur-md",
            "border border-orange-900/50 dark:border-orange-800/60",
            "shadow-md shadow-orange-950/25",
            "ring-1 ring-orange-950/20 dark:ring-orange-800/30",
          )}
        >
          {/* Search + City + Sort */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                type="search"
                placeholder="Buscar servicios, categorías o vendedores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-12 text-base bg-white/95 text-foreground border-white/40 shadow-inner shadow-black/5 placeholder:text-muted-foreground"
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
                className="h-12 text-base pl-9 bg-white/95 text-foreground border-white/40 placeholder:text-muted-foreground"
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
              className="border border-white/40 rounded-2xl px-5 h-12 text-base w-full sm:w-56 bg-white/95 text-foreground"
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
              className={cn(
                "gap-1.5",
                showOnlyNearMe
                  ? "bg-white text-orange-900 hover:bg-orange-50 border-white"
                  : "border-white/50 bg-white/10 text-white hover:bg-white/20 hover:text-white",
              )}
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
                className={cn(
                  showOnlyNearMe
                    ? "bg-white text-orange-900 hover:bg-orange-50 border-white"
                    : "border-white/50 bg-white/10 text-white hover:bg-white/20 hover:text-white",
                )}
              >
                {showOnlyNearMe ? "Ver todos" : "Solo cerca"}
              </Button>
            )}

            <Button
              onClick={() => setShowOnlyRemote(!showOnlyRemote)}
              variant={showOnlyRemote ? "default" : "outline"}
              size="sm"
              className={cn(
                "gap-1.5",
                showOnlyRemote
                  ? "bg-white text-orange-900 hover:bg-orange-50 border-white"
                  : "border-white/50 bg-white/10 text-white hover:bg-white/20 hover:text-white",
              )}
            >
              <Wifi className="h-5 w-5 shrink-0" />
              {showOnlyRemote ? "Todos" : "Solo remotos"}
            </Button>

            <ListMapToggle
              storageKey="gigs-view"
              value={viewMode}
              onChange={setViewMode}
              variant="onDark"
              className="ml-auto sm:ml-0"
            />

            {hasActiveFilters && (
              <Button
                onClick={clearAllFilters}
                variant="outline"
                size="sm"
                className="text-white border-white/50 bg-white/10 hover:bg-white/20 hover:text-white gap-1 ml-auto sm:ml-0"
              >
                <X className="h-4 w-4 shrink-0" /> Limpiar filtros
              </Button>
            )}
          </div>

          {/* Active filter chips */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2" aria-label="Filtros activos">
              {searchTerm.trim() && (
                <button type="button" onClick={() => setSearchTerm("")} className={chipAccent}>
                  “{searchTerm.trim()}”
                  <X className="h-3 w-3 opacity-70" />
                </button>
              )}
              {selectedCategory !== "Todas" && (
                <button type="button" onClick={() => setSelectedCategory("Todas")} className={chipSoft}>
                  {selectedCategory}
                  <X className="h-3 w-3 opacity-70" />
                </button>
              )}
              {selectedCity.trim() && !showOnlyNearMe && (
                <button type="button" onClick={() => setSelectedCity("")} className={chipSoft}>
                  <MapPin className="h-3 w-3" />
                  {selectedCity.trim()}
                  <X className="h-3 w-3 opacity-70" />
                </button>
              )}
              {showOnlyNearMe && (
                <button type="button" onClick={() => setShowOnlyNearMe(false)} className={chipSoft}>
                  <MapPin className="h-3 w-3" />
                  Cerca de mí
                  <X className="h-3 w-3 opacity-70" />
                </button>
              )}
              {showOnlyRemote && (
                <button type="button" onClick={() => setShowOnlyRemote(false)} className={chipSoft}>
                  <Wifi className="h-3 w-3" />
                  Remotos
                  <X className="h-3 w-3 opacity-70" />
                </button>
              )}
            </div>
          )}

          {/* Category tiles */}
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="text-sm font-semibold text-orange-50">Explora por categoría</div>
              {selectedCategory !== "Todas" && (
                <button
                  onClick={() => setSelectedCategory("Todas")}
                  className="text-xs text-orange-100 hover:underline hover:text-white"
                >
                  Ver todas
                </button>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => categoryCarouselRef.current?.scrollBy({ left: -260, behavior: "smooth" })}
                className="hidden md:flex absolute -left-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 items-center justify-center rounded-full bg-white/90 dark:bg-background/90 border border-border/60 shadow-sm hover:bg-muted backdrop-blur-sm"
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
                  className={cn(
                    "snap-start flex-shrink-0 w-[92px] md:w-[108px] flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-200 active:scale-[0.985]",
                    // Idle: neutral white. Active: soft emerald accent (not red/orange).
                    selectedCategory === "Todas"
                      ? "border-emerald-400 bg-emerald-50 text-emerald-950 shadow-md ring-2 ring-emerald-300/70"
                      : "border-white/40 bg-white/95 text-slate-800 shadow-sm hover:bg-white hover:shadow-md hover:-translate-y-0.5 dark:border-white/20 dark:bg-white/90 dark:text-slate-900",
                  )}
                >
                  <div
                    className={cn(
                      "mb-1.5 flex h-12 w-12 items-center justify-center rounded-xl ring-1 shadow-sm",
                      selectedCategory === "Todas"
                        ? "bg-white ring-emerald-200"
                        : "bg-slate-50 ring-slate-200/80",
                    )}
                  >
                    <LayoutGrid
                      className={cn(
                        "h-8 w-8",
                        selectedCategory === "Todas" ? "text-emerald-700" : "text-slate-500",
                      )}
                    />
                  </div>
                  <div className="text-xs font-medium text-center leading-tight">Todas</div>
                  <div
                    className={cn(
                      "text-[11px] mt-0.5",
                      selectedCategory === "Todas" ? "text-emerald-700/80" : "text-slate-500",
                    )}
                  >
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
                      className={cn(
                        "snap-start flex-shrink-0 w-[92px] md:w-[108px] flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-200 active:scale-[0.985]",
                        isActive
                          ? "border-emerald-400 bg-emerald-50 text-emerald-950 shadow-md ring-2 ring-emerald-300/70"
                          : "border-white/40 bg-white/95 text-slate-800 shadow-sm hover:bg-white hover:shadow-md hover:-translate-y-0.5 dark:border-white/20 dark:bg-white/90 dark:text-slate-900",
                      )}
                      title={cat}
                    >
                      <div className="mb-1.5">
                        <CategoryIcon name={cat} variant="tile" active={isActive} />
                      </div>
                      <div className="text-[11px] font-medium text-center leading-tight line-clamp-2">
                        {cat}
                      </div>
                      <div
                        className={cn(
                          "text-[11px] mt-0.5",
                          isActive ? "text-emerald-700/80" : "text-slate-500",
                        )}
                      >
                        {count}
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => categoryCarouselRef.current?.scrollBy({ left: 260, behavior: "smooth" })}
                className="hidden md:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 items-center justify-center rounded-full bg-white/90 dark:bg-background/90 border border-border/60 shadow-sm hover:bg-muted backdrop-blur-sm"
                aria-label="Scroll right"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <p className="text-[10px] text-orange-100/75 mt-1 px-1 md:hidden">
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
            <div className="rounded-2xl overflow-hidden ring-1 ring-black/[0.04] shadow-sm dark:ring-white/10">
              <GigMapExplorer
                pins={mapPins}
                clusters={mapClusters}
                userLocation={userLocation}
                initialCenter={mapCenter}
                height="min(50dvh, 420px)"
                onPinClick={(pin) => router.push(`/gigs/${pin.id}`)}
              />
            </div>
            <p className="text-center text-xs text-muted-foreground">
              {mapPins.length} en el mapa ·{' '}
              <Link href="/mapa" className="text-orange-700 hover:underline dark:text-orange-400">
                Ver mapa completo de Colombia
              </Link>
            </p>
          </div>
        ) : null}

        {/* Full results grid */}
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
          <div
            className={cn(
              "text-center py-16 px-4 rounded-3xl",
              "bg-card/70 backdrop-blur-sm",
              "border border-orange-100/80 dark:border-orange-950/40",
              "shadow-sm ring-1 ring-black/[0.03] dark:ring-white/5",
              "bg-gradient-to-b from-card/90 to-orange-50/40 dark:to-orange-950/20",
            )}
          >
            <p className="text-2xl text-muted-foreground/80 mb-2">No se encontraron servicios</p>
            <p className="text-muted-foreground mb-6">
              {searchTerm.trim()
                ? `No hay resultados para “${searchTerm.trim()}”. Prueba otra palabra, quita la ciudad o elige otra categoría.`
                : "Prueba con otra búsqueda, ciudad o categoría"}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <button
                onClick={clearAllFilters}
                className="text-orange-700 hover:underline font-medium dark:text-orange-400"
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
    </div>
  );
}
