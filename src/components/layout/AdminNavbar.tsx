'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogOut, Users, Package, TrendingUp, Home, Settings, BarChart3, DollarSign, MessageCircle, Menu, X, Tag, Shirt } from 'lucide-react';
import MobileMenu from './MobileMenu';
import { NotificationsBell } from './NotificationsBell';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Logo from '@/components/common/Logo';
import MobileBottomNav from './MobileBottomNav';

export default function AdminNavbar({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  // Close "Más" dropdown when navigating
  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  const handleSignOut = () => {
    setIsMobileMenuOpen(false);
    signOut({ callbackUrl: '/' });
  };

  const isActive = (path: string) => {
    if (path === '/admin') return pathname === '/admin';
    return pathname.startsWith(path);
  };

  return (
    <>
      <nav className="bg-background border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo - links to public homepage (fully respects /admin/settings branding) */}
          <Logo size={40} showText linkClassName="gap-3" />

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6 text-sm">
            <Link 
              href="/admin" 
              className={`flex items-center gap-2 transition ${isActive('/admin') ? 'text-foreground font-semibold border-b-2 border-orange-600 pb-1' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Home size={18} /> Overview
            </Link>
            <Link 
              href="/admin/users" 
              className={`flex items-center gap-2 transition ${isActive('/admin/users') ? 'text-foreground font-semibold border-b-2 border-orange-600 pb-1' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Users size={18} /> Usuarios
            </Link>
            <Link 
              href="/admin/gigs" 
              className={`flex items-center gap-2 transition ${isActive('/admin/gigs') ? 'text-foreground font-semibold border-b-2 border-orange-600 pb-1' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Package size={18} /> Gigs
            </Link>
            <Link 
              href="/admin/categories" 
              className={`flex items-center gap-2 transition ${isActive('/admin/categories') ? 'text-foreground font-semibold border-b-2 border-orange-600 pb-1' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Tag size={18} /> Categorías
            </Link>
            <Link 
              href="/admin/earnings" 
              className={`flex items-center gap-2 transition ${isActive('/admin/earnings') ? 'text-foreground font-semibold border-b-2 border-orange-600 pb-1' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <TrendingUp size={18} /> Ganancias
            </Link>
            <Link 
              href="/admin/payouts" 
              className={`flex items-center gap-2 transition ${isActive('/admin/payouts') ? 'text-foreground font-semibold border-b-2 border-orange-600 pb-1' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <DollarSign size={18} /> Pagos
            </Link>
            <Link 
              href="/admin/reports" 
              className={`flex items-center gap-2 transition ${isActive('/admin/reports') ? 'text-foreground font-semibold border-b-2 border-orange-600 pb-1' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <BarChart3 size={18} /> Reportes
            </Link>
            <Link 
              href="/admin/referrals" 
              className={`flex items-center gap-2 transition ${isActive('/admin/referrals') ? 'text-foreground font-semibold border-b-2 border-orange-600 pb-1' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Users size={18} /> Referidos
            </Link>
            <Link 
              href="/admin/grok-build" 
              className={`flex items-center gap-2 transition font-medium ${isActive('/admin/grok-build') ? 'text-orange-600' : 'text-muted-foreground hover:text-foreground'}`}
            >
              ✨ Grok Build
            </Link>

            {/* More menu for secondary admin links */}
            <div className="relative">
              <button
                onClick={() => setMoreOpen(!moreOpen)}
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition"
              >
                Más <span className="text-xs">▼</span>
              </button>
              {moreOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-background border border-border rounded-md shadow-lg py-1 z-50 text-sm">
                  <Link 
                    href="/admin/notifications" 
                    onClick={() => setMoreOpen(false)}
                    className={`block px-4 py-2 hover:bg-accent ${isActive('/admin/notifications') ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
                  >
                    Notificaciones
                  </Link>
                  <Link 
                    href="/admin/support" 
                    onClick={() => setMoreOpen(false)}
                    className={`block px-4 py-2 hover:bg-accent ${isActive('/admin/support') ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
                  >
                    Soporte
                  </Link>
                  <Link 
                    href="/admin/settings" 
                    onClick={() => setMoreOpen(false)}
                    className={`block px-4 py-2 hover:bg-accent ${isActive('/admin/settings') ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
                  >
                    Ajustes
                  </Link>
                  <Link 
                    href="/admin/audit" 
                    onClick={() => setMoreOpen(false)}
                    className={`block px-4 py-2 hover:bg-accent ${isActive('/admin/audit') ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
                  >
                    Auditoría
                  </Link>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 pl-6 border-l border-border">
              <div className="text-right text-sm">
                <p className="font-semibold text-foreground">{session?.user?.name || 'Admin'}</p>
                <p className="text-xs text-muted-foreground">Administrador</p>
              </div>
              <NotificationsBell />
              <ModeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-red-500 hover:bg-accent"
              >
                <LogOut size={20} />
              </Button>
            </div>
          </div>

          {/* Mobile actions */}
          <div className="md:hidden flex items-center gap-1">
            <NotificationsBell />
            <ModeToggle />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-muted-foreground hover:text-foreground transition"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Shared Mobile Menu */}
      <MobileMenu 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
        role="admin" 
      />

      <main className="pb-16 md:pb-0 bg-background text-foreground">
        {children}
      </main>

      <MobileBottomNav role="admin" />
    </>
  );
}
