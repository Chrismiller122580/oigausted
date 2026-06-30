'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Receipt, TrendingUp, RefreshCw, ArrowRight } from 'lucide-react';
import { ACCOUNTANT_NAV_ITEMS } from '@/lib/accountant-nav';

type OverviewStats = {
  pendingPayoutsNetCOP: number;
  pendingPayoutCount: number;
  pendingReferralsCOP: number;
  totalRevenueCOP: number;
  platformRevenueCOP: number;
  payoutsHealthy: boolean;
};

const QUICK_LINKS = ACCOUNTANT_NAV_ITEMS.filter(
  (item) => item.href !== '/accountant' && item.wired
);

export default function AccountantOverviewPage() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchOverview = useCallback(async (background = false) => {
    if (!background) setLoading(true);
    try {
      const res = await fetch('/api/accountant/overview');
      if (!res.ok) throw new Error('Failed to load overview');
      const data = await res.json();
      setStats(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error(error);
    } finally {
      if (!background) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
    const interval = setInterval(() => fetchOverview(true), 30000);
    return () => clearInterval(interval);
  }, [fetchOverview]);

  const formatCOP = (value: number) => `$${Math.round(value || 0).toLocaleString('es-CO')}`;

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading overview…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payroll & Finance Overview</h1>
          <p className="text-muted-foreground mt-2">
            Live snapshot of payouts, revenue, and referral liabilities.
            {lastUpdated && (
              <span className="block text-xs mt-1">
                Updated {lastUpdated.toLocaleTimeString('es-CO')}
              </span>
            )}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchOverview()} disabled={loading}>
          <RefreshCw size={14} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/accountant/payouts">
          <Card className="hover:shadow-md transition h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" /> Payouts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCOP(stats?.pendingPayoutsNetCOP ?? 0)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats?.pendingPayoutCount ?? 0} unpaid completed orders
                {stats?.payoutsHealthy === false && (
                  <span className="text-amber-600"> · needs attention</span>
                )}
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/accountant/users-finance">
          <Card className="hover:shadow-md transition h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Receipt className="h-4 w-4" /> Referrals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCOP(stats?.pendingReferralsCOP ?? 0)}</p>
              <p className="text-xs text-muted-foreground mt-1">Pending referral payouts</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/accountant/earnings">
          <Card className="hover:shadow-md transition h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCOP(stats?.totalRevenueCOP ?? 0)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Platform fees: {formatCOP(stats?.platformRevenueCOP ?? 0)}
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2">
            {QUICK_LINKS.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3 text-sm hover:bg-muted/50 transition"
                >
                  <span className="flex items-center gap-2 font-medium">
                    <Icon className="h-4 w-4 text-orange-600" />
                    {item.label}
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}