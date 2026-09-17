'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import OrderServiceDetails from '@/components/orders/OrderServiceDetails';
import {
  ClipboardList,
  CreditCard,
  MessageCircle,
} from 'lucide-react';
import { CategoryIcon } from '@/lib/icon-registry';
import type { OrderDetail } from '@/types/order';
import { getOrderStatusDisplayEs } from '@/lib/order-status';
import { buildWompiWidgetConfig } from '@/lib/wompi-widget';

function OrderDetailClient() {
  const params = useParams();
  const orderId = params.id as string;
  const { data: session } = useSession();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  const uid = session?.user?.id;
  const isBuyer = order?.buyerId === uid;
  const isSeller = order?.sellerId === uid;

  const refresh = async () => {
    const res = await fetch(`/api/orders/${orderId}`);
    const data = await res.json();
    const next = data.order || data;
    if (next?.id) setOrder(next);
    return next;
  };

  useEffect(() => {
    if (!orderId) return;
    refresh().catch(() => {}).finally(() => setLoading(false));
  }, [orderId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (document.querySelector('script[src*="checkout.wompi.co"]')) return;
    const script = document.createElement('script');
    script.src = 'https://checkout.wompi.co/widget.js';
    script.async = true;
    document.head.appendChild(script);
  }, []);

  const updateStatus = async (status: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Error actualizando estado');
      }
      toast.success(`Estado actualizado: ${status}`);
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error actualizando');
    }
  };

  const payNow = async () => {
    if (!order) return;
    setPaying(true);
    try {
      const res = await fetch('/api/checkout/wompi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'No se pudo iniciar el pago');

      const pubKey = data.publicKey || data.checkoutData?.publicKey || '';
      if (pubKey) {
        window.WOMPI_PUBLIC_KEY = pubKey;
        window.$wompi = window.$wompi || {};
        window.$wompi.publicKey = pubKey;
      }

      const WidgetCheckoutClass = window.WidgetCheckout || window.WompiCheckout;
      if (!WidgetCheckoutClass) {
        toast.error('El sistema de pagos aún está cargando. Intenta de nuevo.');
        return;
      }
      const checkout = new WidgetCheckoutClass(buildWompiWidgetConfig(data));
      checkout.open(async () => {
        await new Promise((r) => setTimeout(r, 1500));
        await fetch(`/api/orders/${orderId}/check-wompi`, { method: 'POST' }).catch(() => {});
        await refresh();
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al iniciar el pago.');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Cargando pedido...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center">
        <p className="text-2xl text-red-600 mb-4">Pedido no encontrado</p>
        <a href="/orders" className="text-orange-600 hover:underline">Volver a mis pedidos →</a>
      </div>
    );
  }

  const categoryName = order.gig?.category || '';

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-4">
        <a href="/orders" className="text-sm text-orange-600 hover:underline">
          ← Volver a mis pedidos
        </a>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 bg-card p-4 sm:p-6 rounded-xl border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-muted shrink-0">
            {categoryName ? (
              <CategoryIcon name={categoryName} className="h-10 w-10 object-contain" fallbackClassName="text-2xl" />
            ) : (
              <ClipboardList className="h-7 w-7 text-muted-foreground" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Pedido #{order.id.slice(0, 8)}</h1>
            <p className="text-xl text-foreground">{order.gig?.title}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {isBuyer ? 'Vendedor' : 'Comprador'}: {isBuyer ? (order.seller?.businessName || order.seller?.name) : (order.buyer?.name)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-brand tabular-nums">
            ${Number(order.price || 0).toLocaleString('es-CO')}
          </div>
          <div className="text-sm uppercase tracking-widest text-muted-foreground mt-1">
            {getOrderStatusDisplayEs(order.status)}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-12 gap-8">
        <div className="md:col-span-8">
          <Card>
            <CardHeader><CardTitle>Detalles del Servicio</CardTitle></CardHeader>
            <CardContent className="space-y-4 pt-6">
              <OrderServiceDetails
                order={order}
                isBuyer={!!isBuyer}
                onOrderUpdated={(updated) => setOrder(updated)}
              />
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-4">
          <Card>
            <CardHeader><CardTitle>Acciones</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {isSeller && order.status === 'Pending' && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Esperando confirmación de pago del comprador.
                </p>
              )}
              {isSeller && order.status === 'Paid' && (
                <Button onClick={() => updateStatus('In Progress')} className="w-full bg-blue-600 hover:bg-blue-700">
                  Aceptar e Iniciar
                </Button>
              )}
              {isSeller && order.status === 'In Progress' && (
                <Button onClick={() => updateStatus('Completed')} className="w-full">
                  Marcar como Completado
                </Button>
              )}
              {isBuyer && order.status === 'Pending' && (
                <>
                  <Button
                    onClick={payNow}
                    disabled={paying}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <CreditCard className="h-4 w-4" />
                    {paying ? 'Abriendo pago...' : 'Pagar ahora con Wompi'}
                  </Button>
                  <Button
                    onClick={() => updateStatus('Cancelled')}
                    variant="outline"
                    className="w-full text-red-600 border-red-200 hover:bg-red-50"
                  >
                    Cancelar Pedido
                  </Button>
                </>
              )}
              <Button asChild variant="outline" className="w-full">
                <Link href={`/orders/${order.id}?tab=chat`}>
                  <MessageCircle className="h-4 w-4" />
                  Abrir chat
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Cargando pedido...</p>
      </div>
    }>
      <OrderDetailClient />
    </Suspense>
  );
}
