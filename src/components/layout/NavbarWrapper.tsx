'use client';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import AdminNavbar from './AdminNavbar';
import BuyerNavbar from './BuyerNavbar';
import SellerNavbar from './SellerNavbar';

export default function NavbarWrapper({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Force role detection - ignore brief unauthenticated states
  const role = session?.user?.role 
    ? String(session.user.role).toLowerCase().trim() 
    : null;

  // If we detect any role, always use the role navbar
  if (role) {
    if (role === 'admin') return <AdminNavbar>{children}</AdminNavbar>;
    if (role === 'seller') return <SellerNavbar>{children}</SellerNavbar>;
    if (role === 'buyer') return <BuyerNavbar>{children}</BuyerNavbar>;
  }

  // Only show public navbar when truly no role
  return (
    <>
      <nav className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center text-white font-black text-3xl">
              O
            </div>
            <div>
              <span className="text-3xl font-bold text-orange-600">Oiga</span>
              <span className="text-3xl font-bold text-gray-900">Usted</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link href="/gigs" className="font-medium text-gray-700 hover:text-orange-600">Ver Todos los Gigs</Link>
            <Link href="/login">
              <Button variant="outline">Iniciar Sesión</Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-orange-600 hover:bg-orange-700">Registrarse</Button>
            </Link>
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-gray-700"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t p-6 space-y-4">
            <Link href="/gigs" className="block py-2 font-medium" onClick={() => setIsMobileMenuOpen(false)}>
              Ver Todos los Gigs
            </Link>
            <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
              <Button variant="outline" className="w-full">Iniciar Sesión</Button>
            </Link>
            <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)}>
              <Button className="w-full bg-orange-600">Registrarse</Button>
            </Link>
          </div>
        )}
      </nav>
      <main>{children}</main>
    </>
  );
}
