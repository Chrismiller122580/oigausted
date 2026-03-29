"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Menu, X, LogOut } from "lucide-react"

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleLogout = () => {
    if (confirm("¿Cerrar sesión?")) {
      localStorage.clear()
      window.location.reload()
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur-md">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2 font-bold text-2xl text-yellow-600">
          OigaUsted
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link href="/gigs" className="hover:text-yellow-600 transition-colors">Explorar Gigs</Link>
          <Link href="/create-gig" className="hover:text-yellow-600 transition-colors">Publicar Gig</Link>
          <Link href="/profile" className="hover:text-yellow-600 transition-colors">Mi Perfil</Link>
          <Link href="/admin/earnings" className="hover:text-yellow-600 transition-colors">Ganancias</Link>
        </nav>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleLogout} className="hidden md:flex items-center gap-2">
            <LogOut size={16} />
            Salir
          </Button>

          <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700" asChild>
            <Link href="/create-gig">Publicar Gig</Link>
          </Button>

          {/* Mobile menu button */}
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

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t bg-white">
          <div className="container mx-auto px-6 py-6 flex flex-col gap-6 text-lg">
            <Link href="/gigs" onClick={() => setIsMenuOpen(false)}>Explorar Gigs</Link>
            <Link href="/create-gig" onClick={() => setIsMenuOpen(false)}>Publicar Gig</Link>
            <Link href="/profile" onClick={() => setIsMenuOpen(false)}>Mi Perfil</Link>
            <Link href="/admin/earnings" onClick={() => setIsMenuOpen(false)}>Ganancias</Link>
            <button onClick={handleLogout} className="text-left text-red-600">Cerrar Sesión</button>
          </div>
        </div>
      )}
    </header>
  )
}
