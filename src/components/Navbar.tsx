"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2 font-bold text-xl">
          <span className="text-primary">OigaUsted</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/gigs" className="text-sm font-medium transition-colors hover:text-primary">
            Explorar Gigs
          </Link>
          <Link href="/create-gig" className="text-sm font-medium transition-colors hover:text-primary">
            Publicar Gig
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/login">Iniciar Sesión</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Registrarse</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
