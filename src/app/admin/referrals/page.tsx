'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ReferralSummary {
  referrer: {
    id: string;
    name: string;
    email: string;
  };
  referredCount: number;
  totalGenerated: number;
  earningsCount: number;
  effectiveReferralRate: number;
  customReferralRate: number | null;
  pendingPayout: number;
  paidOut: number;
  requestedAmount: number;
}

export default function AdminReferralsPage() {
  const [data, setData] = useState<ReferralSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    try {
      const res = await fetch('/api/admin/referrals');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Cargando datos de referidos...</div>;

  const totalReferrers = data.length;
  const totalReferred = data.reduce((sum, r) => sum + r.referredCount, 0);
  const totalGenerated = data.reduce((sum, r) => sum + (r.totalGenerated || 0), 0);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Gestión de Referidos</h1>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-card border rounded-2xl p-4">
          <div className="text-sm text-muted-foreground">Referidores activos</div>
          <div className="text-3xl font-bold mt-1">{totalReferrers}</div>
        </div>
        <div className="bg-card border rounded-2xl p-4">
          <div className="text-sm text-muted-foreground">Personas referidas</div>
          <div className="text-3xl font-bold mt-1">{totalReferred}</div>
        </div>
        <div className="bg-card border rounded-2xl p-4">
          <div className="text-sm text-muted-foreground">Comisiones generadas (total)</div>
          <div className="text-3xl font-bold mt-1 text-green-600">${totalGenerated.toLocaleString('es-CO')}</div>
        </div>
      </div>

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
                    <th className="text-center py-3 px-4">Ganado Total</th>
                    <th className="text-center py-3 px-4">Pendiente Pago</th>
                    <th className="text-center py-3 px-4">Pagado</th>
                    <th className="text-center py-3 px-4">Rate</th>
                    <th className="text-right py-3 px-4">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium">{row.referrer.name}</td>
                      <td className="py-3 px-4 text-muted-foreground">{row.referrer.email}</td>
                      <td className="py-3 px-4 text-center">{row.referredCount}</td>
                      <td className="py-3 px-4 text-center font-medium">${(row.totalGenerated || 0).toLocaleString('es-CO')}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={row.pendingPayout > 0 ? "text-orange-600 font-semibold" : ""}>
                          ${(row.pendingPayout || 0).toLocaleString('es-CO')}
                        </span>
                        {row.requestedAmount > 0 && <span className="ml-1 text-xs text-amber-500">(solicitado)</span>}
                      </td>
                      <td className="py-3 px-4 text-center text-green-600">${(row.paidOut || 0).toLocaleString('es-CO')}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-medium">
                          {((row.effectiveReferralRate || 0.05) * 100).toFixed(1)}%
                          {row.customReferralRate != null && (
                            <span className="ml-1 text-[9px]">(custom)</span>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {row.pendingPayout > 0 ? (
                          <Button 
                            size="sm" 
                            onClick={async () => {
                              try {
                                const res = await fetch('/api/admin/referrals', {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ referrerId: row.referrer.id })
                                });
                                if (res.ok) {
                                  toast.success('Marcado como pagado');
                                  window.location.reload();
                                } else {
                                  toast.error('Error al marcar');
                                }
                              } catch {
                                toast.error('Error de conexión');
                              }
                            }}
                          >
                            Marcar Pagado
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">Sin pendiente</span>
                        )}
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
