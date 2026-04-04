"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Menu, X, LogOut } from "lucide-react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"

export function Navbar() {
  const { data: session } = useSession()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const router = useRouter()

  const user = session?.user
  const role = (user as any)?.role

  const isAdmin = role === "admin"
  const isSeller = role === "seller"
  const isBuyer = role === "buyer"

  const handleLogout = async () => {
    await signOut({ redirect: false })
    router.push("/login")
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-2xl text-yellow-600">
          OigaUsted
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link href="/gigs" className="hover:text-yellow-600">Explorar Gigs</Link>

          {isBuyer && (
            <Link href="/buyer" className="hover:text-yellow-600">Mi Perfil</Link>
          )}

          {isSeller && (
            <>
              <Link href="/seller" className="hover:text-yellow-600">Mi Dashboard</Link>
              <Link href="/create-gig" className="hover:text-yellow-600">Publicar Gig</Link>
            </>
          )}

          {isAdmin && (
            <Link href="/admin" className="hover:text-yellow-600">Admin Panel</Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {session ? (
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Cerrar Sesión
            </Button>
          ) : (
            <Button size="sm" asChild>
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

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t bg-white">
          <div className="container py-6 flex flex-col gap-6 text-lg">
            <Link href="/gigs" onClick={() => setIsMenuOpen(false)}>Explorar Gigs</Link>
            
            {isBuyer && <Link href="/buyer" onClick={() => setIsMenuOpen(false)}>Mi Perfil</Link>}
            
            {isSeller && (
              <>
                <Link href="/seller" onClick={() => setIsMenuOpen(false)}>Mi Dashboard</Link>
                <Link href="/create-gig" onClick={() => setIsMenuOpen(false)}>Publicar Gig</Link>
              </>
            )}
            
            {isAdmin && <Link href="/admin" onClick={() => setIsMenuOpen(false)}>Admin Panel</Link>}
            
            {session && <button onClick={handleLogout} className="text-left">Cerrar Sesión</button>}
          </div>
        </div>
      )}
    </header>
  )
}
