'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Package, DollarSign, TrendingUp, AlertCircle, Clock, Tag, BarChart3, MessageCircle, Megaphone } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastActivityUpdate, setLastActivityUpdate] = useState<Date | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  // Light auto-refresh for recent activity on dashboard (every 30s)
  useEffect(() => {
    const iv = setInterval(() => fetchStats(true), 30000);
    return () => clearInterval(iv);
  }, []);

  const fetchStats = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const [statsRes, activityRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/audit?limit=6')
      ]);

      const statsData = await statsRes.json();
      setStats(statsData);

      const activityData = await activityRes.json();
      setRecentActivity(activityData.logs || []);
      setLastActivityUpdate(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

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
        <div className="mb-10">
          <h1 className="text-5xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2 text-xl">Platform overview • Real-time data</p>
        </div>

        {/* Stats Grid - Clickable tiles wired to data pages */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6 mb-12">
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

          <Link href="/admin/reports">
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
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
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
                  {recentActivity.map((log: any, index: number) => (
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