'use client';

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Clock, MessageCircle, ArrowRight, CheckCircle } from "lucide-react";

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

  const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    Pending: { 
      label: "Pendiente", 
      color: "bg-yellow-100 text-yellow-700 border-yellow-200", 
      icon: <Clock className="w-4 h-4" /> 
    },
    "In Progress": { 
      label: "En Progreso", 
      color: "bg-blue-100 text-blue-700 border-blue-200", 
      icon: <Package className="w-4 h-4" /> 
    },
    Completed: { 
      label: "Completado", 
      color: "bg-green-100 text-green-700 border-green-200", 
      icon: <CheckCircle className="w-4 h-4" /> 
    },
    Cancelled: { 
      label: "Cancelado", 
      color: "bg-red-100 text-red-700 border-red-200", 
      icon: <Clock className="w-4 h-4" /> 
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-lg">Cargando tus pedidos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-5xl font-bold tracking-tight">Mis Pedidos</h1>
            <p className="text-xl text-gray-600 mt-2">Gestiona tus compras y ventas locales</p>
          </div>
          <Link href="/gigs">
            <Button>Explorar más gigs</Button>
          </Link>
        </div>

        {orders.length === 0 ? (
          <Card className="max-w-md mx-auto">
            <CardContent className="p-16 text-center">
              <Package className="mx-auto w-20 h-20 text-gray-300 mb-6" />
              <h3 className="text-2xl font-semibold mb-3">Aún no tienes pedidos</h3>
              <p className="text-gray-500 mb-8">Cuando compres o vendas un servicio, aparecerá aquí</p>
              <Link href="/gigs">
                <Button size="lg" className="bg-orange-600 hover:bg-orange-700">
                  Explorar Gigs
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {orders.map((order) => {
              const statusInfo = statusConfig[order.status] || { 
                label: order.status || "Desconocido", 
                color: "bg-gray-100 text-gray-700", 
                icon: <Clock className="w-4 h-4" /> 
              };

              return (
                <Card key={order.id} className="hover:shadow-xl transition-all duration-300 overflow-hidden">
                  <CardContent className="p-8 flex flex-col md:flex-row gap-8 items-start">
                    {/* Left - Gig Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-2xl line-clamp-2">
                            {order.gig?.title || "Servicio"}
                          </h3>
                          <p className="text-orange-600 font-bold text-3xl mt-3">
                            ${Number(order.price).toLocaleString('es-CO')}
                          </p>
                        </div>

                        <div className={`px-5 py-2 rounded-full text-sm font-medium flex items-center gap-2 border ${statusInfo.color}`}>
                          {statusInfo.icon}
                          {statusInfo.label}
                        </div>
                      </div>

                      <div className="mt-6 flex items-center gap-3 text-sm text-gray-600">
                        <div className="bg-gray-100 px-3 py-1 rounded-full">
                          {order.buyer?.name || order.seller?.name ? "Con " : ""}
                          {order.buyer?.name || order.seller?.businessName || "Usuario"}
                        </div>
                        <div className="text-gray-400">•</div>
                        <div>{new Date(order.createdAt).toLocaleDateString('es-CO')}</div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3 w-full md:w-auto md:min-w-[180px]">
                      <Link href={`/orders/${order.id}`}>
                        <Button className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700">
                          <MessageCircle size={18} />
                          Ver Chat
                        </Button>
                      </Link>

                      <Link href={`/orders/${order.id}`}>
                        <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                          Ver Detalles
                          <ArrowRight size={18} />
                        </Button>
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
