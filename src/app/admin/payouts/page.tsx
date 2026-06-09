'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { calculateOrderPayout, DEFAULT_PAYOUT_CONFIG, aggregatePayouts } from '@/lib/payout';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

export default function AdminPayoutsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [paidOrders, setPaidOrders] = useState<any[]>([]);
  const [referralPayouts, setReferralPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [paidSearch, setPaidSearch] = useState('');

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

      // Only unpaid seller payouts in main list (persist via sellerPayoutAt)
      const unpaid = withBreakdown.filter((o: any) => !o.sellerPayoutAt);
      setOrders(unpaid);

      // Separate paid for history (searchable datatable)
      const paid = withBreakdown.filter((o: any) => !!o.sellerPayoutAt);
      setPaidOrders(paid);

      // Also fetch pending referral payouts for admin visibility
      const refRes = await fetch('/api/admin/referrals?limit=100');
      if (refRes.ok) {
        const json = await refRes.json();
        const refs = Array.isArray(json) ? json : (json.data || []);
        const pendingRefs = refs.filter((r: any) => r.pendingPayout > 0);
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

      // Persist seller payout on the order so it doesn't come back on refresh
      await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sellerPayoutAt: new Date().toISOString() }),
      });

      // Move from pending to paid list (for searchable history)
      setOrders(prev => prev.filter((o: any) => o.id !== orderId));
      const paidOrder = { ...order, sellerPayoutAt: new Date().toISOString() };
      setPaidOrders(prev => [paidOrder, ...prev]);
      toast.success('Payout marked as paid. Referrals updated if applicable. Moved to paid history.');
    } catch (e) {
      toast.error('Error marking payout');
    }
  };

  const aggregated = aggregatePayouts(orders.map((o: any) => o.breakdown || { grossAmount: o.price || 0, platformFee: 0, referralFee: 0, netToSeller: o.price || 0, referralApplies: false, totalPlatformCost: 0 }));
  const totalNetToSellers = aggregated.netToSeller;
  const totalPlatformRevenue = aggregated.platformFee;
  const totalReferralLiability = aggregated.referralFee;

  const totalPendingReferrals = referralPayouts.reduce((sum: number, r: any) => sum + (r.pendingPayout || 0), 0);

  // Searchable paid payouts datatable
  const filteredPaid = paidOrders.filter((o: any) => {
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
                    </div>
                    <Button onClick={() => markAsPaid(order.id)} className="bg-emerald-600 hover:bg-emerald-700">
                      Mark as Paid
                    </Button>
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
            <h2 className="text-2xl font-semibold mb-4">Paid Payouts History</h2>
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
                    <th className="text-left p-3">ID</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPaid.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No matching paid payouts.</td></tr>
                  ) : (
                    filteredPaid.map((order: any) => (
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
              {referralPayouts.map((ref: any) => (
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
