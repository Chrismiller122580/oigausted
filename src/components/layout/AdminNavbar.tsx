'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  LogOut, Users, Package, TrendingUp, Home, Settings, BarChart3, DollarSign, 
  MessageCircle, Tag, Menu, X, Bell,
  type LucideIcon
} from 'lucide-react';
import { useState } from 'react';
import MobileMenu from './MobileMenu';
import { NotificationsBell } from './NotificationsBell';
import { ModeToggle } from '@/components/ui/mode-toggle';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { href: '/admin', label: 'Overview', icon: Home },
  { href: '/admin/users', label: 'Usuarios', icon: Users },
  { href: '/admin/gigs', label: 'Gigs', icon: Package },
  { href: '/admin/categories', label: 'Categorías', icon: Tag },
  { href: '/admin/earnings', label: 'Ganancias', icon: TrendingUp },
  { href: '/admin/payouts', label: 'Pagos', icon: DollarSign },
  { href: '/admin/reports', label: 'Reportes', icon: BarChart3 },
  { href: '/admin/referrals', label: 'Referidos', icon: Users },
  { href: '/admin/notifications', label: 'Notificaciones', icon: Bell },
  { href: '/admin/support', label: 'Soporte', icon: MessageCircle },
  { href: '/admin/settings', label: 'Ajustes', icon: Settings },
  { href: '/admin/audit', label: 'Auditoría', icon: BarChart3 },
  { href: '/admin/grok-build', label: 'Grok Build', icon: MessageCircle },
];

export default function AdminNavbar({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // desktop sidebar toggle

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
      {/* Top Header - always visible, compact */}
      <header className="bg-background border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition">
              <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                OU
              </div>
              <span className="font-semibold text-lg hidden sm:inline">Admin Portal</span>
            </Link>

            {/* Desktop sidebar toggle */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hidden md:block ml-2 p-2 rounded-md hover:bg-accent text-muted-foreground"
              aria-label="Toggle sidebar"
            >
              <Menu size={20} />
            </button>
          </div>

          {/* Right side - user + actions */}
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
              className="text-muted-foreground hover:text-red-500"
            >
              <LogOut size={18} />
            </Button>

            {/* Mobile controls */}
            <div className="md:hidden">
              <ModeToggle />
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-muted-foreground hover:text-foreground"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-7xl mx-auto w-full">
        {/* Desktop Sidebar */}
        <aside
          className={`hidden md:block border-r border-border bg-muted/30 transition-all duration-200 ${
            isSidebarOpen ? 'w-64' : 'w-0 overflow-hidden'
          }`}
        >
          <div className="p-4 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                      active
                        ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 font-medium'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    }`}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-8 pt-6 border-t text-xs text-muted-foreground px-3">
              Admin tools • {new Date().getFullYear()}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          <main className="p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile Menu (existing component - vertical, good for admin) */}
      <MobileMenu 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
        role="admin" 
      />
    </div>
  );
}
