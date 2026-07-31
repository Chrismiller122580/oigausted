'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { ScrollableTable } from '@/components/ui/scrollable-table';

type TransactionOrder = {
  id: string;
  price: number;
  status: string;
  createdAt: string;
  wompiPayoutRef?: string | null;
  sellerPayoutAt?: string | null;
  buyer?: { name?: string | null; email?: string | null };
  seller?: { name?: string | null; businessName?: string | null; email?: string | null };
  gig?: { title?: string | null };
};

export function TransactionsPage() {
  const [orders, setOrders] = useState<TransactionOrder[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders?view=all');
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.orders || [];
      setOrders(list);
    } catch {
      toast.error('Error loading transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return orders.filter((order) => {
      if (statusFilter !== 'all' && order.status !== statusFilter) return false;
      if (!term) return true;
      return (
        order.id.toLowerCase().includes(term) ||
        order.buyer?.email?.toLowerCase().includes(term) ||
        order.seller?.email?.toLowerCase().includes(term) ||
        order.gig?.title?.toLowerCase().includes(term) ||
        order.wompiPayoutRef?.toLowerCase().includes(term)
      );
    });
  }, [orders, search, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground mt-2">
            Payment and payout ledger across all orders · {filtered.length} shown
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchOrders} disabled={loading}>
          <RefreshCw size={14} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search ID, buyer, seller, gig, Wompi ref..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-card border border-border rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="Pending">Pending</option>
          <option value="Paid">Paid</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-8 text-center text-muted-foreground">Loading transactions…</p>
          ) : (
            <ScrollableTable>
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/30">
                <tr>
                  <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Order</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Gig</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Seller</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Amount</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Payout</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-muted-foreground">
                      No transactions found.
                    </td>
                  </tr>
                )}
                {filtered.map((order) => (
                  <tr key={order.id} className="border-b border-border hover:bg-muted/20">
                    <td className="p-4 text-muted-foreground whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleDateString('es-CO')}
                    </td>
                    <td className="p-4">
                      <Link
                        href={`/orders/${order.id}`}
                        target="_blank"
                        className="font-mono text-xs text-orange-600 hover:underline"
                      >
                        {order.id.slice(0, 8)}…
                      </Link>
                    </td>
                    <td className="p-4 max-w-[180px] truncate">{order.gig?.title || '—'}</td>
                    <td className="p-4 max-w-[160px] truncate">
                      {order.seller?.businessName || order.seller?.name || '—'}
                    </td>
                    <td className="p-4 text-right font-medium">
                      ${Number(order.price || 0).toLocaleString('es-CO')}
                    </td>
                    <td className="p-4">{order.status}</td>
                    <td className="p-4 text-xs">
                      {order.sellerPayoutAt ? (
                        <span className="text-emerald-600">
                          Paid {new Date(order.sellerPayoutAt).toLocaleDateString('es-CO')}
                          {order.wompiPayoutRef ? ` · ${order.wompiPayoutRef}` : ''}
                        </span>
                      ) : order.status === 'Completed' ? (
                        <span className="text-amber-600">Pending payout</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
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