'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Menu, X, LogOut } from 'lucide-react';
import { useState } from 'react';
import { signOut } from 'next-auth/react';

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
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center text-white font-black text-3xl">
              O
            </div>
            <div className="hidden sm:block">
              <span className="text-2xl font-bold text-orange-600">Oiga</span>
              <span className="text-2xl font-bold text-gray-900">Usted</span>
            </div>
            <span className="text-sm font-medium text-orange-600 ml-2">Comprador</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/gigs" className="font-medium text-gray-700 hover:text-orange-600 transition">Explorar Gigs</Link>
            <Link href="/orders" className="font-medium text-gray-700 hover:text-orange-600 transition">Mis Pedidos</Link>
            <Link href="/profile" className="font-medium text-gray-700 hover:text-orange-600 transition">Perfil</Link>

            <Button 
              variant="outline" 
              size="sm"
              onClick={handleSignOut}
              className="flex items-center gap-2"
            >
              <LogOut size={16} />
              Salir
            </Button>
          </div>

          {/* Hamburger Button */}
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
              <Link 
                href="/gigs" 
                className="font-medium py-4 border-b hover:text-orange-600"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Explorar Gigs
              </Link>
              <Link 
                href="/orders" 
                className="font-medium py-4 border-b hover:text-orange-600"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Mis Pedidos
              </Link>
              <Link 
                href="/profile" 
                className="font-medium py-4 border-b hover:text-orange-600"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Mi Perfil
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
