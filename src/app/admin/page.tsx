'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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

  useEffect(() => {
    const eventSource = new EventSource('/api/admin/live');

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setStats(data);
    };

    return () => eventSource.close();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-bold">Panel de Administrador</h1>
          <p className="text-zinc-500 mt-2">Gestión completa • Datos en tiempo real</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3"><CardTitle className="text-zinc-400 text-sm">Usuarios Totales</CardTitle></CardHeader>
            <CardContent>
              <div className="text-5xl font-bold">{stats.users.toLocaleString()}</div>
            </CardContent>
          </Card>
          {/* more cards similar to before */}
        </div>
      </div>
    </div>
  );
}