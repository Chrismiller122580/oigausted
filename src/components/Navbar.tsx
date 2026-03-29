"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Menu, X } from "lucide-react"

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2 font-bold text-2xl text-yellow-600">
          OigaUsted
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link href="/gigs" className="hover:text-yellow-600 transition-colors">Explorar Gigs</Link>
          <Link href="/create-gig" className="hover:text-yellow-600 transition-colors">Publicar Gig</Link>
          <Link href="/profile" className="hover:text-yellow-600 transition-colors">Mi Perfil</Link>
          <Link href="/admin/earnings" className="hover:text-yellow-600 transition-colors">Ganancias</Link>
        </nav>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Iniciar Sesión</Link>
          </Button>
          <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700" asChild>
            <Link href="/login">Registrarse</Link>
          </Button>

          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={toggleMenu}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </Button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden border-t bg-white">
          <div className="container py-6 flex flex-col gap-6 text-lg">
            <Link href="/gigs" onClick={() => setIsMenuOpen(false)}>Explorar Gigs</Link>
            <Link href="/create-gig" onClick={() => setIsMenuOpen(false)}>Publicar Gig</Link>
            <Link href="/profile" onClick={() => setIsMenuOpen(false)}>Mi Perfil</Link>
            <Link href="/admin/earnings" onClick={() => setIsMenuOpen(false)}>Ganancias</Link>
          </div>
        </div>
      )}
    </header>
  )
}
