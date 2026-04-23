'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Menu, X, LogOut, Bell, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';

export default function BuyerNavbar({ children }: { children: React.ReactNode }) {
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
          <Link href="/buyer" className="flex items-center gap-3">
            <Image 
              src="/logo.png" 
              alt="Oiga Usted" 
              width={48} 
              height={48} 
              className="w-10 h-10 sm:w-12 sm:h-12"
              priority
            />
            <span className="text-2xl font-bold text-orange-600">OigaUsted</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/gigs" className="font-medium text-gray-700 hover:text-orange-600 transition">Explorar Gigs</Link>
            <Link href="/orders" className="font-medium text-gray-700 hover:text-orange-600 transition flex items-center gap-1">
              <ShoppingBag size={18} /> Mis Pedidos
            </Link>
            <Link href="/profile" className="font-medium text-gray-700 hover:text-orange-600 transition">Perfil</Link>
          </div>

          {/* Right Side */}
          <div className="hidden md:flex items-center gap-6">
            {/* Notification Bell */}
            <button className="p-2 text-gray-600 hover:text-orange-600 transition relative">
              <Bell size={22} />
            </button>

            {/* Clickable Avatar → Profile */}
            <Link href="/profile" className="flex items-center gap-3 hover:opacity-80 transition">
              <div className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center text-xl overflow-hidden">
                👤
              </div>
              <div className="text-right">
                <p className="font-semibold text-sm leading-none">{session?.user?.name || 'Comprador'}</p>
                <p className="text-xs text-emerald-600">Comprador</p>
              </div>
            </Link>

            {/* Logout */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="text-gray-600 hover:text-red-600"
            >
              <LogOut size={20} />
            </Button>
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
              <Link href="/gigs" className="py-4 border-b" onClick={() => setIsMobileMenuOpen(false)}>Explorar Gigs</Link>
              <Link href="/orders" className="py-4 border-b" onClick={() => setIsMobileMenuOpen(false)}>Mis Pedidos</Link>
              <Link href="/profile" className="py-4 border-b" onClick={() => setIsMobileMenuOpen(false)}>Mi Perfil</Link>
              
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