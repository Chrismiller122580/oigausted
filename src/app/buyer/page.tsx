'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingBag, Package, MessageCircle, ArrowRight, Star, Clock } from "lucide-react";

export default function BuyerDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
          <div>
            <h1 className="text-5xl font-bold tracking-tight">Hola, Comprador 👋</h1>
            <p className="text-2xl text-gray-600 mt-3">¿Qué servicio necesitas hoy en Bucaramanga?</p>
          </div>
          <Link href="/gigs">
            <Button size="lg" className="bg-orange-600 hover:bg-orange-700 text-lg px-10 py-7 rounded-2xl mt-6 md:mt-0">
              Explorar Gigs
            </Button>
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardContent className="p-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8 text-orange-600" />
                </div>
                <div>
                  <p className="text-4xl font-bold">12</p>
                  <p className="text-gray-600">Pedidos realizados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center">
                  <Package className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <p className="text-4xl font-bold">3</p>
                  <p className="text-gray-600">En progreso</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center">
                  <Star className="w-8 h-8 text-amber-600" />
                </div>
                <div>
                  <p className="text-4xl font-bold">4.9</p>
                  <p className="text-gray-600">Calificación promedio</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main CTA */}
        <Card className="mb-12 bg-gradient-to-br from-orange-600 via-orange-700 to-red-600 text-white overflow-hidden">
          <CardContent className="p-16 text-center">
            <ShoppingBag className="h-20 w-20 mx-auto mb-8 opacity-90" />
            <h2 className="text-5xl font-bold mb-6">Encuentra el servicio perfecto</h2>
            <p className="text-2xl max-w-2xl mx-auto opacity-90">
              Miles de freelancers locales en Bucaramanga y Colombia listos para ayudarte
            </p>
            <Link href="/gigs">
              <Button size="lg" className="mt-10 bg-white text-orange-700 hover:bg-gray-100 text-2xl px-16 py-8 rounded-3xl font-semibold shadow-xl">
                Ver Todos los Gigs
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="hover:shadow-xl transition group">
            <CardContent className="p-10">
              <div className="bg-green-100 w-16 h-16 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition">
                <MessageCircle className="h-9 w-9 text-green-600" />
              </div>
              <h3 className="text-3xl font-semibold mb-3">Chats Activos</h3>
              <p className="text-gray-600 mb-8">Habla directamente con los vendedores sobre tus pedidos</p>
              <Link href="/orders">
                <Button variant="outline" className="w-full">Ir a Mis Chats</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition group">
            <CardContent className="p-10">
              <div className="bg-blue-100 w-16 h-16 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition">
                <Clock className="h-9 w-9 text-blue-600" />
              </div>
              <h3 className="text-3xl font-semibold mb-3">Pedidos Recientes</h3>
              <p className="text-gray-600 mb-8">Revisa el estado de tus últimas compras</p>
              <Link href="/orders">
                <Button variant="outline" className="w-full">Ver Mis Pedidos</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
