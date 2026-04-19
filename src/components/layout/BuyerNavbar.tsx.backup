"use client"
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ShoppingBag, LogOut, Bell } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function BuyerNavbar({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const userName = session?.user?.name || "Comprador"

  const [unreadCount, setUnreadCount] = useState(0)

  // Simple global unread simulation for now (we can make it real later with a global context)
  useEffect(() => {
    // For demo purposes - you can replace this with a real API call later
    const interval = setInterval(() => {
      setUnreadCount(Math.floor(Math.random() * 5)) // simulate some unread messages
    }, 15000)
    return () => clearInterval(interval)
  }, [])

  return (
    <>
      <nav className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/buyer" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-2xl flex items-center justify-center text-white text-2xl">
              🛍️
            </div>
            <span className="font-bold text-2xl tracking-tight text-gray-900">OigaUsted</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/gigs" className="font-medium text-gray-700 hover:text-orange-600 transition">Explorar Gigs</Link>
            <Link href="/orders" className="font-medium text-gray-700 hover:text-orange-600 transition flex items-center gap-1">
              <ShoppingBag size={18} /> Mis Pedidos
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-6">
            {/* Notification Bell */}
            <Link href="/orders" className="relative p-2 hover:bg-gray-100 rounded-xl transition">
              <Bell size={22} className="text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-medium w-5 h-5 flex items-center justify-center rounded-full">
                  {unreadCount}
                </span>
              )}
            </Link>

            {/* Profile */}
            <Link
              href="/profile"
              className="flex items-center gap-3 hover:bg-gray-100 px-4 py-2 rounded-2xl transition group"
            >
              <div className="text-right">
                <p className="font-semibold text-sm group-hover:text-orange-600">{userName}</p>
                <p className="text-xs text-emerald-600">Comprador</p>
              </div>
              <div className="w-9 h-9 bg-emerald-100 rounded-2xl flex items-center justify-center text-xl shadow-sm">
                👤
              </div>
            </Link>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => signOut({ callbackUrl: '/' })}
              className="text-gray-500 hover:text-red-600"
            >
              <LogOut size={20} />
            </Button>
          </div>
        </div>
      </nav>

      <main className="min-h-[calc(100vh-73px)]">
        {children}
      </main>
    </>
  )
}
