'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import MobileMenu from './MobileMenu';
import { NotificationsBell } from './NotificationsBell';
import { ModeToggle } from '@/components/ui/mode-toggle';
import Logo from '@/components/common/Logo';
import { ADMIN_ASSISTANT_NAV_ITEMS } from '@/lib/admin-assistant-nav';
import { MarketplaceRoleLink } from '@/components/layout/MarketplaceRoleLink';

export default function AdminAssistantNavbar({ children }: { children: React.ReactNode }) {
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
    if (href === '/admin-assistant') return pathname === '/admin-assistant';
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="bg-background border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Logo size={36} />
              <span className="font-semibold text-lg text-muted-foreground hidden sm:inline">
                Admin Assistant • Support & Ops
              </span>
            </div>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hidden md:block ml-1 p-1.5 rounded-md hover:bg-accent text-muted-foreground"
              aria-label="Toggle sidebar"
            >
              <Menu size={18} className={isSidebarOpen ? '' : 'rotate-180'} />
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <MarketplaceRoleLink />
            <div className="hidden md:flex items-center gap-3 text-sm">
              <div className="text-right">
                <p className="font-medium text-foreground">{session?.user?.name || 'Assistant'}</p>
                <p className="text-xs text-muted-foreground">Customer Service + Manager</p>
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
        <aside
          className={`hidden md:block border-r border-border bg-muted/30 transition-all duration-200 overflow-hidden ${
            isSidebarOpen || isSidebarHovered ? 'w-64' : 'w-14'
          }`}
          onMouseEnter={() => setIsSidebarHovered(true)}
          onMouseLeave={() => setIsSidebarHovered(false)}
        >
          <div className="p-2 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
            <nav className="space-y-1">
              {ADMIN_ASSISTANT_NAV_ITEMS.map((item) => {
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
          <main className="p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>

      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        role="admin-assistant"
      />
    </div>
  );
}