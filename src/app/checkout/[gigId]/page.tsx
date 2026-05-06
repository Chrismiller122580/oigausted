'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'react-hot-toast';
import DynamicCheckoutFields from '@/components/DynamicCheckoutFields';

export default function CheckoutPage() {
  const params = useParams();
  const gigId = params.gigId as string;
  const router = useRouter();
  const { data: session } = useSession();

  const [gig, setGig] = useState<any>(null);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dynamicFields, setDynamicFields] = useState<any>({});

  useEffect(() => {
    fetch(`/api/gigs/${gigId}`)
      .then(r => r.json())
      .then(setGig)
      .finally(() => setLoading(false));
  }, [gigId]);

  useEffect(() => {
    if (!gig?.id || !session?.user) return;

    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gigId: gig.id,
        buyerId: (session.user as any).id,
        price: gig.price
      })
    })
      .then(r => r.json())
      .then(setOrder);
  }, [gig, session]);

  const simulatePayment = async () => {
    if (!order) return toast.error('Orden no creada');

    setSubmitting(true);
    try {
      await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'Completed',
          metadata: dynamicFields 
        })
      });

      toast.success('✅ Pago simulado con éxito');
      setTimeout(() => router.push(`/orders/${order.id}`), 1200);
    } catch (err) {
      toast.error('Error simulando pago');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-20 text-center text-2xl">Cargando checkout...</div>;

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

              <DynamicCheckoutFields gig={gig} onFieldsChange={setDynamicFields} />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-5">
          <Card className="sticky top-8">
            <CardContent className="p-10">
              <Button 
                onClick={simulatePayment}
                disabled={submitting || !order}
                className="w-full py-8 text-xl bg-orange-600 hover:bg-orange-700"
              >
                {submitting ? 'Procesando...' : '🔧 Simular Pago (Modo Desarrollo)'}
              </Button>

              {order && (
                <p className="text-center mt-6 text-sm text-green-600">
                  Orden creada: #{order.id}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
