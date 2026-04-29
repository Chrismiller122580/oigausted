'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Menu, X, LogOut, Bell, Plus } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';

export default function SellerNavbar({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    setIsMobileMenuOpen(false);
    await signOut({ callbackUrl: '/' });
  };

  return (
    <>
      <nav className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.png" alt="Oiga Usted" width={48} height={48} className="w-10 h-10 sm:w-12 sm:h-12" priority />
            <span className="text-2xl font-bold text-orange-600">OigaUsted</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="/seller" className="font-medium text-gray-700 hover:text-orange-600 transition">Dashboard</Link>
            <Link href="/gigs" className="font-medium text-gray-700 hover:text-orange-600 transition">Mis Gigs</Link>
            <Link href="/seller/profile" className="font-medium text-gray-700 hover:text-orange-600 transition">Mi Negocio</Link>
            <Link href="/create-gig">
              <Button className="bg-orange-600 hover:bg-orange-700 flex items-center gap-2">
                <Plus size={18} /> Crear Gig
              </Button>
            </Link>
            <Link href="/orders" className="font-medium text-gray-700 hover:text-orange-600 transition">Mis Pedidos</Link>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <button className="p-2 text-gray-600 hover:text-orange-600 transition">
              <Bell size={22} />
            </button>

            <Link href="/profile" className="flex items-center gap-3 hover:opacity-80 transition">
              <div className="w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center text-xl">👤</div>
              <div className="text-right">
                <p className="font-semibold text-sm">{session?.user?.name || 'Vendedor'}</p>
                <p className="text-xs text-gray-500">Vendedor</p>
              </div>
            </Link>

            <Button variant="ghost" size="icon" onClick={handleSignOut} className="text-gray-600 hover:text-red-600">
              <LogOut size={20} />
            </Button>
          </div>

          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 text-gray-700 hover:text-orange-600">
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 bg-white z-50 pt-20 px-6 overflow-y-auto">
            <div className="flex flex-col gap-6 text-lg">
              <Link href="/seller" onClick={() => setIsMobileMenuOpen(false)}>Dashboard</Link>
              <Link href="/gigs" onClick={() => setIsMobileMenuOpen(false)}>Mis Gigs</Link>
              <Link href="/create-gig" onClick={() => setIsMobileMenuOpen(false)}>Crear Gig</Link>
              <Link href="/orders" onClick={() => setIsMobileMenuOpen(false)}>Mis Pedidos</Link>
              <Button variant="outline" onClick={handleSignOut} className="mt-6 py-6">
                Cerrar Sesión
              </Button>
            </div>
          </div>
        )}
      </nav>
      <main>{children}</main>
    </>
  );
}
