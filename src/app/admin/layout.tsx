"use client"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    if (status === "loading") return

    const role = (session?.user as any)?.role || 
                 JSON.parse(localStorage.getItem("oigausted-user") || "{}").role

    if (role === "admin") {
      setAuthorized(true)
    } else {
      router.push("/login")
    }
  }, [session, status, router])

  if (status === "loading" || !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        Verificando acceso de administrador...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Admin Navbar with Gigs link */}
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
            <Link href="/admin/gigs" className="hover:text-yellow-400 transition-colors">Gigs</Link>
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

      {/* Page Content */}
      <main>
        {children}
      </main>
    </div>
  )
}
