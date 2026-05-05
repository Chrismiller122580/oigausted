'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function CheckoutPage() {
  const params = useParams();
  const gigId = params.gigId as string;
  const { data: session } = useSession();

  const [gig, setGig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [wompiReady, setWompiReady] = useState(false);
  const [status, setStatus] = useState('Cargando Wompi...');

  useEffect(() => {
    fetch(`/api/gigs/${gigId}`)
      .then(r => r.json())
      .then(setGig)
      .finally(() => setLoading(false));
  }, [gigId]);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.wompi.co/widget.js';
    script.async = true;
    script.onload = () => {
      setTimeout(() => {
        if ((window as any).WompiCheckout) {
          setWompiReady(true);
          setStatus('✅ Wompi Listo');
        } else {
          setStatus('Error cargando Wompi');
        }
      }, 1500);
    };
    document.body.appendChild(script);
  }, []);

  const pay = async () => {
    if (!wompiReady || !gig) return alert("Espera que Wompi cargue");

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gigId: gig.id, price: gig.price })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const orderId = data.orderId || data.id;
      const checkout = new (window as any).WompiCheckout({
        publicKey: 'pub_test_hhnHHaFm6UYVNyVRg8KdLOmC5wPZsQfZ',
        amountInCents: Math.round(gig.price * 100),
        currency: 'COP',
        reference: `order_${orderId}`,
        redirectUrl: `${window.location.origin}/orders/${orderId}`,
      });

      checkout.open();
    } catch (e: any) {
      alert(e.message || 'Error');
    }
  };

  if (loading) return <div className="p-12 text-center text-2xl">Cargando...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-8">Checkout - {gig?.title}</h1>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7">
          <Card>
            <CardContent className="p-8">
              {gig?.imageUrl && <img src={gig.imageUrl} className="rounded-2xl mb-6 w-full h-64 object-cover" />}
              <h2 className="text-3xl font-bold">{gig?.title}</h2>
              <p className="text-5xl font-bold text-orange-600 my-4">
                ${Number(gig?.price).toLocaleString('es-CO')} COP
              </p>
              <p className="text-gray-600 whitespace-pre-line">{gig?.description}</p>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-5">
          <Card className="sticky top-6">
            <CardContent className="p-8">
              <Button onClick={pay} disabled={!wompiReady} className="w-full py-8 text-xl bg-green-600 hover:bg-green-700">
                💳 Pagar con Wompi
              </Button>

              <Button onClick={() => window.location.reload()} variant="outline" className="w-full mt-4">
                🔄 Recargar Página
              </Button>

              <p className="text-center mt-4 text-sm">{status}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
