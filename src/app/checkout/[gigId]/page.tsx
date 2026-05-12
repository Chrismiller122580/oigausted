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
    if (!gigId) return;
    fetch(`/api/gigs/${gigId}`)
      .then(res => res.json())
      .then(data => {
        setGig(data);
        setCalculatedPrice(Number(data.price || 0));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [gigId]);

  const handleFieldsChange = (fields: any, total: number) => {
    setDynamicFields(fields);
    setCalculatedPrice(total);
  };

  const simulatePayment = async () => {
    if (!session?.user?.id || !gig) return toast.error("Falta información");

    const orderData = {
      gigId: gig.id,
      buyerId: session.user.id,
      sellerId: gig.sellerId,
      price: calculatedPrice,           // ← Use the real calculated total
      status: 'Pending',
      customFields: dynamicFields,      // Save buyer selections
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      const result = await res.json();
      if (result.order?.id) {
        toast.success(`✅ Orden creada: ${result.order.id}`);
        router.push(`/orders/${result.order.id}`);
      } else {
        toast.error("Error al crear la orden");
      }
    } catch (err) {
      toast.error("Error en el servidor");
    }
  };

  if (loading) return <div className="p-20 text-center">Cargando gig...</div>;
  if (!gig) return <div className="p-20 text-center text-red-600">Gig no encontrado</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-2">Checkout - {gig.title}</h1>
      <p className="text-gray-600 mb-8">Revisa los detalles y confirma tu pedido</p>

      <div className="grid md:grid-cols-5 gap-8">
        {/* Left Column - Gig Info + Dynamic Fields */}
        <div className="md:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Descripción del Servicio</CardTitle>
            </CardHeader>
            <CardContent className="prose">
              <p>{gig.description}</p>
            </CardContent>
          </Card>

          <DynamicCheckoutFields 
            gig={gig} 
            basePrice={Number(gig.price)} 
            onFieldsChange={handleFieldsChange} 
          />
        </div>

        {/* Right Column - Summary */}
        <div className="md:col-span-2">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Resumen del Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-between text-xl">
                <span>Precio Final</span>
                <span className="font-bold text-orange-600">
                  ${calculatedPrice.toLocaleString('es-CO')} COP
                </span>
              </div>

              <Button 
                onClick={simulatePayment}
                className="w-full py-8 text-xl bg-orange-600 hover:bg-orange-700"
              >
                Confirmar y Simular Pago
              </Button>

              <p className="text-xs text-center text-gray-500">
                Esto es una simulación - el pago real se hará con Wompi
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
