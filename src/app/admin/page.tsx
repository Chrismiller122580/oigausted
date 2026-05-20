'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Package, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      setStats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Cargando panel de administración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-5xl font-bold tracking-tight">Panel de Administración</h1>
          <p className="text-zinc-400 mt-2 text-xl">Vista general de OigaUsted • Datos en tiempo real</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-12">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
              <Users className="h-8 w-8 text-blue-400 mb-3" />
              <p className="text-sm text-zinc-400">Usuarios Totales</p>
              <p className="text-4xl font-bold mt-1">{stats?.users?.toLocaleString() || 0}</p>
              <p className="text-xs text-emerald-400 mt-1">{stats?.sellers || 0} vendedores</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
              <Package className="h-8 w-8 text-orange-400 mb-3" />
              <p className="text-sm text-zinc-400">Gigs Publicados</p>
              <p className="text-4xl font-bold mt-1">{stats?.gigs || 0}</p>
              <p className="text-xs text-emerald-400 mt-1">{stats?.activeGigs || 0} activos</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
              <TrendingUp className="h-8 w-8 text-purple-400 mb-3" />
              <p className="text-sm text-zinc-400">Pedidos Totales</p>
              <p className="text-4xl font-bold mt-1">{stats?.orders || 0}</p>
              <p className="text-xs text-emerald-400 mt-1">{stats?.completedOrders || 0} completados</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
              <DollarSign className="h-8 w-8 text-green-400 mb-3" />
              <p className="text-sm text-zinc-400">Ingresos Brutos</p>
              <p className="text-4xl font-bold mt-1">${(stats?.totalRevenue || 0).toLocaleString('es-CO')}</p>
              <p className="text-xs text-emerald-400 mt-1">
                Plataforma: ${(stats?.platformRevenue || 0).toLocaleString('es-CO')} 
                {stats?.estimatedReferralRevenue ? ` • Referidos: $${(stats.estimatedReferralRevenue).toLocaleString('es-CO')}` : ''}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
              <AlertCircle className="h-8 w-8 text-amber-400 mb-3" />
              <p className="text-sm text-zinc-400">Pagos Pendientes</p>
              <p className="text-4xl font-bold mt-1">{stats?.pendingPayouts || 0}</p>
              <p className="text-xs text-zinc-500 mt-1">Órdenes completadas</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/admin/users">
            <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-600 transition cursor-pointer h-full">
              <CardContent className="p-8">
                <Users className="h-10 w-10 text-blue-400 mb-4" />
                <h3 className="text-2xl font-semibold mb-2">Gestionar Usuarios</h3>
                <p className="text-zinc-400">Cambiar roles, ver vendedores, buscar usuarios</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/gigs">
            <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-600 transition cursor-pointer h-full">
              <CardContent className="p-8">
                <Package className="h-10 w-10 text-orange-400 mb-4" />
                <h3 className="text-2xl font-semibold mb-2">Moderar Gigs</h3>
                <p className="text-zinc-400">Pausar, eliminar o revisar servicios</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/payouts">
            <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-600 transition cursor-pointer h-full">
              <CardContent className="p-8">
                <DollarSign className="h-10 w-10 text-green-400 mb-4" />
                <h3 className="text-2xl font-semibold mb-2">Gestionar Pagos</h3>
                <p className="text-zinc-400">Revisar y marcar pagos a vendedores</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}