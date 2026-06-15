'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Trash2, Eye, RefreshCw } from 'lucide-react';

interface Order {
  id: string;
  price: number;
  status: string;
  createdAt: string;
  buyer?: { name?: string; email?: string };
  seller?: { name?: string; businessName?: string; email?: string };
  gig?: { title?: string; id?: string };
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders?view=all');
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.orders || []);
      setOrders(list);
      setFilteredOrders(list);
    } catch (e) {
      toast.error('Error loading orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    let result = [...orders];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(order =>
        order.id.toLowerCase().includes(term) ||
        order.buyer?.email?.toLowerCase().includes(term) ||
        order.buyer?.name?.toLowerCase().includes(term) ||
        order.seller?.email?.toLowerCase().includes(term) ||
        order.seller?.businessName?.toLowerCase().includes(term) ||
        order.seller?.name?.toLowerCase().includes(term) ||
        order.gig?.title?.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'All') {
      result = result.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(result);
  }, [searchTerm, statusFilter, orders]);

  const deleteOrder = async (orderId: string) => {
    if (!confirm('Permanently delete this order and all related data (messages, files, reviews)?')) return;

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Order deleted');
        fetchOrders();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Could not delete order');
      }
    } catch (e) {
      toast.error('Error deleting order');
    }
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        toast.success(`Status updated to ${newStatus}`);
        fetchOrders();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Could not update status');
      }
    } catch (e) {
      toast.error('Error updating status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-foreground">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-5xl font-bold">Orders</h1>
            <p className="text-muted-foreground mt-1">All platform orders • {orders.length} total</p>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <Input
              placeholder="Search ID, buyer, seller, gig..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-72 bg-card border-border"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-card border border-border rounded px-3 py-2 text-sm"
            >
              <option value="All">All statuses</option>
              <option value="Pending">Pending</option>
              <option value="Paid">Paid</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            <Button onClick={fetchOrders} variant="outline" className="border-border">
              <RefreshCw size={16} className="mr-2" /> Refresh
            </Button>
          </div>
        </div>

        <Card className="bg-card border-border">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-background">
                <tr>
                  <th className="text-left p-4 font-medium text-muted-foreground">ID</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Buyer</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Seller</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Gig</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Price</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Created</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-12 text-center">
                      <p className="text-lg text-muted-foreground">No orders found.</p>
                    </td>
                  </tr>
                )}
                {filteredOrders.map(order => (
                  <tr key={order.id} className="border-b border-border hover:bg-background">
                    <td className="p-4 font-mono text-xs">{order.id.slice(0, 8)}...</td>
                    <td className="p-4">
                      <div className="font-medium">{order.buyer?.name || order.buyer?.email || '—'}</div>
                      <div className="text-xs text-muted-foreground">{order.buyer?.email}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium">{order.seller?.businessName || order.seller?.name || '—'}</div>
                      <div className="text-xs text-muted-foreground">{order.seller?.email}</div>
                    </td>
                    <td className="p-4 text-muted-foreground">{order.gig?.title || '—'}</td>
                    <td className="p-4 text-right font-medium">${Number(order.price || 0).toLocaleString('es-CO')}</td>
                    <td className="p-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        order.status === 'Completed' ? 'bg-green-600/20 text-green-400' :
                        order.status === 'In Progress' ? 'bg-purple-600/20 text-purple-400' :
                        order.status === 'Paid' ? 'bg-blue-600/20 text-blue-400' :
                        order.status === 'Pending' ? 'bg-yellow-600/20 text-yellow-400' :
                        'bg-red-600/20 text-red-400'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground text-sm">
                      {new Date(order.createdAt).toLocaleDateString('es-CO')}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <Link href={`/orders/${order.id}`} target="_blank">
                        <Button size="sm" variant="outline" className="border-border">
                          <Eye size={14} className="mr-1" /> View
                        </Button>
                      </Link>

                      <select
                        value={order.status}
                        onChange={(e) => updateStatus(order.id, e.target.value)}
                        className="text-xs bg-background border border-border rounded px-2 py-1"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Paid">Paid</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteOrder(order.id)}
                        className="text-xs"
                      >
                        <Trash2 size={14} className="mr-1" /> Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Admin view — all orders across the platform. Use caution with delete (irreversible).
        </p>
      </div>
    </div>
  );
}
