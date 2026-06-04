import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import GigCard from '@/components/common/GigCard';
import { Button } from '@/components/ui/button';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { name: true, businessName: true }
  });

  const displayName = user?.businessName || user?.name || 'Vendedor';
  return {
    title: `${displayName} | OigaUsted`,
    description: `Conoce los servicios de ${displayName} en OigaUsted. Servicios locales en Colombia.`,
  };
}

export default async function PublicSellerProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const seller = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      businessName: true,
      bio: true,
      profilePicture: true,
      whatsapp: true,
      instagram: true,
      phone: true,
    }
  });

  if (!seller) {
    notFound();
  }

  const gigs = await prisma.gig.findMany({
    where: { sellerId: id },
    include: {
      seller: {
        select: {
          id: true,
          name: true,
          email: true,
          businessName: true,
          profilePicture: true,
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 12
  });

  const reviews = await prisma.review.findMany({
    where: { sellerId: id },
    include: {
      reviewer: { select: { name: true, profilePicture: true } },
      order: { select: { gig: { select: { title: true } } } }
    },
    orderBy: { createdAt: 'desc' },
    take: 8
  });

  const avgRating = reviews.length > 0 
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
    : 0;

  const displayName = seller.businessName || seller.name || 'Vendedor Local';
  const hasContact = seller.whatsapp || seller.instagram;

  return (
    <div className="min-h-screen bg-background">
      {/* Header / Profile Banner */}
      <div className="bg-gradient-to-br from-orange-600 via-red-600 to-rose-600 text-white py-12">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-3xl bg-card/20 backdrop-blur flex items-center justify-center overflow-hidden border-4 border-border/30 flex-shrink-0">
              {seller.profilePicture ? (
                <img src={seller.profilePicture} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-5xl font-bold opacity-90">{displayName[0]}</span>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-4xl md:text-5xl font-bold">{displayName}</h1>
                <div className="bg-card/20 px-4 py-1 rounded-full text-sm flex items-center gap-1">
                  ⭐ {avgRating.toFixed(1)} ({reviews.length} reseñas)
                </div>
              </div>

              <p className="text-white/90 mt-2 text-lg">
                Profesional local en Colombia • {gigs.length} servicios activos
              </p>

              {seller.bio && (
                <p className="mt-4 max-w-2xl text-white/90">{seller.bio}</p>
              )}

              {hasContact && (
                <div className="flex gap-3 mt-5">
                  {seller.whatsapp && (
                    <a 
                      href={`https://wa.me/${seller.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      className="bg-card text-orange-600 font-semibold px-5 py-2 rounded-2xl text-sm hover:bg-muted transition"
                    >
                      💬 WhatsApp
                    </a>
                  )}
                  {seller.instagram && (
                    <a 
                      href={`https://instagram.com/${seller.instagram.replace('@','')}`}
                      target="_blank"
                      className="border border-border/60 hover:bg-muted/10 px-5 py-2 rounded-2xl text-sm transition"
                    >
                      📷 Instagram
                    </a>
                  )}
                </div>
              )}

              {/* Share profile */}
              <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
                <span className="text-white/70">Compartir este perfil:</span>
                <a 
                  href={`https://wa.me/?text=${encodeURIComponent(`Mira los servicios de ${displayName} en OigaUsted`)}`}
                  target="_blank"
                  className="px-3 py-1 bg-card/20 hover:bg-card/30 rounded-xl text-xs transition"
                >
                  WhatsApp
                </a>
                <span className="text-white/50 text-xs">• Copia la URL del navegador para compartir</span>
              </div>
            </div>

            <div className="md:ml-auto">
              <Link href="/gigs">
                <Button variant="outline" className="border-border/70 text-foreground hover:bg-muted/10">
                  Ver todos los gigs
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {gigs.map((gig) => (
              <GigCard key={gig.id} gig={gig as any} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-card rounded-3xl border-border">
            <p className="text-2xl text-gray-400">Este vendedor aún no tiene gigs publicados.</p>
          </div>
        )}

        {/* Recent Reviews */}
        {reviews.length > 0 && (
          <div className="mt-16">
            <h3 className="text-2xl font-semibold mb-6 flex items-center gap-3">
              Reseñas de clientes <span className="text-base font-normal text-muted-foreground">({reviews.length} recientes)</span>
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              {reviews.map((review) => (
                <div key={review.id} className="bg-card border rounded-3xl p-6 hover:shadow-sm transition">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex gap-0.5 text-xl">
                      {[1,2,3,4,5].map(n => (
                        <span key={n}>{n <= review.rating ? '⭐' : '☆'}</span>
                      ))}
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString('es-CO')}
                    </span>
                  </div>

                  {review.comment && (
                    <p className="text-gray-700 mb-4 leading-relaxed">"{review.comment}"</p>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {review.reviewer?.profilePicture ? (
                        <img 
                          src={review.reviewer.profilePicture} 
                          alt="" 
                          className="w-6 h-6 rounded-full object-cover" 
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px]">👤</div>
                      )}
                      <span className="text-foreground font-medium">
                        {review.reviewer?.name || 'Cliente'}
                      </span>
                    </div>

                    {review.order?.gig?.title && (
                      <div className="text-[10px] bg-orange-50 text-orange-600 px-2.5 py-0.5 rounded-full">
                        {review.order.gig.title}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-center text-xs text-gray-400 mt-6">
              Mostrando las reseñas más recientes
            </p>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="border-t py-8 bg-card">
        <div className="max-w-4xl mx-auto px-6 text-center text-sm text-muted-foreground">
          ¿Te gusta lo que ves? <Link href="/gigs" className="text-orange-600 hover:underline">Explora más servicios locales</Link> o publica tu propia necesidad.
        </div>
      </div>
    </div>
  );
}
