import { notFound } from 'next/navigation';
import Link from 'next/link';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import GigCard from '@/components/common/GigCard';
import { Button } from '@/components/ui/button';
import { devLog } from '@/lib/utils';
import ProfileShare from './ProfileShare';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await findSellerBySlugOrId(slug);

  const displayName = user?.businessName || user?.name || 'Vendedor';
  return {
    title: `${displayName} | OigaUsted`,
    description: `Conoce los servicios de ${displayName} en OigaUsted. Servicios locales confiables en Colombia.`,
    openGraph: {
      title: `${displayName} en OigaUsted`,
      description: `Descubre gigs y servicios ofrecidos por ${displayName}. Profesionales locales en Colombia.`,
      images: [{ url: '/logo.png' }],
    },
  };
}

// Helper to support both slug (preferred, company name based) and legacy UUID id
async function findSellerBySlugOrId(identifier: string) {
  if (!identifier) return null;

  // Detect legacy ID-style access so we can completely avoid touching the 'slug' column
  // on prod DBs that are behind on migrations. This prevents "column User.slug does not exist"
  // prisma errors from appearing in Vercel logs for /sellers/<uuid> links.
  const looksLikeId = /^[0-9a-fA-F-]{8,}$/.test(identifier) || identifier.length > 20;

  // Always prefer ID lookup first when it looks like one (guaranteed column).
  // Use a select that deliberately omits 'slug'.
  if (looksLikeId) {
    try {
      const seller = await prisma.user.findUnique({
        where: { id: identifier },
        select: {
          id: true,
          name: true,
          businessName: true,
          // slug omitted here and in all ID paths to avoid referencing the column
          // when it doesn't exist in the current production database.
          bio: true,
          profilePicture: true,
          whatsapp: true,
          instagram: true,
          phone: true,
        }
      });
      if (seller) return seller;
    } catch (e) {
      devLog('Seller find by id failed (possible schema)', e);
    }
  }

  // Only attempt slug lookup for values that do not look like IDs.
  // Real slugs are human-friendly (e.g. "mi-tienda-local"). Querying WHERE slug = '<uuid>'
  // or selecting the column on a drifted DB produces the prisma error we see in logs.
  if (!looksLikeId) {
    try {
      const seller = await prisma.user.findUnique({
        where: { slug: identifier },
        select: {
          id: true,
          name: true,
          businessName: true,
          slug: true,
          bio: true,
          profilePicture: true,
          whatsapp: true,
          instagram: true,
          phone: true,
        }
      });
      if (seller) return seller;
    } catch (e) {
      devLog('Seller find by slug failed (column may be missing in prod DB - run prisma migrate deploy)', e);
    }
  }

  // Last attempt by id (for the case where the param did not look like an ID but ID lookup might still work)
  if (!looksLikeId) {
    try {
      const seller = await prisma.user.findUnique({
        where: { id: identifier },
        select: {
          id: true,
          name: true,
          businessName: true,
          // slug omitted for prod DB compatibility
          bio: true,
          profilePicture: true,
          whatsapp: true,
          instagram: true,
          phone: true,
        }
      });
      if (seller) return seller;
    } catch (e) {}
  }

  return null;
}

