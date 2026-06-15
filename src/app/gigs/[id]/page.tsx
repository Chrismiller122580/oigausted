'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock } from 'lucide-react';
import { parseJsonArrayField } from "@/lib/utils";
import { getAuthCallbackUrl } from "@/lib/getAuthCallbackUrl";
import { toast } from 'sonner';
import type { DynamicFieldDef } from '@/types/gig-fields';
import type { OrderReview } from '@/types/order';

interface GigDetail {
  id: string;
  title: string;
  description?: string;
  price: number;
  category: string;
  isActive?: boolean;
  fields?: unknown;
  addons?: unknown;
  sellerId?: string;
  imageUrl?: string | null;
  completionTime?: string | null;
  seller?: {
    id: string;
    name?: string | null;
    businessName?: string | null;
    slug?: string | null;
    rating?: number;
    reviewCount?: number;
  };
}

export default function GigDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();

  const [gig, setGig] = useState<GigDetail | null>(null);
  const [reviews, setReviews] = useState<OrderReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === "loading") return;
    fetchGig();
  }, [status, params.id]);

  const fetchGig = async () => {
    try {
      const res = await fetch(`/api/gigs/${params.id}`);
      if (!res.ok) throw new Error("Gig no encontrado");
      const data = await res.json();
      const loadedGig = data.gig || data;
      setGig(loadedGig);

      if (loadedGig && loadedGig.isActive === false) {
        setError('Este servicio está pausado temporalmente por el vendedor.');
      }

      // Load reviews for this seller (or this specific gig)
      if (loadedGig?.seller?.id) {
        const reviewsRes = await fetch(`/api/reviews?sellerId=${loadedGig.seller.id}&limit=4`);
        const reviewsData = await reviewsRes.json();
        setReviews(reviewsData.reviews || []);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al cargar el gig");
    } finally {
      setLoading(false);
    }
  };

  const handleBuyNow = () => {
    if (!gig) return;

    if (gig.isActive === false) {
      toast.error('Este servicio está pausado y no se puede comprar.');
      return;
    }

    if (!session?.user) {
      router.push(`/login?callbackUrl=${encodeURIComponent(getAuthCallbackUrl(`/gigs/${params.id}`))}`);
      return;
    }

    router.push(`/checkout/${gig.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Cargando servicio...</p>
        </div>
      </div>
    );
  }

  if (error || !gig) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-xl mb-4">{error || "Gig no encontrado"}</p>
          <Link href="/gigs" className="text-emerald-600 hover:underline">
            Volver al listado de gigs
          </Link>
        </div>
      </div>
    );
  }

  const userId = session?.user?.id;
  const isOwnGig = userId && (userId === gig.sellerId || userId === gig.seller?.id);

  const gigFields = parseJsonArrayField(gig?.fields);
  const gigAddons = parseJsonArrayField(gig?.addons);

  return (
    <div className="bg-background py-8">
      <div className="max-w-7xl mx-auto px-6">
        <Link href="/gigs" className="flex items-center gap-2 text-emerald-600 hover:underline mb-8 inline-block">
          <ArrowLeft size={20} /> Volver a todos los gigs
        </Link>

        <div className="grid lg:grid-cols-5 gap-12">
          <div className="lg:col-span-3 space-y-10">
            {gig.imageUrl && (
              <div className="rounded-3xl overflow-hidden shadow-xl bg-card">
                <img
                  src={gig.imageUrl}
                  alt={gig.title}
                  className="w-full aspect-video object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://placehold.co/800x450?text=Sin+Imagen';
                  }}
                />
              </div>
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
                {gig.description || "Sin descripción"}
              </p>
            </div>

            {/* Reviews Section */}
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
                    <div key={review.id || review.createdAt} className="bg-card border rounded-3xl p-6">
                      <div className="flex gap-1 text-xl mb-3">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <span key={n}>{n <= review.rating ? '⭐' : '☆'}</span>
                        ))}
                      </div>
                      {review.comment && (
                        <p className="text-foreground mb-4">"{review.comment}"</p>
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
                  {gigFields.map((field: DynamicFieldDef, index: number) => (
                    <div key={index} className="bg-card p-6 rounded-3xl border">
                      <p className="text-sm uppercase tracking-widest text-muted-foreground mb-1">
                        {field.label || field.key}
                      </p>
                      <p className="text-lg font-medium text-foreground">
                        {field.extraPrice 
                          ? `+$${field.extraPrice.toLocaleString('es-CO')} COP` 
                          : "Incluido"}
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
                ${gig.price?.toLocaleString("es-CO")}
              </div>
              <p className="text-muted-foreground mb-10">COP</p>

              {!isOwnGig ? (
                <Button
                  onClick={handleBuyNow}
                  size="lg"
                  className="w-full py-8 text-xl bg-emerald-600 hover:bg-emerald-700 rounded-3xl font-semibold mb-8"
                  disabled={gig.isActive === false}
                >
                  {gig.isActive === false ? 'Servicio pausado' : 'Comprar ahora'}
                </Button>
              ) : (
                <div className="bg-amber-50 border border-amber-200 text-amber-700 p-6 rounded-3xl mb-8 text-center font-medium">
                  Este es tu propio gig • No puedes comprarlo
                </div>
              )}

              <div className="border-t pt-8">
                <p className="text-sm text-muted-foreground mb-3">Vendido por</p>
                <Link href={`/sellers/${gig.seller?.slug || gig.seller?.id}`} className="group block">
                  <div className="flex items-center gap-4 hover:bg-muted -mx-2 px-2 py-2 rounded-2xl transition">
                    <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0">
                      👤
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-lg group-hover:text-emerald-600 transition">
                        {gig.seller?.businessName || gig.seller?.name || "Vendedor"}
                      </p>
                      {gig.seller?.rating && gig.seller.rating > 0 && (
                        <div className="flex items-center gap-1 text-sm text-amber-600">
                          ⭐ {gig.seller.rating.toFixed(1)}
                          {(gig.seller.reviewCount ?? 0) > 0 && (
                            <span className="text-muted-foreground">({gig.seller.reviewCount} reseñas)</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
