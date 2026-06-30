'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { calculateOrderPayout, DEFAULT_PAYOUT_CONFIG, aggregatePayouts, type PayoutConfig } from '@/lib/payout';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import type { PayoutOrder, ReferralPayoutSummary } from '@/types/payout';
import type { PayoutAuditReport } from '@/lib/payout-audit';
import { useFinancePanel } from '@/hooks/useFinancePanel';

const LOCAL_STORAGE_KEY = 'adminManuallyPaidPayouts';

function readLocalPaidIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export default function AdminPayoutsPage() {
  const { canDeleteOrders } = useFinancePanel();
  const [orders, setOrders] = useState<PayoutOrder[]>([]);
  const [paidOrders, setPaidOrders] = useState<PayoutOrder[]>([]);
  const [referralPayouts, setReferralPayouts] = useState<ReferralPayoutSummary[]>([]);
  const [audit, setAudit] = useState<PayoutAuditReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [paidSearch, setPaidSearch] = useState('');
  const [localPaidIds, setLocalPaidIds] = useState<string[]>([]);
  const [syncingLocal, setSyncingLocal] = useState(false);

  const isDev = process.env.NODE_ENV === 'development';

  const clearAllOrders = async () => {
    if (!confirm('PERMANENTLY delete ALL orders (and related data like messages, files, reviews, referral earnings)? This is for launch cleanup only. Cannot be undone.')) return;
    try {
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
    } catch {
      toast.error('Error clearing orders');
    }
  };

  const fetchAudit = async () => {
    try {
      const res = await fetch('/api/admin/payouts/audit');
      if (res.ok) {
        const data = await res.json();
        setAudit(data);
      }
    } catch {
      // Non-fatal — page still works without audit banner
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

      const res = await fetch('/api/orders?view=all');
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      const completed = list.filter((o: PayoutOrder) => o.status === 'Completed');

      const withBreakdown = completed.map((o: PayoutOrder) => {
        const breakdown = calculateOrderPayout(
          Number(o.price) || 0,
          !!o.seller?.referredById,
          rates
        );
        return { ...o, breakdown };
      });

      const unpaid = withBreakdown.filter((o: PayoutOrder) => !o.sellerPayoutAt);
      setOrders(unpaid);

      const paid = withBreakdown.filter((o: PayoutOrder) => !!o.sellerPayoutAt);
      setPaidOrders(paid);

      const refRes = await fetch('/api/admin/referrals?limit=100');
      if (refRes.ok) {
        const json = await refRes.json();
        const refs = Array.isArray(json) ? json : (json.data || []);
        const pendingRefs = refs.filter((r: ReferralPayoutSummary) => (r.pendingPayout ?? 0) > 0);
        setReferralPayouts(pendingRefs);
      }

      setLocalPaidIds(readLocalPaidIds());
      await fetchAudit();
    } catch {
      toast.error('Error loading payouts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompleted();
  }, []);

  const syncLocalPayouts = async () => {
    const ids = readLocalPaidIds();
    if (ids.length === 0) {
      toast.error('No local payouts to sync');
      return;
    }
    if (!audit?.schema.sellerPayoutAt) {
      toast.error('Cannot sync — sellerPayoutAt column is missing. Apply migration first.');
      return;
    }
    if (!confirm(`Sync ${ids.length} payout(s) from browser storage to the database?`)) return;

    setSyncingLocal(true);
    let synced = 0;
    let failed = 0;

    for (const orderId of ids) {
      try {
        const res = await fetch(`/api/orders/${orderId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sellerPayoutAt: new Date().toISOString() }),
        });
        if (res.ok) synced++;
        else failed++;
      } catch {
        failed++;
      }
    }

    if (synced > 0) {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      setLocalPaidIds([]);
      toast.success(`Synced ${synced} payout(s) to database${failed ? ` (${failed} failed)` : ''}`);
      fetchCompleted();
    } else {
      toast.error('Failed to sync any payouts');
    }
    setSyncingLocal(false);
  };

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
    } catch {
      toast.error('Error deleting order');
    }
  };

  const markAsPaid = async (orderId: string, wompiRef?: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    const hasBank = !!(order.seller?.payoutAccountNumber && order.seller?.payoutBankCode);

    try {
      const payload: { sellerPayoutAt: string; wompiPayoutRef?: string } = { sellerPayoutAt: new Date().toISOString() };
      if (wompiRef?.trim()) {
        payload.wompiPayoutRef = wompiRef.trim();
      }

      const patchRes = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!patchRes.ok) {
        const err = await patchRes.json().catch(() => ({}));
        toast.error(err?.error || 'Could not save payout to database');
        return;
      }

      if (order.seller?.referredById) {
        await fetch('/api/admin/referrals', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ referrerId: order.seller.referredById }),
        }).catch(() => {});
      }

      try {
        const net = order.breakdown?.netToSeller || order.price || 0;
        const refPart = payload.wompiPayoutRef ? ` Wompi reference: ${payload.wompiPayoutRef}.` : '';
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

      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      const paidOrder = {
        ...order,
        sellerPayoutAt: new Date().toISOString(),
        wompiPayoutRef: payload.wompiPayoutRef || null,
      };
      setPaidOrders((prev) => [paidOrder, ...prev]);

      const mode = payload.wompiPayoutRef ? 'Wompi' : 'manual';
      const bankNote = hasBank ? '' : ' (seller bank details were missing)';
      toast.success(`Seller payout recorded (${mode}). Referrals updated.${bankNote}`);
      fetchAudit();
    } catch {
      toast.error('Error marking payout');
    }
  };

  const recordWompiPayout = async (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    const hasBank = !!(order.seller?.payoutAccountNumber && order.seller?.payoutBankCode);
    if (!hasBank) {
      const proceed = confirm('This seller has incomplete bank details. Record the payout anyway?');
      if (!proceed) return;
    }

    const ref = prompt(
      'Enter the Wompi payout / transfer reference (Pagos a Terceros). Optional but recommended.',
      ''
    );
    await markAsPaid(orderId, ref || undefined);
  };

  const aggregated = aggregatePayouts(
    orders.map((o) =>
      o.breakdown || {
        grossAmount: o.price || 0,
        platformFee: 0,
        referralFee: 0,
        netToSeller: o.price || 0,
        referralApplies: false,
        totalPlatformCost: 0,
      }
    )
  );
  const totalNetToSellers = aggregated.netToSeller;
  const totalPlatformRevenue = aggregated.platformFee;
  const totalReferralLiability = aggregated.referralFee;
  const totalPendingReferrals = referralPayouts.reduce((sum, r) => sum + (r.pendingPayout || 0), 0);

  const filteredPaid = paidOrders.filter((o) => {
    const term = paidSearch.toLowerCase();
    return (
      (o.gig?.title || '').toLowerCase().includes(term) ||
      (o.seller?.businessName || o.seller?.name || '').toLowerCase().includes(term) ||
      (o.buyer?.name || '').toLowerCase().includes(term) ||
      o.id.toLowerCase().includes(term)
    );
  });

  const schemaHealthy = audit?.schema.sellerPayoutAt && audit?.schema.wompiPayoutRef && audit?.schema.payoutBankColumns;
  const needsLocalSync = localPaidIds.length > 0 && audit?.schema.sellerPayoutAt;

  function renderHealthBanner() {
    if (!audit) return null;

    if (!schemaHealthy) {
      return (
        <Card className="mb-6 border-red-500/50 bg-red-950/20">
          <CardContent className="p-4">
            <p className="font-semibold text-red-400">Payout system blocked — database migration required</p>
            <ul className="mt-2 text-sm text-red-300/90 list-disc list-inside space-y-1">
              {audit.blockers
                .filter((b) => b.includes('column') || b.includes('migration'))
                .map((b) => (
                  <li key={b}>{b}</li>
                ))}
            </ul>
            <p className="text-xs text-muted-foreground mt-2">
              Redeploy with DIRECT_DATABASE_URL set so prisma migrate deploy runs on build.
            </p>
          </CardContent>
        </Card>
      );
    }

    if (needsLocalSync) {
      return (
        <Card className="mb-6 border-amber-500/50 bg-amber-950/20">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-amber-400">
                {localPaidIds.length} payout(s) saved only in this browser
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Sync them to the database so they persist across devices and refreshes.
              </p>
            </div>
            <Button onClick={syncLocalPayouts} disabled={syncingLocal} className="bg-amber-600 hover:bg-amber-700 shrink-0">
              {syncingLocal ? 'Syncing...' : 'Sync local payouts to DB'}
            </Button>
          </CardContent>
        </Card>
      );
    }

    if (audit.sellersMissingBank.length > 0) {
      return (
        <Card className="mb-6 border-amber-500/50 bg-amber-950/20">
          <CardContent className="p-4">
            <p className="font-semibold text-amber-400">
              Payout system ready — {audit.payouts.completedUnpaidCount} pending (${audit.payouts.completedUnpaidNetCOP.toLocaleString('es-CO')} COP)
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {audit.sellersMissingBank.length} seller(s) have pending payouts but incomplete bank details (see below).
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="mb-6 border-emerald-500/50 bg-emerald-950/20">
        <CardContent className="p-4">
          <p className="font-semibold text-emerald-400">
            Payout system healthy — {audit.payouts.completedUnpaidCount} pending (${audit.payouts.completedUnpaidNetCOP.toLocaleString('es-CO')} COP)
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {audit.payouts.completedPaidCount} paid • Schema OK • All pending sellers have bank details
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="bg-background text-foreground">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold mb-2">Seller Payouts</h1>
        <div className="text-muted-foreground mb-6 space-y-1">
          <div>
            Net to pay to sellers:{' '}
            <span className="font-bold text-2xl text-emerald-400">${totalNetToSellers.toLocaleString('es-CO')}</span>
          </div>
          <div className="text-sm">
            Estimated platform revenue:{' '}
            <span className="font-semibold text-amber-400">${totalPlatformRevenue.toLocaleString('es-CO')}</span>
            &nbsp;•&nbsp; Referral liability:{' '}
            <span className="font-semibold">${totalReferralLiability.toLocaleString('es-CO')}</span>
          </div>
          {totalPendingReferrals > 0 && (
            <div className="text-sm text-orange-600">
              Pending referral payouts:{' '}
              <span className="font-semibold">${totalPendingReferrals.toLocaleString('es-CO')}</span>
            </div>
          )}
        </div>

        {renderHealthBanner()}

        {!loading && audit && audit.sellersMissingBank.length > 0 && (
          <Card className="mb-8 border-amber-500/30">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Sellers missing bank details</h2>
              <div className="space-y-3">
                {audit.sellersMissingBank.map((seller) => (
                  <div
                    key={seller.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-muted/30"
                  >
                    <div>
                      <p className="font-medium">{seller.name || seller.email}</p>
                      <p className="text-sm text-muted-foreground">{seller.email}</p>
                      <p className="text-xs text-amber-600 mt-1">
                        Missing: {seller.missingFields.join(', ')}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold text-emerald-400">${seller.pendingNetCOP.toLocaleString('es-CO')}</p>
                        <p className="text-xs text-muted-foreground">{seller.pendingOrderCount} order(s)</p>
                      </div>
                      <Link href="/admin/users">
                        <Button size="sm" variant="outline">
                          View user
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full mx-auto mb-4" />
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
              {orders.map((order) => (
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
                        <p className="text-2xl font-bold text-emerald-400">
                          ${(order.breakdown?.netToSeller || order.price || 0).toLocaleString('es-CO')}
                        </p>
                        <p className="text-xs text-muted-foreground line-through">
                          ${(order.price || 0).toLocaleString('es-CO')} gross
                        </p>
                        <p className="text-[10px] text-muted-foreground">Net to seller</p>
                        {order.seller?.payoutAccountNumber && order.seller?.payoutBankCode ? (
                          <p className="text-[10px] text-emerald-600 mt-1">
                            Bank: {order.seller.payoutBankCode} • ****{String(order.seller.payoutAccountNumber).slice(-4)}
                          </p>
                        ) : (
                          <p className="text-[10px] text-amber-600 mt-1">Missing bank details</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button onClick={() => recordWompiPayout(order.id)} className="bg-emerald-600 hover:bg-emerald-700">
                          Pay via Wompi
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => markAsPaid(order.id)} className="text-xs">
                          Mark manual
                        </Button>
                        {canDeleteOrders && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteOrder(order.id, order.reference)}
                            className="text-xs"
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ErrorBoundary>
        )}

        {paidOrders.length > 0 && (
          <div className="mt-10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Paid Payouts History</h2>
              {isDev && canDeleteOrders && (
                <Button variant="destructive" onClick={clearAllOrders} className="text-sm">
                  Clear ALL Orders (dev only)
                </Button>
              )}
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
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        No matching paid payouts.
                      </td>
                    </tr>
                  ) : (
                    filteredPaid.map((order) => (
                      <tr key={order.id} className="border-t hover:bg-muted/30">
                        <td className="p-3">
                          <div className="font-medium">{order.gig?.title || 'Servicio'}</div>
                          <div className="text-xs text-muted-foreground">
                            {order.seller?.businessName || order.seller?.name}
                          </div>
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
          </div>
        )}

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
                      <p className="text-xs text-muted-foreground mt-1">
                        Referred: {ref.referredCount} • Generated: ${(ref.totalGenerated || 0).toLocaleString('es-CO')}
                      </p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-orange-600">
                          ${(ref.pendingPayout || 0).toLocaleString('es-CO')}
                        </p>
                        <p className="text-xs text-muted-foreground">Pending / Requested</p>
                      </div>
                      <Button
                        onClick={async () => {
                          try {
                            const res = await fetch('/api/admin/referrals', {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ referrerId: ref.referrer.id }),
                            });
                            if (res.ok) {
                              toast.success('Referral payout marked paid');
                              fetchCompleted();
                            } else {
                              toast.error('Error');
                            }
                          } catch {
                            toast.error('Connection error');
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