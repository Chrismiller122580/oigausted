'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Menu, X, LogOut, Bell, Plus } from 'lucide-react';
import { useState } from 'react';
import { signOut } from 'next-auth/react';
import Image from 'next/image';

export default function SellerNavbar({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = () => {
    setIsMobileMenuOpen(false);
    signOut({ callbackUrl: '/' });
  };

  return (
    <>
      <nav className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/seller" className="flex items-center gap-3">
            <Image 
              src="/logo.png" 
              alt="Oiga Usted" 
              width={48} 
              height={48} 
              className="w-10 h-10 sm:w-12 sm:h-12"
              priority
            />
            <div className="hidden sm:block">
              <span className="text-2xl font-bold text-orange-600">Oiga</span>
              <span className="text-2xl font-bold text-gray-900">Usted</span>
            </div>
            <span className="text-sm font-medium text-orange-600 ml-1">Vendedor</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/seller" className="font-medium text-gray-700 hover:text-orange-600 transition">Dashboard</Link>
            <Link href="/orders" className="font-medium text-gray-700 hover:text-orange-600 transition">Mis Pedidos</Link>
            <Link href="/gigs" className="font-medium text-gray-700 hover:text-orange-600 transition">Mis Gigs</Link>
            <Link href="/seller/profile" className="font-medium text-gray-700 hover:text-orange-600 transition">Perfil</Link>

            {/* Create Gig Button */}
            <Link href="/create-gig">
              <Button className="bg-orange-600 hover:bg-orange-700 flex items-center gap-2">
                <Plus size={18} /> Crear Gig
              </Button>
            </Link>

            {/* Notifications */}
            <button className="p-2 text-gray-600 hover:text-orange-600 transition relative">
              <Bell size={22} />
              {/* Future notification count badge */}
              {/* <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">3</div> */}
            </button>

            {/* Avatar + Logout */}
            <div className="flex items-center gap-3 pl-6 border-l">
              <div className="text-right">
                <p className="font-semibold text-sm">{session?.user?.name || 'Vendedor'}</p>
                <p className="text-xs text-gray-500">Vendedor</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                className="text-gray-600 hover:text-red-600"
              >
                <LogOut size={20} />
              </Button>
            </div>
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-gray-700 hover:text-orange-600 transition"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 bg-white z-50 pt-20 px-6 overflow-y-auto">
            <div className="flex flex-col gap-6 text-lg">
              <Link href="/seller" className="py-4 border-b" onClick={() => setIsMobileMenuOpen(false)}>Dashboard</Link>
              <Link href="/orders" className="py-4 border-b" onClick={() => setIsMobileMenuOpen(false)}>Mis Pedidos</Link>
              <Link href="/gigs" className="py-4 border-b" onClick={() => setIsMobileMenuOpen(false)}>Mis Gigs</Link>
              <Link href="/seller/profile" className="py-4 border-b" onClick={() => setIsMobileMenuOpen(false)}>Perfil</Link>
              
              <Link href="/create-gig" onClick={() => setIsMobileMenuOpen(false)}>
                <Button className="w-full py-6 bg-orange-600 hover:bg-orange-700 flex items-center justify-center gap-2 text-lg">
                  <Plus size={20} /> Crear Gig
                </Button>
              </Link>

              <Button 
                variant="outline" 
                onClick={handleSignOut}
                className="mt-6 py-6 text-lg flex items-center gap-2 justify-center"
              >
                <LogOut size={20} />
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
