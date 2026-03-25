"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export function Navbar() {
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
        </nav>

        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link href="/login">Iniciar Sesión</Link>
          </Button>
          <Button className="bg-yellow-600 hover:bg-yellow-700" asChild>
            <Link href="/login">Registrarse</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
