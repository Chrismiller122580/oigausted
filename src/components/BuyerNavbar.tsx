'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { ShoppingBag, Package, User, LogOut, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BuyerNavbar() {
  const { data: session } = useSession();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <nav className="bg-white border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-orange-600 rounded-xl flex items-center justify-center text-white font-bold">OU</div>
            <span className="font-bold text-2xl">Oiga Usted</span>
          </Link>

          {/* Navigation */}
          <div className="flex items-center gap-8">
            <Link href="/gigs" className="hover:text-orange-600 transition">Explorar Gigs</Link>
            <Link href="/buyer" className="flex items-center gap-2 hover:text-orange-600 transition font-medium">
              <Home size={18} /> Dashboard
            </Link>
            <Link href="/orders" className="flex items-center gap-2 hover:text-orange-600 transition">
              <Package size={18} /> Mis Pedidos
            </Link>
          </div>

          {/* User Section */}
          <div className="flex items-center gap-4">
            {session?.user && (
              <div className="flex items-center gap-3 pr-4 border-r">
                <div className="text-right">
                  <p className="font-medium text-sm">Hola, {session.user.name?.split(" ")[0]}</p>
                  <p className="text-xs text-gray-500">Comprador</p>
                </div>
                <div className="w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center text-xl">
                  👤
                </div>
              </div>
            )}

            <Button onClick={handleSignOut} variant="ghost" className="flex items-center gap-2 text-red-600 hover:bg-red-50">
              <LogOut size={18} /> Salir
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
