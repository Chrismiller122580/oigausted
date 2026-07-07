'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users,
  Package,
  TrendingUp,
  DollarSign,
  RefreshCw,
  ArrowRight,
  Activity,
  BarChart3,
  Megaphone,
} from 'lucide-react';
import type { AnalyticsIntegration } from '@/lib/admin-analytics';
import { AnalyticsIntegrationsPanel } from '@/components/admin/AnalyticsIntegrationsPanel';
import { ANALYTICS_NAV_ITEMS } from '@/lib/analytics-nav';

interface AnalyticsStats {
  users?: number;
  sellers?: number;
  gigs?: number;
  activeGigs?: number;
  orders?: number;
  completedOrders?: number;
  totalRevenue?: number;
  platformRevenue?: number;
  onlineUsers?: number;
}

const QUICK_LINKS = ANALYTICS_NAV_ITEMS.filter((item) => item.href !== '/analytics');

export default function AnalyticsOverviewPage() {
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [integrations, setIntegrations] = useState<AnalyticsIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchOverview = useCallback(async (background = false) => {
    if (!background) setLoading(true);
    try {
      const [statsRes, integrationsRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/analytics/integrations'),
      ]);

      if (statsRes.ok) {
        setStats(await statsRes.json());
      }

      if (integrationsRes.ok) {
        const data = await integrationsRes.json();
        setIntegrations(data.integrations || []);
      }

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

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading analytics overview…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Overview</h1>
          <p className="text-muted-foreground mt-2">
            Site performance, market trends, and growth insights.
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <Users className="h-8 w-8 text-blue-400 mb-3" />
            <p className="text-sm text-muted-foreground">Total Users</p>
            <p className="text-3xl font-bold mt-1 tabular-nums">{stats?.users?.toLocaleString() ?? 0}</p>
            <p className="text-xs text-emerald-400 mt-1">{stats?.sellers ?? 0} sellers</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <Package className="h-8 w-8 text-orange-400 mb-3" />
            <p className="text-sm text-muted-foreground">Published Gigs</p>
            <p className="text-3xl font-bold mt-1 tabular-nums">{stats?.gigs ?? 0}</p>
            <p className="text-xs text-emerald-400 mt-1">{stats?.activeGigs ?? 0} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <TrendingUp className="h-8 w-8 text-purple-400 mb-3" />
            <p className="text-sm text-muted-foreground">Orders</p>
            <p className="text-3xl font-bold mt-1 tabular-nums">{stats?.orders ?? 0}</p>
            <p className="text-xs text-emerald-400 mt-1">{stats?.completedOrders ?? 0} completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <DollarSign className="h-8 w-8 text-green-400 mb-3" />
            <p className="text-sm text-muted-foreground">Gross Revenue</p>
            <p className="text-3xl font-bold mt-1 tabular-nums">
              ${(stats?.totalRevenue ?? 0).toLocaleString('es-CO')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Platform: ${(stats?.platformRevenue ?? 0).toLocaleString('es-CO')}
            </p>
          </CardContent>
        </Card>
      </div>

      {integrations.length > 0 && (
        <AnalyticsIntegrationsPanel integrations={integrations} />
      )}

      <div>
        <h2 className="text-lg font-semibold mb-4">Explore insights</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {QUICK_LINKS.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <Card className="hover:shadow-md transition h-full">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-orange-500" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      <Card className="border-dashed">
        <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <Activity className="h-5 w-5 text-orange-500 mt-0.5" />
            <div>
              <p className="font-medium">Daily trends & conversion funnel</p>
              <p className="text-sm text-muted-foreground">
                30-day signups, orders, revenue, and drop-off analysis.
              </p>
            </div>
          </div>
          <Button asChild variant="outline">
            <Link href="/analytics/analytics">
              Open Analytics <BarChart3 className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <Megaphone className="h-5 w-5 text-orange-500 mt-0.5" />
            <div>
              <p className="font-medium">Ads & audience insights</p>
              <p className="text-sm text-muted-foreground">
                Buyer funnel, segment sizes, and campaign history (read-only).
              </p>
            </div>
          </div>
          <Button asChild variant="outline">
            <Link href="/analytics/marketing">
              Marketing Insights <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}