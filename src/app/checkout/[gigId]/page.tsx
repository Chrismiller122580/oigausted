'use client';

import { useState, useEffect, useMemo } from 'react';
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
  const [formData, setFormData] = useState<Record<string, any>>({});

  const basePrice = Number(gig?.price || 0);

  const calculatedPrice = useMemo(() => {
    let total = basePrice;
    const allFields = [
      ...(gig?.fields || []),
      ...((gigCategories.find((c: any) => c.name === gig?.category) || {}).fields || [])
    ];

    allFields.forEach((field: any) => {
      const val = formData[field.key];
      if (val == null || val === '') return;
      const extra = Number(field.extraPrice || 0);
      if (extra === 0) return;

      if (field.type === 'checkbox' && val === true) total += extra;
      else if (field.type === 'number') total += extra * (Number(val) || 0);
    });
    return Math.round(total);
  }, [basePrice, formData, gig]);

  useEffect(() => {
    fetch(`/api/gigs/${gigId}`)
      .then(r => r.json())
      .then(data => {
        setGig(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [gigId]);

  const handleFieldChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const simulatePayment = async () => {
    if (!gig || !session?.user?.id) return toast.error("Falta información");

    const orderData = {
      gigId: gig.id,
      buyerId: session.user.id,
      sellerId: gig.sellerId,
      price: calculatedPrice,
      status: 'Pending',
      customFields: formData,
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      const result = await res.json();
      if (result.order?.id) {
        toast.success(`Orden creada #${result.order.id.slice(0,8)}`);
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
            formData={formData}
            onChange={handleFieldChange} 
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

import { gigCategories } from '@/lib/gig-categories';
