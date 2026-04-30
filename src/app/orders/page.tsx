"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Clock, MessageCircle } from "lucide-react";

export default function OrdersPage() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch orders", error);
    } finally {
      setLoading(false);
    }
  };

  const statusConfig: Record<string, { label: string; color: string }> = {
    Pending: { label: "Pendiente", color: "bg-yellow-100 text-yellow-700" },
    "In Progress": { label: "En Progreso", color: "bg-blue-100 text-blue-700" },
    Completed: { label: "Completado", color: "bg-green-100 text-green-700" },
    Cancelled: { label: "Cancelado", color: "bg-red-100 text-red-700" },
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando tus pedidos...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-6">
        <h1 className="text-5xl font-bold mb-4">Mis Pedidos</h1>
        <p className="text-xl text-gray-600 mb-10">Gestiona y sigue el progreso de tus compras y ventas</p>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="p-20 text-center">
              <Package className="mx-auto w-20 h-20 text-gray-300 mb-6" />
              <p className="text-2xl text-gray-400">Aún no tienes pedidos</p>
              <Link href="/gigs">
                <Button className="mt-6">Explorar Gigs</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const statusInfo = statusConfig[order.status] || { label: order.status || "Desconocido", color: "bg-gray-100 text-gray-700" };
              return (
                <Card key={order.id} className="hover:shadow-lg transition">
                  <CardContent className="p-8 flex flex-col md:flex-row gap-8 items-center">
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold text-xl">Pedido #{order.id?.slice(0, 8)}</h3>
                        <span className={`px-4 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <p className="text-gray-600 mt-3">{order.gig?.title || "Servicio"}</p>
                      <p className="text-2xl font-bold text-orange-600 mt-4">
                        ${Number(order.price).toLocaleString('es-CO')}
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 w-full md:w-auto">
                      <Link href={`/orders/${order.id}`}>
                        <Button className="w-full md:w-auto flex items-center gap-2">
                          <MessageCircle size={18} /> Ver Chat
                        </Button>
                      </Link>
                      <Link href={`/orders/${order.id}`}>
                        <Button variant="outline" className="w-full md:w-auto">Ver Detalles</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
