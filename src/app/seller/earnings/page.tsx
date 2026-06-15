'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import MapsPollutionNuke from '@/components/maps/MapsPollutionNuke';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, Calendar, Download, Package, Users, Landmark } from 'lucide-react';
import { calculateOrderPayout, DEFAULT_PAYOUT_CONFIG, aggregatePayouts } from '@/lib/payout';
import { toast } from 'sonner';

export default function SellerEarningsPage() {
  const { data: session } = useSession();
  const [earnings, setEarnings] = useState({
    total: 0,
    thisMonth: 0,
    pending: 0,
    completedGigs: 0,
    grossTotal: 0,
    platformFees: 0,
    referralFees: 0,
  });
  const [referralEarnings, setReferralEarnings] = useState({
    total: 0,
    pending: 0,
  });
  const [transactions, setTransactions] = useState<Array<Record<string, unknown> & { id: string; amount?: number }>>([]);
  const [loading, setLoading] = useState(true);

  // Seller payout bank details (for Wompi seller payouts from admin)
  const [bankForm, setBankForm] = useState({
    payoutBankCode: '',
    payoutAccountNumber: '',
    payoutAccountType: 'SAVINGS',
    payoutHolderName: '',
    payoutDocumentType: 'CC',
    payoutDocumentNumber: '',
    payoutPhone: '',
    payoutEmail: '',
  });
  const [bankLoading, setBankLoading] = useState(false);
  const [bankSaved, setBankSaved] = useState(false);

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

      // Pending gross (for display) - all Completed contribute to earned; no separate paymentStatus field
      const pendingAmount = sellerOrders
        .filter(o => o.status === 'Completed')
        .reduce((sum, o) => sum + (Number(o.price) || 0), 0);

      setEarnings({
        total: aggregated.netToSeller,
        thisMonth: thisMonthNet,
        pending: pendingAmount,
        completedGigs: completedOrders.length,
        grossTotal: aggregated.grossAmount,
        platformFees: aggregated.platformFee,
        referralFees: aggregated.referralFee,
      });

      // Build transaction list from completed orders
      const tx = completedOrders
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 15)
        .map(o => ({
          id: o.id,
          date: new Date(o.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }),
          gig: o.gig?.title || 'Servicio',
          amount: Number(o.price) || 0,
          status: 'Pagado', // Completed orders are considered settled for earnings display
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

  // Load/save seller bank payout info (used by admin when paying via Wompi)
  const loadBank = async () => {
    try {
      const res = await fetch('/api/seller/payout-bank');
      if (res.ok) {
        const json = await res.json();
        if (json.bank) {
          setBankForm((prev) => ({ ...prev, ...json.bank }));
          setBankSaved(!!json.bank.payoutAccountNumber);
        }
      }
    } catch {}
  };

  const saveBank = async () => {
    setBankLoading(true);
    try {
      const res = await fetch('/api/seller/payout-bank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bankForm),
      });
      if (res.ok) {
        setBankSaved(true);
        toast.success('Datos bancarios guardados. El administrador podrá usarlos para pagarte vía Wompi.');
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err?.error || 'No se pudieron guardar los datos bancarios');
      }
    } catch {
      toast.error('Error de conexión al guardar');
    } finally {
      setBankLoading(false);
    }
  };

  useEffect(() => {
    // Load bank after main earnings (non-blocking)
    if (!loading) loadBank();
  }, [loading]);

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

        {/* Bank details for Wompi seller payouts (admin will use this when recording "Pagar con Wompi") */}
        <Card className="mb-12 border-emerald-200">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-4">
              <Landmark className="w-8 h-8 text-emerald-600" />
              <div>
                <h3 className="text-2xl font-semibold">Datos bancarios para cobros</h3>
                <p className="text-sm text-muted-foreground">Completa esto para que el administrador pueda pagarte los giros netos vía Wompi (Pagos a Terceros). Se usan solo para payouts de vendedores.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="text-xs text-muted-foreground">Banco (código Wompi)</label>
                <input value={bankForm.payoutBankCode} onChange={(e) => setBankForm({ ...bankForm, payoutBankCode: e.target.value })} placeholder="BANCOLOMBIA" className="w-full mt-1 px-3 py-2 border rounded-xl bg-background" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Número de cuenta</label>
                <input value={bankForm.payoutAccountNumber} onChange={(e) => setBankForm({ ...bankForm, payoutAccountNumber: e.target.value })} placeholder="1234567890" className="w-full mt-1 px-3 py-2 border rounded-xl bg-background" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Tipo de cuenta</label>
                <select value={bankForm.payoutAccountType} onChange={(e) => setBankForm({ ...bankForm, payoutAccountType: e.target.value })} className="w-full mt-1 px-3 py-2 border rounded-xl bg-background">
                  <option value="SAVINGS">Ahorros (Savings)</option>
                  <option value="CHECKING">Corriente (Checking)</option>
                  <option value="CURRENT">Current</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Titular de la cuenta</label>
                <input value={bankForm.payoutHolderName} onChange={(e) => setBankForm({ ...bankForm, payoutHolderName: e.target.value })} placeholder="Nombre completo como aparece en la cuenta" className="w-full mt-1 px-3 py-2 border rounded-xl bg-background" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Tipo documento</label>
                <select value={bankForm.payoutDocumentType} onChange={(e) => setBankForm({ ...bankForm, payoutDocumentType: e.target.value })} className="w-full mt-1 px-3 py-2 border rounded-xl bg-background">
                  <option value="CC">CC (Cédula)</option>
                  <option value="NIT">NIT</option>
                  <option value="CE">CE</option>
                  <option value="PASSPORT">Pasaporte</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Número de documento</label>
                <input value={bankForm.payoutDocumentNumber} onChange={(e) => setBankForm({ ...bankForm, payoutDocumentNumber: e.target.value })} placeholder="12345678" className="w-full mt-1 px-3 py-2 border rounded-xl bg-background" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Teléfono (opcional)</label>
                <input value={bankForm.payoutPhone} onChange={(e) => setBankForm({ ...bankForm, payoutPhone: e.target.value })} placeholder="3001234567" className="w-full mt-1 px-3 py-2 border rounded-xl bg-background" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Email de la cuenta (opcional)</label>
                <input value={bankForm.payoutEmail} onChange={(e) => setBankForm({ ...bankForm, payoutEmail: e.target.value })} placeholder="pago@tuempresa.com" className="w-full mt-1 px-3 py-2 border rounded-xl bg-background" />
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <Button onClick={saveBank} disabled={bankLoading} className="bg-emerald-600 hover:bg-emerald-700">
                {bankLoading ? 'Guardando...' : 'Guardar datos bancarios'}
              </Button>
              {bankSaved && <span className="text-emerald-600 text-sm">✓ Guardado. El admin lo verá al pagar vía Wompi.</span>}
              <p className="text-[11px] text-muted-foreground ml-auto">Estos datos solo los usa el administrador para registrar tus pagos. Nunca se comparten públicamente.</p>
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardContent className="p-10">
            <h3 className="text-2xl font-semibold mb-8 text-foreground">Historial de Pagos</h3>
            {transactions.length > 0 ? (
              <div className="space-y-4">
                {transactions.map((t) => (
                  <div key={t.id} className="flex items-center justify-between border-b pb-6 last:border-0">
                    <div>
                      <p className="font-medium text-foreground">{String(t.gig ?? '')}</p>
                      <p className="text-sm text-muted-foreground">{String(t.date ?? '')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">+${(t.amount ?? 0).toLocaleString('es-CO')}</p>
                      <p className={`text-sm ${t.status === 'Pagado' ? 'text-green-600' : 'text-amber-600'}`}>
                        {String(t.status ?? '')}
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
          Los pagos netos a vendedores se registran en el panel Admin (Payouts) usando Wompi. Completa tus datos bancarios arriba para agilizar el proceso. Reportes de SFTP de Wompi pueden usarse para reconciliación.

          <div className="mt-6 text-xs text-muted-foreground border-t pt-4">
            <strong>Nota sobre comisiones:</strong> Tus ganancias netas consideran la comisión de plataforma (12%) 
            y, si aplica, la comisión por referido (5%). Los números arriba son estimaciones basadas en la configuración actual.
          </div>
        </div>
      </div>
    </div>
  );
}
