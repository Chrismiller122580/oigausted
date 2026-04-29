"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, Package, Plus, ArrowRight, Trash2, Users } from "lucide-react";
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
      const res = await fetch("/api/gigs?role=seller");
      if (res.ok) {
        const data = await res.json();
        setGigs(Array.isArray(data) ? data : data.gigs || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders?role=seller");
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
    if (!confirm("¿Estás seguro de eliminar este gig? Esta acción no se puede deshacer.")) return;
    
    try {
      const res = await fetch(`/api/gigs/${gigId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Gig eliminado correctamente");
        fetchGigs();
      } else {
        toast.error("No se pudo eliminar el gig");
      }
    } catch (err) {
      toast.error("Error de conexión");
    }
  };

  const activeOrders = orders.filter((o: any) => !["Completed", "Approved"].includes(o.status));
  const completedOrders = orders.filter((o: any) => ["Completed", "Approved"].includes(o.status));
  const totalEarnings = completedOrders.reduce((sum: number, o: any) => sum + (o.price || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="max-w-7xl mx-auto px-6 pt-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10">
          <div>
            <h1 className="text-5xl font-bold tracking-tight">Hola, Vendedor</h1>
            <p className="text-xl text-gray-600 mt-2">Gestiona tus servicios y pedidos activos</p>
          </div>
          <Button asChild size="lg" className="mt-6 md:mt-0 px-8 py-7 text-lg">
            <Link href="/create-gig">
              <Plus className="mr-3" /> Crear Nuevo Gig
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card>
            <CardContent className="p-8">
              <div className="flex items-center gap-4">
                <div className="bg-green-100 p-4 rounded-2xl">
                  <DollarSign className="h-9 w-9 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Ganancias Totales</p>
                  <p className="text-4xl font-bold mt-1">${totalEarnings.toLocaleString("es-CO")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-4 rounded-2xl">
                  <Package className="h-9 w-9 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pedidos Activos</p>
                  <p className="text-4xl font-bold mt-1">{activeOrders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <div className="flex items-center gap-4">
                <div className="bg-orange-100 p-4 rounded-2xl">
                  <Package className="h-9 w-9 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Gigs Publicados</p>
                  <p className="text-4xl font-bold mt-1">{gigs.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <div className="flex items-center gap-4">
                <div className="bg-purple-100 p-4 rounded-2xl">
                  <Users className="h-9 w-9 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pedidos Completados</p>
                  <p className="text-4xl font-bold mt-1">{completedOrders.length}</p>
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
              <Link href="/orders" className="text-orange-600 hover:underline flex items-center gap-2 font-medium">
                Ver todos <ArrowRight size={18} />
              </Link>
            </div>

            {activeOrders.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                No tienes pedidos activos. ¡Comparte tus gigs!
              </div>
            ) : (
              <div className="space-y-4">
                {activeOrders.slice(0, 5).map((order: any) => (
                  <Link
                    key={order.id}
                    href={`/orders/${order.id}`}
                    className="block p-6 border rounded-3xl hover:border-orange-500 hover:shadow-md transition-all"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-lg">{order.gig?.title}</p>
                        <p className="text-sm text-gray-500">
                          Cliente: {order.buyer?.name || order.buyer?.email} • ${order.price?.toLocaleString("es-CO")}
                        </p>
                      </div>
                      <div className={`mt-4 md:mt-0 px-6 py-2 rounded-full text-sm font-medium ${statusConfig[order.status]?.color || "bg-gray-100"}`}>
                        {statusConfig[order.status]?.label || order.status}
                      </div>
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
              <Button asChild>
                <Link href="/create-gig">+ Nuevo Gig</Link>
              </Button>
            </div>

            {gigs.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-2xl text-gray-400">Aún no tienes gigs publicados</p>
                <Button asChild className="mt-6" size="lg">
                  <Link href="/create-gig">Crear mi primer Gig</Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {gigs.map((gig: any) => (
                  <Card key={gig.id} className="hover:shadow-lg transition">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-xl line-clamp-2">{gig.title}</h3>
                          <p className="text-3xl font-bold text-orange-600 mt-3">
                            ${gig.price?.toLocaleString("es-CO")}
                          </p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => deleteGig(gig.id)} className="text-red-500 hover:bg-red-50">
                          <Trash2 size={20} />
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600 mt-4 line-clamp-3">{gig.description}</p>
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
