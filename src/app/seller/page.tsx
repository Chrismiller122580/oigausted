'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, Package, Star, Plus, TrendingUp } from 'lucide-react';
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

  const activeOrders = orders.filter(o => ['Pending', 'In Progress'].includes(o.status));
  const totalEarnings = gigs.reduce((sum, gig) => sum + (gig.price || 0), 0);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-5xl font-bold">Dashboard del Vendedor</h1>
            <p className="text-xl text-gray-600 mt-2">Bienvenido de vuelta, {session?.user?.name?.split(" ")[0]}</p>
          </div>
          <Link href="/create-gig">
            <Button className="bg-orange-600 hover:bg-orange-700 text-lg px-8 py-6 rounded-2xl flex items-center gap-3">
              <Plus size={24} /> Crear Nuevo Gig
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card>
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Ganancias Totales</p>
                  <p className="text-4xl font-bold text-green-600 mt-2">${totalEarnings.toLocaleString('es-CO')}</p>
                </div>
                <DollarSign className="w-12 h-12 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Gigs Publicados</p>
                  <p className="text-4xl font-bold mt-2">{gigs.length}</p>
                </div>
                <Package className="w-12 h-12 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Pedidos Activos</p>
                  <p className="text-4xl font-bold mt-2">{activeOrders.length}</p>
                </div>
                <TrendingUp className="w-12 h-12 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Calificación</p>
                  <p className="text-4xl font-bold mt-2">4.8 <span className="text-xl">★</span></p>
                </div>
                <Star className="w-12 h-12 text-amber-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <Card>
            <CardContent className="p-10">
              <h3 className="text-2xl font-semibold mb-6">Mis Gigs Activos</h3>
              {gigs.length > 0 ? (
                <div className="space-y-4">
                  {gigs.slice(0, 3).map(gig => (
                    <div key={gig.id} className="flex justify-between items-center border-b pb-4">
                      <div>
                        <p className="font-medium">{gig.title}</p>
                        <p className="text-sm text-gray-500">${gig.price?.toLocaleString('es-CO')}</p>
                      </div>
                      <Link href={`/gigs/${gig.id}`}>
                        <Button variant="outline" size="sm">Ver</Button>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 py-8 text-center">Aún no tienes gigs. ¡Crea uno ahora!</p>
              )}
              <Link href="/create-gig" className="block mt-6">
                <Button className="w-full">+ Crear Nuevo Gig</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-10">
              <h3 className="text-2xl font-semibold mb-6">Pedidos Recientes</h3>
              {activeOrders.length > 0 ? (
                <div className="space-y-4">
                  {activeOrders.slice(0, 3).map(order => (
                    <div key={order.id} className="flex justify-between items-center border-b pb-4">
                      <div>
                        <p className="font-medium">Pedido #{order.id.slice(0,8)}</p>
                        <p className="text-sm text-gray-500">{order.status}</p>
                      </div>
                      <Link href={`/orders/${order.id}`}>
                        <Button variant="outline" size="sm">Ver</Button>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 py-8 text-center">No tienes pedidos activos aún.</p>
              )}
              <Link href="/orders" className="block mt-6">
                <Button variant="outline" className="w-full">Ver Todos los Pedidos</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
