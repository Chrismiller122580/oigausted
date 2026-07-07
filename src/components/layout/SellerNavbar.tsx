'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  LogOut,
  DollarSign,
  Menu,
  X,
  MessageCircle,
  Home,
  Briefcase,
  List,
  Users,
  Store,
  UserPlus,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { NotificationsBell } from './NotificationsBell';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import MobileMenu from './MobileMenu';
import MobileBottomNav from './MobileBottomNav';
import Logo from '@/components/common/Logo';
import { UserAvatar } from '@/components/ui/user-avatar';
import { StaffPortalLink } from './StaffPortalLink';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  id?: string;
  /** Hide below this breakpoint to keep the bar from crowding on tablet widths */
  minBreakpoint?: 'lg' | 'xl';
}

const SELLER_NAV_ITEMS: NavItem[] = [
  { href: '/seller', label: 'Dashboard', icon: Home },
  { href: '/seller/gigs', label: 'Mis Gigs', icon: Briefcase },
  { href: '/seller/orders', label: 'Pedidos', icon: List },
  { href: '/messages', label: 'Mensajes', icon: MessageCircle },
  { href: '/seller/earnings', label: 'Ganancias', icon: DollarSign },
  { href: '/seller/network', label: 'Red', icon: Users, minBreakpoint: 'lg' },
  { href: '/seller/marketing', label: 'Marketing', icon: Sparkles, minBreakpoint: 'lg' },
  { href: '/seller/profile', label: 'Mi Negocio', icon: Store, minBreakpoint: 'lg' },
  { href: '/referrals', label: 'Referidos', icon: UserPlus, id: 'tutorial-referrals-nav', minBreakpoint: 'xl' },
];

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
    return pathname === path || pathname.startsWith(path + '/');
  };

  const navLinkClass = (path: string) =>
    `flex items-center gap-1.5 whitespace-nowrap text-sm transition ${
      isActive(path)
        ? 'text-foreground font-semibold border-b-2 border-orange-600 pb-1'
        : 'text-muted-foreground hover:text-foreground'
    }`;

  return (
    <>
      <nav className="bg-background border-b sticky top-0 z-50 shadow-sm safe-area-inset-top">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center h-16 gap-4">
            <Logo size={36} />

            <div className="hidden md:flex flex-1 items-center justify-center gap-5 xl:gap-6 font-medium min-w-0">
              {SELLER_NAV_ITEMS.map(({ href, label, icon: Icon, id, minBreakpoint }) => (
                <Link
                  key={href}
                  id={id}
                  href={href}
                  className={cn(
                    navLinkClass(href),
                    minBreakpoint === 'lg' && 'hidden lg:flex',
                    minBreakpoint === 'xl' && 'hidden xl:flex',
                  )}
                >
                  <Icon size={18} />
                  {label}
                </Link>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-4 flex-shrink-0">
              {session?.user && (
                <Link href="/profile" className="flex items-center gap-3 hover:opacity-80 transition">
                  <div className="text-right">
                    <p className="font-medium text-sm text-foreground">
                      Hola, {session.user.name?.split(' ')[0]}
                    </p>
                    <p className="text-xs text-muted-foreground">Vendedor</p>
                  </div>
                  <UserAvatar
                    src={session.user.image}
                    name={session.user.name}
                    size="sm"
                    className="cursor-pointer hover:ring-2 hover:ring-brand transition"
                  />
                </Link>
              )}

              <StaffPortalLink className="hidden lg:flex p-2 rounded-md hover:bg-accent" />
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
                onClick={handleSignOut}
                variant="ghost"
                className="flex items-center gap-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
              >
                <LogOut size={18} /> Salir
              </Button>
            </div>

            <div className="md:hidden flex items-center gap-1 ml-auto">
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

      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        role="seller"
      />

      <MobileBottomNav role="seller" />

      <main className="mobile-page-bottom">{children}</main>
    </>
  );
}