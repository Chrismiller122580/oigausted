"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { Menu, X, LogOut, User, Repeat, HelpCircle } from "lucide-react"
import { useRouter } from "next/navigation"

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const savedUser = localStorage.getItem("oigausted-user")
    if (savedUser) setUser(JSON.parse(savedUser))
  }, [])

  const handleLogout = () => {
    if (confirm("¿Cerrar sesión?")) {
      localStorage.removeItem("oigausted-user")
      setUser(null)
      router.push("/login")
    }
  }

  const switchRole = () => {
    if (!user) return
    const newRole = user.role === "buyer" ? "seller" : "buyer"
    const updated = { ...user, role: newRole }
    localStorage.setItem("oigausted-user", JSON.stringify(updated))
    setUser(updated)
    window.location.reload()
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur-md">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <img src="/logo.png" alt="OigaUsted" className="h-9 w-auto" />
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          {user?.role !== "admin" && (
            <>
              <Link href="/gigs" className="hover:text-yellow-600 transition-colors">Explorar Gigs</Link>
              <Link href="/create-gig" className="hover:text-yellow-600 transition-colors">Publicar Gig</Link>
            </>
          )}
          {user?.role === "admin" && (
            <>
              <Link href="/admin" className="hover:text-yellow-600 transition-colors font-semibold">Dashboard</Link>
              <Link href="/admin/users" className="hover:text-yellow-600 transition-colors">Usuarios</Link>
            </>
          )}
          <Link href="/profile" className="hover:text-yellow-600 transition-colors">Mi Perfil</Link>
          {user && user.role !== "admin" && (
            <Link href="/seller" className="hover:text-yellow-600 transition-colors">Vendedor</Link>
          )}
          <Link href="#" className="hover:text-yellow-600 transition-colors flex items-center gap-1">
            <HelpCircle size={16} /> Ayuda
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 text-sm">
                <User size={16} />
                <span>{user.name}</span>
                <span className="text-xs bg-yellow-100 px-2 py-1 rounded-full">({user.role})</span>
              </div>

              {user.role !== "admin" && (
                <Button variant="ghost" size="sm" onClick={switchRole} className="flex items-center gap-2 text-blue-600">
                  <Repeat size={16} /> Cambiar Rol
                </Button>
              )}

              <Button variant="ghost" size="sm" onClick={handleLogout} className="flex items-center gap-2 text-red-600">
                <LogOut size={16} /> Cerrar Sesión
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" asChild>
              <Link href="/login">Iniciar Sesión</Link>
            </Button>
          )}

          {user?.role !== "admin" && (
            <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700" asChild>
              <Link href="/create-gig">Publicar Gig</Link>
            </Button>
          )}

          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </Button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden border-t bg-white">
          <div className="container py-6 flex flex-col gap-6 text-lg">
            {user?.role !== "admin" && (
              <>
                <Link href="/gigs" onClick={() => setIsMenuOpen(false)}>Explorar Gigs</Link>
                <Link href="/create-gig" onClick={() => setIsMenuOpen(false)}>Publicar Gig</Link>
              </>
            )}
            {user?.role === "admin" && (
              <>
                <Link href="/admin" onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
                <Link href="/admin/users" onClick={() => setIsMenuOpen(false)}>Usuarios</Link>
              </>
            )}
            <Link href="/profile" onClick={() => setIsMenuOpen(false)}>Mi Perfil</Link>
            {user && user.role !== "admin" && <Link href="/seller" onClick={() => setIsMenuOpen(false)}>Vendedor</Link>}
            <Link href="#" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2">Ayuda</Link>
            {user && (
              <button onClick={handleLogout} className="text-left text-red-600 flex items-center gap-2">
                <LogOut size={20} /> Cerrar Sesión
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
