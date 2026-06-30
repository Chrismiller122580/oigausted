'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { List, MessageCircle, Users, RefreshCw, ArrowRight } from 'lucide-react';
import { ADMIN_ASSISTANT_NAV_ITEMS } from '@/lib/admin-assistant-nav';

type OverviewStats = {
  ordersNeedingAttention: number;
  openSupportTickets: number;
  totalUsers: number;
  onlineUsers: number;
};

const QUICK_LINKS = ADMIN_ASSISTANT_NAV_ITEMS.filter((item) => item.href !== '/admin-assistant');

export default function AdminAssistantOverviewPage() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchOverview = useCallback(async (background = false) => {
    if (!background) setLoading(true);
    try {
      const res = await fetch('/api/admin-assistant/overview');
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
          <h1 className="text-3xl font-bold tracking-tight">Support & Ops Overview</h1>
          <p className="text-muted-foreground mt-2">
            Live snapshot of orders, support, and users across the platform.
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
        <Link href="/admin-assistant/orders">
          <Card className="hover:shadow-md transition h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <List className="h-4 w-4" /> Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats?.ordersNeedingAttention ?? '—'}</p>
              <p className="text-xs text-muted-foreground mt-1">Pending, paid, or in progress</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin-assistant/support">
          <Card className="hover:shadow-md transition h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <MessageCircle className="h-4 w-4" /> Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats?.openSupportTickets ?? '—'}</p>
              <p className="text-xs text-muted-foreground mt-1">Open support tickets</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin-assistant/users">
          <Card className="hover:shadow-md transition h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" /> Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats?.totalUsers ?? '—'}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Registered users
                {typeof stats?.onlineUsers === 'number' && stats.onlineUsers > 0 && (
                  <> · {stats.onlineUsers} online now</>
                )}
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