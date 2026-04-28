'use client';

import { useSession } from 'next-auth/react';
import BuyerNavbar from './BuyerNavbar';
import SellerNavbar from './SellerNavbar';
import AdminNavbar from './AdminNavbar';

export default function NavbarWrapper({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  const role = session?.user 
    ? String((session.user as any)?.role || '').toLowerCase().trim() 
    : null;

  if (role === 'admin') return <AdminNavbar>{children}</AdminNavbar>;
  if (role === 'seller') return <SellerNavbar>{children}</SellerNavbar>;
  
  return <BuyerNavbar>{children}</BuyerNavbar>;
}
