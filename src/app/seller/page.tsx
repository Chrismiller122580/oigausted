"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, Package, Plus, ArrowRight, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";

const statusConfig: any = {
  Pending: { label: "Pendiente", color: "bg-orange-100 text-orange-700" },
  Paid: { label: "Pagado", color: "bg-green-100 text-green-700" },
  "In Progress": { label: "En progreso", color: "bg-blue-100 text-blue-700" },
  Completed: { label: "Completado", color: "bg-emerald-100 text-emerald-700" },
  Approved: { label: "Aprobado", color: "bg-purple-100 text-purple-700" },
};

export default function SellerDashboard() {
  const { data: session, status } = useSession();
  const [gigs, setGigs] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    const user = session?.user as any;
    if (!user?.id) {
      setLoading(false);
      return;
    }
    fetchGigs();
    fetchOrders();
  }, [session, status]);

  const fetchGigs = async () => {
    try {
      const res = await fetch("/api/gigs?role=seller", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setGigs(data.gigs || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders?role=seller", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : data.orders || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteGig = async (gigId: string) => {
    if (!confirm("¿Estás seguro de eliminar este gig?")) return;
    try {
      const res = await fetch(`/api/gigs/${gigId}`, { 
        method: "DELETE", 
        credentials: "include" 
      });
      if (res.ok) {
        toast.success("Gig eliminado");
        fetchGigs();
      }
    } catch (err) {
      toast.error("Error al eliminar");
    }
  };

  const activeOrders = orders.filter((o: any) => o.status !== "Completed" && o.status !== "Approved");
  const totalEarnings = orders
    .filter((o: any) => o.status === "Approved" || o.status === "Completed")
    .reduce((sum: number, o: any) => sum + (o.price || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="max-w-7xl mx-auto px-6 pt-8">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-5xl font-bold tracking-tight">Hola, Vendedor</h1>
            <p className="text-xl text-gray-600 mt-2">Gestiona tus gigs y pedidos activos</p>
          </div>
          <Button asChild size="lg" className="px-8 py-7 text-lg">
            <Link href="/create-gig">
              <Plus className="mr-2" /> Crear Nuevo Gig
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardContent className="p-8">
              <div className="flex items-center gap-5">
                <div className="bg-green-100 p-4 rounded-2xl">
                  <DollarSign className="h-10 w-10 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Ganancias Totales</p>
                  <p className="text-4xl font-bold">${totalEarnings.toLocaleString("es-CO")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <div className="flex items-center gap-5">
                <div className="bg-blue-100 p-4 rounded-2xl">
                  <Package className="h-10 w-10 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pedidos Activos</p>
                  <p className="text-4xl font-bold">{activeOrders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <div className="flex items-center gap-5">
                <div className="bg-orange-100 p-4 rounded-2xl">
                  <Package className="h-10 w-10 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Gigs Publicados</p>
                  <p className="text-4xl font-bold">{gigs.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Orders */}
        <Card className="mb-12">
          <CardContent className="p-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-semibold">Pedidos Activos ({activeOrders.length})</h2>
              <Link href="/orders" className="text-orange-600 hover:underline flex items-center gap-2">
                Ver todos <ArrowRight size={18} />
              </Link>
            </div>

            {activeOrders.length === 0 ? (
              <p className="text-gray-500 py-12 text-center">No tienes pedidos activos en este momento.</p>
            ) : (
              <div className="space-y-5">
                {activeOrders.slice(0, 6).map((order: any) => (
                  <Link
                    key={order.id}
                    href={`/orders/${order.id}`}
                    className="flex flex-col md:flex-row md:items-center justify-between p-6 border rounded-3xl hover:border-orange-500 hover:shadow-md transition-all"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-lg">{order.gig?.title}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Comprador: {order.buyer?.name} • ${order.price?.toLocaleString("es-CO")}
                      </p>
                    </div>
                    <div className={`px-6 py-2 rounded-full text-sm font-medium mt-4 md:mt-0 ${statusConfig[order.status]?.color}`}>
                      {statusConfig[order.status]?.label || order.status}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Gigs */}
        <Card>
          <CardContent className="p-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-semibold">Mis Gigs ({gigs.length})</h2>
              <Button asChild variant="outline">
                <Link href="/create-gig">+ Nuevo Gig</Link>
              </Button>
            </div>

            {gigs.length === 0 ? (
              <p className="text-gray-500 py-16 text-center">Aún no tienes gigs. ¡Crea tu primer servicio!</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {gigs.map((gig: any) => (
                  <Card key={gig.id} className="overflow-hidden hover:shadow-lg transition">
                    <CardContent className="p-6">
                      <div className="flex justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-xl line-clamp-2">{gig.title}</h3>
                          <p className="text-3xl font-bold text-orange-600 mt-3">
                            ${gig.price?.toLocaleString("es-CO")}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteGig(gig.id)}
                          className="text-red-500 hover:bg-red-50"
                        >
                          <Trash2 size={20} />
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600 mt-6 line-clamp-3">{gig.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}