'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import GigCard from '@/components/common/GigCard'
import ProjectBuilder from '@/components/seller/ProjectBuilder'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useGigCategories } from '@/lib/useGigCategories'
import { getCurrentLocation, calculateDistance } from '@/lib/distance'
import LocationPermissionPrompt from '@/components/maps/LocationPermissionPrompt'
import MapsPollutionNuke from '@/components/maps/MapsPollutionNuke'
import { MapPin, Wifi, X, Users, FolderKanban } from 'lucide-react'
import { toast } from 'sonner'
import {
  loadProjectBundle,
  networkGigToBundleItem,
  saveProjectBundle,
  clearProjectBundle,
  type NetworkGig,
  type ProjectBundleItem,
} from '@/lib/seller-network'

export default function SellerNetworkPage() {
  const { data: session } = useSession()
  const userId = session?.user?.id

  const { categories: loadedCategories, loading: catLoading } = useGigCategories()
  const categoryList = loadedCategories.map((c) => c.name)

  const [gigs, setGigs] = useState<NetworkGig[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Todas')
  const [sortBy, setSortBy] = useState('relevance')
  const [projectItems, setProjectItems] = useState<ProjectBundleItem[]>([])
  const [showMobileProject, setShowMobileProject] = useState(false)

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [showOnlyNearMe, setShowOnlyNearMe] = useState(false)
  const [showOnlyRemote, setShowOnlyRemote] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false)

  const fetchGigs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/seller/network/gigs', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al cargar')
      setGigs(data.gigs || [])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudieron cargar los servicios')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchGigs()
    const savedLocation = localStorage.getItem('userLocation')
    if (savedLocation) {
      try {
        const parsed = JSON.parse(savedLocation)
        if (parsed.lat && parsed.lng) setUserLocation(parsed)
      } catch {}
    }
  }, [fetchGigs])

  useEffect(() => {
    if (!userId) return
    const bundle = loadProjectBundle(userId)
    setProjectItems(bundle.items)
  }, [userId])

  const persistProject = useCallback(
    (items: ProjectBundleItem[]) => {
      if (!userId) return
      setProjectItems(items)
      saveProjectBundle(userId, { items, updatedAt: new Date().toISOString() })
    },
    [userId]
  )

  const handleAddToProject = (gig: NetworkGig) => {
    if (!userId) {
      toast.error('Inicia sesión para armar un proyecto')
      return
    }
    if (projectItems.some((item) => item.gigId === gig.id)) {
      toast.info('Este servicio ya está en tu proyecto')
      return
    }
    const next = [...projectItems, networkGigToBundleItem(gig)]
    persistProject(next)
    toast.success('Servicio agregado al proyecto')
    setShowMobileProject(true)
  }

  const handleRemoveFromProject = (gigId: string) => {
    persistProject(projectItems.filter((item) => item.gigId !== gigId))
  }

  const handleClearProject = () => {
    if (!userId) return
    clearProjectBundle(userId)
    setProjectItems([])
    toast.success('Proyecto vaciado')
  }

  const handleUseMyLocation = async () => {
    setLocationLoading(true)
    setLocationError(null)
    setShowPermissionPrompt(false)
    try {
      const location = await getCurrentLocation()
      setUserLocation(location)
      setShowOnlyNearMe(true)
      localStorage.setItem('userLocation', JSON.stringify(location))
    } catch (error: unknown) {
      const geoError = error as { code?: number }
      let message = 'No pudimos acceder a tu ubicación.'
      if (geoError.code === 1) message = 'Permiso de ubicación denegado.'
      setLocationError(message)
      setShowPermissionPrompt(true)
    } finally {
      setLocationLoading(false)
    }
  }

  const gigsWithDistance = useMemo(() => {
    return gigs.map((gig) => {
      if (userLocation && gig.latitude && gig.longitude) {
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          gig.latitude,
          gig.longitude
        )
        return { ...gig, distanceKm: distance }
      }
      return gig
    })
  }, [gigs, userLocation])

  const filteredGigs = useMemo(() => {
    let result = [...gigsWithDistance] as (NetworkGig & { distanceKm?: number })[]

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        (gig) =>
          gig.title?.toLowerCase().includes(term) ||
          gig.description?.toLowerCase().includes(term) ||
          gig.seller?.businessName?.toLowerCase().includes(term) ||
          gig.seller?.name?.toLowerCase().includes(term)
      )
    }

    if (selectedCategory !== 'Todas') {
      result = result.filter((gig) => gig.category === selectedCategory)
    }

    if (showOnlyNearMe && userLocation) {
      result = result.filter((gig) => gig.distanceKm !== undefined)
      result.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))
    }

    if (showOnlyRemote) {
      result = result.filter((gig) => gig.isRemote === true)
    }

    if (!showOnlyNearMe) {
      if (sortBy === 'rating') {
        result.sort((a, b) => (b.seller?.rating || 0) - (a.seller?.rating || 0))
      } else if (sortBy === 'price-low') {
        result.sort((a, b) => (a.price || 0) - (b.price || 0))
      } else if (sortBy === 'price-high') {
        result.sort((a, b) => (b.price || 0) - (a.price || 0))
      } else if (sortBy === 'newest') {
        result.sort(
          (a, b) =>
            new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
        )
      }
    }

    return result
  }, [
    gigsWithDistance,
    searchTerm,
    selectedCategory,
    sortBy,
    showOnlyNearMe,
    showOnlyRemote,
    userLocation,
  ])

  const projectGigIds = useMemo(() => new Set(projectItems.map((i) => i.gigId)), [projectItems])

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando red de vendedores...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-28 lg:pb-12 overflow-x-hidden">
      <MapsPollutionNuke />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-orange-100 dark:bg-orange-900/40 text-orange-600 flex items-center justify-center shrink-0">
              <Users size={22} />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">Red de Vendedores</h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                Encuentra socios para proyectos grandes. Combina servicios y contacta vendedores directamente.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          <div className="lg:col-span-8 space-y-5 min-w-0">
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                type="text"
                placeholder="Buscar servicios o vendedores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-11 sm:h-12"
              />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border rounded-xl px-4 h-11 sm:h-12 text-sm bg-background w-full sm:w-52"
              >
                <option value="relevance">Relevancia</option>
                <option value="rating">Mejor valorados</option>
                <option value="price-low">Precio: menor a mayor</option>
                <option value="price-high">Precio: mayor a menor</option>
                <option value="newest">Más recientes</option>
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={handleUseMyLocation}
                disabled={locationLoading}
                variant={showOnlyNearMe ? 'default' : 'outline'}
                size="sm"
                className="gap-1.5"
              >
                <MapPin className="h-4 w-4" />
                {locationLoading ? 'Ubicando...' : 'Cerca de mí'}
              </Button>
              {userLocation && (
                <Button
                  onClick={() => setShowOnlyNearMe(!showOnlyNearMe)}
                  variant={showOnlyNearMe ? 'default' : 'outline'}
                  size="sm"
                >
                  {showOnlyNearMe ? 'Ver todos' : 'Solo cerca'}
                </Button>
              )}
              <Button
                onClick={() => setShowOnlyRemote(!showOnlyRemote)}
                variant={showOnlyRemote ? 'default' : 'outline'}
                size="sm"
                className="gap-1.5"
              >
                <Wifi className="h-4 w-4" />
                {showOnlyRemote ? 'Todos' : 'Solo remotos'}
              </Button>
              {(searchTerm || selectedCategory !== 'Todas' || showOnlyNearMe || showOnlyRemote) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 text-orange-600"
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedCategory('Todas')
                    setShowOnlyNearMe(false)
                    setShowOnlyRemote(false)
                  }}
                >
                  <X className="h-3.5 w-3.5" /> Limpiar
                </Button>
              )}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <button
                onClick={() => setSelectedCategory('Todas')}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  selectedCategory === 'Todas'
                    ? 'bg-orange-600 text-white border-orange-600'
                    : 'border-border hover:border-orange-300'
                }`}
              >
                Todas ({gigs.length})
              </button>
              {!catLoading &&
                categoryList.map((cat) => {
                  const count = gigs.filter((g) => g.category === cat).length
                  if (count === 0) return null
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        selectedCategory === cat
                          ? 'bg-orange-600 text-white border-orange-600'
                          : 'border-border hover:border-orange-300'
                      }`}
                    >
                      {cat} ({count})
                    </button>
                  )
                })}
            </div>

            {showPermissionPrompt && (
              <LocationPermissionPrompt
                onAllow={handleUseMyLocation}
                onDismiss={() => setShowPermissionPrompt(false)}
                isLoading={locationLoading}
                error={locationError || undefined}
              />
            )}

            <p className="text-sm text-muted-foreground">
              {filteredGigs.length} servicios de otros vendedores
            </p>

            {filteredGigs.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                {filteredGigs.map((gig) => (
                  <GigCard
                    key={gig.id}
                    gig={gig}
                    mode="network"
                    distanceKm={gig.distanceKm}
                    inProject={projectGigIds.has(gig.id)}
                    onAddToProject={(g) => handleAddToProject(g as NetworkGig)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-card rounded-2xl border border-border">
                <p className="text-muted-foreground mb-4">No hay servicios que coincidan con tus filtros.</p>
                <Link href="/create-gig">
                  <Button variant="outline">Publicar tu primer servicio</Button>
                </Link>
              </div>
            )}
          </div>

          <div className="hidden lg:block lg:col-span-4 min-w-0">
            <ProjectBuilder
              items={projectItems}
              onRemove={handleRemoveFromProject}
              onClear={handleClearProject}
            />
          </div>
        </div>
      </div>

      {/* Mobile project toggle + sheet */}
      <div className="lg:hidden fixed bottom-16 left-0 right-0 z-30 px-4">
        <Button
          className="w-full bg-orange-600 hover:bg-orange-700 shadow-lg gap-2"
          onClick={() => setShowMobileProject((v) => !v)}
        >
          <FolderKanban size={18} />
          Mi proyecto ({projectItems.length})
        </Button>
      </div>

      {showMobileProject && (
        <ProjectBuilder
          items={projectItems}
          onRemove={handleRemoveFromProject}
          onClear={handleClearProject}
          onClose={() => setShowMobileProject(false)}
          mobileSheet
        />
      )}
    </div>
  )
}