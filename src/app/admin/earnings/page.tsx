'use client';

import { useEffect, useState } from 'react';

export default function AdminEarnings() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch('/api/admin/stats').then(r => r.json()).then(setStats);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-5xl font-bold mb-8">Ganancias de la Plataforma</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card p-8 rounded-2xl border border-border">
            <p className="text-sm text-muted-foreground">Ingresos Totales</p>
            <p className="text-6xl font-bold mt-2">${(stats?.totalRevenue || 0).toLocaleString('es-CO')}</p>
          </div>
          <div className="bg-card p-8 rounded-2xl border border-border">
            <p className="text-sm text-muted-foreground">Ingresos Estimados Plataforma</p>
            <p className="text-6xl font-bold mt-2 text-emerald-400">${(stats?.platformRevenue || 0).toLocaleString('es-CO')}</p>
            <p className="text-xs text-amber-400 mt-1">
              + Referidos: ${(stats?.estimatedReferralRevenue || 0).toLocaleString('es-CO')}
            </p>
          </div>
        </div>
        <p className="mt-8 text-sm text-muted-foreground">Datos reales extraídos de órdenes completadas.</p>
      </div>
    </div>
  );
}
