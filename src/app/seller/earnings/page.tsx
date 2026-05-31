'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import MapsPollutionNuke from '@/components/maps/MapsPollutionNuke';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, Calendar, Download, Package, Users } from 'lucide-react';
import { calculateOrderPayout, DEFAULT_PAYOUT_CONFIG } from '@/lib/payout';

export default function SellerEarningsPage() {
  const { data: session } = useSession();
  const [earnings, setEarnings] = useState({
    total: 0,
    thisMonth: 0,
    pending: 0,
    completedGigs: 0,
  });
  const [referralEarnings, setReferralEarnings] = useState({
    total: 0,
    pending: 0,
  });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      const res = await fetch('/api/orders?role=seller');
      const data = await res.json();
      const sellerOrders = Array.isArray(data) ? data : [];

      const completedOrders = sellerOrders.filter(o => o.status === 'Completed');

      // Proper accounting using centralized payout logic
      const completedWithBreakdown = completedOrders.map(o => {
        const breakdown = calculateOrderPayout(
          Number(o.price) || 0,
          !!o.seller?.referredById, // seller was referred → referral fee applies
          DEFAULT_PAYOUT_CONFIG
        );
        return { ...o, breakdown };
      });

      const aggregated = aggregatePayouts(completedWithBreakdown.map(o => o.breakdown));

      // This month net
      const now = new Date();
      const thisMonthOrders = completedWithBreakdown.filter(o =>
        new Date(o.createdAt).getMonth() === now.getMonth() &&
        new Date(o.createdAt).getFullYear() === now.getFullYear()
      );
      const thisMonthNet = aggregatePayouts(thisMonthOrders.map(o => o.breakdown)).netToSeller;

      // Pending gross (for display)
      const pendingAmount = sellerOrders
        .filter(o => o.status === 'Completed' && (o.paymentStatus !== 'Paid'))
        .reduce((sum, o) => sum + (Number(o.price) || 0), 0);

      setEarnings({
        total: aggregated.netToSeller,
        thisMonth: thisMonthNet,
        pending: pendingAmount,
        completedGigs: completedOrders.length,
        grossTotal: aggregated.grossAmount,
        platformFees: aggregated.platformFee,
        referralFees: aggregated.referralFee,
      } as any);

      // Build transaction list from completed orders
      const tx = completedOrders
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 15)
        .map(o => ({
          id: o.id,
          date: new Date(o.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }),
          gig: o.gig?.title || 'Servicio',
          amount: Number(o.price) || 0,
          status: o.paymentStatus === 'Paid' ? 'Pagado' : 'Pendiente',
        }));

      setTransactions(tx);

      // Fetch referral earnings
      const refRes = await fetch('/api/referrals');
      if (refRes.ok) {
        const refData = await refRes.json();
        setReferralEarnings({
          total: refData.stats?.totalEarned || 0,
          pending: refData.stats?.pendingEarnings || 0,
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Cargando ganancias...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <MapsPollutionNuke />
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-5xl font-bold text-foreground">Mis Ganancias</h1>
            <p className="text-xl text-muted-foreground mt-2">Resumen financiero como vendedor</p>
          </div>
          <Button className="flex items-center gap-2">
            <Download size={18} /> Descargar Reporte
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-12">
          <Card>
            <CardContent className="p-8">
              <DollarSign className="w-12 h-12 text-green-600 mb-4" />
              <p className="text-sm text-muted-foreground">Total Ganado</p>
              <p className="text-4xl font-bold mt-2 text-foreground">${(earnings.total || 0).toLocaleString('es-CO')}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Bruto: ${(earnings.grossTotal || 0).toLocaleString('es-CO')}
                {earnings.platformFees > 0 && (
                  <> • Plataforma: -${(earnings.platformFees || 0).toLocaleString('es-CO')}</>
                )}
                {earnings.referralFees > 0 && (
                  <> • Referidos: -${(earnings.referralFees || 0).toLocaleString('es-CO')}</>
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <TrendingUp className="w-12 h-12 text-orange-600 mb-4" />
              <p className="text-sm text-muted-foreground">Este Mes</p>
              <p className="text-4xl font-bold mt-2 text-foreground">${earnings.thisMonth.toLocaleString('es-CO')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <div className="text-amber-600">
                <DollarSign className="w-12 h-12 mb-4" />
              </div>
              <p className="text-sm text-muted-foreground">Pendiente de Pago</p>
              <p className="text-4xl font-bold mt-2 text-foreground">${earnings.pending.toLocaleString('es-CO')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <Package className="w-12 h-12 text-blue-600 mb-4" />
              <p className="text-sm text-muted-foreground">Gigs Completados</p>
              <p className="text-4xl font-bold mt-2 text-foreground">{earnings.completedGigs}</p>
            </CardContent>
          </Card>

          {/* Referral Earnings Card */}
          <Card className="border-emerald-200">
            <CardContent className="p-8">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-12 h-12 text-emerald-600" />
              </div>
              <p className="text-sm text-muted-foreground">Ganancias por Referidos</p>
              <p className="text-4xl font-bold mt-2 text-emerald-600">${referralEarnings.total.toLocaleString('es-CO')}</p>
              <p className="text-xs text-muted-foreground mt-1">Pendiente: ${referralEarnings.pending.toLocaleString('es-CO')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card>
          <CardContent className="p-10">
            <h3 className="text-2xl font-semibold mb-8 text-foreground">Historial de Pagos</h3>
            {transactions.length > 0 ? (
              <div className="space-y-4">
                {transactions.map((t) => (
                  <div key={t.id} className="flex items-center justify-between border-b pb-6 last:border-0">
                    <div>
                      <p className="font-medium text-foreground">{t.gig}</p>
                      <p className="text-sm text-muted-foreground">{t.date}</p>
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
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                Aún no tienes transacciones registradas.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-12 text-center text-muted-foreground text-sm">
          Los retiros a cuenta bancaria y reportes avanzados estarán disponibles próximamente.

          <div className="mt-6 text-xs text-muted-foreground border-t pt-4">
            <strong>Nota sobre comisiones:</strong> Tus ganancias netas consideran la comisión de plataforma (12%) 
            y, si aplica, la comisión por referido (5%). Los números arriba son estimaciones basadas en la configuración actual.
          </div>
        </div>
      </div>
    </div>
  );
}
