cat > src/components/Navbar.tsx << 'EOF'
"use client"
import Link from "next/link"
import Link from "next/link"mponents/ui/button"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
export function Navbar() {
export function Navbar() {
  return (r className="sticky top-0 z-50 w-full border-b bg-background/9    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">y-between">      <div className="container flex h-16 items-center justify-between">        <Link href="/" className="flex items-center space-x-2 font-bold         <Link href="/" className="flex items-center space-x-2 font-bold text-xl"> <span className="text-primary">OigaUsted</span>
          <span className="text-primary">OigaUsted</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
        <nav className="hidden md:flex items-center gap-6"> transition-c          <Link href="/gigs" className="text-sm font-medium transition-colors hover:text-primary">
            Explorar Gigs
          </Link>ref="/create-gig" className="text-sm font-medium transi          <Link href="/create-gig" className="text-sm font-medium transition-colors hover:text-primary">
            Publicar Gig
          </Link>
        </nav>
        <div className="flex items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>sión</Link>
            <Link href="/login">Iniciar Sesión</Link>
          </Button>sChild>
          <Button asChild>ignup">Registrarse</Link>
            <Link href="/signup">Registrarse</Link>
          </Button>
        </div>
      </div>>
    </header>
  )
}OF
