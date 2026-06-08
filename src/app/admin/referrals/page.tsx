'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { devLog } from '@/lib/utils';

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
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<{page:number;limit:number;total:number;totalPages:number;hasNext:boolean;hasPrev:boolean} | null>(null);

  const fetchReferrals = async (p = page) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/referrals?page=${p}&limit=20`);
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

  if (loading) return <div className="p-8">Loading referrals data...</div>;

  const totalReferrers = pagination ? pagination.total : data.length;
  const totalReferred = data.reduce((sum, r) => sum + r.referredCount, 0);
  const totalGenerated = data.reduce((sum, r) => sum + (r.totalGenerated || 0), 0);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Referrals Management</h1>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-card border rounded-2xl p-4">
          <div className="text-sm text-muted-foreground">Active referrers</div>
          <div className="text-3xl font-bold mt-1">{totalReferrers}</div>
        </div>
        <div className="bg-card border rounded-2xl p-4">
          <div className="text-sm text-muted-foreground">People referred</div>
          <div className="text-3xl font-bold mt-1">{totalReferred}</div>
        </div>
        <div className="bg-card border rounded-2xl p-4">
          <div className="text-sm text-muted-foreground">Commissions generated (total)</div>
          <div className="text-3xl font-bold mt-1 text-green-600">${totalGenerated.toLocaleString('es-CO')}</div>
        </div>
      </div>

      {/* Pagination controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mb-4 text-sm">
          <div className="text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages} • {pagination.total} referrers
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={!pagination.hasPrev} onClick={() => setPage(p => Math.max(1, p-1))}>Previous</Button>
            <Button variant="outline" size="sm" disabled={!pagination.hasNext} onClick={() => setPage(p => p+1)}>Next</Button>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Referrals Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {data.length === 0 ? (
            <p className="text-muted-foreground">No referrals registered yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Referrer</th>
                    <th className="text-left py-3 px-4">Email</th>
                    <th className="text-center py-3 px-4">Referred</th>
                    <th className="text-center py-3 px-4">Total Earned</th>
                    <th className="text-center py-3 px-4">Pending Payout</th>
                    <th className="text-center py-3 px-4">Paid</th>
                    <th className="text-center py-3 px-4">Rate</th>
                    <th className="text-right py-3 px-4">Action</th>
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
                                  toast.success('Marked as paid');
                                  fetchReferrals(page);
                                } else {
                                  toast.error('Error marking');
                                }
                              } catch {
                                toast.error('Connection error');
                              }
                            }}
                          >
                            Marcar Pagado
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">No pending</span>
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
        Data updates in real time. Use browser search (Ctrl+F) to filter.
        <br />
        Earnings are generated automatically when referred users complete paid orders.
      </div>
    </div>
  );
}
