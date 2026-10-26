'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import MapsPollutionNuke from '@/components/maps/MapsPollutionNuke';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, Calendar, Download, Package, Users, Landmark } from 'lucide-react';
import { calculateOrderPayout, DEFAULT_PAYOUT_CONFIG, aggregatePayouts, type PayoutConfig } from '@/lib/payout';
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
  const [referralEarnings, setReferralEarnings] = useState({ total: 0, pending: 0 });
  const [transactions, setTransactions] = useState<Array<Record<string, unknown> & { id: string; amount?: number }>>([]);
  const [reportRows, setReportRows] = useState<Array<{ id: string; date: string; gig: string; gross: number; net: number; status: string }>>([]);
  const [commissionRate, setCommissionRate] = useState(DEFAULT_PAYOUT_CONFIG.platformCommissionRate);
  const [loading, setLoading] = useState(true);
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
  const isNequi = bankForm.payoutBankCode === 'NEQUI';

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      let rates: PayoutConfig = DEFAULT_PAYOUT_CONFIG;
      const bankRes = await fetch('/api/seller/payout-bank').catch(() => null);
      if (bankRes?.ok) {
        const bankData = await bankRes.json();
        if (bankData.rates) {
          rates = {
            platformCommissionRate: bankData.rates.platformCommissionRate ?? DEFAULT_PAYOUT_CONFIG.platformCommissionRate,
            referralCommissionRate: bankData.rates.referralCommissionRate ?? DEFAULT_PAYOUT_CONFIG.referralCommissionRate,
          };
          setCommissionRate(rates.platformCommissionRate);
        }
        if (bankData.bank) {
          setBankForm((prev) => ({ ...prev, ...bankData.bank }));
          setBankSaved(!!bankData.bank.payoutAccountNumber);
        }
      }

      const res = await fetch('/api/orders?role=seller');
      const data = await res.json();
      const sellerOrders = Array.isArray(data) ? data : [];
      const completedOrders = sellerOrders.filter((o) => o.status === 'Completed');
      const completedWithBreakdown = completedOrders.map((o) => {
        const breakdown = calculateOrderPayout(Number(o.price) || 0, !!o.seller?.referredById, rates);
        return { ...o, breakdown };
      });
      const aggregated = aggregatePayouts(completedWithBreakdown.map((o) => o.breakdown));
      const now = new Date();
      const thisMonthOrders = completedWithBreakdown.filter((o) => {
        const d = new Date(o.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
      const thisMonthNet = aggregatePayouts(thisMonthOrders.map((o) => o.breakdown)).netToSeller;
      const unpaidCompleted = completedWithBreakdown.filter((o: { sellerPayoutAt?: string | null }) => !o.sellerPayoutAt);
      const pendingAmount = aggregatePayouts(unpaidCompleted.map((o) => o.breakdown)).netToSeller;

      setEarnings({
        total: aggregated.netToSeller,
        thisMonth: thisMonthNet,
        pending: pendingAmount,
        completedGigs: completedOrders.length,
        grossTotal: aggregated.grossAmount,
        platformFees: aggregated.platformFee,
        referralFees: aggregated.referralFee,
      });

      setTransactions(
        completedWithBreakdown
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 15)
          .map((o) => ({
            id: o.id,
            date: new Date(o.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }),
            gig: o.gig?.title || 'Servicio',
            amount: o.breakdown.netToSeller,
            status: o.sellerPayoutAt ? 'Pagado' : 'Pendiente',
          }))
      );
      setReportRows(
        completedWithBreakdown
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .map((o) => ({
            id: o.id,
            date: new Date(o.createdAt).toLocaleDateString('es-CO'),
            gig: o.gig?.title || 'Servicio',
            gross: o.breakdown.grossAmount,
            net: o.breakdown.netToSeller,
            status: o.sellerPayoutAt ? 'Pagado' : 'Pendiente',
          }))
      );

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

  const downloadReport = () => {
    if (reportRows.length === 0) {
      toast.error('No hay transacciones para exportar');
      return;
    }
    const header = ['Fecha', 'Pedido', 'Bruto (COP)', 'Neto (COP)', 'Estado', 'ID'];
    const lines = reportRows.map((r) => [r.date, `"${r.gig.replace(/"/g, '""')}"`, r.gross, r.net, r.status, r.id].join(','));
    const csv = [header.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ganancias-oigagig-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Reporte descargado');
  };

  const setDestination = (value: string) => {
    if (value === 'NEQUI') {
      setBankForm((prev) => ({
        ...prev,
        payoutBankCode: 'NEQUI',
        payoutAccountType: 'NEQUI',
        payoutAccountNumber: prev.payoutBankCode === 'NEQUI' ? prev.payoutAccountNumber : '',
      }));
      return;
    }
    setBankForm((prev) => ({
      ...prev,
      payoutBankCode: prev.payoutBankCode === 'NEQUI' ? '' : prev.payoutBankCode,
      payoutAccountType: prev.payoutAccountType === 'NEQUI' ? 'SAVINGS' : prev.payoutAccountType,
    }));
  };

  const saveBank = async () => {
    setBankLoading(true);
    try {
      const res = await fetch('/api/seller/payout-bank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bankForm),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setBankSaved(true);
        if (data.bank) setBankForm((prev) => ({ ...prev, ...data.bank }));
        toast.success(isNequi ? 'Nequi guardado para pagos de vendedor.' : 'Datos bancarios guardados para pagos de vendedor.');
      } else {
        toast.error(data?.error || 'No se pudieron guardar los datos');
      }
    } catch {
      toast.error('Error de conexión al guardar');
    } finally {
      setBankLoading(false);
    }
  };

  const bankComplete =
    !!bankForm.payoutBankCode?.trim() &&
    !!bankForm.payoutAccountNumber?.trim() &&
    !!bankForm.payoutHolderName?.trim() &&
    !!bankForm.payoutDocumentNumber?.trim();

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
        {earnings.pending > 0 && !bankComplete && (
          <Card className="mb-8 border-amber-500/50 bg-amber-950/20">
            <CardContent className="p-5">
              <p className="font-semibold text-amber-400">Tienes ${earnings.pending.toLocaleString('es-CO')} COP pendiente de pago</p>
              <p className="text-sm text-muted-foreground mt-1">Complete banco o Nequi abajo. Es solo para el pago del vendedor.</p>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-5xl font-bold text-foreground">Mis Ganancias</h1>
            <p className="text-xl text-muted-foreground mt-2">Resumen financiero como vendedor</p>
          </div>
          <Button className="flex items-center gap-2" onClick={downloadReport} disabled={reportRows.length === 0}>
            <Download size={18} /> Descargar Reporte
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-12">
          <Card><CardContent className="p-8"><DollarSign className="w-12 h-12 text-green-600 mb-4" /><p className="text-sm text-muted-foreground">Total Ganado</p><p className="text-4xl font-bold mt-2 text-foreground">${(earnings.total || 0).toLocaleString('es-CO')}</p></CardContent></Card>
          <Card><CardContent className="p-8"><TrendingUp className="w-12 h-12 text-orange-600 mb-4" /><p className="text-sm text-muted-foreground">Este Mes</p><p className="text-4xl font-bold mt-2 text-foreground">${earnings.thisMonth.toLocaleString('es-CO')}</p></CardContent></Card>
          <Card><CardContent className="p-8"><DollarSign className="w-12 h-12 text-amber-600 mb-4" /><p className="text-sm text-muted-foreground">Pendiente de Pago</p><p className="text-4xl font-bold mt-2 text-foreground">${earnings.pending.toLocaleString('es-CO')}</p></CardContent></Card>
          <Card><CardContent className="p-8"><Package className="w-12 h-12 text-blue-600 mb-4" /><p className="text-sm text-muted-foreground">Gigs Completados</p><p className="text-4xl font-bold mt-2 text-foreground">{earnings.completedGigs}</p></CardContent></Card>
          <Card className="border-emerald-200"><CardContent className="p-8"><Users className="w-12 h-12 text-emerald-600 mb-4" /><p className="text-sm text-muted-foreground">Ganancias por Referidos</p><p className="text-4xl font-bold mt-2 text-emerald-600">${referralEarnings.total.toLocaleString('es-CO')}</p><p className="text-xs text-muted-foreground mt-1">Pendiente: ${referralEarnings.pending.toLocaleString('es-CO')}</p></CardContent></Card>
        </div>

        <Card className="mb-12 border-emerald-200">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-4">
              <Landmark className="w-8 h-8 text-emerald-600" />
              <div>
                <h3 className="text-2xl font-semibold">Dónde recibir el pago</h3>
                <p className="text-sm text-muted-foreground">Solo para payouts de vendedor, por Wompi Pagos a Terceros. No cambia cómo paga el comprador.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="text-xs text-muted-foreground">Destino del pago</label>
                <select value={isNequi ? 'NEQUI' : 'BANK'} onChange={(e) => setDestination(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-xl bg-background">
                  <option value="BANK">Cuenta bancaria</option>
                  <option value="NEQUI">Nequi</option>
                </select>
              </div>
              {isNequi ? (
                <div>
                  <label className="text-xs text-muted-foreground">Número Nequi</label>
                  <input value={bankForm.payoutAccountNumber} onChange={(e) => setBankForm({ ...bankForm, payoutAccountNumber: e.target.value.replace(/\D/g, '').slice(0, 10), payoutBankCode: 'NEQUI', payoutAccountType: 'NEQUI' })} placeholder="3001234567" className="w-full mt-1 px-3 py-2 border rounded-xl bg-background" />
                </div>
              ) : (
                <div>
                  <label className="text-xs text-muted-foreground">Banco</label>
                  <input value={bankForm.payoutBankCode} onChange={(e) => setBankForm({ ...bankForm, payoutBankCode: e.target.value })} placeholder="BANCOLOMBIA" className="w-full mt-1 px-3 py-2 border rounded-xl bg-background" />
                </div>
              )}
              {!isNequi && (
                <>
                  <div>
                    <label className="text-xs text-muted-foreground">Número de cuenta</label>
                    <input value={bankForm.payoutAccountNumber} onChange={(e) => setBankForm({ ...bankForm, payoutAccountNumber: e.target.value })} placeholder="1234567890" className="w-full mt-1 px-3 py-2 border rounded-xl bg-background" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Tipo de cuenta</label>
                    <select value={bankForm.payoutAccountType} onChange={(e) => setBankForm({ ...bankForm, payoutAccountType: e.target.value })} className="w-full mt-1 px-3 py-2 border rounded-xl bg-background">
                      <option value="SAVINGS">Ahorros</option>
                      <option value="CHECKING">Corriente</option>
                    </select>
                  </div>
                </>
              )}
              <div>
                <label className="text-xs text-muted-foreground">Titular</label>
                <input value={bankForm.payoutHolderName} onChange={(e) => setBankForm({ ...bankForm, payoutHolderName: e.target.value })} placeholder="Nombre como aparece en Nequi o el banco" className="w-full mt-1 px-3 py-2 border rounded-xl bg-background" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Tipo documento</label>
                <select value={bankForm.payoutDocumentType} onChange={(e) => setBankForm({ ...bankForm, payoutDocumentType: e.target.value })} className="w-full mt-1 px-3 py-2 border rounded-xl bg-background">
                  <option value="CC">CC</option>
                  <option value="NIT">NIT</option>
                  <option value="CE">CE</option>
                  <option value="PASSPORT">Pasaporte</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Número de documento</label>
                <input value={bankForm.payoutDocumentNumber} onChange={(e) => setBankForm({ ...bankForm, payoutDocumentNumber: e.target.value })} placeholder="12345678" className="w-full mt-1 px-3 py-2 border rounded-xl bg-background" />
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <Button onClick={saveBank} disabled={bankLoading} className="bg-emerald-600 hover:bg-emerald-700">
                {bankLoading ? 'Guardando...' : isNequi ? 'Guardar Nequi' : 'Guardar datos bancarios'}
              </Button>
              {bankSaved && <span className="text-emerald-600 text-sm">Guardado. El admin lo usa solo para el payout.</span>}
            </div>
          </CardContent>
        </Card>

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
                      <p className={`text-sm ${t.status === 'Pagado' ? 'text-green-600' : 'text-amber-600'}`}>{String(t.status ?? '')}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">Aún no tienes transacciones registradas.</div>
            )}
          </CardContent>
        </Card>

        <div className="mt-12 text-center text-muted-foreground text-sm">
          Los pagos netos se registran en Admin. Nequi es solo el destino del payout del vendedor.
          <div className="mt-6 text-xs text-muted-foreground border-t pt-4">
            <strong>Nota sobre comisiones:</strong> el neto descuenta la comisión de plataforma ({(commissionRate * 100).toFixed(0)}%).
          </div>
        </div>
      </div>
    </div>
  );
}
