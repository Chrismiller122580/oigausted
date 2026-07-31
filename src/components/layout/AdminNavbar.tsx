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
  { href: '/admin', label: 'Overview', icon: Home },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/gigs', label: 'Gigs', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: List },
  { href: '/admin/categories', label: 'Categories', icon: Tag },
  { href: '/admin/earnings', label: 'Earnings', icon: TrendingUp },
  { href: '/admin/payouts', label: 'Payouts', icon: DollarSign },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { href: '/admin/analytics', label: 'Analytics', icon: Activity },
  { href: '/admin/userlens', label: 'UserLens', icon: ScanSearch },
  { href: '/admin/referrals', label: 'Referrals', icon: Users },
  { href: '/admin/notifications', label: 'Notifications', icon: Bell },
  { href: '/admin/messages', label: 'Messages', icon: MessageCircle },
  { href: '/admin/marketing', label: 'Marketing', icon: Megaphone },
  { href: '/admin/support', label: 'Support', icon: MessageCircle },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
  { href: '/admin/audit', label: 'Audit', icon: BarChart3 },
  { href: '/admin/grok-build', label: 'Grok Build', icon: MessageCircle },
];

export default function AdminNavbar({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // pinned expanded state
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
      {/* Top Header - always visible, compact */}
      <header className="bg-background border-b border-border sticky top-0 z-50 safe-area-inset-top">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            {/* Logo - links to public homepage */}
            <div className="flex items-center gap-2">
              <Logo size={36} />
              <span className="font-semibold text-lg text-muted-foreground hidden sm:inline">Admin</span>
            </div>

            {/* Desktop sidebar toggle - compact */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hidden md:block ml-1 p-1.5 rounded-md hover:bg-accent text-muted-foreground"
              aria-label="Toggle sidebar"
              title={isSidebarOpen ? "Collapse sidebar (icons only)" : "Expand sidebar (show labels)"}
            >
              <Menu size={18} className={isSidebarOpen ? '' : 'rotate-180'} />
            </button>
          </div>

          {/* Right side - user + actions */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-3 text-sm">
              <div className="text-right">
                <p className="font-medium text-foreground">{session?.user?.name || 'Admin'}</p>
                <p className="text-xs text-muted-foreground">Administrator</p>
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

            { (isSidebarOpen || isSidebarHovered) && (
              <div className="mt-8 pt-6 border-t text-xs text-muted-foreground px-3">
                Admin tools • {new Date().getFullYear()}
              </div>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          <main className="p-4 sm:p-6 lg:p-8 mobile-page-bottom">
            {children}
          </main>
        </div>
      </div>

      <MobileBottomNav role="admin" />

      {/* Full nav for less-used admin tools */}
      <MobileMenu 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
        role="admin" 
      />
    </div>
  );
}
