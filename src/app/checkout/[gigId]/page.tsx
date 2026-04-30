'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ArrowLeft } from 'lucide-react';

export default function CheckoutPage({ params }: { params: { gigId: string } }) {
  const router = useRouter();
  const { data: session } = useSession();
  const gigId = params.gigId;

  const [gig, setGig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [buyerFields, setBuyerFields] = useState<any[]>([]);
  const [customData, setCustomData] = useState<Record<string, any>>({});
  const [totalPrice, setTotalPrice] = useState(0);

  useEffect(() => {
    fetch(`/api/gigs/${gigId}`)
      .then(res => res.json())
      .then(data => {
        setGig(data);
        setTotalPrice(Number(data.price) || 0);
        generateBuyerFields(data.category);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [gigId]);

  const generateBuyerFields = (category: string) => {
    // Same fields as before (Limpieza, Transporte, etc.)
    let fields: any[] = [];
    if (category === 'Limpieza de Hogar y Oficinas') {
      fields = [
        { key: 'rooms', label: 'Número de habitaciones', type: 'number', placeholder: '3', priceImpact: 25000 },
        { key: 'bathrooms', label: 'Número de baños', type: 'number', placeholder: '2', priceImpact: 15000 },
        { key: 'deepClean', label: '¿Limpieza profunda?', type: 'checkbox', priceImpact: 40000 },
        { key: 'pets', label: '¿Hay mascotas?', type: 'checkbox', priceImpact: 10000 },
      ];
    }
    setBuyerFields(fields);
  };

  const handleFieldChange = (key: string, value: any, priceImpact: number = 0) => {
    const newData = { ...customData, [key]: value };
    setCustomData(newData);

    let extra = 0;
    Object.keys(newData).forEach(k => {
      const field = buyerFields.find(f => f.key === k);
      if (field?.priceImpact && (newData[k] === true || Number(newData[k]) > 0)) extra += field.priceImpact;
    });
    setTotalPrice((gig?.price || 0) + extra);
  };

  const handleCheckout = async () => {
    const userId = (session?.user as any)?.id;
    if (!userId) return alert("Por favor inicia sesión");

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gigId: gigId,
          buyerId: userId,
          price: totalPrice,
          customFields: customData,
        }),
      });

      const data = await res.json();
      console.log("Order response:", data);

      if (!res.ok) throw new Error(data.error || "Error al crear la orden");

      alert("✅ Orden creada correctamente!");
      router.push(`/orders/${data.id || data.orderId}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  if (!gig) return <div className="min-h-screen flex items-center justify-center">Gig no encontrado</div>;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <Link href={`/gigs/${gigId}`} className="flex items-center gap-2 text-orange-600 mb-8">← Volver al Gig</Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div>
          <h1 className="text-4xl font-bold">{gig.title}</h1>
          <p className="text-3xl font-bold text-orange-600 mt-4">${totalPrice.toLocaleString('es-CO')} COP</p>
          {gig.imageUrl && <img src={gig.imageUrl} className="mt-6 rounded-3xl" />}
        </div>

        <div className="bg-white p-10 rounded-3xl border">
          <h2 className="text-2xl font-semibold mb-8">Personaliza tu pedido</h2>

          {buyerFields.map((f, i) => (
            <div key={i} className="mb-6">
              <label className="block mb-2 font-medium">{f.label}</label>
              {f.type === 'number' && <input type="number" onChange={(e) => handleFieldChange(f.key, Number(e.target.value), f.priceImpact)} className="w-full p-4 border rounded-2xl" />}
              {f.type === 'checkbox' && (
                <label className="flex items-center gap-3">
                  <input type="checkbox" onChange={(e) => handleFieldChange(f.key, e.target.checked, f.priceImpact)} className="w-5 h-5" />
                  Sí
                </label>
              )}
            </div>
          ))}

          {error && <p className="text-red-600 mt-4">{error}</p>}

          <button onClick={handleCheckout} disabled={submitting} className="mt-8 w-full bg-orange-600 text-white py-6 rounded-2xl text-xl font-semibold">
            {submitting ? "Procesando..." : `Pagar $${totalPrice.toLocaleString('es-CO')}`}
          </button>
        </div>
      </div>
    </div>
  );
}
