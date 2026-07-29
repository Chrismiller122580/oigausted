"use client"
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { MapPin } from "lucide-react"
import StartInquiryButton from '@/components/common/StartInquiryButton'
import BuyGigConfirmDialog from '@/components/gigs/BuyGigConfirmDialog'
import { useBuyGigConfirm } from '@/hooks/useBuyGigConfirm'
import { CategoryIcon } from "@/lib/icon-registry"
import { StarRating } from "@/components/ui/star-rating"
import { UserAvatar } from "@/components/ui/user-avatar"
import { formatGigLocation } from "@/lib/gig-location"
import { cn } from "@/lib/utils"

interface Gig {
  id: string
  title: string
  description?: string | null
  price: number
  category?: string | null
  completionTime?: string | null
  imageUrl?: string | null
  isActive?: boolean
  city?: string | null
  isRemote?: boolean | null
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
  showChatButton = false,
}: { 
  gig: Gig; 
  sellerView?: boolean;
  compact?: boolean;
  distanceKm?: number;
  mode?: 'buyer' | 'network';
  inProject?: boolean;
  onAddToProject?: (gig: Gig) => void;
  showChatButton?: boolean;
}) {
  const router = useRouter()
  const { data: session } = useSession()
  const { open, pending, requestBuy, confirm, cancel } = useBuyGigConfirm()

  const sellerName =
    gig.seller?.name ||
    gig.seller?.businessName ||
    "Vendedor"

  const locationLabel = formatGigLocation(gig)

  const userId = session?.user?.id
  const isOwnGig = userId && gig.seller?.id === userId

  const handleBuyNow = () => {
    requestBuy({
      gigId: gig.id,
      title: gig.title,
      price: gig.price,
      isActive: gig.isActive,
      sellerId: gig.seller?.id,
    })
  }

  return (
    <Card
      className={cn(
        "overflow-hidden rounded-2xl border-0 py-0 gap-0",
        "bg-gradient-to-b from-card via-card to-orange-50/40",
        "dark:to-orange-950/25",
        "ring-1 ring-black/[0.04] dark:ring-white/10",
        "shadow-sm shadow-orange-900/[0.04]",
        "transition-all duration-200 ease-out",
        "hover:shadow-md hover:shadow-orange-900/10 hover:ring-orange-200/60",
        "dark:hover:ring-orange-800/40 hover:-translate-y-0.5",
      )}
    >
      <div
        className={cn(
          "relative w-full overflow-hidden",
          compact ? "h-32" : "h-48",
          "bg-gradient-to-br from-orange-50 via-amber-50/80 to-slate-100",
          "dark:from-orange-950/50 dark:via-slate-900 dark:to-slate-950",
        )}
      >
        {gig.imageUrl ? (
          <>
            <Image
              src={gig.imageUrl}
              alt={gig.title}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover"
            />
            {/* Soft fade into card body */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card via-card/50 to-transparent dark:from-card"
            />
          </>
        ) : (
          <div
            aria-hidden
            className="absolute inset-0 flex items-center justify-center opacity-40"
          >
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-orange-200/60 to-amber-100/40 dark:from-orange-800/40 dark:to-amber-900/20" />
          </div>
        )}
      </div>

      <CardHeader className="pt-4">
        <CardTitle className="line-clamp-2 text-foreground">{gig.title}</CardTitle>
        
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
                className="truncate text-xs text-muted-foreground hover:text-orange-700 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {sellerName}
              </Link>
            )}
          </div>

          {/* Rating badge */}
          {gig.seller?.rating && gig.seller.rating > 0 && (
            <div
              className={cn(
                "flex items-center gap-1 rounded-full bg-amber-50/90 px-2 py-0.5 flex-shrink-0",
                "ring-1 ring-amber-100/80 dark:bg-amber-950/40 dark:ring-amber-900/40",
                compact && "px-1.5",
              )}
            >
              <StarRating
                rating={gig.seller.rating}
                size="sm"
                showValue
                reviewCount={gig.seller.reviewCount ?? undefined}
              />
            </div>
          )}
        </div>

        {locationLabel && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-orange-500/90" aria-hidden />
            <span className="truncate">{locationLabel}</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="pb-3">
        <p className="text-muted-foreground line-clamp-3 mb-4">{gig.description}</p>
        <div className="flex justify-between items-center gap-2 flex-wrap">
          <span className="text-2xl sm:text-3xl font-bold text-orange-700 dark:text-orange-400 tabular-nums">
            ${gig.price.toLocaleString("es-CO")}
          </span>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {distanceKm !== undefined && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs bg-sky-50/90 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200 px-2.5 py-1 rounded-full font-medium ring-1 ring-sky-100/80 dark:ring-sky-900/40">
                  {distanceKm.toFixed(1)} km
                </span>
                {gig.seller?.serviceRadiusKm && distanceKm > gig.seller.serviceRadiusKm && (
                  <span 
                    className="text-[10px] bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-200 px-2 py-0.5 rounded-full font-medium ring-1 ring-rose-100/80" 
                    title={`Este vendedor suele atender hasta ${gig.seller.serviceRadiusKm} km`}
                  >
                    +{Math.round(distanceKm - gig.seller.serviceRadiusKm)}km
                  </span>
                )}
              </div>
            )}
            {gig.category && (
              <span className="text-xs bg-orange-50/90 text-orange-800 dark:bg-orange-950/40 dark:text-orange-200 px-2.5 py-1 rounded-full flex items-center gap-1.5 ring-1 ring-orange-100/80 dark:ring-orange-900/40 max-w-[11rem]">
                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-white/90 ring-1 ring-black/5 dark:bg-white/90 dark:ring-white/15">
                  <CategoryIcon name={gig.category} className="h-4 w-4 object-contain" />
                </span>
                <span className="truncate">{gig.category}</span>
              </span>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter
        className={cn(
          "border-t border-orange-100/60 dark:border-orange-950/40",
          "bg-gradient-to-t from-orange-50/50 via-muted/30 to-transparent",
          "dark:from-orange-950/20 dark:via-muted/20",
          mode === 'network' && 'flex flex-col gap-2',
        )}
      >
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
        ) : showChatButton && !isOwnGig && gig.isActive !== false ? (
          <div className="flex flex-col gap-2 w-full">
            <Button onClick={handleBuyNow} variant="brand" className="w-full">
              Comprar Ahora
            </Button>
            <StartInquiryButton gigId={gig.id} fullWidth size="sm" label="Chatear en OigaGIG" />
          </div>
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

      {pending && (
        <BuyGigConfirmDialog
          open={open}
          title={pending.title}
          price={pending.price}
          onConfirm={confirm}
          onCancel={cancel}
        />
      )}
    </Card>
  )
}
