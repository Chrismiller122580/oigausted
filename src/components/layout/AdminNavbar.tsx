'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogOut, Users, Package, TrendingUp, Home, Settings, BarChart3, DollarSign, MessageCircle, Menu, X } from 'lucide-react';
import MobileMenu from './MobileMenu';
import { NotificationsBell } from './NotificationsBell';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { useState } from 'react';

export default function AdminNavbar({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = () => {
    setIsMobileMenuOpen(false);
    signOut({ callbackUrl: '/' });
  };

  return (
    <>
      <nav className="bg-background border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          {/* Logo - links to public homepage */}
          <Link href="/" className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition">
            <div className="w-10 h-10 bg-red-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg">
              ⚡
            </div>
            <span className="font-bold text-xl sm:text-2xl tracking-tight text-foreground">
              OigaUsted <span className="text-red-500">Admin</span>
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8 text-sm">
            <Link href="/admin" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition">
              <Home size={18} /> Overview
            </Link>
            <Link href="/admin/users" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition">
              <Users size={18} /> Usuarios
            </Link>
            <Link href="/admin/gigs" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition">
              <Package size={18} /> Gigs
            </Link>
            <Link href="/admin/earnings" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition">
              <TrendingUp size={18} /> Ganancias
            </Link>
            <Link href="/admin/payouts" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition">
              <DollarSign size={18} /> Pagos
            </Link>
            <Link href="/admin/reports" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition">
              <BarChart3 size={18} /> Reportes
            </Link>
            <Link href="/admin/referrals" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition">
              <Users size={18} /> Referidos
            </Link>
            <Link href="/admin/notifications" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition">
              <MessageCircle size={18} /> Notificaciones
            </Link>
            <Link href="/admin/support" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition">
              <MessageCircle size={18} /> Soporte
            </Link>
            <Link href="/admin/settings" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition">
              <Settings size={18} /> Ajustes
            </Link>
            <Link href="/admin/audit" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition">
              <BarChart3 size={18} /> Auditoría
            </Link>
            <Link href="/admin/grok-build" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition font-medium">
              ✨ Grok Build
            </Link>

            <div className="flex items-center gap-4 pl-8 border-l border-border">
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

      <main className="bg-background text-foreground">
        {children}
      </main>
    </>
  );
}
