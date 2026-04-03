"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Menu, X, LogOut, Bell, User } from "lucide-react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"

export function Navbar() {
  const { data: session } = useSession()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const router = useRouter()

  const user = session?.user
  const role = (user as any)?.role || ""
  const name = user?.name || ""

  const isSeller = role === "seller" || name.toLowerCase().includes("seller") || name.toLowerCase().includes("vendedor")
  const isAdmin = role === "admin"
  const isBuyer = !isSeller && !isAdmin

  const handleLogout = async () => {
    await signOut({ redirect: false })
    window.location.href = "/login"
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-2xl text-yellow-600">
          OigaUsted
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link href="/gigs" className="hover:text-yellow-600">Explorar Gigs</Link>

          {isSeller && (
            <>
              <Link href="/seller" className="hover:text-yellow-600 font-medium">Dashboard</Link>
              <Link href="/create-gig" className="hover:text-yellow-600">Publicar Gig</Link>
              <Link href={`/sellers/${name.toLowerCase().replace(/\s+/g, '')}`} className="hover:text-yellow-600">Mi Página Pública</Link>
            </>
          )}

          {isBuyer && (
            <Link href="/buyer" className="hover:text-yellow-600">Mi Perfil</Link>
          )}

          {isAdmin && <Link href="/admin" className="hover:text-yellow-600">Admin Dashboard</Link>}
        </nav>

        <div className="flex items-center gap-4">
          {session && isSeller && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative"
              onClick={() => router.push("/seller")}
            >
              <Bell className="w-5 h-5" />
              {/* Future notification badge can go here */}
            </Button>
          )}

          {session ? (
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Cerrar Sesión
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" asChild>
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
            
            {isSeller && (
              <>
                <Link href="/seller" onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
                <Link href="/create-gig" onClick={() => setIsMenuOpen(false)}>Publicar Gig</Link>
                <Link href={`/sellers/${name.toLowerCase().replace(/\s+/g, '')}`} onClick={() => setIsMenuOpen(false)}>Mi Página Pública</Link>
              </>
            )}
            
            {isBuyer && <Link href="/buyer" onClick={() => setIsMenuOpen(false)}>Mi Perfil</Link>}
            {isAdmin && <Link href="/admin" onClick={() => setIsMenuOpen(false)}>Admin Dashboard</Link>}
            
            {session && <button onClick={handleLogout} className="text-left text-red-600">Cerrar Sesión</button>}
          </div>
        </div>
      )}
    </header>
  )
}
