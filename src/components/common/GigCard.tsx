"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { toast } from 'sonner'
import { CategoryIcon } from "@/lib/icon-registry"

interface Gig {
  id: string
  title: string
  description?: string
  price: number
  category?: string
  completionTime?: string
  imageUrl?: string
  isActive?: boolean
  seller: {
    id: string
    name?: string
    email?: string
    businessName?: string
    slug?: string
    profilePicture?: string
    rating?: number
    reviewCount?: number
    latitude?: number | null
    longitude?: number | null
    serviceRadiusKm?: number | null
    city?: string | null
  }
}

export default function GigCard({ 
  gig, 
  sellerView = false,
  compact = false,
  distanceKm,
}: { 
  gig: Gig; 
  sellerView?: boolean;
  compact?: boolean;
  distanceKm?: number;
}) {
  const router = useRouter()
  const { data: session } = useSession()

  const sellerName =
    gig.seller?.name ||
    gig.seller?.businessName ||
    gig.seller?.email ||
    "Vendedor"

  const sellerInitial = sellerName[0]?.toUpperCase() || "V"

  const userId = (session?.user as any)?.id
  const isOwnGig = userId && gig.seller?.id === userId

  const handleBuyNow = () => {
    if (isOwnGig) {
      toast.error("No puedes comprar tu propio gig")
      return
    }
    if (gig.isActive === false) {
      toast.error("Este servicio está pausado temporalmente")
      return
    }
    router.push(`/checkout/${gig.id}`)
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {gig.imageUrl && (
        <img
          src={gig.imageUrl}
          alt={gig.title}
          className={`w-full ${compact ? 'h-32' : 'h-48'} object-cover`}
        />
      )}
      <CardHeader>
        <CardTitle className="line-clamp-2">{gig.title}</CardTitle>
        
        {/* Seller info: avatar + name + rating */}
        <div className="mt-1 flex items-center justify-between gap-2 text-sm">
          <div className="flex min-w-0 items-center gap-2">
            {gig.seller?.profilePicture ? (
              <img 
                src={gig.seller.profilePicture} 
                alt={sellerName}
                className="w-5 h-5 rounded-full object-cover border border-zinc-200 dark:border-zinc-700 flex-shrink-0" 
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 text-[10px] flex items-center justify-center font-semibold flex-shrink-0">
                {sellerInitial}
              </div>
            )}

            {isOwnGig ? (
              <span className="truncate text-muted-foreground text-xs">{sellerName}</span>
            ) : (
              <Link 
                href={`/sellers/${gig.seller?.slug || gig.seller?.id}`} 
                className="truncate text-xs text-muted-foreground hover:text-orange-600 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {sellerName}
              </Link>
            )}
          </div>

          {/* Rating badge */}
          {gig.seller?.rating && gig.seller.rating > 0 && (
            <div className={`flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] text-amber-700 flex-shrink-0 ${compact ? 'text-[9px] px-1.5' : ''}`}>
              ⭐ {gig.seller.rating.toFixed(1)}
              {gig.seller.reviewCount && gig.seller.reviewCount > 0 && (
                <span className="text-amber-500">({gig.seller.reviewCount})</span>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground line-clamp-3 mb-4">{gig.description}</p>
        <div className="flex justify-between items-center">
          <span className="text-3xl font-bold text-orange-600">
            ${gig.price.toLocaleString("es-CO")}
          </span>
          <div className="flex items-center gap-2">
            {distanceKm !== undefined && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-medium">
                  {distanceKm.toFixed(1)} km
                </span>
                {gig.seller?.serviceRadiusKm && distanceKm > gig.seller.serviceRadiusKm && (
                  <span 
                    className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium" 
                    title={`Este vendedor suele atender hasta ${gig.seller.serviceRadiusKm} km`}
                  >
                    +{Math.round(distanceKm - gig.seller.serviceRadiusKm)}km
                  </span>
                )}
              </div>
            )}
            {gig.category && (
              <span className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full flex items-center gap-1">
                <CategoryIcon name={gig.category} className="w-3 h-3 mr-0.5 object-contain inline align-middle" />
                {gig.category}
              </span>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        {sellerView && isOwnGig ? (
          <Button
            onClick={() => router.push(`/create-gig?edit=${gig.id}`)}
            className="w-full bg-orange-600 hover:bg-orange-700"
          >
            Editar gig
          </Button>
        ) : (
          <Button
            onClick={handleBuyNow}
            className="w-full bg-orange-600 hover:bg-orange-700"
            disabled={isOwnGig || gig.isActive === false}
          >
            {isOwnGig ? "Tu propio gig" : (gig.isActive === false ? "Servicio pausado" : "Comprar Ahora")}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}