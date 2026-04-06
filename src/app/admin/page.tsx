"use client"
import Link from "next/link"
import { Users, DollarSign, MessageCircle, BarChart3, Settings, Home, Package } from "lucide-react"

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-950 text-white pt-8">
      <div className="container mx-auto px-6">
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-3">Panel de Administrador</h1>
          <p className="text-gray-400 text-xl">Gestiona usuarios, gigs, pagos y la plataforma completa</p>
        </div>

        {/* Stats Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                <Users className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <div className="text-4xl font-bold">1,284</div>
                <div className="text-gray-400">Usuarios totales</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-green-500/10 rounded-2xl flex items-center justify-center">
                <Package className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <div className="text-4xl font-bold">342</div>
                <div className="text-gray-400">Gigs publicados</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center">
                <DollarSign className="w-8 h-8 text-orange-400" />
              </div>
              <div>
                <div className="text-4xl font-bold">$12.4M</div>
                <div className="text-gray-400">Volumen este mes</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-purple-400" />
              </div>
              <div>
                <div className="text-4xl font-bold">47</div>
                <div className="text-gray-400">Soporte pendiente</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Access Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/admin/users" className="group">
            <div className="bg-gray-900 border border-gray-800 hover:border-yellow-500 p-8 rounded-3xl transition-all h-full">
              <Users className="w-12 h-12 text-yellow-400 mb-6" />
              <h3 className="text-2xl font-semibold mb-3 group-hover:text-yellow-400">Gestión de Usuarios</h3>
              <p className="text-gray-400">Editar roles, datos y eliminar usuarios</p>
            </div>
          </Link>

          <Link href="/admin/gigs" className="group">
            <div className="bg-gray-900 border border-gray-800 hover:border-yellow-500 p-8 rounded-3xl transition-all h-full">
              <Package className="w-12 h-12 text-yellow-400 mb-6" />
              <h3 className="text-2xl font-semibold mb-3 group-hover:text-yellow-400">Gestión de Gigs</h3>
              <p className="text-gray-400">Editar, eliminar y moderar servicios</p>
            </div>
          </Link>

          <Link href="/admin/payouts" className="group">
            <div className="bg-gray-900 border border-gray-800 hover:border-yellow-500 p-8 rounded-3xl transition-all h-full">
              <DollarSign className="w-12 h-12 text-yellow-400 mb-6" />
              <h3 className="text-2xl font-semibold mb-3 group-hover:text-yellow-400">Pagos y Retiros</h3>
              <p className="text-gray-400">Procesar pagos a vendedores</p>
            </div>
          </Link>

          <Link href="/admin/support" className="group">
            <div className="bg-gray-900 border border-gray-800 hover:border-yellow-500 p-8 rounded-3xl transition-all h-full">
              <MessageCircle className="w-12 h-12 text-yellow-400 mb-6" />
              <h3 className="text-2xl font-semibold mb-3 group-hover:text-yellow-400">Soporte</h3>
              <p className="text-gray-400">Atención a usuarios y quejas</p>
            </div>
          </Link>

          <Link href="/admin/reports" className="group">
            <div className="bg-gray-900 border border-gray-800 hover:border-yellow-500 p-8 rounded-3xl transition-all h-full">
              <BarChart3 className="w-12 h-12 text-yellow-400 mb-6" />
              <h3 className="text-2xl font-semibold mb-3 group-hover:text-yellow-400">Reportes</h3>
              <p className="text-gray-400">Estadísticas y análisis de la plataforma</p>
            </div>
          </Link>

          <Link href="/admin/settings" className="group">
            <div className="bg-gray-900 border border-gray-800 hover:border-yellow-500 p-8 rounded-3xl transition-all h-full">
              <Settings className="w-12 h-12 text-yellow-400 mb-6" />
              <h3 className="text-2xl font-semibold mb-3 group-hover:text-yellow-400">Configuración</h3>
              <p className="text-gray-400">Ajustes generales de la plataforma</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
