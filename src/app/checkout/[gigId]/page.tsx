'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import DynamicCheckoutFields from '@/components/DynamicCheckoutFields';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-hot-toast';

export default function CheckoutPage() {
  const params = useParams();
  const gigId = params.gigId as string;
  const router = useRouter();
  const { data: session } = useSession();

  const [gig, setGig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dynamicFields, setDynamicFields] = useState<any>({});
  const [calculatedPrice, setCalculatedPrice] = useState(0);

  useEffect(() => {
    fetch(`/api/gigs/${gigId}`)
      .then(r => r.json())
      .then(data => {
        setGig(data);
        setCalculatedPrice(Number(data.price || 0));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [gigId]);

  const handlePriceChange = (total: number, fields: any) => {
    setCalculatedPrice(total);
    setDynamicFields(fields);
  };

  const simulatePayment = async () => {
    if (!gig || !session?.user?.id) return toast.error("Falta información");

    const orderData = {
      gigId: gig.id,
      buyerId: session.user.id,
      sellerId: gig.sellerId,
      price: calculatedPrice,
      status: 'Pending',
      customFields: dynamicFields,
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      const result = await res.json();
      if (result.order?.id) {
        toast.success(`Orden creada`);
        router.push(`/orders/${result.order.id}`);
      }
    } catch (e) {
      toast.error("Error creando orden");
    }
  };

  if (loading || !gig) return <div className="p-20 text-center">Cargando...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-8">Checkout - {gig.title}</h1>

      <div className="grid md:grid-cols-5 gap-8">
        <div className="md:col-span-3 space-y-6">
          <Card>
            <CardHeader><CardTitle>Descripción del Servicio</CardTitle></CardHeader>
            <CardContent className="prose"><p>{gig.description}</p></CardContent>
          </Card>

          <DynamicCheckoutFields 
            gig={gig} 
            basePrice={Number(gig.price)} 
            onPriceChange={handlePriceChange} 
          />
        </div>

        <div className="md:col-span-2">
          <Card className="sticky top-6">
            <CardHeader><CardTitle>Resumen del Pedido</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-between text-3xl font-bold">
                <span>Precio Final</span>
                <span className="text-orange-600">${calculatedPrice.toLocaleString('es-CO')} COP</span>
              </div>

              <Button onClick={simulatePayment} className="w-full py-8 text-xl bg-orange-600 hover:bg-orange-700">
                Confirmar y Simular Pago
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
