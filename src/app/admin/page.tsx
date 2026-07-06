'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Package, DollarSign, TrendingUp, AlertCircle, Clock, Tag, BarChart3, MessageCircle, Megaphone, RefreshCw, Activity, Zap, MapPin } from 'lucide-react';
import { useRealtimeNotifications } from '@/lib/useRealtimeNotifications';
import type { AuditLogEntry } from '@/types/audit';
import type { AnalyticsIntegration } from '@/lib/admin-analytics';
import { AnalyticsIntegrationsPanel } from '@/components/admin/AnalyticsIntegrationsPanel';
import { formatRelativeActive } from '@/lib/presence';
import { syncAdminStatsToNativeWidget } from '@/lib/admin-widget-bridge';

interface OnlineUser {
  id: string
  name: string | null
  email: string | null
  role: string
  staffRole: string | null
  lastActiveAt: string
}

interface AdminStats {
  users?: number
  sellers?: number
  gigs?: number
  activeGigs?: number
  orders?: number
  completedOrders?: number
  totalCategories?: number
  totalRevenue?: number
  platformRevenue?: number
  estimatedReferralRevenue?: number
  pendingPayouts?: number
  onlineUsers?: number
  onlineUsersList?: OnlineUser[]
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [integrations, setIntegrations] = useState<AnalyticsIntegration[]>([]);
  const [recentActivity, setRecentActivity] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastActivityUpdate, setLastActivityUpdate] = useState<Date | null>(null);

  const fetchStats = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const [statsRes, activityRes, integrationsRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/audit?limit=6'),
        fetch('/api/admin/analytics/integrations'),
      ]);

      const statsData = await statsRes.json();
      setStats(statsData);
      void syncAdminStatsToNativeWidget(statsData);

      const activityData = await activityRes.json();
      setRecentActivity(activityData.logs || []);

      if (integrationsRes.ok) {
        const integrationsData = await integrationsRes.json();
        setIntegrations(integrationsData.integrations || []);
      }

      setLastActivityUpdate(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  // Real-time updates via notifications SSE (instant refresh on relevant events)
  // + polling fallback every 10s for true real-time feel on admin dashboard
  useRealtimeNotifications({
    enableToasts: false, // avoid duplicate toasts in admin; we just want the trigger
    onNewNotification: () => {
      fetchStats(true); // background refresh on any new notification
    },
  });

  useEffect(() => {
    fetchStats();
  }, []);

  // Poll every 10s for real-time data (lightweight background updates)
  useEffect(() => {
    const iv = setInterval(() => fetchStats(true), 10000);
    return () => clearInterval(iv);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-2 text-xl">
              Platform overview • Real-time data (updates every ~10s + instant on events)
              {lastActivityUpdate && (
                <span className="ml-2 text-xs">• Last updated {lastActivityUpdate.toLocaleTimeString('es-CO')}</span>
              )}
            </p>
          </div>
          <button
            onClick={() => fetchStats()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-sm"
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh now
          </button>
        </div>

        {/* Stats Grid - Clickable tiles wired to data pages */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4 sm:gap-6 mb-12">
          <Link href="/admin/users?online=true">
            <Card className="bg-card border-border hover:border-emerald-500/50 hover:shadow-sm transition cursor-pointer h-full">
              <CardContent className="p-4 sm:p-6">
                <Zap className={`h-8 w-8 text-emerald-400 mb-3 ${(stats?.onlineUsers ?? 0) > 0 ? 'animate-pulse' : ''}`} />
                <p className="text-sm text-muted-foreground">Online Now</p>
                <p className="text-3xl sm:text-4xl font-bold mt-1 tabular-nums text-emerald-400">
                  {stats?.onlineUsers?.toLocaleString() ?? 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">active in last 5 min</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/users">
            <Card className="bg-card border-border hover:border-accent hover:shadow-sm transition cursor-pointer h-full">
              <CardContent className="p-4 sm:p-6">
                <Users className="h-8 w-8 text-blue-400 mb-3" />
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-3xl sm:text-4xl font-bold mt-1 tabular-nums">{stats?.users?.toLocaleString() || 0}</p>
                <p className="text-xs text-emerald-400 mt-1">{stats?.sellers || 0} sellers</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/gigs">
            <Card className="bg-card border-border hover:border-accent hover:shadow-sm transition cursor-pointer h-full">
              <CardContent className="p-4 sm:p-6">
                <Package className="h-8 w-8 text-orange-400 mb-3" />
                <p className="text-sm text-muted-foreground">Published Gigs</p>
                <p className="text-3xl sm:text-4xl font-bold mt-1 tabular-nums">{stats?.gigs || 0}</p>
                <p className="text-xs text-emerald-400 mt-1">{stats?.activeGigs || 0} active</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/categories">
            <Card className="bg-card border-border hover:border-accent hover:shadow-sm transition cursor-pointer h-full">
              <CardContent className="p-4 sm:p-6">
                <Tag className="h-8 w-8 text-indigo-400 mb-3" />
                <p className="text-sm text-muted-foreground">Categories</p>
                <p className="text-3xl sm:text-4xl font-bold mt-1 tabular-nums">{stats?.totalCategories || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">service categories</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/orders">
            <Card className="bg-card border-border hover:border-accent hover:shadow-sm transition cursor-pointer h-full">
              <CardContent className="p-4 sm:p-6">
                <TrendingUp className="h-8 w-8 text-purple-400 mb-3" />
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-3xl sm:text-4xl font-bold mt-1 tabular-nums">{stats?.orders || 0}</p>
                <p className="text-xs text-emerald-400 mt-1">{stats?.completedOrders || 0} completed</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/earnings">
            <Card className="bg-card border-border hover:border-accent hover:shadow-sm transition cursor-pointer h-full">
              <CardContent className="p-4 sm:p-6">
                <DollarSign className="h-8 w-8 text-green-400 mb-3" />
                <p className="text-sm text-muted-foreground">Gross Revenue</p>
                <p className="text-3xl sm:text-4xl font-bold mt-1 tabular-nums">${(stats?.totalRevenue || 0).toLocaleString('es-CO')}</p>
                <p className="text-xs text-emerald-400 mt-1">
                  Platform: ${(stats?.platformRevenue || 0).toLocaleString('es-CO')} 
                  {stats?.estimatedReferralRevenue ? ` • Referrals: $${(stats.estimatedReferralRevenue).toLocaleString('es-CO')}` : ''}
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/payouts">
            <Card className="bg-card border-border hover:border-accent hover:shadow-sm transition cursor-pointer h-full">
              <CardContent className="p-4 sm:p-6">
                <AlertCircle className="h-8 w-8 text-amber-400 mb-3" />
                <p className="text-sm text-muted-foreground">Pending Payouts</p>
                <p className="text-3xl sm:text-4xl font-bold mt-1 tabular-nums">{stats?.pendingPayouts || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Completed orders</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        <Card className="bg-card border-border mb-12">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Zap className="h-5 w-5 text-emerald-400" />
                Users Online Now
              </h2>
              <Link href="/admin/users?online=true" className="text-sm text-brand hover:underline">
                View all online →
              </Link>
            </div>

            {(stats?.onlineUsersList?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">No users online right now.</p>
            ) : (
              <div className="space-y-2">
                {stats?.onlineUsersList?.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/40 border border-border/60"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">{user.name || 'No name'}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-semibold capitalize text-emerald-400">
                        {user.role}
                        {user.staffRole ? ` · ${user.staffRole.replace('_', ' ')}` : ''}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {formatRelativeActive(user.lastActiveAt)}
                      </p>
                    </div>
                  </div>
                ))}
                {(stats?.onlineUsers ?? 0) > (stats?.onlineUsersList?.length ?? 0) && (
                  <p className="text-xs text-muted-foreground pt-1">
                    Showing {stats?.onlineUsersList?.length} of {stats?.onlineUsers} online users
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {integrations.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Zap className="h-5 w-5 text-brand" />
                Analytics integrations
              </h2>
              <Link href="/admin/analytics" className="text-sm text-brand hover:underline">
                Full analytics →
              </Link>
            </div>
            <AnalyticsIntegrationsPanel integrations={integrations} compact />
          </div>
        )}

        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-4 text-muted-foreground">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Link href="/admin/users">
            <Card className="bg-card border-border hover:border-accent transition cursor-pointer h-full">
              <CardContent className="p-8">
                <Users className="h-10 w-10 text-blue-400 mb-4" />
                <h3 className="text-2xl font-semibold mb-2">Manage Users</h3>
                <p className="text-muted-foreground">Change roles, view sellers, search users</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/gigs">
            <Card className="bg-card border-border hover:border-accent transition cursor-pointer h-full">
              <CardContent className="p-8">
                <Package className="h-10 w-10 text-orange-400 mb-4" />
                <h3 className="text-2xl font-semibold mb-2">Moderate Gigs</h3>
                <p className="text-muted-foreground">Pause, delete or review services</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/categories">
            <Card className="bg-card border-border hover:border-accent transition cursor-pointer h-full">
              <CardContent className="p-8">
                <Tag className="h-10 w-10 text-indigo-400 mb-4" />
                <h3 className="text-2xl font-semibold mb-2">Manage Categories</h3>
                <p className="text-muted-foreground">Create/edit categories and their dynamic price fields</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/payouts">
            <Card className="bg-card border-border hover:border-accent transition cursor-pointer h-full">
              <CardContent className="p-8">
                <DollarSign className="h-10 w-10 text-green-400 mb-4" />
                <h3 className="text-2xl font-semibold mb-2">Manage Payouts</h3>
                <p className="text-muted-foreground">Review and mark seller payouts</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/mapa">
            <Card className="bg-card border-border hover:border-sky-500/50 hover:shadow-sm transition cursor-pointer h-full">
              <CardContent className="p-8">
                <MapPin className="h-10 w-10 text-sky-400 mb-4" />
                <h3 className="text-2xl font-semibold mb-2">Mapa</h3>
                <p className="text-muted-foreground">View gigs across Colombia on the live map</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/admin/analytics">
            <Card className="bg-card border-border hover:border-accent transition cursor-pointer h-full">
              <CardContent className="p-6 flex items-center gap-4">
                <Activity className="h-8 w-8 text-blue-400" />
                <div>
                  <div className="font-semibold">Analytics</div>
                  <div className="text-sm text-muted-foreground">Integrations, funnel, trends</div>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/reports">
            <Card className="bg-card border-border hover:border-accent transition cursor-pointer h-full">
              <CardContent className="p-6 flex items-center gap-4">
                <BarChart3 className="h-8 w-8 text-purple-400" />
                <div>
                  <div className="font-semibold">Reports</div>
                  <div className="text-sm text-muted-foreground">Statistics and exports</div>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/support">
            <Card className="bg-card border-border hover:border-accent transition cursor-pointer h-full">
              <CardContent className="p-6 flex items-center gap-4">
                <MessageCircle className="h-8 w-8 text-blue-400" />
                <div>
                  <div className="font-semibold">Support</div>
                  <div className="text-sm text-muted-foreground">Tickets and replies</div>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/settings">
            <Card className="bg-card border-border hover:border-accent transition cursor-pointer h-full">
              <CardContent className="p-6 flex items-center gap-4">
                <Tag className="h-8 w-8 text-amber-400" />
                <div>
                  <div className="font-semibold">Settings & Config</div>
                  <div className="text-sm text-muted-foreground">Commissions, maintenance, branding</div>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/marketing">
            <Card className="bg-card border-border hover:border-accent transition cursor-pointer h-full">
              <CardContent className="p-6 flex items-center gap-4">
                <Megaphone className="h-8 w-8 text-orange-400" />
                <div>
                  <div className="font-semibold">Marketing</div>
                  <div className="text-sm text-muted-foreground">Broadcasts, promos, system updates</div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Recent Activity Widget */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-purple-400" />
              <h2 className="text-2xl font-semibold">Recent System Activity</h2>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <button 
                onClick={() => fetchStats(true)} 
                className="text-orange-400 hover:underline"
                disabled={loading}
              >
                Refresh
              </button>
              <Link href="/admin/audit" className="text-orange-400 hover:underline">
                View full history →
              </Link>
            </div>
          </div>

          <Card className="bg-card border-border">
            <CardContent className="p-0">
              {recentActivity.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No recent activity.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {recentActivity.map((log, index: number) => (
                    <div key={index} className="px-6 py-4 flex items-start justify-between hover:bg-muted/50 transition">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">
                          {log.admin?.name || log.admin?.email || 'Admin'} 
                          <span className="text-muted-foreground font-normal"> • {log.action.replace(/_/g, ' ').toLowerCase()}</span>
                        </div>
                        {log.details && (
                          <div className="text-xs text-muted-foreground mt-1 truncate">
                            {log.targetType} {log.targetId ? `(${log.targetId.slice(0,8)}...)` : ''}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                        {new Date(log.createdAt).toLocaleTimeString('es-CO', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}