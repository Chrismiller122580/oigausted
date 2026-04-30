'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, Package, Star, Plus, TrendingUp, Clock } from 'lucide-react';
import GigCard from '@/components/common/GigCard';

export default function SellerDashboard() {
  const { data: session } = useSession();
  const [gigs, setGigs] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [gigsRes, ordersRes] = await Promise.all([
        fetch('/api/gigs'),
        fetch('/api/orders?role=seller')
      ]);

      const gigsData = await gigsRes.json();
      const ordersData = await ordersRes.json();

      setGigs(Array.isArray(gigsData) ? gigsData : []);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
    } catch (error) {
      console.error('Error fetching seller data:', error);
    } finally {
      setLoading(false);
    }
  };

  const activeOrders = orders.filter(o => ['Pending', 'In Progress'].includes(o.status || ''));
  const completedOrders = orders.filter(o => o.status === 'Completed');
  const totalEarnings = gigs.reduce((sum, gig) => sum + (Number(gig.price) || 0), 0);
  const pendingEarnings = activeOrders.reduce((sum, order) => sum + (Number(order.price) || 0), 0);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-xl">Cargando tu dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-5xl font-bold">Mi Dashboard</h1>
            <p className="text-xl text-gray-600 mt-2">Hola, {session?.user?.name?.split(" ")[0] || 'Vendedor'}</p>
          </div>
          <Link href="/create-gig">
            <Button className="bg-orange-600 hover:bg-orange-700 text-lg px-8 py-6 rounded-2xl flex items-center gap-3">
              <Plus size={24} /> Crear Nuevo Gig
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card>
            <CardContent className="p-8">
              <DollarSign className="w-12 h-12 text-green-600 mb-4" />
              <p className="text-sm text-gray-500">Ganancias Totales</p>
              <p className="text-4xl font-bold mt-2">${totalEarnings.toLocaleString('es-CO')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <Package className="w-12 h-12 text-orange-600 mb-4" />
              <p className="text-sm text-gray-500">Gigs Publicados</p>
              <p className="text-4xl font-bold mt-2">{gigs.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <TrendingUp className="w-12 h-12 text-blue-600 mb-4" />
              <p className="text-sm text-gray-500">Pedidos Activos</p>
              <p className="text-4xl font-bold mt-2">{activeOrders.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <Star className="w-12 h-12 text-amber-500 mb-4" />
              <p className="text-sm text-gray-500">Calificación</p>
              <p className="text-4xl font-bold mt-2">4.8 ★</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* My Gigs */}
          <Card>
            <CardContent className="p-10">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-semibold">Mis Gigs</h3>
                <Link href="/gigs">
                  <Button variant="outline" size="sm">Ver Todos</Button>
                </Link>
              </div>
              {gigs.length > 0 ? (
                <div className="grid gap-6">
                  {gigs.slice(0, 4).map(gig => (
                    <GigCard key={gig.id} gig={gig} />
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 py-12 text-center">Aún no tienes gigs publicados.</p>
              )}
            </CardContent>
          </Card>

          {/* Active Orders */}
          <Card>
            <CardContent className="p-10">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-semibold">Pedidos Activos</h3>
                <Link href="/orders">
                  <Button variant="outline" size="sm">Ver Todos</Button>
                </Link>
              </div>
              {activeOrders.length > 0 ? (
                <div className="space-y-4">
                  {activeOrders.slice(0, 4).map(order => (
                    <div key={order.id} className="flex justify-between items-center p-4 border rounded-2xl">
                      <div>
                        <p className="font-medium">Pedido #{order.id.slice(0,8)}</p>
                        <p className="text-sm text-gray-500">Estado: {order.status}</p>
                      </div>
                      <Link href={`/orders/${order.id}`}>
                        <Button variant="outline" size="sm">Gestionar</Button>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 py-12 text-center">No tienes pedidos activos en este momento.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
