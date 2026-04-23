'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock } from 'lucide-react';

export default function GigDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();

  const [gig, setGig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      router.push(`/login?callbackUrl=/gigs/${params.id}`);
      return;
    }
    fetchGig();
  }, [session, status, params.id, router]);

  const fetchGig = async () => {
    try {
      const res = await fetch(`/api/gigs/${params.id}`);
      if (!res.ok) throw new Error("Gig no encontrado");
      const data = await res.json();
      setGig(data.gig || data);
    } catch (err: any) {
      setError(err.message || "Error al cargar el gig");
    } finally {
      setLoading(false);
    }
  };

  const handleBuyNow = () => {
    if (!gig) return;
    router.push(`/checkout/${gig.id}`);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-xl">Cargando gig...</div>;
  if (error || !gig) return <div className="min-h-screen flex items-center justify-center text-red-600">{error || "Gig no encontrado"}</div>;

  const userId = (session?.user as any)?.id;
  const isOwnGig = userId && (userId === gig.sellerId || userId === gig.seller?.id);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-6">
        <Link href="/gigs" className="flex items-center gap-2 text-emerald-600 hover:underline mb-8 inline-block">
          <ArrowLeft size={20} /> Volver a todos los gigs
        </Link>

        <div className="grid lg:grid-cols-5 gap-12">
          <div className="lg:col-span-3 space-y-10">
            {gig.imageUrl && (
              <div className="rounded-3xl overflow-hidden shadow-xl bg-white">
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
              <div className="flex flex-wrap items-center gap-4 text-gray-600">
                {gig.category && (
                  <span className="font-medium bg-emerald-100 text-emerald-700 px-4 py-1 rounded-full">
                    {gig.category}
                  </span>
                )}
                {gig.completionTime && (
                  <div className="flex items-center gap-1.5 bg-white px-4 py-1 rounded-full border">
                    <Clock className="w-5 h-5 text-emerald-600" />
                    <span className="font-medium">Entrega en {gig.completionTime}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-4">Descripción</h2>
              <p className="text-gray-700 leading-relaxed text-lg whitespace-pre-line">
                {gig.description || "Sin descripción"}
              </p>
            </div>

            {gig.fields && Object.keys(gig.fields).length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold mb-6">Detalles específicos del servicio</h2>
                <div className="grid gap-4">
                  {Object.entries(gig.fields).map(([key, value]) => (
                    <div key={key} className="bg-white p-6 rounded-3xl border">
                      <p className="text-sm uppercase tracking-widest text-gray-500 mb-1">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <p className="text-lg font-medium text-gray-900">
                        {String(value) || "No especificado"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl p-8 shadow-sm border sticky top-8">
              <div className="text-5xl sm:text-6xl font-bold text-emerald-600 mb-1">
                ${gig.price?.toLocaleString("es-CO")}
              </div>
              <p className="text-gray-500 mb-10">COP</p>

              {!isOwnGig ? (
                <Button
                  onClick={handleBuyNow}
                  size="lg"
                  className="w-full py-8 text-xl bg-emerald-600 hover:bg-emerald-700 rounded-3xl font-semibold mb-8"
                >
                  Comprar ahora
                </Button>
              ) : (
                <div className="bg-amber-50 border border-amber-200 text-amber-700 p-6 rounded-3xl mb-8 text-center font-medium">
                  Este es tu propio gig • No puedes comprarlo
                </div>
              )}

              <div className="border-t pt-8">
                <p className="text-sm text-gray-500 mb-3">Vendido por</p>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-3xl">
                    👤
                  </div>
                  <div>
                    <p className="font-semibold text-lg">
                      {gig.seller?.businessName || gig.seller?.name || "Vendedor"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
