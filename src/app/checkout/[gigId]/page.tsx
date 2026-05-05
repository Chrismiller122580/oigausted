'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'react-hot-toast';

export default function CheckoutPage() {
  const params = useParams();
  const gigId = params.gigId as string;
  const { data: session } = useSession();

  const [gig, setGig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [wompiReady, setWompiReady] = useState(false);

  // Load gig
  useEffect(() => {
    fetch(`/api/gigs/${gigId}`)
      .then(r => r.json())
      .then(setGig)
      .finally(() => setLoading(false));
  }, [gigId]);

  // Load Wompi - Very simple & reliable
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.wompi.co/widget.js';
    script.async = true;

    script.onload = () => {
      setTimeout(() => {
        if ((window as any).WompiCheckout) {
          setWompiReady(true);
          toast.success('✅ Wompi listo');
        }
      }, 1000);
    };

    document.head.appendChild(script);
  }, []);

  const handlePayment = () => {
    if (!wompiReady) return toast.error("Wompi aún cargando");

    const checkout = new (window as any).WompiCheckout({
      publicKey: 'pub_test_hhnHHaFm6UYVNyVRg8KdLOmC5wPZsQfZ', // hardcoded for testing
      amountInCents: gig.price * 100,
      currency: 'COP',
      reference: `test_${Date.now()}`,
      redirectUrl: `${window.location.origin}/orders/test`,
    });

    checkout.open();
  };

  if (loading) return <div className="p-20 text-center">Cargando...</div>;

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Checkout - {gig?.title}</h1>

      <Card>
        <CardContent className="p-10">
          <p className="text-5xl font-bold text-orange-600 mb-6">
            ${Number(gig?.price).toLocaleString('es-CO')} COP
          </p>

          <Button 
            onClick={handlePayment} 
            disabled={!wompiReady}
            className="w-full py-8 text-xl bg-green-600"
          >
            {wompiReady ? '💳 Pagar con Wompi' : '⏳ Cargando Wompi...'}
          </Button>

          <p className="text-center mt-4 text-sm">
            {wompiReady ? '✅ Wompi listo' : 'Esperando widget...'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}