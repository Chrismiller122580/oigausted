'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Home, Package, LogOut, User, Menu, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { NotificationsBell } from './NotificationsBell';
import { useState } from 'react';
import MobileMenu from './MobileMenu';
import MobileBottomNav from './MobileBottomNav';

export default function BuyerNavbar({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    setIsMobileMenuOpen(false);
    await signOut({ callbackUrl: '/' });
  };

  return (
    <>
      <nav className="bg-background border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            {/* Logo - links to homepage */}
            <Link href="/" className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition">
              <div className="w-9 h-9 bg-orange-600 rounded-xl flex items-center justify-center text-white font-bold">OU</div>
              <span className="font-bold text-2xl text-foreground">Oiga Usted</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8 font-medium">
              <Link href="/gigs" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition">
                <Search size={18} /> Explorar Gigs
              </Link>
              <Link href="/buyer" className="flex items-center gap-2 text-orange-600 font-semibold border-b-2 border-orange-600 pb-1">
                <Home size={18} /> Dashboard
              </Link>
              <Link href="/orders" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition">
                <Package size={18} /> Mis Pedidos
              </Link>
            </div>

            {/* Desktop User Area */}
            <div className="hidden md:flex items-center gap-4">
              {session?.user && (
                <>
                  <Link href="/profile" className="flex items-center gap-3 hover:opacity-80 transition">
                    <div className="text-right">
                      <p className="font-medium text-sm text-foreground">Hola, {session.user.name?.split(" ")[0]}</p>
                      <p className="text-xs text-muted-foreground">Comprador</p>
                    </div>
                    <div className="w-9 h-9 bg-orange-100 dark:bg-orange-900/40 rounded-full flex items-center justify-center text-2xl cursor-pointer hover:ring-2 hover:ring-orange-600 transition">
                      👤
                    </div>
                  </Link>
                  <Link href="/support" className="text-sm text-muted-foreground hover:text-foreground transition hidden lg:inline">
                    Soporte
                  </Link>
                </>
              )}

              <NotificationsBell />
              <ModeToggle />
              <Button 
                onClick={handleSignOut} 
                variant="ghost" 
                className="flex items-center gap-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
              >
                <LogOut size={18} /> Salir
              </Button>
            </div>

            {/* Mobile compact controls */}
            <div className="md:hidden flex items-center gap-1">
              <NotificationsBell />
              <ModeToggle />
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-muted-foreground hover:text-foreground transition"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu (shared component) */}
      <MobileMenu 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
        role="buyer" 
      />

      <MobileBottomNav role="buyer" />

      <main className="pb-16 md:pb-0">{children}</main>
    </>
  );
}