export default async function PublicSellerProfile({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: identifier } = await params;

  const seller = await findSellerBySlugOrId(identifier);

  if (!seller) {
    notFound();
  }

  const sellerId = seller!.id;

  const gigs = await prisma.gig.findMany({
    where: { sellerId },
    include: {
      seller: {
        select: {
          id: true,
          name: true,
          email: true,
          businessName: true,
          // slug omitted for prod DB compatibility
          profilePicture: true,
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 12
  });

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
    ? reviews.reduce((sum: any, r: any) => sum + r.rating, 0) / reviews.length 
    : 0;

  const displayName = seller.businessName || seller.name || 'Vendedor Local';
  const hasContact = seller.whatsapp || seller.instagram;

  // Use slug for URLs if available, fallback to id for backward compat.
  // Cast because ID-based lookup paths deliberately omit 'slug' from the Prisma select
  // (to avoid "column does not exist" errors on drifted prod DBs). Slug path includes it.
  const sellerSlugOrId = (seller as any).slug || seller.id;

  // Build the canonical public URL on the server (for the share client component)
  const headersList = await headers();
  const host = headersList.get('host') || 'oigagig.com';
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  const publicUrl = `${protocol}://${host}/sellers/${sellerSlugOrId}`;

  return (
    <div className="min-h-screen bg-background">
      {/* Premium Header / Profile Banner - facelift style */}
      <div className="bg-gradient-to-br from-orange-600 via-red-600 to-rose-600 text-white py-14 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff22_1px,transparent_1px)] [background-size:22px_22px]" />
        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
            {/* Avatar with facelift treatment */}
            <div className="w-28 h-28 md:w-32 md:h-32 rounded-3xl bg-white/15 backdrop-blur-md flex items-center justify-center overflow-hidden border-4 border-white/30 shadow-2xl flex-shrink-0">
              {seller.profilePicture ? (
                <img src={seller.profilePicture} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-6xl font-bold opacity-95">{displayName[0]}</span>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tighter">{displayName}</h1>
                <div className="bg-white/20 backdrop-blur px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5 border border-white/30">
                  ⭐ {avgRating.toFixed(1)} <span className="opacity-80">({reviews.length} reseñas)</span>
                </div>
              </div>

              <p className="text-white/90 mt-2 text-xl">
                Profesional local en Colombia • {gigs.length} servicios activos
              </p>

              {seller.bio && (
                <p className="mt-4 max-w-2xl text-lg text-white/90 leading-relaxed">{seller.bio}</p>
              )}

              {hasContact && (
                <div className="flex flex-wrap gap-3 mt-6">
                  {seller.whatsapp && (
                    <a 
                      href={`https://wa.me/${seller.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      className="bg-white text-orange-600 font-semibold px-6 py-3 rounded-2xl text-sm hover:bg-white/95 transition-all flex items-center gap-2 shadow-lg active:scale-[0.985]"
                    >
                      💬 Contactar por WhatsApp
                    </a>
                  )}
                  {seller.instagram && (
                    <a 
                      href={`https://instagram.com/${seller.instagram.replace('@','')}`}
                      target="_blank"
                      className="border-2 border-white/70 hover:bg-white/10 px-5 py-3 rounded-2xl text-sm font-medium transition flex items-center gap-2 backdrop-blur active:scale-[0.985]"
                    >
                      📷 Ver en Instagram
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className="md:ml-auto flex flex-col gap-3">
              <Link href="/gigs">
                <Button variant="outline" className="border-white/70 text-white hover:bg-white/10 w-full md:w-auto">
                  Explorar más servicios
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Gigs Grid */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold">Servicios de {displayName}</h2>
            <p className="text-muted-foreground mt-1">Elige el que mejor se adapte a lo que necesitas</p>
          </div>
          {gigs.length > 0 && (
            <Link href={`/gigs?categoria=${encodeURIComponent(gigs[0]?.category || '')}`} className="text-orange-600 hover:underline text-sm">
              Ver más →
            </Link>
          )}
        </div>

        {gigs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gigs.map((gig: any) => (
              <GigCard key={gig.id} gig={gig as any} />
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
          <div className="mt-16">
            <div className="flex items-end justify-between mb-6">
              <h3 className="text-3xl font-bold tracking-tight">Lo que dicen sus clientes</h3>
              <span className="text-sm text-muted-foreground">({reviews.length} reseñas recientes)</span>
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              {reviews.map((review: any) => (
                <div key={review.id} className="testimonial-card border border-border/70">
                  <div className="flex items-center gap-2 mb-3 text-amber-500 text-lg tracking-[1px]">
                    {[1,2,3,4,5].map(n => (
                      <span key={n}>{n <= review.rating ? '★' : '☆'}</span>
                    ))}
                  </div>

                  {review.comment && (
                    <p className="text-foreground mb-5 leading-relaxed text-[15px]">“{review.comment}”</p>
                  )}

                  <div className="mt-auto pt-4 border-t flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      {review.reviewer?.profilePicture ? (
                        <img 
                          src={review.reviewer.profilePicture} 
                          alt="" 
                          className="w-5 h-5 rounded-full object-cover border" 
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[9px]">👤</div>
                      )}
                      <span className="font-medium text-foreground">{review.reviewer?.name || 'Cliente'}</span>
                    </div>

                    {review.order?.gig?.title && (
                      <div className="text-[10px] bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 px-2.5 py-0.5 rounded-full">
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
      <div className="border-t bg-muted/30 py-10">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">¿Conoces a alguien que necesite estos servicios?</p>
          <div className="flex flex-wrap justify-center gap-3">
            <ProfileShare url={publicUrl} displayName={displayName} />
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="border-t py-8 bg-card">
        <div className="max-w-4xl mx-auto px-6 text-center text-sm text-muted-foreground">
          ¿Te gusta lo que ves? <Link href="/gigs" className="text-orange-600 hover:underline">Explora más servicios locales</Link> o publica tu propia necesidad en OigaUsted.
        </div>
      </div>
    </div>
  );
}
