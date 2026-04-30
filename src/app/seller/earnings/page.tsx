'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, Calendar, Download } from 'lucide-react';

export default function SellerEarningsPage() {
  const { data: session } = useSession();
  const [earnings, setEarnings] = useState({
    total: 0,
    thisMonth: 0,
    pending: 0,
    completedGigs: 0,
  });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      // For now using mock data - later connect to real API
      setEarnings({
        total: 8450000,
        thisMonth: 2340000,
        pending: 890000,
        completedGigs: 23,
      });

      setTransactions([
        { id: 1, date: "15 Abr 2026", gig: "Limpieza profunda oficina", amount: 450000, status: "Pagado" },
        { id: 2, date: "08 Abr 2026", gig: "DJ para boda", amount: 1200000, status: "Pagado" },
        { id: 3, date: "02 Abr 2026", gig: "Sesión fotográfica", amount: 850000, status: "Pendiente" },
      ]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando ganancias...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-5xl font-bold">Mis Ganancias</h1>
            <p className="text-xl text-gray-600 mt-2">Resumen financiero como vendedor</p>
          </div>
          <Button className="flex items-center gap-2">
            <Download size={18} /> Descargar Reporte
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card>
            <CardContent className="p-8">
              <DollarSign className="w-12 h-12 text-green-600 mb-4" />
              <p className="text-sm text-gray-500">Total Ganado</p>
              <p className="text-4xl font-bold mt-2">${earnings.total.toLocaleString('es-CO')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <TrendingUp className="w-12 h-12 text-orange-600 mb-4" />
              <p className="text-sm text-gray-500">Este Mes</p>
              <p className="text-4xl font-bold mt-2">${earnings.thisMonth.toLocaleString('es-CO')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <div className="text-amber-600">
                <DollarSign className="w-12 h-12 mb-4" />
              </div>
              <p className="text-sm text-gray-500">Pendiente de Pago</p>
              <p className="text-4xl font-bold mt-2">${earnings.pending.toLocaleString('es-CO')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <Package className="w-12 h-12 text-blue-600 mb-4" />
              <p className="text-sm text-gray-500">Gigs Completados</p>
              <p className="text-4xl font-bold mt-2">{earnings.completedGigs}</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card>
          <CardContent className="p-10">
            <h3 className="text-2xl font-semibold mb-8">Historial de Pagos</h3>
            <div className="space-y-4">
              {transactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between border-b pb-6 last:border-0">
                  <div>
                    <p className="font-medium">{t.gig}</p>
                    <p className="text-sm text-gray-500">{t.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">+${t.amount.toLocaleString('es-CO')}</p>
                    <p className={`text-sm ${t.status === 'Pagado' ? 'text-green-600' : 'text-amber-600'}`}>
                      {t.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="mt-12 text-center text-gray-500">
          Próximamente: Retiros a cuenta bancaria y reportes detallados
        </div>
      </div>
    </div>
  );
}
