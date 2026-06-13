'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { devLog } from '@/lib/utils';

interface SellerReferralRow {
  seller: {
    id: string;
    name: string;
    email: string;
    businessName: string | null;
  };
  referredBy: {
    id: string;
    name: string;
    email: string;
  } | null;
  joined: string;
  totalReferralGenerated: number;
  pendingReferral: number;
  paidReferral: number;
  referredById: string | null;
}

export default function AdminReferralsPage() {
  const [data, setData] = useState<SellerReferralRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<{page:number;limit:number;total:number;totalPages:number;hasNext:boolean;hasPrev:boolean} | null>(null);

  const fetchReferrals = async (p = page) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/referrals?view=sellers&page=${p}&limit=20`);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json)) {
          // legacy shape
          setData(json);
          setPagination(null);
        } else {
          setData(json.data || []);
          setPagination(json.pagination || null);
        }
      }
    } catch (e) {
      devLog('fetch referrals', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals(page);
  }, [page]);

  if (loading) return <div className="p-8">Loading sellers data...</div>;

  const totalSellers = pagination ? pagination.total : data.length;
  const referredSellers = data.filter(r => !!r.referredBy).length;
  const totalCommissions = data.reduce((sum, r) => sum + (r.totalReferralGenerated || 0), 0);
  const totalPending = data.reduce((sum, r) => sum + (r.pendingReferral || 0), 0);

  const markReferrerPaid = async (referrerId: string | null, sellerName?: string) => {
    if (!referrerId) return;
    try {
      const res = await fetch('/api/admin/referrals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referrerId })
      });
      if (res.ok) {
        toast.success(`Marked paid for referrer of ${sellerName || 'seller'}`);
        fetchReferrals(page);
      } else {
        toast.error('Error marking as paid');
      }
    } catch {
      toast.error('Connection error');
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Referrals Management</h1>
      <p className="text-muted-foreground mb-6 -mt-4">Showing all Sellers and their referral attribution (who referred them and commissions generated).</p>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card border rounded-2xl p-4">
          <div className="text-sm text-muted-foreground">Total Sellers</div>
          <div className="text-3xl font-bold mt-1">{totalSellers}</div>
        </div>
        <div className="bg-card border rounded-2xl p-4">
          <div className="text-sm text-muted-foreground">Referred Sellers</div>
          <div className="text-3xl font-bold mt-1">{referredSellers}</div>
        </div>
        <div className="bg-card border rounded-2xl p-4">
          <div className="text-sm text-muted-foreground">Total Referral Commissions</div>
          <div className="text-3xl font-bold mt-1 text-green-600">${totalCommissions.toLocaleString('es-CO')}</div>
        </div>
        <div className="bg-card border rounded-2xl p-4">
          <div className="text-sm text-muted-foreground">Pending Referral Payouts</div>
          <div className="text-3xl font-bold mt-1 text-orange-600">${totalPending.toLocaleString('es-CO')}</div>
        </div>
      </div>

      {/* Pagination controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mb-4 text-sm">
          <div className="text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages} • {pagination.total} sellers
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={!pagination.hasPrev} onClick={() => setPage(p => Math.max(1, p-1))}>Previous</Button>
            <Button variant="outline" size="sm" disabled={!pagination.hasNext} onClick={() => setPage(p => p+1)}>Next</Button>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Sellers (Referral Data)</CardTitle>
        </CardHeader>
        <CardContent>
          {data.length === 0 ? (
            <p className="text-muted-foreground">No sellers registered yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Seller</th>
                    <th className="text-left py-3 px-4">Email / Business</th>
                    <th className="text-left py-3 px-4">Referred By</th>
                    <th className="text-center py-3 px-4">Joined</th>
                    <th className="text-center py-3 px-4">Referral Commissions Generated</th>
                    <th className="text-center py-3 px-4">Pending</th>
                    <th className="text-center py-3 px-4">Paid</th>
                    <th className="text-right py-3 px-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium">{row.seller.name}</td>
                      <td className="py-3 px-4 text-muted-foreground">
                        <div>{row.seller.email}</div>
                        {row.seller.businessName && <div className="text-xs">{row.seller.businessName}</div>}
                      </td>
                      <td className="py-3 px-4">
                        {row.referredBy ? (
                          <span className="text-sm">
                            {row.referredBy.name}
                            <span className="block text-[10px] text-muted-foreground">{row.referredBy.email}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">— (no referrer)</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center text-xs text-muted-foreground">
                        {new Date(row.joined).toLocaleDateString('es-CO')}
                      </td>
                      <td className="py-3 px-4 text-center font-medium">
                        ${(row.totalReferralGenerated || 0).toLocaleString('es-CO')}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={row.pendingReferral > 0 ? "text-orange-600 font-semibold" : ""}>
                          ${(row.pendingReferral || 0).toLocaleString('es-CO')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-green-600">
                        ${(row.paidReferral || 0).toLocaleString('es-CO')}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {row.pendingReferral > 0 && row.referredById ? (
                          <Button 
                            size="sm" 
                            onClick={() => markReferrerPaid(row.referredById, row.seller.name)}
                          >
                            Marcar Pagado (referrer)
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
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
        This page shows <strong>all sellers</strong> and their referrer attribution (not the admin's personal referrals).
        Commissions are generated when a referred seller completes paid orders. Use <a href="/admin/payouts" className="underline">Payouts</a> for full seller + referrer payout management.
        <br />
        Data updates in real time. Use browser search (Ctrl+F) to filter. Pagination is by seller count.
      </div>
    </div>
  );
}
