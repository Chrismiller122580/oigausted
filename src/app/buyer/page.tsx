"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingBag, Package, MessageCircle, ArrowRight, Clock, Star } from "lucide-react";

export default function BuyerDashboard() {
  const { data: session } = useSession();
  const userName = session?.user?.name?.split(" ")[0] || "Amigo";

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-12">
          <h1 className="text-5xl font-bold tracking-tight">Hola, {userName} 👋</h1>
          <p className="text-2xl text-gray-600 mt-3">¿Qué servicio necesitas hoy en Colombia?</p>
        </div>

        {/* Hero Section */}
        <Card className="mb-12 bg-gradient-to-br from-orange-600 via-red-600 to-rose-600 text-white overflow-hidden">
          <CardContent className="p-16 text-center">
            <ShoppingBag className="h-20 w-20 mx-auto mb-8 opacity-90" />
            <h2 className="text-5xl font-bold mb-6">Encuentra profesionales locales</h2>
            <p className="text-2xl mb-10 max-w-2xl mx-auto opacity-90">
              Miles de gigs confiables cerca de ti. Rápido, seguro y con entrega local.
            </p>
            <Button asChild size="lg" className="bg-white text-orange-700 hover:bg-gray-100 text-2xl px-16 py-8 rounded-3xl font-semibold shadow-xl">
              <Link href="/gigs">Explorar Gigs Ahora</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="hover:shadow-xl transition-all group">
            <CardContent className="p-10">
              <div className="bg-orange-100 w-16 h-16 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition">
                <ShoppingBag className="h-9 w-9 text-orange-600" />
              </div>
              <h3 className="text-3xl font-semibold mb-3">Buscar Servicios</h3>
              <p className="text-gray-600 mb-8">Encuentra lo que necesitas cerca de ti</p>
              <Button asChild className="w-full">
                <Link href="/gigs">Ver Todos los Gigs</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-all group">
            <CardContent className="p-10">
              <div className="bg-blue-100 w-16 h-16 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition">
                <Package className="h-9 w-9 text-blue-600" />
              </div>
              <h3 className="text-3xl font-semibold mb-3">Mis Pedidos</h3>
              <p className="text-gray-600 mb-8">Revisa el estado de tus compras</p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/orders">Ver Mis Órdenes</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-all group">
            <CardContent className="p-10">
              <div className="bg-green-100 w-16 h-16 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition">
                <MessageCircle className="h-9 w-9 text-green-600" />
              </div>
              <h3 className="text-3xl font-semibold mb-3">Chats Activos</h3>
              <p className="text-gray-600 mb-8">Habla directamente con vendedores</p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/orders">Ir a Mensajes</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Placeholder */}
        <Card>
          <CardContent className="p-10">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-semibold">Actividad Reciente</h2>
              <Link href="/orders" className="text-orange-600 hover:underline flex items-center gap-2">
                Ver todo <ArrowRight size={18} />
              </Link>
            </div>
            <p className="text-gray-500 text-center py-16 text-lg">
              Tus pedidos y conversaciones recientes aparecerán aquí
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
