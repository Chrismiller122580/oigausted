import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowLeft, Clock } from 'lucide-react'
import { GigImageGallery } from '@/components/common/GigImageGallery'
import GigDetailActions from '@/components/gigs/GigDetailActions'
import { StarRating } from '@/components/ui/star-rating'
import { UserAvatar } from '@/components/ui/user-avatar'
import {
  getPublicGigById,
  getSellerReviewsForGigPage,
  type GigPageReview,
} from '@/lib/gig-queries'
import type { DynamicFieldDef } from '@/types/gig-fields'

export const revalidate = 60

type PageProps = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const gig = await getPublicGigById(id)
  if (!gig) return { title: 'Servicio no encontrado' }

  const description =
    gig.description?.slice(0, 160) ||
    `${gig.title} — servicio local en OigaGIG`

  return {
    title: gig.title,
    description,
    openGraph: {
      title: gig.title,
      description,
      images: gig.images[0] ? [{ url: gig.images[0] }] : undefined,
    },
  }
}

export default async function GigDetailPage({ params }: PageProps) {
  const { id } = await params
  const gig = await getPublicGigById(id)

  if (!gig) {
    notFound()
  }

  const reviews: GigPageReview[] = gig.seller?.id
    ? await getSellerReviewsForGigPage(gig.seller.id, 4)
    : []

  const pausedNotice = !gig.isActive
    ? 'Este servicio está pausado temporalmente por el vendedor.'
    : null

  const gigFields = gig.fields as DynamicFieldDef[]

  return (
    <div className="bg-background py-8">
      <div className="max-w-7xl mx-auto px-6">
        <Link
          href="/gigs"
          className="flex items-center gap-2 text-emerald-600 hover:underline mb-8 inline-block"
        >
          <ArrowLeft size={20} /> Volver a todos los gigs
        </Link>

        {pausedNotice && (
          <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-6">
            {pausedNotice}
          </p>
        )}

        <div className="grid lg:grid-cols-5 gap-12">
          <div className="lg:col-span-3 space-y-10">
            {gig.images.length > 0 && (
              <GigImageGallery images={gig.images} alt={gig.title} priority />
            )}

            <div>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">{gig.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                {gig.category && (
                  <span className="font-medium bg-emerald-100 text-emerald-700 px-4 py-1 rounded-full">
                    {gig.category}
                  </span>
                )}
                {gig.completionTime && (
                  <div className="flex items-center gap-1.5 bg-card px-4 py-1 rounded-full border">
                    <Clock className="w-5 h-5 text-emerald-600" />
                    <span className="font-medium">Entrega en {gig.completionTime}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-4">Descripción</h2>
              <p className="text-foreground leading-relaxed text-lg whitespace-pre-line">
                {gig.description || 'Sin descripción'}
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-4 flex items-center justify-between">
                Reseñas
                {reviews.length > 0 && (
                  <span className="text-sm font-normal text-muted-foreground">
                    {reviews.length} recientes
                  </span>
                )}
              </h2>

              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="bg-card border rounded-3xl p-6">
                      <div className="mb-3">
                        <StarRating rating={review.rating} size="md" />
                      </div>
                      {review.comment && (
                        <p className="text-foreground mb-4">&ldquo;{review.comment}&rdquo;</p>
                      )}
                      <div className="text-sm text-muted-foreground flex items-center justify-between">
                        <span>— {review.reviewer?.name || 'Cliente anónimo'}</span>
                        <span className="text-xs">
                          {new Date(review.createdAt).toLocaleDateString('es-CO')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-card border border-border rounded-3xl p-8 text-center text-muted-foreground">
                  Aún no hay reseñas para este vendedor.
                  <br />
                  <span className="text-sm">Sé el primero en dejar una después de tu compra.</span>
                </div>
              )}

              {gig.seller?.id && reviews.length > 0 && (
                <div className="mt-4 text-right">
                  <Link
                    href={`/sellers/${gig.seller.slug || gig.seller.id}`}
                    className="inline-flex items-center gap-1 text-sm text-emerald-600 hover:underline font-medium"
                  >
                    Ver todas las reseñas del vendedor →
                  </Link>
                </div>
              )}
            </div>

            {gigFields.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold mb-6">Opciones del servicio</h2>
                <div className="grid gap-4">
                  {gigFields.map((field, index) => (
                    <div key={index} className="bg-card p-6 rounded-3xl border">
                      <p className="text-sm uppercase tracking-widest text-muted-foreground mb-1">
                        {field.label || field.key}
                      </p>
                      <p className="text-lg font-medium text-foreground">
                        {field.extraPrice
                          ? `+$${field.extraPrice.toLocaleString('es-CO')} COP`
                          : 'Incluido'}
                      </p>
                      {field.type && (
                        <p className="text-xs text-muted-foreground mt-1">Tipo: {field.type}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="bg-card rounded-3xl p-8 shadow-sm border lg:sticky lg:top-8">
              <div className="text-5xl sm:text-6xl font-bold text-emerald-600 mb-1">
                ${gig.price.toLocaleString('es-CO')}
              </div>
              <p className="text-muted-foreground mb-10">COP</p>

              <GigDetailActions
                gigId={gig.id}
                gigTitle={gig.title}
                gigPrice={gig.price}
                sellerId={gig.sellerId}
                isActive={gig.isActive}
              />

              {gig.seller && (
                <div className="border-t pt-8">
                  <p className="text-sm text-muted-foreground mb-3">Vendido por</p>
                  <Link
                    href={`/sellers/${gig.seller.slug || gig.seller.id}`}
                    className="group block"
                  >
                    <div className="flex items-center gap-4 hover:bg-muted -mx-2 px-2 py-2 rounded-2xl transition">
                      <UserAvatar
                        name={gig.seller.businessName || gig.seller.name}
                        size="lg"
                        className="rounded-2xl flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-semibold text-lg group-hover:text-emerald-600 transition">
                          {gig.seller.businessName || gig.seller.name || 'Vendedor'}
                        </p>
                        {gig.seller.rating != null && gig.seller.rating > 0 && (
                          <StarRating
                            rating={gig.seller.rating}
                            size="sm"
                            showValue
                            reviewCount={gig.seller.reviewCount}
                            className="text-sm"
                          />
                        )}
                      </div>
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}