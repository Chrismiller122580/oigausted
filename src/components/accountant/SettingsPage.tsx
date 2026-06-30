'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

type FinanceSettings = {
  commissionRate: number;
  referralCommissionRate: number;
  wompiRealPaymentsEnabled: boolean;
  wompiSftpEnabled: boolean;
  wompiMode: string;
  wompiConfigured: boolean;
  payoutSchema: {
    sellerPayoutAt: boolean;
    wompiPayoutRef: boolean;
    payoutBankColumns: boolean;
  };
  payoutsHealthy: boolean;
  pendingPayoutCount: number;
  pendingPayoutNetCOP: number;
};

export function SettingsPage() {
  const [settings, setSettings] = useState<FinanceSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/accountant/settings');
      if (!res.ok) throw new Error('Failed');
      setSettings(await res.json());
    } catch {
      toast.error('Error loading settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const pct = (rate: number) => `${(rate * 100).toFixed(1)}%`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Accounting Settings</h1>
          <p className="text-muted-foreground mt-2">Read-only finance configuration and payout system health</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchSettings} disabled={loading}>
          <RefreshCw size={14} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {loading && !settings ? (
        <p className="text-muted-foreground">Loading settings…</p>
      ) : settings ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Commission rates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                Platform commission:{' '}
                <span className="font-semibold">{pct(settings.commissionRate)}</span>
              </p>
              <p>
                Referral commission:{' '}
                <span className="font-semibold">{pct(settings.referralCommissionRate)}</span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Wompi payments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                Mode: <span className="font-semibold uppercase">{settings.wompiMode}</span>
              </p>
              <p>
                Configured:{' '}
                <span className={settings.wompiConfigured ? 'text-emerald-600' : 'text-amber-600'}>
                  {settings.wompiConfigured ? 'Yes' : 'Incomplete'}
                </span>
              </p>
              <p>Real payments: {settings.wompiRealPaymentsEnabled ? 'Enabled' : 'Disabled'}</p>
              <p>SFTP reconciliation: {settings.wompiSftpEnabled ? 'Enabled' : 'Disabled'}</p>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Payout system</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 text-sm">
              <p>
                Health:{' '}
                <span className={settings.payoutsHealthy ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>
                  {settings.payoutsHealthy ? 'Healthy' : 'Needs attention'}
                </span>
              </p>
              <p>
                Pending payouts: {settings.pendingPayoutCount} (
                ${Math.round(settings.pendingPayoutNetCOP).toLocaleString('es-CO')} COP)
              </p>
              <p>sellerPayoutAt column: {settings.payoutSchema.sellerPayoutAt ? '✓' : '✕'}</p>
              <p>wompiPayoutRef column: {settings.payoutSchema.wompiPayoutRef ? '✓' : '✕'}</p>
              <p>Bank payout columns: {settings.payoutSchema.payoutBankColumns ? '✓' : '✕'}</p>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}