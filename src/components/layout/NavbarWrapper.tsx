'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

// Enhanced imports with correct paths
import AdminNavbar from '../AdminNavbar';
import BuyerNavbar from '../BuyerNavbar';
import SellerNavbar from '../SellerNavbar';

export default function NavbarWrapper({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (status === "loading") {
    return <div className="min-h-[80px] bg-white border-b flex items-center justify-center">Cargando navegación...</div>;
  }

  const role = String((session?.user as any)?.role || '').toLowerCase().trim();

  // Role-based rendering (enhanced with fallback)
  if (role === 'admin') return <AdminNavbar>{children}</AdminNavbar>;
  if (role === 'seller') return <SellerNavbar>{children}</SellerNavbar>;
  if (role === 'buyer') return <BuyerNavbar>{children}</BuyerNavbar>;

  // Public navbar (enhanced)
  return (
    <>
      <nav className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
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

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-gray-700 hover:text-orange-600 transition"
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 bg-white z-50 pt-20 px-6 overflow-y-auto">
            <div className="flex flex-col gap-6 text-lg">
              <Link href="/gigs" onClick={() => setIsMobileMenuOpen(false)}>Explorar Gigs</Link>
              <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full py-6">Iniciar Sesión</Button>
              </Link>
              <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                <Button className="w-full bg-orange-600 hover:bg-orange-700 py-6">Registrarse</Button>
              </Link>
            </div>
          </div>
        )}
      </nav>
      <main>{children}</main>
    </>
  );
}
