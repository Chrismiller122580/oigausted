'use client';

import { useEffect, useState } from 'react';

export default function AdminEarnings() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch('/api/admin/stats').then(r => r.json()).then(setStats);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-5xl font-bold mb-8">Ganancias de la Plataforma</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800">
            <p className="text-sm text-zinc-400">Ingresos Totales</p>
            <p className="text-6xl font-bold mt-2">${(stats?.totalRevenue || 0).toLocaleString('es-CO')}</p>
          </div>
          <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800">
            <p className="text-sm text-zinc-400">Ingresos Estimados Plataforma</p>
            <p className="text-6xl font-bold mt-2 text-emerald-400">${(stats?.platformRevenue || 0).toLocaleString('es-CO')}</p>
            <p className="text-xs text-amber-400 mt-1">
              + Referidos: ${(stats?.estimatedReferralRevenue || 0).toLocaleString('es-CO')}
            </p>
          </div>
        </div>
        <p className="mt-8 text-sm text-zinc-500">Datos reales extraídos de órdenes completadas.</p>
      </div>
    </div>
  );
}
