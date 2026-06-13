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

// Same-folder imports (all files are in layout/)
import AdminNavbar from './AdminNavbar';
import BuyerNavbar from './BuyerNavbar';
import SellerNavbar from './SellerNavbar';
import ImpersonationBanner from './ImpersonationBanner';

export default function NavbarWrapper({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password' || pathname?.startsWith('/login/') || false;

  if (status === "loading") {
    return <div className="min-h-[64px] bg-background border-b border-border flex items-center justify-center text-sm text-muted-foreground">Loading...</div>;
  }

  const role = String((session?.user as any)?.role || '').toLowerCase().trim();

  // The impersonation banner (if active) is always rendered at the very top.
  // It is self-contained and will only show when the current session has impersonatorId.
  // This works even when the effective role is buyer/seller (the admin is "wearing" that identity).
  const banner = <ImpersonationBanner />;

  if (role === 'admin') {
    return (
      <>
        {banner}
        <AdminNavbar>{children}</AdminNavbar>
      </>
    );
  }
  if (role === 'seller') {
    return (
      <>
        {banner}
        <SellerNavbar>{children}</SellerNavbar>
      </>
    );
  }
  if (role === 'buyer') {
    return (
      <>
        {banner}
        <BuyerNavbar>{children}</BuyerNavbar>
      </>
    );
  }

  // Public navbar
  return (
    <>
      {banner}
      <nav className="bg-background border-b border-border shadow-sm sticky top-0 z-50">
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

      {/* Mobile Menu for public users */}
      <MobileMenu 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
        role="public" 
      />

      <main>{children}</main>
    </>
  );
}
