'use client';

import { useEffect, useState } from 'react';
import { calculateOrderPayout, aggregatePayouts, DEFAULT_PAYOUT_CONFIG } from '@/lib/payout';

export default function AdminEarnings() {
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [earningsData, setEarningsData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try stats, fallback to direct computation from orders to "wire" the page
    Promise.all([
      fetch('/api/admin/stats').then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('/api/orders?view=all').then(r => r.ok ? r.json() : []).catch(() => []),
    ]).then(([statsData, ordersData]) => {
      const list = Array.isArray(ordersData) ? ordersData : [];
      const completed = list.filter((o: { status?: string }) => o.status === 'Completed');

      const breakdowns = completed.map((o: { price?: number; seller?: { referredById?: string | null } }) =>
        calculateOrderPayout(
          Number(o.price) || 0,
          !!o.seller?.referredById,
          DEFAULT_PAYOUT_CONFIG
        )
      );
      const aggregated = aggregatePayouts(breakdowns);

      setEarningsData({
        totalRevenue: aggregated.grossAmount,
        platformRevenue: aggregated.platformFee,
        estimatedReferralRevenue: aggregated.referralFee,
        netToSellers: aggregated.netToSeller,
        completedCount: completed.length,
      });

      if (statsData) {
        setStats(statsData);
      }
    }).finally(() => setLoading(false));
  }, []);

  const data = stats || earningsData || {};
  const num = (v: unknown) => Number(v) || 0;

  return (
    <div className="bg-background text-foreground">
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-5xl font-bold mb-8">Platform Earnings</h1>

        {loading ? (
          <div className="text-muted-foreground">Loading earnings data...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-card p-8 rounded-2xl border border-border">
                <p className="text-sm text-muted-foreground">Total Revenue (Gross)</p>
                <p className="text-5xl font-bold mt-2">${num(data.totalRevenue ?? data.grossAmount).toLocaleString('es-CO')}</p>
                <p className="text-xs text-muted-foreground mt-1">From {num(data.completedCount ?? data.completedOrders)} completed orders</p>
              </div>
              <div className="bg-card p-8 rounded-2xl border border-border">
                <p className="text-sm text-muted-foreground">Platform Revenue (Fees)</p>
                <p className="text-5xl font-bold mt-2 text-emerald-400">${num(data.platformRevenue).toLocaleString('es-CO')}</p>
                <p className="text-xs text-amber-400 mt-1">
                  + Referrals liability: ${num(data.estimatedReferralRevenue ?? data.referralFee).toLocaleString('es-CO')}
                </p>
              </div>
              <div className="bg-card p-8 rounded-2xl border border-border">
                <p className="text-sm text-muted-foreground">Net Payouts to Sellers</p>
                <p className="text-5xl font-bold mt-2">${num(data.netToSellers ?? data.pendingPayouts).toLocaleString('es-CO')}</p>
                <p className="text-xs text-muted-foreground mt-1">Real data from completed orders + payout calc</p>
              </div>
            </div>

            <div className="bg-card p-8 rounded-2xl border border-border">
              <h2 className="text-2xl font-semibold mb-4">Earnings Breakdown</h2>
              <p className="text-muted-foreground">
                Platform keeps commission on every completed order. Referral fees (when applicable) are tracked as platform liability but do not reduce seller net.
                See <a href="/admin/payouts" className="text-orange-600 hover:underline">Payouts</a> for pending/paid details and referral management.
              </p>
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="p-4 bg-muted/30 rounded-xl">
                  <div className="text-muted-foreground">Gross from buyers</div>
                  <div className="font-bold text-lg">${num(data.totalRevenue).toLocaleString('es-CO')}</div>
                </div>
                <div className="p-4 bg-muted/30 rounded-xl">
                  <div className="text-muted-foreground">Platform fees kept</div>
                  <div className="font-bold text-lg text-emerald-400">${num(data.platformRevenue).toLocaleString('es-CO')}</div>
                </div>
                <div className="p-4 bg-muted/30 rounded-xl">
                  <div className="text-muted-foreground">Referral liabilities</div>
                  <div className="font-bold text-lg">${num(data.estimatedReferralRevenue).toLocaleString('es-CO')}</div>
                </div>
                <div className="p-4 bg-muted/30 rounded-xl">
                  <div className="text-muted-foreground">Net to sellers (pending + paid)</div>
                  <div className="font-bold text-lg">${num(data.netToSellers ?? data.pendingPayouts).toLocaleString('es-CO')}</div>
                </div>
              </div>
            </div>
          </>
        )}

        <p className="mt-8 text-sm text-muted-foreground">Data computed from completed orders using the canonical payout calculator (see lib/payout.ts). Real-time via orders + referrals.</p>
      </div>
    </div>
  );
}
