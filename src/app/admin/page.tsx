"use client"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import Link from "next/link"
import { Users, DollarSign, MessageCircle, BarChart3, Settings, Home } from "lucide-react"

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return

    const role = (session?.user as any)?.role || 
                 JSON.parse(localStorage.getItem("oigausted-user") || "{}").role

    if (role !== "admin") {
      router.push("/login")
    }
  }, [session, status, router])

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">Verificando acceso...</div>
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Admin-only Top Navbar */}
      <nav className="border-b border-gray-800 bg-gray-950 py-4 sticky top-0 z-50">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-yellow-500 rounded-xl flex items-center justify-center text-black font-bold text-xl">O</div>
            <div>
              <div className="font-bold text-2xl tracking-tight">OigaUsted</div>
              <div className="text-xs text-gray-400 -mt-1">Admin Portal</div>
            </div>
          </div>

          <div className="flex items-center gap-8 text-sm">
            <Link href="/admin" className="hover:text-yellow-400 transition-colors font-medium">Dashboard</Link>
            <Link href="/admin/users" className="hover:text-yellow-400 transition-colors">Usuarios</Link>
            <Link href="/admin/overview" className="hover:text-yellow-400 transition-colors">Overview</Link>
            <Link href="/admin/payouts" className="hover:text-yellow-400 transition-colors">Pagos</Link>
            <Link href="/admin/reports" className="hover:text-yellow-400 transition-colors">Reportes</Link>
            <Link href="/admin/support" className="hover:text-yellow-400 transition-colors">Soporte</Link>
            <Link href="/admin/settings" className="hover:text-yellow-400 transition-colors">Configuración</Link>
          </div>

          <button
            onClick={() => {
              localStorage.removeItem("oigausted-user")
              window.location.href = "/login"
            }}
            className="px-5 py-2 text-sm bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-3">Panel de Administrador</h1>
          <p className="text-gray-400 text-xl">Gestiona usuarios, pagos y la plataforma completa</p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/admin/users" className="block group">
            <div className="bg-gray-900 border border-gray-800 hover:border-yellow-500 p-8 rounded-3xl transition-all h-full">
              <Users className="w-12 h-12 text-yellow-400 mb-6" />
              <h3 className="text-2xl font-semibold mb-3 group-hover:text-yellow-400">Gestión de Usuarios</h3>
              <p className="text-gray-400">Editar roles, datos y eliminar usuarios</p>
            </div>
          </Link>

          <Link href="/admin/payouts" className="block group">
            <div className="bg-gray-900 border border-gray-800 hover:border-yellow-500 p-8 rounded-3xl transition-all h-full">
              <DollarSign className="w-12 h-12 text-yellow-400 mb-6" />
              <h3 className="text-2xl font-semibold mb-3 group-hover:text-yellow-400">Pagos y Retiros</h3>
              <p className="text-gray-400">Procesar pagos a vendedores</p>
            </div>
          </Link>

          <Link href="/admin/support" className="block group">
            <div className="bg-gray-900 border border-gray-800 hover:border-yellow-500 p-8 rounded-3xl transition-all h-full">
              <MessageCircle className="w-12 h-12 text-yellow-400 mb-6" />
              <h3 className="text-2xl font-semibold mb-3 group-hover:text-yellow-400">Soporte</h3>
              <p className="text-gray-400">Atención a usuarios y quejas</p>
            </div>
          </Link>

          <Link href="/admin/reports" className="block group">
            <div className="bg-gray-900 border border-gray-800 hover:border-yellow-500 p-8 rounded-3xl transition-all h-full">
              <BarChart3 className="w-12 h-12 text-yellow-400 mb-6" />
              <h3 className="text-2xl font-semibold mb-3 group-hover:text-yellow-400">Reportes</h3>
              <p className="text-gray-400">Estadísticas y análisis de la plataforma</p>
            </div>
          </Link>

          <Link href="/admin/settings" className="block group">
            <div className="bg-gray-900 border border-gray-800 hover:border-yellow-500 p-8 rounded-3xl transition-all h-full">
              <Settings className="w-12 h-12 text-yellow-400 mb-6" />
              <h3 className="text-2xl font-semibold mb-3 group-hover:text-yellow-400">Configuración</h3>
              <p className="text-gray-400">Ajustes generales de la plataforma</p>
            </div>
          </Link>

          <Link href="/admin/overview" className="block group">
            <div className="bg-gray-900 border border-gray-800 hover:border-yellow-500 p-8 rounded-3xl transition-all h-full">
              <Home className="w-12 h-12 text-yellow-400 mb-6" />
              <h3 className="text-2xl font-semibold mb-3 group-hover:text-yellow-400">Overview</h3>
              <p className="text-gray-400">Resumen general y métricas</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
