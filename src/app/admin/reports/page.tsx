'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, Users, DollarSign, BarChart3 } from 'lucide-react';

interface ReportData {
  totalCompleted: number;
  grossRevenue: number;
  platformRevenue: number;
  referralRevenue: number;
  netToSellers: number;
  categorySales: Array<{ category: string; orders: number; revenue: number }>;
  monthlyRevenue: Array<{ month: string; revenue: number }>;
  topGigs: Array<{ title: string; count: number; revenue: number }>;
  topSellers: Array<{ name: string; email: string; revenue: number; orders: number }>;
  repeatBuyers: number;
  totalBuyersWithOrders: number;
  avgOrderValue: number;
}

export default function AdminReports() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/reports');
      if (!res.ok) throw new Error('Error loading reports');
      const json = await res.json();
      setData(json);
    } catch (e: any) {
      setError(e.message || 'Error loading reports');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const maxCategoryRevenue = Math.max(...(data?.categorySales.map(c => c.revenue) || [1]), 1);
  const maxMonthly = Math.max(...(data?.monthlyRevenue.map(m => m.revenue) || [1]), 1);

  return (
    <div className="bg-background text-foreground">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-5xl font-bold tracking-tight">Reports</h1>
            <p className="text-muted-foreground mt-2 text-lg">Sales analysis, categories, retention and more</p>
          </div>
          <Button onClick={fetchReports} disabled={loading} variant="outline" className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Update
          </Button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-muted-foreground">Generating reports...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 border border-destructive text-destructive p-6 rounded-2xl mb-8">
            {error}
          </div>
        )}

        {!loading && data && (
          <>
            {/* KPI Summary */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
              <Card className="bg-card border-border">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <BarChart3 className="h-5 w-5 text-blue-400" />
                    <p className="text-sm text-muted-foreground">Completed Orders</p>
                  </div>
                  <p className="text-4xl font-bold">{data.totalCompleted.toLocaleString('es-CO')}</p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <DollarSign className="h-5 w-5 text-green-400" />
                    <p className="text-sm text-muted-foreground">Gross Revenue</p>
                  </div>
                  <p className="text-4xl font-bold">${data.grossRevenue.toLocaleString('es-CO')}</p>
                  <p className="text-xs text-muted-foreground mt-1">Promedio: ${data.avgOrderValue.toLocaleString('es-CO')}</p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="h-5 w-5 text-emerald-400" />
                    <p className="text-sm text-muted-foreground">Platform Revenue</p>
                  </div>
                  <p className="text-4xl font-bold text-emerald-400">${data.platformRevenue.toLocaleString('es-CO')}</p>
                  <p className="text-xs text-amber-400 mt-1">+ Referidos: ${data.referralRevenue.toLocaleString('es-CO')}</p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Users className="h-5 w-5 text-purple-400" />
                    <p className="text-sm text-muted-foreground">Unique Buyers</p>
                  </div>
                  <p className="text-4xl font-bold">{data.totalBuyersWithOrders}</p>
                  <p className="text-xs text-muted-foreground mt-1">{data.repeatBuyers} con 2+ pedidos ({data.totalBuyersWithOrders > 0 ? Math.round((data.repeatBuyers / data.totalBuyersWithOrders) * 100) : 0}% retención)</p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <DollarSign className="h-5 w-5 text-amber-400" />
                    <p className="text-sm text-muted-foreground">Net to Sellers</p>
                  </div>
                  <p className="text-4xl font-bold">${data.netToSellers.toLocaleString('es-CO')}</p>
                </CardContent>
              </Card>
            </div>

            {/* Ventas por Categoría */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="h-6 w-6" /> Sales by Category
              </h2>
              <Card className="bg-card border-border">
                <CardContent className="p-6">
                  {data.categorySales.length === 0 ? (
                    <p className="text-muted-foreground">No category data yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {data.categorySales.map((cat, idx) => {
                        const pct = Math.round((cat.revenue / maxCategoryRevenue) * 100);
                        return (
                          <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                            <div className="md:col-span-4 font-medium truncate">{cat.category}</div>
                            <div className="md:col-span-5">
                              <div className="h-3 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className="h-3 bg-orange-500 rounded-full transition-all" 
                                  style={{ width: `${Math.max(pct, 3)}%` }} 
                                />
                              </div>
                            </div>
                            <div className="md:col-span-3 text-sm flex justify-between md:justify-end gap-4 text-muted-foreground">
                              <span>{cat.orders} pedidos</span>
                              <span className="font-semibold text-foreground">${cat.revenue.toLocaleString('es-CO')}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Ingresos Mensuales */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Monthly Revenue (last 6 months)</h2>
              <Card className="bg-card border-border">
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {data.monthlyRevenue.map((m, i) => {
                      const pct = Math.round((m.revenue / maxMonthly) * 100);
                      return (
                        <div key={i} className="text-center">
                          <div className="text-xs text-muted-foreground mb-1">{m.month}</div>
                          <div className="h-24 flex items-end justify-center">
                            <div 
                              className="w-10 bg-blue-500 rounded-t transition-all" 
                              style={{ height: `${Math.max(pct, 8)}%` }} 
                            />
                          </div>
                          <div className="mt-2 text-sm font-semibold">${m.revenue.toLocaleString('es-CO')}</div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Gigs y Top Sellers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Card className="bg-card border-border">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 text-lg">Top Selling Services</h3>
                  {data.topGigs.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No data.</p>
                  ) : (
                    <div className="space-y-3 text-sm">
                      {data.topGigs.map((g, i) => (
                        <div key={i} className="flex justify-between items-center border-b border-border pb-2 last:border-0 last:pb-0">
                          <div className="truncate pr-4">{g.title}</div>
                          <div className="text-right text-muted-foreground whitespace-nowrap">
                            {g.count} × <span className="font-medium text-foreground">${g.revenue.toLocaleString('es-CO')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 text-lg">Top Sellers</h3>
                  {data.topSellers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No data.</p>
                  ) : (
                    <div className="space-y-3 text-sm">
                      {data.topSellers.map((s, i) => (
                        <div key={i} className="flex justify-between items-center border-b border-border pb-2 last:border-0 last:pb-0">
                          <div className="truncate pr-4">
                            {s.name} <span className="text-muted-foreground">({s.orders} ventas)</span>
                          </div>
                          <div className="font-medium text-foreground whitespace-nowrap">
                            ${s.revenue.toLocaleString('es-CO')}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="text-xs text-muted-foreground text-center">
              Data is calculated only on orders with status "Completed". 
              Retention = buyers with 2 or more completed orders.
            </div>
          </>
        )}

        {!loading && !data && !error && (
          <div className="text-center py-12 text-muted-foreground">
            No hay datos disponibles todavía.
          </div>
        )}
      </div>
    </div>
  );
}
