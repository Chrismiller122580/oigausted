'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Package, DollarSign, TrendingUp, AlertCircle, Clock, Tag } from 'lucide-react';

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
          <p>Cargando panel de administración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-5xl font-bold tracking-tight">Panel de Administración</h1>
          <p className="text-muted-foreground mt-2 text-xl">Vista general de OigaUsted • Datos en tiempo real</p>
          {stats?.wompiMode === 'sandbox' && (
            <div className="mt-4 p-4 bg-yellow-900/30 border border-yellow-600 rounded-2xl text-sm text-yellow-300 flex items-start gap-3">
              <span>⚠️</span>
              <div>
                <strong>Wompi en modo Sandbox (pruebas)</strong> — Los pagos no son reales. Cambia a llaves de producción (live) antes de lanzar con usuarios reales.
                {stats?.wompiWarning && <div className="text-xs mt-1 opacity-80">{stats.wompiWarning}</div>}
              </div>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-12">
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <Users className="h-8 w-8 text-blue-400 mb-3" />
              <p className="text-sm text-muted-foreground">Usuarios Totales</p>
              <p className="text-4xl font-bold mt-1">{stats?.users?.toLocaleString() || 0}</p>
              <p className="text-xs text-emerald-400 mt-1">{stats?.sellers || 0} vendedores</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <Package className="h-8 w-8 text-orange-400 mb-3" />
              <p className="text-sm text-muted-foreground">Gigs Publicados</p>
              <p className="text-4xl font-bold mt-1">{stats?.gigs || 0}</p>
              <p className="text-xs text-emerald-400 mt-1">{stats?.activeGigs || 0} activos</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <Tag className="h-8 w-8 text-indigo-400 mb-3" />
              <p className="text-sm text-muted-foreground">Categorías</p>
              <p className="text-4xl font-bold mt-1">{stats?.totalCategories || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">de servicios</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <TrendingUp className="h-8 w-8 text-purple-400 mb-3" />
              <p className="text-sm text-muted-foreground">Pedidos Totales</p>
              <p className="text-4xl font-bold mt-1">{stats?.orders || 0}</p>
              <p className="text-xs text-emerald-400 mt-1">{stats?.completedOrders || 0} completados</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <DollarSign className="h-8 w-8 text-green-400 mb-3" />
              <p className="text-sm text-muted-foreground">Ingresos Brutos</p>
              <p className="text-4xl font-bold mt-1">${(stats?.totalRevenue || 0).toLocaleString('es-CO')}</p>
              <p className="text-xs text-emerald-400 mt-1">
                Plataforma: ${(stats?.platformRevenue || 0).toLocaleString('es-CO')} 
                {stats?.estimatedReferralRevenue ? ` • Referidos: $${(stats.estimatedReferralRevenue).toLocaleString('es-CO')}` : ''}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <AlertCircle className="h-8 w-8 text-amber-400 mb-3" />
              <p className="text-sm text-muted-foreground">Pagos Pendientes</p>
              <p className="text-4xl font-bold mt-1">{stats?.pendingPayouts || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Órdenes completadas</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link href="/admin/users">
            <Card className="bg-card border-border hover:border-accent transition cursor-pointer h-full">
              <CardContent className="p-8">
                <Users className="h-10 w-10 text-blue-400 mb-4" />
                <h3 className="text-2xl font-semibold mb-2">Gestionar Usuarios</h3>
                <p className="text-muted-foreground">Cambiar roles, ver vendedores, buscar usuarios</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/gigs">
            <Card className="bg-card border-border hover:border-accent transition cursor-pointer h-full">
              <CardContent className="p-8">
                <Package className="h-10 w-10 text-orange-400 mb-4" />
                <h3 className="text-2xl font-semibold mb-2">Moderar Gigs</h3>
                <p className="text-muted-foreground">Pausar, eliminar o revisar servicios</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/categories">
            <Card className="bg-card border-border hover:border-accent transition cursor-pointer h-full">
              <CardContent className="p-8">
                <Tag className="h-10 w-10 text-indigo-400 mb-4" />
                <h3 className="text-2xl font-semibold mb-2">Gestionar Categorías</h3>
                <p className="text-muted-foreground">Crear/editar categorías y sus campos dinámicos de precio</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/payouts">
            <Card className="bg-card border-border hover:border-accent transition cursor-pointer h-full">
              <CardContent className="p-8">
                <DollarSign className="h-10 w-10 text-green-400 mb-4" />
                <h3 className="text-2xl font-semibold mb-2">Gestionar Pagos</h3>
                <p className="text-muted-foreground">Revisar y marcar pagos a vendedores</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Recent Activity Widget */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-purple-400" />
              <h2 className="text-2xl font-semibold">Actividad Reciente del Sistema</h2>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <button 
                onClick={() => fetchStats(true)} 
                className="text-orange-400 hover:underline"
                disabled={loading}
              >
                Refrescar
              </button>
              <Link href="/admin/audit" className="text-orange-400 hover:underline">
                Ver todo el historial →
              </Link>
            </div>
          </div>

          <Card className="bg-card border-border">
            <CardContent className="p-0">
              {recentActivity.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No hay actividad reciente.
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