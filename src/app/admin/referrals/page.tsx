'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ReferralSummary {
  referrer: {
    id: string;
    name: string;
    email: string;
  };
  referredCount: number;
  activeSellers: number;
  totalGenerated: number;
}

export default function AdminReferralsPage() {
  const [data, setData] = useState<ReferralSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    try {
      // For MVP we fetch all users with referredBy and aggregate client-side
      const res = await fetch('/api/admin/users?limit=1000'); // rough
      const json = await res.json();
      const users = json.users || [];

      const summaryMap = new Map();

      users.forEach((user: any) => {
        if (user.referredById) {
          const key = user.referredById;
          if (!summaryMap.has(key)) {
            summaryMap.set(key, {
              referrer: { id: key, name: 'Cargando...', email: '' },
              referredCount: 0,
              activeSellers: 0,
              totalGenerated: 0,
            });
          }
          const entry = summaryMap.get(key);
          entry.referredCount++;
          if (user.role === 'seller') entry.activeSellers++;
        }
      });

      // Fetch referrer names
      const referrerIds = Array.from(summaryMap.keys());
      if (referrerIds.length > 0) {
        const referrersRes = await fetch('/api/admin/users?ids=' + referrerIds.join(','));
        const referrersJson = await referrersRes.json();
        (referrersJson.users || []).forEach((r: any) => {
          if (summaryMap.has(r.id)) {
            summaryMap.get(r.id).referrer = { id: r.id, name: r.name || r.email, email: r.email };
          }
        });
      }

      setData(Array.from(summaryMap.values()));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Cargando datos de referidos...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Gestión de Referidos</h1>

      <Card>
        <CardHeader>
          <CardTitle>Resumen de Referidos</CardTitle>
        </CardHeader>
        <CardContent>
          {data.length === 0 ? (
            <p className="text-muted-foreground">Aún no hay referidos registrados.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Referidor</th>
                    <th className="text-left py-3 px-4">Email</th>
                    <th className="text-center py-3 px-4">Invitados</th>
                    <th className="text-center py-3 px-4">Vendedores Activos</th>
                    <th className="text-right py-3 px-4">Ingresos Generados (est.)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium">{row.referrer.name}</td>
                      <td className="py-3 px-4 text-muted-foreground">{row.referrer.email}</td>
                      <td className="py-3 px-4 text-center">{row.referredCount}</td>
                      <td className="py-3 px-4 text-center">{row.activeSellers}</td>
                      <td className="py-3 px-4 text-right font-medium">
                        ${(row.totalGenerated || 0).toLocaleString('es-CO')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 text-xs text-muted-foreground">
        Los datos se actualizan en tiempo real. Usa la búsqueda del navegador (Ctrl+F) para filtrar.
        <br />
        Los ingresos se generan automáticamente cuando los referidos completan pedidos pagados.
      </div>
    </div>
  );
}
