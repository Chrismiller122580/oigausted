'use client';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import AdminNavbar from './AdminNavbar';
import BuyerNavbar from './BuyerNavbar';
import SellerNavbar from './SellerNavbar';

export default function NavbarWrapper({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  const role = session?.user 
    ? String((session.user as any)?.role || '').toLowerCase().trim() 
    : null;

  // Role-based navbars
  if (role === 'admin') return <AdminNavbar>{children}</AdminNavbar>;
  if (role === 'seller') return <SellerNavbar>{children}</SellerNavbar>;
  if (role === 'buyer') return <BuyerNavbar>{children}</BuyerNavbar>;

  // Public navbar (not logged in)
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
        </div>
      </nav>
      <main>{children}</main>
    </>
  );
}