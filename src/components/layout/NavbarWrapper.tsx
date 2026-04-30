'use client';

import { useSession } from 'next-auth/react';
import AdminNavbar from '../AdminNavbar';
import BuyerNavbar from '../BuyerNavbar';
import SellerNavbar from '../SellerNavbar';

export default function NavbarWrapper({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="min-h-[80px] bg-white border-b flex items-center justify-center">Cargando...</div>;
  }

  const role = String((session?.user as any)?.role || '').toLowerCase().trim();

  if (role === 'admin') return <AdminNavbar>{children}</AdminNavbar>;
  if (role === 'seller') return <SellerNavbar>{children}</SellerNavbar>;
  if (role === 'buyer') return <BuyerNavbar>{children}</BuyerNavbar>;

  // Public / Logged out navbar
  return <BuyerNavbar>{children}</BuyerNavbar>; // fallback
}
