"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Menu, X, LogOut } from "lucide-react"
import { signOut, useSession } from "next-auth/react"

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { data: session } = useSession()

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
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

        {/* Right side */}
        <div className="flex items-center gap-3">
          {session ? (
            <>
              <span className="hidden md:block text-sm text-muted-foreground">
                Hola, {session.user?.name?.split(" ")[0]}
              </span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex items-center gap-2"
              >
                <LogOut size={16} />
                Salir
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Iniciar Sesión</Link>
              </Button>
              <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700" asChild>
                <Link href="/login">Registrarse</Link>
              </Button>
            </>
          )}

          {/* Mobile Menu Button */}
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

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t bg-white">
          <div className="container py-6 flex flex-col gap-6 text-lg">
            <Link href="/gigs" className="hover:text-yellow-600" onClick={() => setIsMenuOpen(false)}>
              Explorar Gigs
            </Link>
            <Link href="/create-gig" className="hover:text-yellow-600" onClick={() => setIsMenuOpen(false)}>
              Publicar Gig
            </Link>
            <Link href="/profile" className="hover:text-yellow-600" onClick={() => setIsMenuOpen(false)}>
              Mi Perfil
            </Link>
            <Link href="/admin/earnings" className="hover:text-yellow-600" onClick={() => setIsMenuOpen(false)}>
              Ganancias
            </Link>

            {session && (
              <Button 
                variant="ghost" 
                className="justify-start text-red-600"
                onClick={() => {
                  signOut({ callbackUrl: "/" })
                  setIsMenuOpen(false)
                }}
              >
                Cerrar Sesión
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
