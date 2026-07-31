'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { RefreshCw, Download } from 'lucide-react';
import { toast } from 'sonner';
import { ScrollableTable } from '@/components/ui/scrollable-table';

type SellerTaxRecord = {
  id: string;
  name: string | null;
  email: string | null;
  businessName: string | null;
  nit: string | null;
  payoutDocumentType: string | null;
  payoutDocumentNumber: string | null;
  payoutHolderName: string | null;
  payoutBankCode: string | null;
  payoutAccountNumber: string | null;
  payoutAccountType: string | null;
};

export function TaxDocumentsPage() {
  const [sellers, setSellers] = useState<SellerTaxRecord[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchSellers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/accountant/tax-documents');
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setSellers(data.sellers || []);
    } catch {
      toast.error('Error loading seller tax records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers();
  }, []);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return sellers.filter(
      (s) =>
        !term ||
        s.name?.toLowerCase().includes(term) ||
        s.email?.toLowerCase().includes(term) ||
        s.businessName?.toLowerCase().includes(term) ||
        s.nit?.toLowerCase().includes(term) ||
        s.payoutDocumentNumber?.toLowerCase().includes(term)
    );
  }, [sellers, search]);

  const exportCsv = () => {
    if (!filtered.length) {
      toast.error('Nothing to export');
      return;
    }
    const headers = [
      'Business',
      'Name',
      'Email',
      'NIT',
      'Doc Type',
      'Doc Number',
      'Holder',
      'Bank',
      'Account',
      'Account Type',
    ];
    const rows = filtered.map((s) => [
      s.businessName || '',
      s.name || '',
      s.email || '',
      s.nit || '',
      s.payoutDocumentType || '',
      s.payoutDocumentNumber || '',
      s.payoutHolderName || '',
      s.payoutBankCode || '',
      s.payoutAccountNumber || '',
      s.payoutAccountType || '',
    ]);
    const csv =
      headers.join(',') +
      '\n' +
      rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `seller_tax_records_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    toast.success('CSV exported');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tax Documents</h1>
          <p className="text-muted-foreground mt-2">
            Seller NIT and payout identity records · {filtered.length} sellers
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={!filtered.length}>
            <Download size={14} className="mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={fetchSellers} disabled={loading}>
            <RefreshCw size={14} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Input
        placeholder="Search business, email, NIT, document..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-8 text-center text-muted-foreground">Loading records…</p>
          ) : (
            <ScrollableTable>
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/30">
                <tr>
                  <th className="text-left p-4 font-medium text-muted-foreground">Business</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">NIT</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Document</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Holder</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Bank</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Email</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((seller) => (
                  <tr key={seller.id} className="border-b border-border hover:bg-muted/20">
                    <td className="p-4">{seller.businessName || seller.name || '—'}</td>
                    <td className="p-4 font-mono text-xs">{seller.nit || '—'}</td>
                    <td className="p-4 text-xs">
                      {seller.payoutDocumentType && seller.payoutDocumentNumber
                        ? `${seller.payoutDocumentType} ${seller.payoutDocumentNumber}`
                        : '—'}
                    </td>
                    <td className="p-4">{seller.payoutHolderName || '—'}</td>
                    <td className="p-4 text-xs">
                      {seller.payoutBankCode
                        ? `${seller.payoutBankCode} · ****${String(seller.payoutAccountNumber || '').slice(-4)}`
                        : '—'}
                    </td>
                    <td className="p-4 text-muted-foreground">{seller.email || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </ScrollableTable>
          )}
        </CardContent>
      </Card>
    </div>
  );
}