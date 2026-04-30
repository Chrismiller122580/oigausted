'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ArrowLeft } from 'lucide-react';

export default function CheckoutPage({ params }: { params: { gigId: string } }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const gigId = params.gigId;

  const [gig, setGig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [buyerFields, setBuyerFields] = useState<any[]>([]);
  const [customData, setCustomData] = useState<Record<string, any>>({});
  const [totalPrice, setTotalPrice] = useState(0);

  useEffect(() => {
    if (status === "loading") return;

    fetch(`/api/gigs/${gigId}`)
      .then(res => res.json())
      .then(data => {
        setGig(data);
        setTotalPrice(data.price || 0);
        generateBuyerFields(data.category);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [gigId, status]);

  const generateBuyerFields = (category: string) => {
    let fields: any[] = [];

    if (category === 'Limpieza de Hogar y Oficinas') {
      fields = [
        { key: 'rooms', label: 'Número de habitaciones', type: 'number', placeholder: '3', priceImpact: 25000 },
        { key: 'bathrooms', label: 'Número de baños', type: 'number', placeholder: '2', priceImpact: 15000 },
        { key: 'deepClean', label: '¿Limpieza profunda?', type: 'checkbox', priceImpact: 40000 },
        { key: 'pets', label: '¿Hay mascotas?', type: 'checkbox', priceImpact: 10000 },
      ];
    } else if (category.includes('Transporte') || category.includes('Mudanzas') || category.includes('Delivery') || category.includes('Mensajería')) {
      fields = [
        { key: 'pickupAddress', label: 'Dirección de recogida', type: 'text' },
        { key: 'deliveryAddress', label: 'Dirección de entrega', type: 'text' },
        { key: 'packageSize', label: 'Tamaño del paquete', type: 'select', options: ['Pequeño', 'Mediano', 'Grande'] },
        { key: 'urgent', label: '¿Entrega urgente?', type: 'checkbox', priceImpact: 35000 },
      ];
    } else if (category === 'Reparaciones y Mantenimiento del Hogar') {
      fields = [
        { key: 'problemType', label: 'Tipo de reparación', type: 'select', options: ['Eléctrica', 'Plomería', 'Pintura', 'Carpintería', 'Otra'] },
        { key: 'urgency', label: 'Urgencia', type: 'select', options: ['Hoy mismo', 'Esta semana', 'Normal'] },
      ];
    } 
    // Add more categories here later if needed

    setBuyerFields(fields);
  };

  const handleFieldChange = (key: string, value: any, priceImpact: number = 0) => {
    const newData = { ...customData, [key]: value };
    setCustomData(newData);

    let extra = 0;
    Object.keys(newData).forEach(k => {
      const field = buyerFields.find(f => f.key === k);
      if (field?.priceImpact && newData[k]) extra += field.priceImpact;
    });
    setTotalPrice((gig?.price || 0) + extra);
  };

  const handleCheckout = async () => {
    const userId = (session?.user as any)?.id;
    if (!userId) return alert("Debes iniciar sesión para continuar");

    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gigId,
          buyerId: userId,
          price: totalPrice,
          customFields: customData,
        }),
      });

      const order = await res.json();
      if (!res.ok) throw new Error(order.error || "Error creando orden");

      // For now, go to order detail (we'll connect Wompi next)
      router.push(`/orders/${order.id}`);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-xl">Cargando servicio...</div>;
  if (!gig) return <div className="min-h-screen flex items-center justify-center text-xl">Gig no encontrado</div>;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <Link href={`/gigs/${gigId}`} className="flex items-center gap-2 text-orange-600 mb-8 hover:underline">
        <ArrowLeft size={20} /> Volver al Gig
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Gig Summary */}
        <div>
          <h1 className="text-4xl font-bold mb-2">{gig.title}</h1>
          <p className="text-3xl font-bold text-orange-600 mb-8">
            ${totalPrice.toLocaleString('es-CO')} COP
          </p>

          {gig.imageUrl && (
            <img src={gig.imageUrl} className="w-full h-64 object-cover rounded-3xl mb-6" alt={gig.title} />
          )}

          <p className="text-gray-700 leading-relaxed text-lg">{gig.description}</p>
        </div>

        {/* Buyer Requirements Form */}
        <div className="bg-white rounded-3xl p-10 border">
          <h2 className="text-2xl font-semibold mb-8">Personaliza tu pedido</h2>

          <div className="space-y-8">
            {buyerFields.map((field, i) => (
              <div key={i}>
                <label className="block text-sm font-medium mb-3">{field.label}</label>
                {field.type === 'number' && (
                  <input 
                    type="number" 
                    onChange={(e) => handleFieldChange(field.key, Number(e.target.value), field.priceImpact)} 
                    className="w-full px-5 py-4 border rounded-2xl text-lg" 
                    placeholder={field.placeholder} 
                  />
                )}
                {field.type === 'text' && (
                  <input 
                    type="text" 
                    onChange={(e) => handleFieldChange(field.key, e.target.value)} 
                    className="w-full px-5 py-4 border rounded-2xl" 
                  />
                )}
                {field.type === 'checkbox' && (
                  <label className="flex items-center gap-3 cursor-pointer py-3">
                    <input 
                      type="checkbox" 
                      onChange={(e) => handleFieldChange(field.key, e.target.checked, field.priceImpact)} 
                      className="w-5 h-5 accent-orange-600" 
                    />
                    <span>Sí</span>
                  </label>
                )}
                {field.type === 'select' && field.options && (
                  <select 
                    onChange={(e) => handleFieldChange(field.key, e.target.value)} 
                    className="w-full px-5 py-4 border rounded-2xl"
                  >
                    <option value="">Selecciona una opción</option>
                    {field.options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                )}
              </div>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t">
            <div className="flex justify-between items-center text-2xl font-semibold mb-8">
              <span>Total</span>
              <span className="text-orange-600">${totalPrice.toLocaleString('es-CO')}</span>
            </div>

            <button 
              onClick={handleCheckout}
              disabled={submitting}
              className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-semibold py-6 rounded-2xl text-xl transition-all"
            >
              {submitting ? 'Procesando...' : 'Continuar al Pago 💳'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
