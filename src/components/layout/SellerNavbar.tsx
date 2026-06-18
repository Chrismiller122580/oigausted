'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogOut, DollarSign, Menu, X, MessageCircle, Home, Briefcase, Users } from 'lucide-react';
import { NotificationsBell } from './NotificationsBell';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import MobileMenu from './MobileMenu';
import MobileBottomNav from './MobileBottomNav';
import Logo from '@/components/common/Logo';
import { UserAvatar } from '@/components/ui/user-avatar';

export default function SellerNavbar({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    setIsMobileMenuOpen(false);
    await signOut({ callbackUrl: '/' });
  };

  const isActive = (path: string) => {
    if (path === '/seller') return pathname === '/seller';
    return pathname.startsWith(path);
  };

  return (
    <>
      <nav className="bg-background border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
          
          {/* Logo (respects admin branding) */}
          <Logo size={36} />

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8 font-medium">
            <Link 
              href="/seller" 
              className={`flex items-center gap-2 transition ${isActive('/seller') ? 'text-foreground font-semibold border-b-2 border-orange-600 pb-1' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Home size={18} /> Dashboard
            </Link>
            <Link 
              href="/seller/gigs" 
              className={`flex items-center gap-2 transition ${isActive('/seller/gigs') ? 'text-foreground font-semibold border-b-2 border-orange-600 pb-1' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Briefcase size={18} /> Mis Gigs
            </Link>
            <Link 
              href="/seller/network" 
              className={`flex items-center gap-2 transition ${isActive('/seller/network') ? 'text-foreground font-semibold border-b-2 border-orange-600 pb-1' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Users size={18} /> Red
            </Link>
            <Link 
              href="/seller/profile" 
              className={isActive('/seller/profile') 
                ? 'font-semibold bg-orange-100 dark:bg-orange-900/40 px-4 py-1 rounded-2xl hover:bg-orange-200 dark:hover:bg-orange-900/60 transition flex items-center gap-2' 
                : 'flex items-center gap-2 text-muted-foreground hover:text-foreground transition'
              }
            >
              {isActive('/seller/profile') ? 'Mi Negocio' : <><Briefcase size={18} /> Mi Negocio</>}
            </Link>
            <Link 
              href="/seller/earnings" 
              className={`flex items-center gap-2 transition ${isActive('/seller/earnings') ? 'text-foreground font-semibold border-b-2 border-orange-600 pb-1' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <DollarSign size={18} /> Ganancias
            </Link>
            <Link 
              id="tutorial-referrals-nav"
              href="/referrals" 
              className={`flex items-center gap-2 transition ${isActive('/referrals') ? 'text-foreground font-semibold border-b-2 border-orange-600 pb-1' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Users size={18} /> Referidos
            </Link>
          </div>

          {/* Desktop Right Side (hidden on mobile) */}
          <div className="hidden md:flex items-center gap-5">
            <Link href="/profile" className="flex items-center gap-3 hover:opacity-80 transition cursor-pointer">
              <div className="text-right">
                <p className="font-semibold text-sm leading-none text-foreground">{session?.user?.name?.split(" ")[0] || 'Vendedor'}</p>
                <p className="text-xs text-muted-foreground">Vendedor</p>
              </div>
              <UserAvatar
                src={session?.user?.image}
                name={session?.user?.name}
                size="sm"
                className="cursor-pointer hover:ring-2 hover:ring-brand transition"
              />
            </Link>
            <Link 
              href="/support" 
              className="hidden lg:inline text-muted-foreground hover:text-foreground transition p-2 rounded-md hover:bg-accent flex items-center gap-1.5" 
              title="Soporte, FAQ y Tutoriales" 
              aria-label="Soporte y Capacitación"
            >
              <MessageCircle size={18} />
              <span className="text-xs font-medium">Ayuda</span>
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

      {/* Shared Mobile Menu */}
      <MobileMenu 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
        role="seller" 
      />

      <MobileBottomNav role="seller" />

      <main className="pb-16 md:pb-0">{children}</main>
    </>
  );
}
