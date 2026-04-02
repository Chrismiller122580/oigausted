"use client"
import Link from "next/link"

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="container mx-auto py-12 px-6 max-w-6xl">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 text-blue-400">Admin Panel</h1>
          <p className="text-xl text-gray-400">Gestión completa de OigaUsted</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Link href="/admin/overview" className="group">
            <div className="bg-gray-900 border border-gray-700 hover:border-blue-500 rounded-3xl p-10 text-center transition-all hover:shadow-2xl">
              <div className="text-6xl mb-6">📊</div>
              <h3 className="text-2xl font-semibold mb-3 group-hover:text-blue-400">Overview</h3>
              <p className="text-gray-400">Métricas generales y estadísticas</p>
            </div>
          </Link>

          <Link href="/admin/users" className="group">
            <div className="bg-gray-900 border border-gray-700 hover:border-blue-500 rounded-3xl p-10 text-center transition-all hover:shadow-2xl">
              <div className="text-6xl mb-6">👥</div>
              <h3 className="text-2xl font-semibold mb-3 group-hover:text-blue-400">Gestión de Usuarios</h3>
              <p className="text-gray-400">Ver y editar usuarios</p>
            </div>
          </Link>

          <Link href="/admin/payouts" className="group">
            <div className="bg-gray-900 border border-gray-700 hover:border-blue-500 rounded-3xl p-10 text-center transition-all hover:shadow-2xl">
              <div className="text-6xl mb-6">💰</div>
              <h3 className="text-2xl font-semibold mb-3 group-hover:text-blue-400">Pagos a Vendedores</h3>
              <p className="text-gray-400">Revisar y pagar pendientes</p>
            </div>
          </Link>

          <Link href="/admin/support" className="group">
            <div className="bg-gray-900 border border-gray-700 hover:border-blue-500 rounded-3xl p-10 text-center transition-all hover:shadow-2xl">
              <div className="text-6xl mb-6">🛟</div>
              <h3 className="text-2xl font-semibold mb-3 group-hover:text-blue-400">Soporte y Tickets</h3>
              <p className="text-gray-400">Gestionar tickets de usuarios</p>
            </div>
          </Link>

          <Link href="/admin/settings" className="group">
            <div className="bg-gray-900 border border-gray-700 hover:border-blue-500 rounded-3xl p-10 text-center transition-all hover:shadow-2xl">
              <div className="text-6xl mb-6">⚙️</div>
              <h3 className="text-2xl font-semibold mb-3 group-hover:text-blue-400">Platform Settings</h3>
              <p className="text-gray-400">Configuración general</p>
            </div>
          </Link>

          <Link href="/admin/reports" className="group">
            <div className="bg-gray-900 border border-gray-700 hover:border-blue-500 rounded-3xl p-10 text-center transition-all hover:shadow-2xl">
              <div className="text-6xl mb-6">📈</div>
              <h3 className="text-2xl font-semibold mb-3 group-hover:text-blue-400">Reports</h3>
              <p className="text-gray-400">Reportes y analíticas</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
