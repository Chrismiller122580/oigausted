'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { calculateOrderPayout, DEFAULT_PAYOUT_CONFIG, aggregatePayouts, type PayoutConfig } from '@/lib/payout';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import type { PayoutOrder, ReferralPayoutSummary } from '@/types/payout';

export default function AdminPayoutsPage() {
  const [orders, setOrders] = useState<PayoutOrder[]>([]);
  const [paidOrders, setPaidOrders] = useState<PayoutOrder[]>([]);
  const [referralPayouts, setReferralPayouts] = useState<ReferralPayoutSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [paidSearch, setPaidSearch] = useState('');
  // Local persistence for marked-paid payouts (workaround while prod DB may be missing sellerPayoutAt column)
  // Prevents "old" payouts from reappearing on refresh until migration adds the column.
  const [manuallyMarkedPaid, setManuallyMarkedPaid] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('adminManuallyPaidPayouts');
        return saved ? new Set(JSON.parse(saved)) : new Set();
      } catch { return new Set(); }
    }
    return new Set();
  });

  const clearAllOrders = async () => {
    if (!confirm('PERMANENTLY delete ALL orders (and related data like messages, files, reviews, referral earnings)? This is for launch cleanup only. Cannot be undone.')) return;
    try {
      // Fetch ALL orders for admin cleanup (not just completed)
      const res = await fetch('/api/orders?view=all');
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.orders || []);
      let deleted = 0;
      for (const o of list) {
        try {
          const delRes = await fetch(`/api/orders/${o.id}`, { method: 'DELETE' });
          if (delRes.ok) deleted++;
        } catch {}
      }
      toast.success(`Cleared ${deleted} orders and related data`);
      fetchCompleted();
    } catch (e) {
      toast.error('Error clearing orders');
    }
  };

  const fetchCompleted = async () => {
    try {
      let rates: PayoutConfig = DEFAULT_PAYOUT_CONFIG;
      const configRes = await fetch('/api/admin/config').catch(() => null);
      if (configRes?.ok) {
        const cfg = await configRes.json();
        rates = {
          platformCommissionRate: cfg.commissionRate ?? DEFAULT_PAYOUT_CONFIG.platformCommissionRate,
          referralCommissionRate: cfg.referralCommissionRate ?? DEFAULT_PAYOUT_CONFIG.referralCommissionRate,
        };
      }

      const res = await fetch('/api/orders?view=all'); // admin view: all orders
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      const completed = list.filter((o: PayoutOrder) => o.status === 'Completed');

      // Always re-read the local persistence to avoid stale closure and ensure
      // previously-marked payouts do not reappear in the "to be marked" list on refresh/re-fetch.
      let currentMarked = manuallyMarkedPaid;
      if (typeof window !== 'undefined') {
        try {
          const saved = localStorage.getItem('adminManuallyPaidPayouts');
          if (saved) currentMarked = new Set(JSON.parse(saved));
        } catch {}
      }

      const withBreakdown = completed.map((o: PayoutOrder) => {
        const breakdown = calculateOrderPayout(
          Number(o.price) || 0,
          !!o.seller?.referredById,
          rates
        );
        return { ...o, breakdown };
      });

      // Only unpaid seller payouts in main list (persist via sellerPayoutAt)
      // Also exclude locally marked ones (for when DB column is missing in prod)
      const unpaid = withBreakdown.filter((o: PayoutOrder) => !o.sellerPayoutAt && !currentMarked.has(o.id));
      setOrders(unpaid);

      // Separate paid for history (searchable datatable)
      const paid = withBreakdown.filter((o: PayoutOrder) => !!o.sellerPayoutAt || currentMarked.has(o.id));
      setPaidOrders(paid);

      // Also fetch pending referral payouts for admin visibility
      const refRes = await fetch('/api/admin/referrals?limit=100');
      if (refRes.ok) {
        const json = await refRes.json();
        const refs = Array.isArray(json) ? json : (json.data || []);
        const pendingRefs = refs.filter((r: ReferralPayoutSummary) => (r.pendingPayout ?? 0) > 0);
        setReferralPayouts(pendingRefs);
      }
    } catch (e) {
      toast.error('Error loading payouts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompleted();
  }, []);

  const deleteOrder = async (orderId: string, reference?: string) => {
    if (!confirm(`Delete order ${orderId} (${reference || ''})? This will also remove related messages, files, reviews, and referral earnings. Cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/orders/${orderId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Order deleted');
        fetchCompleted();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to delete order');
      }
    } catch (e) {
      toast.error('Error deleting order');
    }
  };

  const markAsPaid = async (orderId: string, wompiRef?: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    const hasBank = !!(order.seller?.payoutAccountNumber && order.seller?.payoutBankCode);

    try {
      const payload: { sellerPayoutAt: string; wompiPayoutRef?: string } = { sellerPayoutAt: new Date().toISOString() };
      if (wompiRef && wompiRef.trim()) {
        payload.wompiPayoutRef = wompiRef.trim();
      }

      // Persist seller payout + optional Wompi ref on the order (best effort for column drift)
      const patchRes = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => null);

      if (!patchRes?.ok) {
        const err = await patchRes?.json().catch(() => ({}));
        toast.error(err?.error || 'No se pudo guardar el pago en la base de datos');
        return;
      }

      // If seller had a referrer, mark their referral earnings as Paid
      if (order.seller?.referredById) {
        await fetch('/api/admin/referrals', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ referrerId: order.seller.referredById }),
        }).catch(() => {});
      }

      // Notify seller (best effort)
      try {
        const net = order.breakdown?.netToSeller || order.price || 0;
        const refPart = payload.wompiPayoutRef ? ` Referencia Wompi: ${payload.wompiPayoutRef}.` : '';
        await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: order.sellerId,
            category: 'payment',
            type: 'in_app',
            title: 'Pago enviado a tu cuenta',
            message: `Tu pago neto de $${net.toLocaleString('es-CO')} COP por "${order.gig?.title || 'el servicio'}" fue marcado como pagado vía Wompi.${refPart} Se acreditará en la cuenta registrada.`,
            link: `/orders/${orderId}`,
          }),
        }).catch(() => {});
      } catch {}

      // Move from pending to paid list
      setOrders(prev => prev.filter((o) => o.id !== orderId));
      const paidOrder = { ...order, sellerPayoutAt: new Date().toISOString(), wompiPayoutRef: payload.wompiPayoutRef || null };
      setPaidOrders(prev => [paidOrder, ...prev]);

      // Local persistence fallback
      const newMarked = new Set(manuallyMarkedPaid);
      newMarked.add(orderId);
      setManuallyMarkedPaid(newMarked);
      if (typeof window !== 'undefined') {
        localStorage.setItem('adminManuallyPaidPayouts', JSON.stringify([...newMarked]));
      }

      const mode = payload.wompiPayoutRef ? 'Wompi' : 'manual';
      const bankNote = hasBank ? '' : ' (seller bank details were missing)';
      toast.success(`Seller payout recorded (${mode}). Referrals updated.${bankNote}`);
    } catch (e) {
      toast.error('Error marking payout');
    }
  };

  // Convenience wrapper that asks for Wompi ref (the main path for "pay sellers using wompi")
  const recordWompiPayout = async (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    const hasBank = !!(order.seller?.payoutAccountNumber && order.seller?.payoutBankCode);
    if (!hasBank) {
      const proceed = confirm('Este vendedor no tiene datos bancarios completos en el sistema. ¿Deseas registrar el pago de todas formas (puedes agregar los datos después)?');
      if (!proceed) return;
    }

    const ref = prompt('Ingresa la referencia / ID del payout en Wompi (Pagos a Terceros o transferencia). Esto se mostrará al vendedor y ayuda con la reconciliación. (Opcional pero recomendado)', '');
    // Allow empty ref (manual Wompi outside the app is still "using Wompi")
    await markAsPaid(orderId, ref || undefined);
  };

  const aggregated = aggregatePayouts(orders.map((o) => o.breakdown || { grossAmount: o.price || 0, platformFee: 0, referralFee: 0, netToSeller: o.price || 0, referralApplies: false, totalPlatformCost: 0 }));
  const totalNetToSellers = aggregated.netToSeller;
  const totalPlatformRevenue = aggregated.platformFee;
  const totalReferralLiability = aggregated.referralFee;

  const totalPendingReferrals = referralPayouts.reduce((sum: number, r) => sum + (r.pendingPayout || 0), 0);

  // Searchable paid payouts datatable
  const filteredPaid = paidOrders.filter((o) => {
    const term = paidSearch.toLowerCase();
    return (
      (o.gig?.title || '').toLowerCase().includes(term) ||
      (o.seller?.businessName || o.seller?.name || '').toLowerCase().includes(term) ||
      (o.buyer?.name || '').toLowerCase().includes(term) ||
      o.id.toLowerCase().includes(term)
    );
  });

  return (
    <div className="bg-background text-foreground">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold mb-2">Seller Payouts</h1>
        <div className="text-muted-foreground mb-8 space-y-1">
          <div>
            Net to pay to sellers: <span className="font-bold text-2xl text-emerald-400">${totalNetToSellers.toLocaleString('es-CO')}</span>
          </div>
          <div className="text-sm">
            Estimated platform revenue: <span className="font-semibold text-amber-400">${totalPlatformRevenue.toLocaleString('es-CO')}</span> &nbsp;•&nbsp;
            Referral liability: <span className="font-semibold">${totalReferralLiability.toLocaleString('es-CO')}</span>
          </div>
          {totalPendingReferrals > 0 && (
            <div className="text-sm text-orange-600">
              Pending referral payouts (requested): <span className="font-semibold">${totalPendingReferrals.toLocaleString('es-CO')}</span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading payouts...</p>
            </div>
          </div>
        ) : orders.length === 0 ? (
          <Card className="bg-card border-border p-12 text-center">
            <p className="text-xl">No pending payouts at this time.</p>
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
                      Seller: {order.seller?.businessName || order.seller?.name} • Buyer: {order.buyer?.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-emerald-400">${(order.breakdown?.netToSeller || order.price || 0).toLocaleString('es-CO')}</p>
                      <p className="text-xs text-muted-foreground line-through">${(order.price || 0).toLocaleString('es-CO')} gross</p>
                      <p className="text-[10px] text-muted-foreground">Net to seller</p>
                      {order.seller?.payoutAccountNumber && order.seller?.payoutBankCode ? (
                        <p className="text-[10px] text-emerald-600 mt-1">Banco: {order.seller.payoutBankCode} • ****{String(order.seller.payoutAccountNumber).slice(-4)}</p>
                      ) : (
                        <p className="text-[10px] text-amber-600 mt-1">⚠️ Sin datos bancarios</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button onClick={() => recordWompiPayout(order.id)} className="bg-emerald-600 hover:bg-emerald-700">
                        Pagar con Wompi
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => markAsPaid(order.id)} className="text-xs">
                        Marcar manual
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => deleteOrder(order.id, order.reference)} className="text-xs">
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          </ErrorBoundary>
        )}

        {/* Paid Payouts - Searchable Datatable */}
        {paidOrders.length > 0 && (
          <div className="mt-10">
            <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Paid Payouts History</h2>
            <Button variant="destructive" onClick={clearAllOrders} className="text-sm">
              Clear ALL Orders (Launch Cleanup)
            </Button>
          </div>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search paid payouts by gig, seller, buyer, id..."
                value={paidSearch}
                onChange={(e) => setPaidSearch(e.target.value)}
                className="w-full max-w-md px-4 py-2 border border-border rounded-xl bg-background text-sm"
              />
            </div>
            <div className="overflow-x-auto border border-border rounded-xl">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3">Gig / Seller</th>
                    <th className="text-left p-3">Buyer</th>
                    <th className="text-right p-3">Net Paid</th>
                    <th className="text-left p-3">Paid At</th>
                    <th className="text-left p-3">Wompi Ref</th>
                    <th className="text-left p-3">ID</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPaid.length === 0 ? (
                    <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No matching paid payouts.</td></tr>
                  ) : (
                    filteredPaid.map((order) => (
                      <tr key={order.id} className="border-t hover:bg-muted/30">
                        <td className="p-3">
                          <div className="font-medium">{order.gig?.title || 'Servicio'}</div>
                          <div className="text-xs text-muted-foreground">{order.seller?.businessName || order.seller?.name}</div>
                        </td>
                        <td className="p-3 text-muted-foreground">{order.buyer?.name}</td>
                        <td className="p-3 text-right font-bold text-emerald-400">
                          ${(order.breakdown?.netToSeller || order.price || 0).toLocaleString('es-CO')}
                        </td>
                        <td className="p-3 text-xs text-muted-foreground">
                          {order.sellerPayoutAt ? new Date(order.sellerPayoutAt).toLocaleDateString('es-CO') : '—'}
                        </td>
                        <td className="p-3 text-[10px] text-emerald-600 font-mono">{order.wompiPayoutRef || '—'}</td>
                        <td className="p-3 text-[10px] text-muted-foreground font-mono">{order.id.slice(0, 8)}…</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Searchable list of all marked seller payouts. Total paid out: use the history above.</p>
          </div>
        )}

        {/* Referral Payouts Section */}
        {referralPayouts.length > 0 && (
          <div className="mt-10">
            <h2 className="text-2xl font-semibold mb-4">Pending Referral Payouts</h2>
            <div className="space-y-4">
              {referralPayouts.map((ref) => (
                <Card key={ref.referrer.id} className="bg-card border-border">
                  <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-lg">Referrer: {ref.referrer.name}</p>
                      <p className="text-sm text-muted-foreground">{ref.referrer.email}</p>
                      <p className="text-xs text-muted-foreground mt-1">Referred: {ref.referredCount} • Generated: ${(ref.totalGenerated || 0).toLocaleString('es-CO')}</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-orange-600">${(ref.pendingPayout || 0).toLocaleString('es-CO')}</p>
                        <p className="text-xs text-muted-foreground">Pending / Requested</p>
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
                        Mark Referrals Paid
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
