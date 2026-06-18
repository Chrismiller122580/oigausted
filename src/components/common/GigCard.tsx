"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { toast } from 'sonner'
import { CategoryIcon } from "@/lib/icon-registry"
import { StarRating } from "@/components/ui/star-rating"
import { UserAvatar } from "@/components/ui/user-avatar"

interface Gig {
  id: string
  title: string
  description?: string | null
  price: number
  category?: string | null
  completionTime?: string | null
  imageUrl?: string | null
  isActive?: boolean
  seller?: {
    id: string
    name?: string | null
    email?: string | null
    businessName?: string | null
    slug?: string | null
    profilePicture?: string | null
    rating?: number | null
    reviewCount?: number | null
    latitude?: number | null
    longitude?: number | null
    serviceRadiusKm?: number | null
    city?: string | null
  } | null
}

export default function GigCard({ 
  gig, 
  sellerView = false,
  compact = false,
  distanceKm,
  mode = 'buyer',
  inProject = false,
  onAddToProject,
}: { 
  gig: Gig; 
  sellerView?: boolean;
  compact?: boolean;
  distanceKm?: number;
  mode?: 'buyer' | 'network';
  inProject?: boolean;
  onAddToProject?: (gig: Gig) => void;
}) {
  const router = useRouter()
  const { data: session } = useSession()

  const sellerName =
    gig.seller?.name ||
    gig.seller?.businessName ||
    "Vendedor"

  const userId = session?.user?.id
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
        <div className={`w-full ${compact ? 'h-32' : 'h-48'} bg-muted flex items-center justify-center overflow-hidden`}>
          <img
            src={gig.imageUrl}
            alt={gig.title}
            className="w-full h-full object-contain"
          />
        </div>
      )}
      <CardHeader>
        <CardTitle className="line-clamp-2">{gig.title}</CardTitle>
        
        {/* Seller info: avatar + name + rating */}
        <div className="mt-1 flex items-center justify-between gap-2 text-sm">
          <div className="flex min-w-0 items-center gap-2">
            <UserAvatar
              src={gig.seller?.profilePicture}
              name={sellerName}
              size="sm"
              className="w-5 h-5 text-[10px] flex-shrink-0"
            />

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
            <div className={`flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 flex-shrink-0 ${compact ? 'px-1.5' : ''}`}>
              <StarRating
                rating={gig.seller.rating}
                size="sm"
                showValue
                reviewCount={gig.seller.reviewCount ?? undefined}

              />
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
              <span className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-md flex items-center gap-1">
                <CategoryIcon name={gig.category} className="w-3 h-3 mr-0.5 object-contain inline align-middle" />
                {gig.category}
              </span>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className={mode === 'network' ? 'flex flex-col gap-2' : undefined}>
        {mode === 'network' ? (
          <>
            <Button
              onClick={() => onAddToProject?.(gig)}
              variant="brand"
              className="w-full"
              disabled={inProject || gig.isActive === false}
            >
              {inProject ? 'En tu proyecto' : 'Agregar al proyecto'}
            </Button>
            <Link href={`/sellers/${gig.seller?.slug || gig.seller?.id}`} className="w-full">
              <Button variant="outline" className="w-full">
                Ver perfil del vendedor
              </Button>
            </Link>
          </>
        ) : sellerView && isOwnGig ? (
          <Button
            onClick={() => router.push(`/create-gig?edit=${gig.id}`)}
            variant="brand"
            className="w-full"
          >
            Editar gig
          </Button>
        ) : (
          <Button
            onClick={handleBuyNow}
            variant="brand"
            className="w-full"
            disabled={isOwnGig || gig.isActive === false}
          >
            {isOwnGig ? "Tu propio gig" : (gig.isActive === false ? "Servicio pausado" : "Comprar Ahora")}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}