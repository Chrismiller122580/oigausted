'use client';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogOut, PlusCircle, BarChart3, User, ShoppingBag } from 'lucide-react';

export default function SellerNavbar({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  return (
    <>
      <nav className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo + Brand */}
          <Link href="/seller" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center text-white text-2xl">
              💼
            </div>
            <span className="font-bold text-2xl tracking-tight text-gray-900">OigaUsted</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/seller" className="font-medium text-gray-700 hover:text-orange-600 transition">Dashboard</Link>
            <Link href="/create-gig" className="flex items-center gap-2 font-medium text-gray-700 hover:text-orange-600 transition">
              <PlusCircle size={18} /> Nuevo Gig
            </Link>
            <Link href="/seller/earnings" className="flex items-center gap-2 font-medium text-gray-700 hover:text-orange-600 transition">
              <BarChart3 size={18} /> Ganancias
            </Link>
            <Link href="/seller/profile" className="flex items-center gap-2 font-medium text-gray-700 hover:text-orange-600 transition">
              <User size={18} /> Mi Negocio
            </Link>
          </div>

          {/* Right side - User + Logout */}
          <div className="flex items-center gap-4">
            <Link 
              href="/profile" 
              className="flex items-center gap-3 hover:bg-gray-100 px-4 py-2 rounded-2xl transition group"
            >
              <div className="text-right">
                <p className="font-semibold text-sm group-hover:text-orange-600">
                  {session?.user?.name || 'Vendedor'}
                </p>
                <p className="text-xs text-amber-600">Vendedor</p>
              </div>
            </Link>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => signOut({ callbackUrl: '/' })}
              className="text-gray-500 hover:text-red-600 hover:bg-red-50"
            >
              <LogOut size={20} />
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="min-h-[calc(100vh-73px)] bg-gray-50">
        {children}
      </main>
    </>
  );
}
