'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'react-hot-toast';

export default function CheckoutPage() {
  const params = useParams();
  const gigId = params.gigId as string;
  const router = useRouter();
  const { data: session } = useSession();

  const [gig, setGig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/gigs/${gigId}`)
      .then(r => r.json())
      .then(setGig)
      .finally(() => setLoading(false));
  }, [gigId]);

  const handleCheckout = async () => {
    if (!session?.user) {
      return toast.error('Debes iniciar sesión');
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gigId,
          buyerId: (session.user as any).id
        })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      // Redirect to Wompi Hosted Checkout
      window.location.href = data.checkoutUrl;
    } catch (error: any) {
      toast.error(error.message || 'Error al procesar el pago');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-20 text-center text-2xl">Cargando...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-8">Checkout - {gig?.title}</h1>

      <div className="grid lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7">
          <Card>
            <CardContent className="p-10">
              {gig?.imageUrl && <img src={gig.imageUrl} className="w-full h-64 object-cover rounded-3xl mb-8" />}
              <h2 className="text-4xl font-bold">{gig?.title}</h2>
              <p className="text-5xl font-bold text-orange-600 mt-4">
                ${Number(gig?.price).toLocaleString('es-CO')} COP
              </p>
              <p className="mt-6 text-gray-600 whitespace-pre-line">{gig?.description}</p>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-5">
          <Card className="sticky top-8">
            <CardContent className="p-10">
              <Button 
                onClick={handleCheckout} 
                disabled={submitting}
                className="w-full py-8 text-xl bg-green-600 hover:bg-green-700"
              >
                {submitting ? 'Redirigiendo a Wompi...' : '💳 Pagar con Wompi'}
              </Button>

              <p className="text-center mt-6 text-sm text-gray-500">
                Serás redirigido al portal seguro de Wompi
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}