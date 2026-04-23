"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Package, ArrowRight } from "lucide-react";
import { toast } from "react-hot-toast";

const statusConfig: any = {
  Pending: { label: "Pendiente de pago", color: "bg-orange-100 text-orange-700" },
  Paid: { label: "Pagado ✓", color: "bg-green-100 text-green-700" },
  "In Progress": { label: "En progreso", color: "bg-blue-100 text-blue-700" },
  Completed: { label: "Completado", color: "bg-emerald-100 text-emerald-700" },
  Approved: { label: "Aprobado", color: "bg-purple-100 text-purple-700" },
};

export default function OrdersPage() {
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"buyer" | "seller">("buyer");

  useEffect(() => {
    if (status === "loading") return;

    const user = session?.user as any; // Safe cast for id/role
    if (!user?.id) {
      setLoading(false);
      return;
    }

    fetchOrders(activeTab);
  }, [session, status, activeTab]);

  const fetchOrders = async (role: "buyer" | "seller") => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/orders?role=${role}`, {
        credentials: "include",
        cache: "no-store",
      });

      if (!res.ok) {
        if (res.status === 401) throw new Error("Sesión expirada. Inicia sesión nuevamente.");
        throw new Error("No se pudieron cargar las órdenes");
      }

      const data = await res.json();
      setOrders(Array.isArray(data) ? data : data.orders || []);
    } catch (err: any) {
      console.error("Orders fetch error:", err);
      setError(err.message || "Error al cargar órdenes");
      toast.error(err.message || "Error al cargar órdenes");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-6 text-gray-600">Cargando tus órdenes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <p className="text-red-600 mb-6">{error}</p>
          <Button onClick={() => fetchOrders(activeTab)}>Intentar de nuevo</Button>
        </div>
      </div>
    );
  }

  const hasOrders = orders.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-bold">Mis Órdenes</h1>
        </div>

        {/* Role Tabs */}
        <div className="flex border-b mb-8">
          <button
            onClick={() => setActiveTab("buyer")}
            className={`px-8 py-4 font-medium text-lg border-b-2 transition-all ${
              activeTab === "buyer"
                ? "border-orange-600 text-orange-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Como Comprador
          </button>
          <button
            onClick={() => setActiveTab("seller")}
            className={`px-8 py-4 font-medium text-lg border-b-2 transition-all ${
              activeTab === "seller"
                ? "border-orange-600 text-orange-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Como Vendedor
          </button>
        </div>

        {!hasOrders ? (
          <div className="text-center py-20 border-2 border-dashed rounded-3xl border-gray-300 bg-white">
            <Package className="mx-auto h-16 w-16 text-gray-300 mb-6" />
            <p className="text-2xl text-gray-500 mb-4">
              {activeTab === "buyer" ? "Aún no tienes órdenes como comprador" : "Aún no tienes pedidos como vendedor"}
            </p>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              {activeTab === "buyer"
                ? "Cuando compres un gig, aparecerá aquí"
                : "Cuando alguien compre uno de tus gigs, aparecerá aquí"}
            </p>
            {activeTab === "buyer" && (
              <Button asChild size="lg" className="px-10 py-7 text-lg">
                <Link href="/gigs">Explorar Gigs Disponibles</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order: any) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="block bg-white border rounded-3xl p-8 hover:shadow-xl hover:border-orange-500 transition-all group"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex-1">
                    <h3 className="font-semibold text-xl line-clamp-2 group-hover:text-orange-600 transition">
                      {order.gig?.title || "Orden sin título"}
                    </h3>
                    <p className="text-gray-500 mt-2">
                      {activeTab === "buyer"
                        ? `Vendedor: ${order.seller?.businessName || order.seller?.name}`
                        : `Comprador: ${order.buyer?.name}`}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <div className={`px-6 py-2 text-sm font-medium rounded-full ${statusConfig[order.status]?.color || "bg-gray-100"}`}>
                      {statusConfig[order.status]?.label || order.status}
                    </div>
                    <p className="text-2xl font-bold text-orange-600">
                      ${order.price?.toLocaleString("es-CO")}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <span className="text-orange-600 text-sm font-medium flex items-center gap-2 group-hover:gap-3 transition-all">
                    Ver detalles del pedido <ArrowRight size={18} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}