"use client"
import { useSession } from "next-auth/react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { useEffect, useState } from "react"

// Simple fallback navbar for non-admin pages
export default function Navbar() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    if (status === "loading") return

    const savedUser = localStorage.getItem("oigausted-user")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
  }, [status])

  // Don't render on admin pages (handled by admin layout)
  if (pathname?.startsWith("/admin")) {
    return null
  }

  const isLoggedIn = !!user || !!session?.user
  const role = user?.role || (session?.user as any)?.role || "buyer"

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white border-b z-50">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-yellow-500 rounded-xl flex items-center justify-center text-black font-bold text-2xl">O</div>
          <span className="font-bold text-2xl tracking-tight">OigaUsted</span>
        </Link>

        <div className="flex items-center gap-8 text-sm">
          <Link href="/gigs" className="hover:text-yellow-600">Gigs</Link>
          <Link href="/orders" className="hover:text-yellow-600">Mis Pedidos</Link>
          
          {isLoggedIn ? (
            <>
              {role === "seller" && <Link href="/seller" className="hover:text-yellow-600">Vendedor</Link>}
              {role === "buyer" && <Link href="/buyer" className="hover:text-yellow-600">Comprador</Link>}
              <Link href="/profile" className="hover:text-yellow-600">Perfil</Link>
              <button 
                onClick={() => {
                  localStorage.removeItem("oigausted-user")
                  window.location.href = "/login"
                }}
                className="text-red-600 hover:text-red-700"
              >
                Cerrar Sesión
              </button>
            </>
          ) : (
            <Link href="/login" className="bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-2 rounded-full font-medium">
              Iniciar Sesión
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
