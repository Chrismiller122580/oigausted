// src/app/checkout/[gigId]/CheckoutForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  gig: any;
  buyerId: string;
}

export default function CheckoutForm({ gig, buyerId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCheckout = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gigId: gig.id,
          price: gig.price,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al procesar la orden');
      }

      alert('¡Orden creada correctamente! Redirigiendo...');
      router.push('/orders');
    } catch (err: any) {
      setError(err.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-6">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border p-10">
        <h1 className="text-3xl font-bold mb-8">Confirmar Compra</h1>

        <div className="mb-10">
          <h2 className="text-2xl font-semibold">{gig.title}</h2>
          <p className="text-zinc-600 dark:text-zinc-400 mt-3 line-clamp-3">{gig.description}</p>
          
          <div className="mt-8 flex justify-between items-end">
            <div>
              <p className="text-sm text-zinc-500">Precio total</p>
              <p className="text-4xl font-bold text-orange-600">
                ${gig.price.toLocaleString()} COP
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-zinc-500">Vendedor</p>
              <p className="font-medium">{gig.seller?.businessName || gig.seller?.name}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6">
            {error}
          </div>
        )}

        <button
          onClick={handleCheckout}
          disabled={loading}
          className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-semibold py-4 rounded-2xl text-lg transition-all"
        >
          {loading ? 'Procesando...' : 'Confirmar y Pagar con Wompi'}
        </button>

        <p className="text-center text-xs text-zinc-500 mt-6">
          Pago seguro • Conexión directa con el vendedor
        </p>
      </div>
    </div>
  );
}
