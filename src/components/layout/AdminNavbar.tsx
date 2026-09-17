'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  LogOut, Users, Package, TrendingUp, Home, Settings, BarChart3, DollarSign, 
  MessageCircle, Tag, Menu, X, Bell, Megaphone, List, Activity, ScanSearch,
  type LucideIcon
} from 'lucide-react';
import { useState } from 'react';
import MobileMenu from './MobileMenu';
import MobileBottomNav from './MobileBottomNav';
import { NotificationsBell } from './NotificationsBell';
import { ModeToggle } from '@/components/ui/mode-toggle';
import Logo from '@/components/common/Logo';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { href: '/admin', label: 'Resumen', icon: Home },
  { href: '/admin/users', label: 'Usuarios', icon: Users },
  { href: '/admin/gigs', label: 'Servicios', icon: Package },
  { href: '/admin/orders', label: 'Pedidos', icon: List },
  { href: '/admin/categories', label: 'Categorías', icon: Tag },
  { href: '/admin/earnings', label: 'Ganancias', icon: TrendingUp },
  { href: '/admin/payouts', label: 'Pagos', icon: DollarSign },
  { href: '/admin/reports', label: 'Reportes', icon: BarChart3 },
  { href: '/admin/analytics', label: 'Analítica', icon: Activity },
  { href: '/admin/userlens', label: 'UserLens', icon: ScanSearch },
  { href: '/admin/referrals', label: 'Referidos', icon: Users },
  { href: '/admin/notifications', label: 'Notificaciones', icon: Bell },
  { href: '/admin/messages', label: 'Mensajes', icon: MessageCircle },
  { href: '/admin/marketing', label: 'Marketing', icon: Megaphone },
  { href: '/admin/support', label: 'Soporte', icon: MessageCircle },
  { href: '/admin/settings', label: 'Ajustes', icon: Settings },
  { href: '/admin/audit', label: 'Auditoría', icon: BarChart3 },
  { href: '/admin/grok-build', label: 'Grok Build', icon: MessageCircle },
];

export default function AdminNavbar({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  const handleSignOut = () => {
    setIsMobileMenuOpen(false);
    signOut({ callbackUrl: '/' });
  };

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="bg-white dark:bg-neutral-950 border-b border-border sticky top-0 z-[80] safe-area-inset-top">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Logo size={36} />
              <span className="font-semibold text-lg text-muted-foreground hidden sm:inline">Administración</span>
            </div>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hidden md:block ml-1 p-1.5 rounded-md hover:bg-accent text-muted-foreground"
              aria-label="Alternar menú lateral"
            >
              <Menu size={18} className={isSidebarOpen ? '' : 'rotate-180'} />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-3 text-sm">
              <div className="text-right">
                <p className="font-medium text-foreground">{session?.user?.name || 'Admin'}</p>
                <p className="text-xs text-muted-foreground">Administrador</p>
              </div>
            </div>

            <NotificationsBell />
            <ModeToggle />

            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="hidden sm:flex text-muted-foreground hover:text-red-500"
            >
              <LogOut size={18} />
            </Button>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-muted-foreground hover:text-foreground"
              aria-label="Abrir menú"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-7xl mx-auto w-full">
        <aside
          className={`hidden md:block border-r border-border bg-muted/30 transition-all duration-200 overflow-hidden ${
            (isSidebarOpen || isSidebarHovered) ? 'w-64' : 'w-14'
          }`}
          onMouseEnter={() => setIsSidebarHovered(true)}
          onMouseLeave={() => setIsSidebarHovered(false)}
        >
          <div className="p-2 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                const showLabel = isSidebarOpen || isSidebarHovered;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={item.label}
                    className={`flex items-center ${showLabel ? 'gap-3 px-3' : 'justify-center px-1'} py-2.5 rounded-xl text-sm transition-colors ${
                      active
                        ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 font-medium'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    }`}
                  >
                    <Icon size={18} />
                    {showLabel && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <main className="p-4 sm:p-6 lg:p-8 mobile-page-bottom">
            {children}
          </main>
        </div>
      </div>

      <MobileBottomNav role="admin" />
      <MobileMenu 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
        role="admin" 
      />
    </div>
  );
}
