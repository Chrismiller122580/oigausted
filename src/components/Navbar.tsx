"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Menu, X, LogOut } from "lucide-react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"

export function Navbar() {
  const { data: session, status } = useSession()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const router = useRouter()

  const user = session?.user
  const isAdmin = user && (user as any).role === "admin"
  const isSeller = user && (user as any).role === "seller"

  if (status === "loading") {
    return <div className="h-16 bg-white border-b" />
  }

  const handleLogout = async () => {
    await signOut({ redirect: false })
    router.push("/login")
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-2xl text-yellow-600">
          OigaUsted
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          {!isAdmin && (
            <>
              <Link href="/gigs" className="hover:text-yellow-600 transition-colors">Explorar Gigs</Link>
              {!isSeller && <Link href="/buyer" className="hover:text-yellow-600 transition-colors">Mi Perfil</Link>}
              {isSeller && <Link href="/seller" className="hover:text-yellow-600 transition-colors">Mi Dashboard</Link>}
              {isSeller && <Link href="/create-gig" className="hover:text-yellow-600 transition-colors">Publicar Gig</Link>}
            </>
          )}
          {isAdmin && (
            <Link href="/admin" className="hover:text-yellow-600 transition-colors">Admin</Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {session ? (
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Cerrar Sesión
            </Button>
          ) : (
            <Button asChild size="sm" variant="outline">
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
        <div className="md:hidden border-t bg-white py-6 px-4">
          <div className="flex flex-col gap-6 text-lg">
            {!isAdmin && (
              <>
                <Link href="/gigs" onClick={() => setIsMenuOpen(false)}>Explorar Gigs</Link>
                {!isSeller && <Link href="/buyer" onClick={() => setIsMenuOpen(false)}>Mi Perfil</Link>}
                {isSeller && <Link href="/seller" onClick={() => setIsMenuOpen(false)}>Mi Dashboard</Link>}
                {isSeller && <Link href="/create-gig" onClick={() => setIsMenuOpen(false)}>Publicar Gig</Link>}
              </>
            )}
            {isAdmin && <Link href="/admin" onClick={() => setIsMenuOpen(false)}>Admin Dashboard</Link>}
            {session && <button onClick={handleLogout} className="text-red-600 text-left">Cerrar Sesión</button>}
          </div>
        </div>
      )}
    </header>
  )
}
