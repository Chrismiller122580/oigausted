"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { Menu, X, LogOut, User, ShoppingBag } from "lucide-react"
import { signOut } from "next-auth/react"

export default function BuyerNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [userName, setUserName] = useState("Usuario")

  useEffect(() => {
    const saved = localStorage.getItem("oigausted-user")
    if (saved) {
      try {
        setUserName(JSON.parse(saved).name || "Usuario")
      } catch {}
    }
  }, [])

  const handleLogout = async () => {
    await signOut({ redirect: false })
    localStorage.removeItem("oigausted-user")
    window.location.href = "/login"
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-3xl text-yellow-600">
          OigaUsted
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link href="/gigs" className="hover:text-yellow-600">Explorar Gigs</Link>
          <Link href="/buyer" className="hover:text-yellow-600 flex items-center gap-1">
            <ShoppingBag size={16} /> Mis Compras
          </Link>
          <Link href="/profile" className="hover:text-yellow-600">Mi Perfil</Link>
        </nav>

        {/* Top-right Profile Button */}
        <div className="flex items-center gap-4">
          <div 
            onClick={() => window.location.href = "/profile"}
            className="hidden md:flex items-center gap-3 cursor-pointer hover:bg-gray-100 px-3 py-1.5 rounded-xl transition-colors"
          >
            <div className="text-right">
              <p className="text-sm font-medium">{userName}</p>
              <span className="text-xs px-2.5 py-1 bg-yellow-100 text-yellow-700 rounded-full">Comprador</span>
            </div>
            <div className="w-9 h-9 bg-yellow-200 rounded-full flex items-center justify-center border-2 border-white shadow">
              <User size={18} />
            </div>
          </div>

          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut size={20} />
          </Button>

          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </Button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden border-t bg-white py-6">
          <div className="container px-6 flex flex-col gap-6 text-lg">
            <Link href="/gigs" onClick={() => setIsMenuOpen(false)}>Explorar Gigs</Link>
            <Link href="/buyer" onClick={() => setIsMenuOpen(false)}>Mis Compras</Link>
            <Link href="/profile" onClick={() => setIsMenuOpen(false)}>Mi Perfil</Link>
            <Button variant="destructive" onClick={handleLogout}>Cerrar Sesión</Button>
          </div>
        </div>
      )}
    </header>
  )
}
