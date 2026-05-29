"use client"
import { useState, useEffect } from "react"
import GigCard from "@/components/common/GigCard"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { getCurrentLocation, calculateDistance } from "@/lib/distance"
import LocationPermissionPrompt from "@/components/maps/LocationPermissionPrompt"

export default function GigsContent() {
  const [gigs, setGigs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [showOnlyNearMe, setShowOnlyNearMe] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false)

  useEffect(() => {
    fetchGigs()
  }, [])

  const fetchGigs = async () => {
    try {
      const res = await fetch("/api/gigs")
      const data = await res.json()
      setGigs(data.gigs || [])
    } catch (error) {
      console.error("Failed to fetch gigs", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUseMyLocation = async () => {
    setLocationLoading(true)
    setLocationError(null)
    setShowPermissionPrompt(false)

    try {
      const location = await getCurrentLocation()
      setUserLocation(location)
      setShowOnlyNearMe(true)
    } catch (error: any) {
      let message = "No pudimos acceder a tu ubicación."

      if (error.code === 1) {
        message = "Permiso de ubicación denegado. Puedes activarlo en los ajustes de tu navegador."
      } else if (error.code === 2) {
        message = "No fue posible determinar tu ubicación. Intenta de nuevo."
      } else if (error.code === 3) {
        message = "La solicitud de ubicación tardó demasiado."
      }

      setLocationError(message)
      setShowPermissionPrompt(true)
    } finally {
      setLocationLoading(false)
    }
  }

  const dismissPermissionPrompt = () => {
    setShowPermissionPrompt(false)
    setLocationError(null)
  }

  // Calculate distance for each gig that has coordinates
  const gigsWithDistance = gigs.map(gig => {
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

  let filteredGigs = gigsWithDistance.filter(gig =>
    gig.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    gig.seller?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    gig.category?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Apply "near me" filter
  if (showOnlyNearMe && userLocation) {
    filteredGigs = filteredGigs.filter(gig => gig.distanceKm !== undefined)
    // Sort by distance
    filteredGigs.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))
  }

  if (loading) {
    return (
      <div className="container py-20 text-center">
        <p className="text-xl text-gray-500">Cargando gigs...</p>
      </div>
    )
  }

  return (
    <div className="container py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-4xl font-bold">Explorar Gigs en Colombia</h1>
          <p className="text-gray-500 mt-2">{filteredGigs.length} servicios disponibles</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Button 
            onClick={handleUseMyLocation} 
            disabled={locationLoading}
            variant={showOnlyNearMe ? "default" : "outline"}
            className="whitespace-nowrap flex-1 sm:flex-none"
          >
            {locationLoading ? "Obteniendo ubicación..." : "📍 Gigs cerca de mí"}
          </Button>

          {userLocation && (
            <Button 
              onClick={() => {
                setShowOnlyNearMe(!showOnlyNearMe)
              }}
              variant={showOnlyNearMe ? "default" : "outline"}
              className="flex-1 sm:flex-none"
            >
              {showOnlyNearMe ? "Mostrar todos" : "Solo cerca de mí"}
            </Button>
          )}

          <div className="w-full md:w-80">
            <Input
              type="text"
              placeholder="Buscar gigs, categorías o vendedores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="py-6 text-base"
            />
          </div>
        </div>

        {/* Mobile-friendly location permission prompt */}
        {showPermissionPrompt && (
          <div className="mt-4">
            <LocationPermissionPrompt
              onAllow={handleUseMyLocation}
              onDismiss={dismissPermissionPrompt}
              isLoading={locationLoading}
              error={locationError || undefined}
            />
          </div>
        )}
      </div>

      {filteredGigs.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-2xl text-gray-400">No se encontraron gigs</p>
          <p className="text-gray-500 mt-2">
            {showOnlyNearMe 
              ? "No hay servicios disponibles cerca de tu ubicación actual." 
              : "Intenta con otra búsqueda o activa 'Gigs cerca de mí'"}
          </p>
          {showOnlyNearMe && (
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setShowOnlyNearMe(false)}
            >
              Ver todos los gigs
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredGigs.map((gig) => (
            <GigCard 
              key={gig.id} 
              gig={gig} 
              distanceKm={gig.distanceKm} 
            />
          ))}
        </div>
      )}
    </div>
  )
}
