'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { ModeToggle } from '@/components/ui/mode-toggle';
import MobileMenu from './MobileMenu';

// Same-folder imports (all files are in layout/)
import AdminNavbar from './AdminNavbar';
import BuyerNavbar from './BuyerNavbar';
import SellerNavbar from './SellerNavbar';

export default function NavbarWrapper({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password' || pathname?.startsWith('/login/') || false;

  if (status === "loading") {
    return <div className="min-h-[80px] bg-background border-b border-border flex items-center justify-center">Cargando...</div>;
  }

  const role = String((session?.user as any)?.role || '').toLowerCase().trim();

  if (role === 'admin') return <AdminNavbar>{children}</AdminNavbar>;
  if (role === 'seller') return <SellerNavbar>{children}</SellerNavbar>;
  if (role === 'buyer') return <BuyerNavbar>{children}</BuyerNavbar>;

  // Public navbar
  return (
    <>
      <nav className="bg-background border-b border-border shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition">
            <div className="w-9 h-9 bg-orange-600 rounded-xl flex items-center justify-center text-white font-bold">OU</div>
          </Link>

          <div className="hidden md:flex items-center gap-4">
            {!isAuthPage && (
              <Link href="/gigs" className="text-foreground hover:text-orange-600 transition-colors">Explorar Gigs</Link>
            )}
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
