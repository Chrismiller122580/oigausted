'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { ModeToggle } from '@/components/ui/mode-toggle';

// Same-folder imports (all files are in layout/)
import AdminNavbar from './AdminNavbar';
import BuyerNavbar from './BuyerNavbar';
import SellerNavbar from './SellerNavbar';

export default function NavbarWrapper({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.png" alt="Oiga Usted" width={48} height={48} className="w-10 h-10" priority />
            <span className="text-2xl font-bold text-orange-600">OigaUsted</span>
          </Link>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/gigs" className="text-foreground hover:text-orange-600 transition-colors">Explorar Gigs</Link>
            <Link href="/login"><Button variant="outline">Iniciar Sesión</Button></Link>
            <Link href="/signup"><Button className="bg-orange-600">Registrarse</Button></Link>
            <ModeToggle />
          </div>

          <div className="md:hidden flex items-center gap-2">
            <ModeToggle />
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </>
  );
}
