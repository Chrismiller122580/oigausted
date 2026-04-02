"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { Menu, X, LogOut, User } from "lucide-react"
import { useSession, signOut } from "next-auth/react"

export function Navbar() {
  const { data: session, status } = useSession()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const user = session?.user
  const isAdmin = user && (user as any).role === "admin"

  const handleLogout = async () => {
    await signOut({ redirect: false })
    window.location.href = "/login"
  }

  if (status === "loading") {
    return <div className="h-16 bg-white border-b" />
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-2xl text-yellow-600">
          OigaUsted
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          {!isAdmin && (
            <>
              <Link href="/gigs" className="hover:text-yellow-600">Explorar Gigs</Link>
              <Link href="/create-gig" className="hover:text-yellow-600">Publicar Gig</Link>
            </>
          )}
          <Link href="/profile" className="hover:text-yellow-600 flex items-center gap-1">
            <User size={18} /> Mi Perfil
          </Link>
          {isAdmin && <Link href="/admin" className="hover:text-yellow-600 font-medium">Admin</Link>}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 hidden md:block">
                {isAdmin ? "Admin" : (user as any).role === "buyer" ? "Comprador" : "Vendedor"}
              </span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut size={18} />
              </Button>
            </div>
          ) : (
            <Button asChild>
              <Link href="/login">Iniciar Sesión</Link>
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </Button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden border-t bg-white px-6 py-6">
          <div className="flex flex-col gap-6 text-lg">
            {!isAdmin && (
              <>
                <Link href="/gigs" onClick={() => setIsMenuOpen(false)}>Explorar Gigs</Link>
                <Link href="/create-gig" onClick={() => setIsMenuOpen(false)}>Publicar Gig</Link>
              </>
            )}
            <Link href="/profile" onClick={() => setIsMenuOpen(false)}>Mi Perfil</Link>
            {isAdmin && <Link href="/admin" onClick={() => setIsMenuOpen(false)}>Admin Panel</Link>}
            {user && (
              <button onClick={handleLogout} className="text-left text-red-600">
                Cerrar Sesión
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
