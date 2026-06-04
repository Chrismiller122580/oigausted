'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { calculateOrderPayout, DEFAULT_PAYOUT_CONFIG, aggregatePayouts } from '@/lib/payout';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

export default function AdminPayoutsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [referralPayouts, setReferralPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCompleted = async () => {
    try {
      const res = await fetch('/api/orders?view=all'); // admin view: all orders
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

      // Also fetch pending referral payouts for admin visibility
      const refRes = await fetch('/api/admin/referrals');
      if (refRes.ok) {
        const refs = await refRes.json();
        const pendingRefs = refs.filter((r: any) => r.pendingPayout > 0);
        setReferralPayouts(pendingRefs);
      }
    } catch (e) {
      toast.error('Error cargando pagos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompleted();
  }, []);

  const markAsPaid = async (orderId: string) => {
    const order = orders.find((o: any) => o.id === orderId);
    if (!order) return;

    try {
      // If seller had a referrer, mark their referral earnings as Paid
      if (order.seller?.referredById) {
        await fetch('/api/admin/referrals', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ referrerId: order.seller.referredById }),
        });
      }

      // Remove from UI list (in real: would update order payout status too)
      setOrders(prev => prev.filter((o: any) => o.id !== orderId));
      toast.success('Pago marcado como realizado. Referidos actualizados si aplicaba.');
    } catch (e) {
      toast.error('Error al marcar pago');
    }
  };

  const aggregated = aggregatePayouts(orders.map((o: any) => o.breakdown || { grossAmount: o.price || 0, platformFee: 0, referralFee: 0, netToSeller: o.price || 0, referralApplies: false, totalPlatformCost: 0 }));
  const totalNetToSellers = aggregated.netToSeller;
  const totalPlatformRevenue = aggregated.platformFee;
  const totalReferralLiability = aggregated.referralFee;

  const totalPendingReferrals = referralPayouts.reduce((sum: number, r: any) => sum + (r.pendingPayout || 0), 0);

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold mb-2">Pagos a Vendedores</h1>
        <div className="text-muted-foreground mb-8 space-y-1">
          <div>
            Neto a pagar a vendedores: <span className="font-bold text-2xl text-emerald-400">${totalNetToSellers.toLocaleString('es-CO')}</span>
          </div>
          <div className="text-sm">
            Ingreso plataforma estimado: <span className="font-semibold text-amber-400">${totalPlatformRevenue.toLocaleString('es-CO')}</span> &nbsp;•&nbsp;
            Pasivo referidos: <span className="font-semibold">${totalReferralLiability.toLocaleString('es-CO')}</span>
          </div>
          {totalPendingReferrals > 0 && (
            <div className="text-sm text-orange-600">
              Pendiente pago referidos (solicitados): <span className="font-semibold">${totalPendingReferrals.toLocaleString('es-CO')}</span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Cargando pagos...</p>
            </div>
          </div>
        ) : orders.length === 0 ? (
          <Card className="bg-card border-border p-12 text-center">
            <p className="text-xl">No hay pagos pendientes en este momento.</p>
          </Card>
        ) : (
          <ErrorBoundary>
          <div className="space-y-4">
            {orders.map(order => (
              <Card key={order.id} className="bg-card border-border">
                <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-lg">{order.gig?.title || 'Servicio'}</p>
                    <p className="text-sm text-muted-foreground">
                      Vendedor: {order.seller?.businessName || order.seller?.name} • Comprador: {order.buyer?.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-emerald-400">${(order.breakdown?.netToSeller || order.price || 0).toLocaleString('es-CO')}</p>
                      <p className="text-xs text-muted-foreground line-through">${(order.price || 0).toLocaleString('es-CO')} bruto</p>
                      <p className="text-[10px] text-muted-foreground">Neto a vendedor</p>
                    </div>
                    <Button onClick={() => markAsPaid(order.id)} className="bg-emerald-600 hover:bg-emerald-700">
                      Marcar como Pagado
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          </ErrorBoundary>
        )}

        {/* Referral Payouts Section */}
        {referralPayouts.length > 0 && (
          <div className="mt-10">
            <h2 className="text-2xl font-semibold mb-4">Pagos Pendientes por Referidos</h2>
            <div className="space-y-4">
              {referralPayouts.map((ref: any) => (
                <Card key={ref.referrer.id} className="bg-card border-border">
                  <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-lg">Referidor: {ref.referrer.name}</p>
                      <p className="text-sm text-muted-foreground">{ref.referrer.email}</p>
                      <p className="text-xs text-muted-foreground mt-1">Invitados: {ref.referredCount} • Generado: ${(ref.totalGenerated || 0).toLocaleString('es-CO')}</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-orange-600">${(ref.pendingPayout || 0).toLocaleString('es-CO')}</p>
                        <p className="text-xs text-muted-foreground">Pendiente / Solicitado</p>
                      </div>
                      <Button 
                        onClick={async () => {
                          try {
                            const res = await fetch('/api/admin/referrals', {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ referrerId: ref.referrer.id })
                            });
                            if (res.ok) {
                              toast.success('Pago de referidos marcado');
                              fetchCompleted(); // refresh both
                            } else {
                              toast.error('Error');
                            }
                          } catch {
                            toast.error('Error de conexión');
                          }
                        }}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        Marcar Referidos Pagados
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
