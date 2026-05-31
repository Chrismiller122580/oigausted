'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'react-hot-toast';
import { calculateOrderPayout, DEFAULT_PAYOUT_CONFIG, aggregatePayouts } from '@/lib/payout';

export default function AdminPayoutsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCompleted = async () => {
    try {
      const res = await fetch('/api/orders?role=seller'); // admin view
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      const completed = list.filter((o: any) => o.status === 'Completed');

      // Apply proper accounting
      const withBreakdown = completed.map((o: any) => {
        const breakdown = calculateOrderPayout(
          Number(o.price) || 0,
          !!o.seller?.referredById,
          DEFAULT_PAYOUT_CONFIG
        );
        return { ...o, breakdown };
      });

      setOrders(withBreakdown);
    } catch (e) {
      toast.error('Error cargando pagos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompleted();
  }, []);

  const markAsPaid = (orderId: string) => {
    // TODO: In production this should:
    // 1. Create a real Payout record
    // 2. Update order with payout status
    // 3. Mark related ReferralEarning as Paid if applicable
    setOrders(prev => prev.filter((o: any) => o.id !== orderId));
    toast.success('Pago marcado como realizado (beta - contabilidad corregida)');
  };

  const aggregated = aggregatePayouts(orders.map((o: any) => o.breakdown || { grossAmount: o.price || 0, platformFee: 0, referralFee: 0, netToSeller: o.price || 0, referralApplies: false, totalPlatformCost: 0 }));
  const totalNetToSellers = aggregated.netToSeller;
  const totalPlatformRevenue = aggregated.platformFee;
  const totalReferralLiability = aggregated.referralFee;

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold mb-2">Pagos a Vendedores</h1>
        <div className="text-zinc-400 mb-8 space-y-1">
          <div>
            Neto a pagar a vendedores: <span className="font-bold text-2xl text-emerald-400">${totalNetToSellers.toLocaleString('es-CO')}</span>
          </div>
          <div className="text-sm">
            Ingreso plataforma estimado: <span className="font-semibold text-amber-400">${totalPlatformRevenue.toLocaleString('es-CO')}</span> &nbsp;•&nbsp;
            Pasivo referidos: <span className="font-semibold">${totalReferralLiability.toLocaleString('es-CO')}</span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-zinc-400">Cargando pagos...</p>
            </div>
          </div>
        ) : orders.length === 0 ? (
          <Card className="bg-zinc-900 border-zinc-800 p-12 text-center">
            <p className="text-xl">No hay pagos pendientes en este momento.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <Card key={order.id} className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-lg">{order.gig?.title || 'Servicio'}</p>
                    <p className="text-sm text-zinc-400">
                      Vendedor: {order.seller?.businessName || order.seller?.name} • Comprador: {order.buyer?.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-emerald-400">${(order.breakdown?.netToSeller || order.price || 0).toLocaleString('es-CO')}</p>
                      <p className="text-xs text-zinc-400 line-through">${(order.price || 0).toLocaleString('es-CO')} bruto</p>
                      <p className="text-[10px] text-zinc-500">Neto a vendedor</p>
                    </div>
                    <Button onClick={() => markAsPaid(order.id)} className="bg-emerald-600 hover:bg-emerald-700">
                      Marcar como Pagado
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
