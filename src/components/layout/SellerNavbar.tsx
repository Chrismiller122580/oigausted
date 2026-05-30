'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogOut, Plus, DollarSign, Menu, X } from 'lucide-react';
import { NotificationsBell } from './NotificationsBell';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { useState } from 'react';
import MobileMenu from './MobileMenu';

export default function SellerNavbar({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    setIsMobileMenuOpen(false);
    await signOut({ callbackUrl: '/' });
  };

  return (
    <>
      <nav className="bg-background border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          
          {/* Logo - matches BuyerNavbar style */}
          <Link href="/" className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition">
            <div className="w-9 h-9 bg-orange-600 rounded-xl flex items-center justify-center text-white font-bold">OU</div>
            <span className="font-bold text-2xl text-foreground">Oiga Usted</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8 font-medium">
            <Link href="/seller" className="text-muted-foreground hover:text-foreground transition">Dashboard</Link>
            <Link href="/seller/gigs" className="text-muted-foreground hover:text-foreground transition">Mis Gigs</Link>
            <Link href="/seller/profile" className="font-semibold bg-orange-100 dark:bg-orange-900/40 px-4 py-1 rounded-2xl hover:bg-orange-200 dark:hover:bg-orange-900/60 transition">
              Mi Negocio
            </Link>
            <Link href="/seller/earnings" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition">
              <DollarSign size={18} /> Ganancias
            </Link>
            <Link href="/referrals" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition">
              Referidos
            </Link>
            <Link href="/create-gig">
              <Button className="bg-orange-600 hover:bg-orange-700 flex items-center gap-2">
                <Plus size={18} /> Crear Gig
              </Button>
            </Link>
          </div>

          {/* Desktop Right Side (hidden on mobile) */}
          <div className="hidden md:flex items-center gap-5">
            <Link href="/profile" className="flex items-center gap-3 hover:opacity-80 transition cursor-pointer">
              <div className="text-right">
                <p className="font-semibold text-sm leading-none text-foreground">{session?.user?.name?.split(" ")[0] || 'Vendedor'}</p>
                <p className="text-xs text-muted-foreground">Vendedor</p>
              </div>
              <div className="w-9 h-9 bg-orange-100 dark:bg-orange-900/40 rounded-full flex items-center justify-center text-2xl hover:ring-2 hover:ring-orange-600 transition">
                👤
              </div>
            </Link>

            <NotificationsBell />
            <ModeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-red-600"
            >
              <LogOut size={20} />
            </Button>
          </div>

          {/* Mobile Right Side (compact hamburger area) */}
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
      </nav>

      {/* Shared Mobile Menu */}
      <MobileMenu 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
        role="seller" 
      />

      <main>{children}</main>
    </>
  );
}
