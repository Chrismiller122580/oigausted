'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Home, Package, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BuyerNavbar({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  return (
    <>
      <nav className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div className="w-9 h-9 bg-orange-600 rounded-xl flex items-center justify-center text-white font-bold">OU</div>
              <span className="font-bold text-2xl">Oiga Usted</span>
            </Link>

            {/* Navigation */}
            <div className="hidden md:flex items-center gap-8 font-medium">
              <Link href="/gigs" className="hover:text-orange-600 transition">Explorar Gigs</Link>
              <Link href="/buyer" className="flex items-center gap-2 text-orange-600 font-semibold border-b-2 border-orange-600 pb-1">
                <Home size={18} /> Dashboard
              </Link>
              <Link href="/orders" className="flex items-center gap-2 hover:text-orange-600 transition">
                <Package size={18} /> Mis Pedidos
              </Link>
            </div>

            {/* User Area with Profile Link */}
            <div className="flex items-center gap-4">
              {session?.user && (
                <Link href="/profile" className="hidden md:flex items-center gap-3 hover:opacity-80 transition">
                  <div className="text-right">
                    <p className="font-medium text-sm">Hola, {session.user.name?.split(" ")[0]}</p>
                    <p className="text-xs text-gray-500">Comprador</p>
                  </div>
                  <div className="w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center text-2xl cursor-pointer hover:ring-2 hover:ring-orange-600 transition">
                    👤
                  </div>
                </Link>
              )}

              <Button 
                onClick={() => signOut({ callbackUrl: '/' })} 
                variant="ghost" 
                className="flex items-center gap-2 text-red-600 hover:bg-red-50"
              >
                <LogOut size={18} /> Salir
              </Button>
            </div>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </>
  );
}
