'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import AdminNavbar from './AdminNavbar';
import BuyerNavbar from './BuyerNavbar';
import SellerNavbar from './SellerNavbar';

export default function NavbarWrapper({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  const role = session?.user
    ? String((session.user as any)?.role || '').toLowerCase().trim()
    : null;

  // Role-based navbars (they will handle their own mobile menu)
  if (role === 'admin') return <AdminNavbar>{children}</AdminNavbar>;
  if (role === 'seller') return <SellerNavbar>{children}</SellerNavbar>;
  if (role === 'buyer') return <BuyerNavbar>{children}</BuyerNavbar>;

  // ====================== PUBLIC NAVBAR (Guest) ======================
  return (
    <>
      <nav className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center text-white font-black text-3xl">
              O
            </div>
            <div className="hidden sm:block">
              <span className="text-2xl font-bold text-orange-600">Oiga</span>
              <span className="text-2xl font-bold text-gray-900">Usted</span>
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/gigs" className="font-medium text-gray-700 hover:text-orange-600 transition">
              Explorar Gigs
            </Link>
            <Link href="/login">
              <Button variant="outline">Iniciar Sesión</Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-orange-600 hover:bg-orange-700">Registrarse</Button>
            </Link>
          </div>

          {/* Hamburger Button - Visible only on mobile */}
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
                className="font-medium text-gray-700 hover:text-orange-600 py-3 border-b"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Explorar Gigs
              </Link>
              
              <Link 
                href="/login" 
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Button variant="outline" className="w-full py-6 text-lg">Iniciar Sesión</Button>
              </Link>
              
              <Link 
                href="/signup" 
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Button className="w-full bg-orange-600 hover:bg-orange-700 py-6 text-lg">Registrarse</Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      <main>{children}</main>
    </>
  );
}
