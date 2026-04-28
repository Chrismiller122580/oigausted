'use client';

import { useSession } from 'next-auth/react';
import BuyerNavbar from './BuyerNavbar';
import SellerNavbar from './SellerNavbar';
import AdminNavbar from './AdminNavbar';

export default function NavbarWrapper() {
  const { data: session } = useSession();

  const role = session?.user 
    ? String((session.user as any)?.role || '').toLowerCase().trim() 
    : null;

  if (role === 'admin') return <AdminNavbar />;
  if (role === 'seller') return <SellerNavbar />;
  
  // Default: Buyer or public user
  return <BuyerNavbar />;
}
