import { notFound, redirect } from 'next/navigation';
import { BRAND_LOGO_PATH } from '@/lib/brand';
import Link from 'next/link';
import { headers } from 'next/headers';
import GigCard from '@/components/common/GigCard';
import { fetchPublicProfileGigs } from '@/lib/gig-showcase';
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import {
  canonicalSellerPath,
  findSellerBySlugOrId,
} from '@/lib/seller-profile';
import ProfileShare from './ProfileShare';
import SellerProfileMobileBar from './SellerProfileMobileBar';
import { StarRating } from '@/components/ui/star-rating';
import { UserAvatar } from '@/components/ui/user-avatar';

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await findSellerBySlugOrId(slug);

  const displayName = user?.businessName || user?.name || 'Vendedor';
  return {
    title: `${displayName} | OigaGIG`,
    description: `Conoce los servicios de ${displayName} en OigaGIG. Servicios locales confiables en Colombia.`,
    openGraph: {
      title: `${displayName} en OigaGIG`,
      description: `Descubre gigs y servicios ofrecidos por ${displayName}. Profesionales locales en Colombia.`,
      images: [{ url: BRAND_LOGO_PATH }],
    },
  };
}

export default async function PublicSellerProfile({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: identifier } = await params;

  const seller = await findSellerBySlugOrId(identifier);

  if (!seller) {
    notFound();
  }

  const canonicalPath = canonicalSellerPath(seller);
  const requested = decodeURIComponent(identifier).trim().toLowerCase();
  if (canonicalPath !== requested) {
    redirect(`/sellers/${canonicalPath}`);
  }

  const sellerId = seller.id;

  const gigs = await fetchPublicProfileGigs(sellerId);

  const reviews = await prisma.review.findMany({
    where: { sellerId },
    include: {
      reviewer: { select: { name: true, profilePicture: true } },
      order: { select: { gig: { select: { title: true } } } }
    },
    orderBy: { createdAt: 'desc' },
    take: 8
  });

  const avgRating = reviews.length > 0 
    ? reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / reviews.length
    : 0;

  const displayName = seller.businessName || seller.name || 'Vendedor Local';
  const sellerSlugOrId = seller.slug || seller.id;

  // Build the canonical public URL on the server (for the share client component)
  const headersList = await headers();
  const host = headersList.get('host') || 'oigagig.com';
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  const publicUrl = `${protocol}://${host}/sellers/${sellerSlugOrId}`;

  return (
    <div className="min-h-screen bg-background pb-32 md:pb-0 overflow-x-hidden">
      {/* Premium Header / Profile Banner - facelift style */}
      <div className="bg-gradient-to-br from-orange-600 via-red-600 to-rose-600 text-white py-8 sm:py-12 md:py-14 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff22_1px,transparent_1px)] [background-size:22px_22px]" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-5 sm:gap-8">
            {/* Avatar with facelift treatment */}
            <div className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-2xl sm:rounded-3xl bg-white/15 backdrop-blur-md overflow-hidden border-4 border-white/30 shadow-2xl flex-shrink-0 mx-auto md:mx-0">
              <UserAvatar
                src={seller.profilePicture}
                name={displayName}
                size="xl"
                className="w-full h-full rounded-none border-0 text-4xl sm:text-6xl"
              />
            </div>

            <div className="flex-1 min-w-0 w-full text-center md:text-left">
              <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold tracking-tight break-words leading-tight">
                {displayName}
              </h1>
              <div className="mt-2 inline-flex bg-white/20 backdrop-blur px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium items-center gap-1.5 border border-white/30">
                <StarRating rating={avgRating} size="sm" showValue reviewCount={reviews.length} className="text-white [&_span]:text-white [&_svg]:fill-white [&_svg]:text-white" />
              </div>

              <p className="text-white/90 mt-3 text-sm sm:text-lg md:text-xl">
                {seller.city
                  ? `${seller.city} • ${gigs.length} servicios activos`
                  : `Profesional local en Colombia • ${gigs.length} servicios activos`}
              </p>

              {seller.bio && (
                <p className="mt-3 sm:mt-4 max-w-2xl text-sm sm:text-base md:text-lg text-white/90 leading-relaxed mx-auto md:mx-0">
                  {seller.bio}
                </p>
              )}

              <p className="mt-4 text-sm text-white/80 max-w-xl mx-auto md:mx-0">
                Coordina con {displayName} usando el chat de OigaGIG — sin salir de la plataforma.
              </p>
            </div>

            <div className="hidden md:flex md:ml-auto flex-col gap-3 w-full md:w-auto">
              <Link href="/gigs" className="w-full md:w-auto">
                <Button variant="outline" className="border-white/70 text-white hover:bg-white/10 w-full md:w-auto">
                  Explorar más servicios
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <SellerProfileMobileBar firstGigId={gigs[0]?.id} hasGigs={gigs.length > 0} />

      {/* Gigs Grid */}
      <div id="seller-gigs" className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6 sm:mb-8">
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold break-words">Servicios de {displayName}</h2>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">Elige el que mejor se adapte a lo que necesitas</p>
          </div>
          {gigs.length > 0 && (
            <Link
              href={`/gigs?categoria=${encodeURIComponent(gigs[0]?.category || '')}`}
              className="text-orange-600 hover:underline text-sm shrink-0 !min-w-0 inline-flex items-center h-auto min-h-0 py-1"
            >
              Ver más →
            </Link>
          )}
        </div>

        {gigs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gigs.map((gig: (typeof gigs)[number]) => (
              <GigCard key={gig.id} gig={gig} showChatButton />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-card rounded-3xl border border-border">
            <p className="text-xl text-muted-foreground">Este vendedor aún no tiene servicios publicados.</p>
            <Link href="/gigs" className="text-orange-600 hover:underline text-sm mt-3 inline-block">
              Explora otros profesionales locales →
            </Link>
          </div>
        )}

        {/* Recent Reviews - facelift style */}
        {reviews.length > 0 && (
          <div className="mt-10 sm:mt-16">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-1 mb-6">
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Lo que dicen sus clientes</h3>
              <span className="text-sm text-muted-foreground">({reviews.length} reseñas recientes)</span>
            </div>
            <div className="grid md:grid-cols-2 gap-4 sm:gap-5">
              {reviews.map((review: (typeof reviews)[number]) => (
                <div key={review.id} className="testimonial-card border border-border/70 p-4 sm:p-6">
                  <div className="flex items-center gap-2 mb-3 text-amber-500 text-lg tracking-[1px]">
                    {[1,2,3,4,5].map(n => (
                      <span key={n}>{n <= review.rating ? '★' : '☆'}</span>
                    ))}
                  </div>

                  {review.comment && (
                    <p className="text-foreground mb-5 leading-relaxed text-[15px]">“{review.comment}”</p>
                  )}

                  <div className="mt-auto pt-4 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                      {review.reviewer?.profilePicture ? (
                        <img 
                          src={review.reviewer.profilePicture} 
                          alt="" 
                          className="w-5 h-5 rounded-full object-cover border flex-shrink-0" 
                        />
                      ) : (
                        <UserAvatar
                          src={review.reviewer?.profilePicture}
                          name={review.reviewer?.name}
                          size="sm"
                          className="w-5 h-5 text-[9px] flex-shrink-0"
                        />
                      )}
                      <span className="font-medium text-foreground truncate">{review.reviewer?.name || 'Cliente'}</span>
                    </div>

                    {review.order?.gig?.title && (
                      <div className="text-[10px] bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 px-2.5 py-0.5 rounded-full max-w-full truncate self-start sm:self-auto">
                        {review.order.gig.title}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Share & Spread section - helps sellers get more visibility */}
      <div className="border-t bg-muted/30 py-8 sm:py-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">¿Conoces a alguien que necesite estos servicios?</p>
          <div className="flex flex-wrap justify-center gap-3">
            <ProfileShare url={publicUrl} displayName={displayName} />
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="border-t py-6 sm:py-8 bg-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center text-sm text-muted-foreground">
          ¿Te gusta lo que ves? <Link href="/gigs" className="text-orange-600 hover:underline">Explora más servicios locales</Link> o publica tu propia necesidad en OigaGIG.
        </div>
      </div>
    </div>
  );
}
