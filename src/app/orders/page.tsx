"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Package, ArrowRight } from "lucide-react";

const statusConfig: any = {
  Pending: { label: "Pendiente", color: "bg-orange-100 text-orange-700" },
  Paid: { label: "Pagado ✓", color: "bg-green-100 text-green-700" },
  "In Progress": { label: "En progreso", color: "bg-blue-100 text-blue-700" },
  Completed: { label: "Completado", color: "bg-emerald-100 text-emerald-700" },
};

export default function BuyerOrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user?.id) {
      router.push("/login?callbackUrl=/orders");
      return;
    }
    fetchOrders();
  }, [session, status, router]);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders?role=buyer", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando tus órdenes...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-5xl mx-auto px-6">
        <h1 className="text-4xl font-bold mb-2">Mis Órdenes</h1>
        <p className="text-gray-600 mb-10">Como Comprador</p>

        {orders.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center shadow">
            <Package className="mx-auto h-20 w-20 text-gray-300 mb-6" />
            <h3 className="text-2xl font-semibold mb-4">Aún no tienes órdenes</h3>
            <p className="text-gray-600 mb-10">Cuando compres un gig, aparecerá aquí</p>
            <Button asChild size="lg" className="px-10 py-7 text-lg">
              <Link href="/gigs">Explorar Gigs Disponibles</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order: any) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="block bg-white border rounded-3xl p-8 hover:shadow-xl hover:border-orange-500 transition-all"
              >
                {/* Order card content here */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-xl">{order.gig?.title}</h3>
                    <p className="text-gray-500 mt-1">
                      Vendedor: {order.seller?.businessName || order.seller?.name}
                    </p>
                  </div>
                  <div className={`px-5 py-2 rounded-full text-sm font-medium ${statusConfig[order.status]?.color || "bg-gray-100"}`}>
                    {statusConfig[order.status]?.label || order.status}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}