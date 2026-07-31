'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { ModeToggle } from '@/components/ui/mode-toggle';
import MobileMenu from './MobileMenu';
import Logo from '@/components/common/Logo';

import AdminNavbar from './AdminNavbar';
import AdminAssistantNavbar from './AdminAssistantNavbar';
import AccountantNavbar from './AccountantNavbar';
import AnalyticsNavbar from './AnalyticsNavbar';
import BuyerNavbar from './BuyerNavbar';
import SellerNavbar from './SellerNavbar';
import ImpersonationBanner from './ImpersonationBanner';
import { isStaffRole, isUserRole } from '@/lib/session';
import { isCountryLandingPath } from '@/lib/countries';

export default function NavbarWrapper({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const isAuthPage =
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password' ||
    pathname?.startsWith('/login/') ||
    false;
  const banner = <ImpersonationBanner />;

  const rawRole = String(session?.user?.role || '').toLowerCase().trim();
  const role = isUserRole(rawRole) ? rawRole : null;
  const staffRole = isStaffRole(session?.user?.staffRole) ? session.user.staffRole : null;
  const isAuthenticated = !!session?.user;

  // Marketing homepage and country landings render their own HomeNavbar — skip role navbars
  if (pathname === '/' || isCountryLandingPath(pathname)) {
    return (
      <>
        {banner}
        <main>{children}</main>
      </>
    );
  }

  // Full-screen map — no chrome navbar
  if (pathname === '/mapa') {
    return (
      <>
        {banner}
        {children}
      </>
    );
  }

  if (isAuthenticated && role === 'admin') {
    return (
      <>
        {banner}
        <AdminNavbar>{children}</AdminNavbar>
      </>
    );
  }

  if (pathname.startsWith('/accountant') && staffRole === 'accountant') {
    return (
      <>
        {banner}
        <AccountantNavbar>{children}</AccountantNavbar>
      </>
    );
  }

  if (pathname.startsWith('/admin-assistant') && staffRole === 'admin_assistant') {
    return (
      <>
        {banner}
        <AdminAssistantNavbar>{children}</AdminAssistantNavbar>
      </>
    );
  }

  if (pathname.startsWith('/analytics') && staffRole === 'analytics') {
    return (
      <>
        {banner}
        <AnalyticsNavbar>{children}</AnalyticsNavbar>
      </>
    );
  }

  if (isAuthenticated && role === 'seller') {
    return (
      <>
        {banner}
        <SellerNavbar>{children}</SellerNavbar>
      </>
    );
  }

  if (isAuthenticated && role === 'buyer') {
    return (
      <>
        {banner}
        <BuyerNavbar>{children}</BuyerNavbar>
      </>
    );
  }

  return (
    <>
      {banner}
      <nav className="bg-background border-b border-border shadow-sm sticky top-0 z-50 safe-area-inset-top">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <Logo size={36} />

            <div className="hidden md:flex items-center gap-4">
              <Link href="/login"><Button variant="outline">Iniciar Sesión</Button></Link>
              <Link href="/signup"><Button className="bg-orange-600">Registrarse</Button></Link>
              {!isAuthPage && <ModeToggle />}
            </div>

            <div className="md:hidden flex items-center gap-2">
              {!isAuthPage && <ModeToggle />}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle menu"
                className="p-2"
              >
                {isMobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        role="public"
      />

      <main>{children}</main>
    </>
  );
}