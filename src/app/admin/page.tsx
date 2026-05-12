'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 1284,
    gigs: 342,
    orders: 156,
    revenue: 12400000,
    pendingSupport: 47,
    activeChats: 23
  });

  const [recentActivity, setRecentActivity] = useState<any[]>([
    { id: 1, action: "Nuevo gig creado", detail: "Limpieza Premium en Bogotá", time: "hace 12 min" },
    { id: 2, action: "Pedido completado", detail: "#A7K92 - $245.000", time: "hace 47 min" },
    { id: 3, action: "Usuario registrado", detail: "Maria Rodriguez", time: "hace 2 horas" },
  ]);

  const fetchLiveStats = async () => {
    // Simulate real API call (replace with real /api/admin/stats later)
    setStats(prev => ({
      ...prev,
      users: prev.users + Math.floor(Math.random() * 3),
      orders: prev.orders + Math.floor(Math.random() * 2),
      revenue: prev.revenue + Math.floor(Math.random() * 450000)
    }));
  };

  useEffect(() => {
    const interval = setInterval(fetchLiveStats, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-xl">⚡</div>
            <div>
              <h1 className="text-4xl font-bold">OigaUsted Admin</h1>
              <p className="text-zinc-500">Panel de Control • Datos en tiempo real</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="px-4 py-2">Administrador</Badge>
            <Button variant="outline">Cerrar Sesión</Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle className="text-zinc-400">Usuarios Totales</CardTitle></CardHeader>
            <CardContent>
              <div className="text-5xl font-bold">{stats.users.toLocaleString()}</div>
              <p className="text-emerald-500 text-sm mt-2">↑ 18 hoy</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle className="text-zinc-400">Gigs Publicados</CardTitle></CardHeader>
            <CardContent>
              <div className="text-5xl font-bold">{stats.gigs}</div>
              <p className="text-emerald-500 text-sm mt-2">↑ 7 hoy</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle className="text-zinc-400">Pedidos Totales</CardTitle></CardHeader>
            <CardContent>
              <div className="text-5xl font-bold">{stats.orders}</div>
              <p className="text-amber-500 text-sm mt-2">12 pendientes</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle className="text-zinc-400">Volumen este mes</CardTitle></CardHeader>
            <CardContent>
              <div className="text-5xl font-bold text-orange-500">
                ${(stats.revenue / 1000000).toFixed(1)}M
              </div>
              <p className="text-emerald-500 text-sm mt-2">+14% vs mes pasado</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle className="text-zinc-400">Soporte Pendiente</CardTitle></CardHeader>
            <CardContent>
              <div className="text-5xl font-bold text-red-500">{stats.pendingSupport}</div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="bg-zinc-900 border-zinc-800 mb-12">
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-3 border-b border-zinc-800 last:border-0">
                  <div>
                    <p className="font-medium">{item.action}</p>
                    <p className="text-sm text-zinc-500">{item.detail}</p>
                  </div>
                  <p className="text-xs text-zinc-500">{item.time}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle>Usuarios</CardTitle></CardHeader>
            <CardContent>
              <Button className="w-full mb-3">Ver Todos los Usuarios</Button>
              <Button variant="outline" className="w-full">Usuarios Suspendidos</Button>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle>Gigs</CardTitle></CardHeader>
            <CardContent>
              <Button className="w-full mb-3">Moderación de Gigs</Button>
              <Button variant="outline" className="w-full">Gigs Destacados</Button>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle>Reportes</CardTitle></CardHeader>
            <CardContent>
              <Button className="w-full mb-3">Exportar Reporte Mensual</Button>
              <Button variant="outline" className="w-full">Ver Disputas</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
